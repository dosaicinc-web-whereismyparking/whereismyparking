/**
 * WIMP Analytics Worker
 * workers/analytics.js
 *
 * Deploy on Cloudflare Workers (free tier: 100k req/day)
 *
 * Routes:
 *   POST /api/track  → accept event, store in Supabase (write-only, no auth)
 *   GET  /api/stats  → return aggregate events (requires X-Dashboard-Secret header)
 *
 * Environment variables (set in CF Workers dashboard or wrangler.toml):
 *   SUPABASE_URL     - e.g. https://xyzxyz.supabase.co
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_KEY  - for reading/deleting (only used by /stats)
 *   DASHBOARD_SECRET      - same passphrase as in analytics-pmf-*.html
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Dashboard-Secret',
};

export default {
  async fetch(request, env, ctx) {
    // OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    /* ── POST /api/track — write event ── */
    if (path === '/api/track' && request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch(_) { return json({ error: 'invalid JSON' }, 400); }

      // Validate event shape
      if (!body.event || !body.ts) {
        return json({ error: 'missing event or ts' }, 400);
      }

      // Write to Supabase
      const row = {
        event:    body.event,
        ts:       new Date(body.ts).toISOString(),
        payload:  JSON.stringify(body),
        ip_hash:  await hashIp(request.headers.get('CF-Connecting-IP') || ''),
        country:  request.headers.get('CF-IPCountry') || null,
      };

      const r = await supabaseInsert(env, 'wimp_events', row);
      if (!r.ok) {
        const err = await r.text();
        console.error('[WIMP Worker] Supabase insert failed:', err);
        return json({ error: 'write failed' }, 502);
      }

      return json({ ok: true }, 200);
    }

    /* ── GET /api/stats — aggregate read (dashboard only) ── */
    if (path === '/api/stats' && request.method === 'GET') {
      // Auth check
      const secret = request.headers.get('X-Dashboard-Secret');
      if (!secret || secret !== env.DASHBOARD_SECRET) {
        return json({ error: 'unauthorized' }, 401);
      }

      // Fetch all events from Supabase
      const r = await supabaseFetch(env, 'wimp_events?select=event,ts,payload&order=ts.desc&limit=10000');
      if (!r.ok) return json({ error: 'read failed' }, 502);

      const rows = await r.json();

      // Parse payloads back to events array for the dashboard
      const events = rows.map(row => {
        try { return JSON.parse(row.payload); }
        catch(_) { return { event: row.event, ts: new Date(row.ts).getTime() }; }
      });

      return json({
        ok: true,
        count: events.length,
        events,
        generatedAt: new Date().toISOString(),
      }, 200, {
        'Cache-Control': 'no-store',
      });
    }

    /* ── DELETE /api/reset — clear all data ── */
    if (path === '/api/reset' && request.method === 'DELETE') {
      const secret = request.headers.get('X-Dashboard-Secret');
      if (!secret || secret !== env.DASHBOARD_SECRET) {
        return json({ error: 'unauthorized' }, 401);
      }
      const r = await supabaseDelete(env, 'wimp_events');
      if (!r.ok) return json({ error: 'delete failed' }, 502);
      return json({ ok: true, message: 'PMF observation window reset.' }, 200);
    }

    return json({ error: 'not found' }, 404);
  }
};

/* ── Helpers ── */
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

async function hashIp(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + 'wimp-salt'));
  return Array.from(new Uint8Array(buf)).slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function supabaseInsert(env, table, row) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(row),
  });
}

function supabaseFetch(env, path) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY}`,
    },
  });
}

function supabaseDelete(env, table) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?ts=gte.1970-01-01`, {
    method: 'DELETE',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY}`,
    },
  });
}
