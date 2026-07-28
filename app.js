/**
 * WIMP — WhereIsMyParking
 * app.js | Core application logic
 *
 * Flow:
 *   1. Attempt auto-geolocation
 *   2. Query Overpass API (OSM amenity=parking)
 *   3. Sort by Haversine distance, render cards
 *   4. "Navigate" tap → geo: URI / Google Maps URL
 *   5. Fallback: manual location entry
 *   6. PMF analytics: 5 beacon events
 */

'use strict';

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
const CONFIG = {
  radiusDefault:   2000,   // metres
  radiusExpanded:  5000,   // metres — auto-expand if < MIN_RESULTS returned
  minResults:      3,      // threshold to trigger radius expansion
  overpassUrl:     'https://overpass-api.de/api/interpreter',
  geoTimeout:      8000,   // ms — geolocation timeout
  analyticsUrl:    null,   // Optional: set to your endpoint URL to send beacons
  analyticsKey:    'wimp_analytics_events',  // localStorage key
  analyticsMax:    500,    // max events stored locally (oldest dropped after)
};

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
let state = {
  lat:    null,
  lng:    null,
  radius: CONFIG.radiusDefault,
  lots:   [],
};

/* ─────────────────────────────────────────
   DOM REFS
───────────────────────────────────────── */
const $ = id => document.getElementById(id);

const el = {
  statusDot:          $('status-dot'),
  statusText:         $('status-text'),
  permissionPrompt:   $('permission-prompt'),
  btnGrantLocation:   $('btn-grant-location'),
  btnEnterManually:   $('btn-enter-manually'),
  skeletonState:      $('skeleton-state'),
  resultsSection:     $('results-section'),
  resultsCountLabel:  $('results-count-label'),
  resultsRadiusLabel: $('results-radius-label'),
  resultsList:        $('results-list'),
  fallbackPanel:      $('fallback-panel'),
  fallbackInput:      $('fallback-input'),
  btnFallbackSearch:  $('btn-fallback-search'),
  geocodeError:       $('geocode-error'),
  emptyState:         $('empty-state'),
  emptySubText:       $('empty-sub-text'),
  btnRetryEmpty:      $('btn-retry-empty'),
  errorState:         $('error-state'),
  errorDetail:        $('error-detail'),
  btnRetryError:      $('btn-retry-error'),
  fabTop:             $('fab-top'),
};

/* ─────────────────────────────────────────
   UI STATE MACHINE
───────────────────────────────────────── */
const ALL_STATES = [
  'permissionPrompt', 'skeletonState', 'resultsSection',
  'fallbackPanel', 'emptyState', 'errorState',
];

function showState(...names) {
  ALL_STATES.forEach(s => {
    const elem = el[s];
    if (!elem) return;
    elem.classList.toggle('hidden', !names.includes(s));
  });
}

function setStatus(msg, mode = 'idle') {
  el.statusText.textContent = msg;
  el.statusDot.className = 'status-dot';
  if (mode === 'active')  el.statusDot.classList.add('active');
  if (mode === 'loading') el.statusDot.classList.add('loading');
  if (mode === 'error')   el.statusDot.classList.add('error');
}

/* ─────────────────────────────────────────
   PMF ANALYTICS
   Five lightweight beacon events — no PII.
   Events are always persisted to localStorage.
   View them at /analytics.html.
───────────────────────────────────────── */
function track(event, payload = {}) {
  const data = { event, ts: Date.now(), ...payload };

  // Always log to console (dev)
  console.info('[WIMP analytics]', data);

  // Persist to localStorage — analytics.html reads from here
  try {
    const raw    = localStorage.getItem(CONFIG.analyticsKey);
    const stored = raw ? JSON.parse(raw) : [];
    stored.push(data);
    // Cap at max to prevent unbounded growth
    if (stored.length > CONFIG.analyticsMax) stored.splice(0, stored.length - CONFIG.analyticsMax);
    localStorage.setItem(CONFIG.analyticsKey, JSON.stringify(stored));
  } catch (_) {}

  // Also beacon to remote endpoint if configured
  if (!CONFIG.analyticsUrl) return;
  try {
    navigator.sendBeacon(CONFIG.analyticsUrl, JSON.stringify(data));
  } catch (_) {}
}

/* ─────────────────────────────────────────
   GEOLOCATION
───────────────────────────────────────── */
function requestLocation() {
  setStatus('Requesting location…', 'loading');
  track('session_start');

  if (!navigator.geolocation) {
    track('location_denied', { reason: 'api_unavailable' });
    showFallback('Geolocation is not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    onLocationGranted,
    onLocationDenied,
    { enableHighAccuracy: false, timeout: CONFIG.geoTimeout, maximumAge: 30000 }
  );
}

function onLocationGranted(pos) {
  state.lat = pos.coords.latitude;
  state.lng = pos.coords.longitude;
  track('location_granted');
  setStatus('Location found — fetching parking…', 'loading');
  showState('skeletonState');
  fetchParking(state.lat, state.lng, CONFIG.radiusDefault);
}

function onLocationDenied(err) {
  const reason = err.code === 1 ? 'permission_denied'
               : err.code === 2 ? 'position_unavailable'
               : 'timeout';
  track('location_denied', { reason });
  setStatus('Location unavailable', 'error');
  showFallback();
}

/* ─────────────────────────────────────────
   OVERPASS API — Parking retrieval
───────────────────────────────────────── */
function buildOverpassQuery(lat, lng, radius) {
  // Query all OSM parking amenities within radius
  return `
[out:json][timeout:25];
(
  node["amenity"="parking"](around:${radius},${lat},${lng});
  way["amenity"="parking"](around:${radius},${lat},${lng});
  relation["amenity"="parking"](around:${radius},${lat},${lng});
  node["parking"="surface"](around:${radius},${lat},${lng});
  way["parking"="surface"](around:${radius},${lat},${lng});
  node["parking"="multi-storey"](around:${radius},${lat},${lng});
  way["parking"="multi-storey"](around:${radius},${lat},${lng});
);
out center tags;
`.trim();
}

async function fetchParking(lat, lng, radius, isRetry = false) {
  state.radius = radius;

  const query = buildOverpassQuery(lat, lng, radius);
  const body  = new URLSearchParams({ data: query });

  try {
    const res = await fetch(CONFIG.overpassUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

    const json = await res.json();
    const lots = parseOsmElements(json.elements, lat, lng);

    if (lots.length < CONFIG.minResults && !isRetry && radius < CONFIG.radiusExpanded) {
      // Auto-expand radius once
      setStatus(`Expanding search to ${CONFIG.radiusExpanded / 1000} km…`, 'loading');
      return fetchParking(lat, lng, CONFIG.radiusExpanded, true);
    }

    state.lots = lots;
    track('results_shown', { count: lots.length, radius });

    if (lots.length === 0) {
      renderEmpty();
    } else {
      renderResults(lots, radius);
    }

  } catch (err) {
    console.error('[WIMP] Overpass fetch failed:', err);
    renderError(err.message);
  }
}

/* ─────────────────────────────────────────
   OSM PARSING & DISTANCE
───────────────────────────────────────── */
function parseOsmElements(elements, userLat, userLng) {
  return elements
    .map(el => {
      // Ways/relations have a `center` property; nodes are directly lat/lon
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) return null;

      const tags  = el.tags || {};
      const name  = tags.name || tags['name:en'] || null;
      const label = name || inferLabel(tags);
      const dist  = haversine(userLat, userLng, lat, lng);
      const type  = inferParkingType(tags);

      return { id: el.id, lat, lng, label, dist, type, tags };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist);
}

function inferLabel(tags) {
  if (tags['parking'] === 'multi-storey') return 'Multi-storey Car Park';
  if (tags['parking'] === 'surface')      return 'Surface Parking';
  if (tags['park_ride'])                  return 'Park & Ride';
  return 'Parking Area';
}

function inferParkingType(tags) {
  const types = [];
  if (tags['parking'] === 'multi-storey') types.push('Multi-storey');
  if (tags['parking'] === 'surface')      types.push('Surface');
  if (tags['access'] === 'private')       types.push('Private');
  if (tags['fee'] === 'yes')              types.push('Paid');
  if (tags['fee'] === 'no')               types.push('Free');
  if (tags['capacity'])                   types.push(`~${tags['capacity']} spaces`);
  return types;
}

/** Haversine great-circle distance in metres */
function haversine(lat1, lng1, lat2, lng2) {
  const R  = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDist(m) {
  if (m < 1000) return { value: Math.round(m),       unit: 'm'  };
  return           { value: (m / 1000).toFixed(1), unit: 'km' };
}

/* ─────────────────────────────────────────
   RENDERING
───────────────────────────────────────── */
function renderResults(lots, radius) {
  setStatus(`${lots.length} parking spot${lots.length !== 1 ? 's' : ''} found`, 'active');

  el.resultsCountLabel.textContent  = `${lots.length} result${lots.length !== 1 ? 's' : ''}`;
  el.resultsRadiusLabel.textContent = `within ${radius >= 1000 ? (radius/1000)+'km' : radius+'m'}`;

  el.resultsList.innerHTML = '';

  lots.forEach((lot, i) => {
    const { value, unit } = formatDist(lot.dist);
    const delay = i * 60; // stagger animation

    const li = document.createElement('li');
    li.innerHTML = `
      <article class="result-card" style="animation-delay:${delay}ms" data-id="${lot.id}">
        <div class="card-top">
          <div>
            <div class="card-rank">#${i + 1} Nearest</div>
            <h3 class="card-name">${escHtml(lot.label)}</h3>
          </div>
          <div class="card-distance" aria-label="${value} ${unit} away">
            ${value}<span>${unit}</span>
          </div>
        </div>
        ${lot.type.length ? `
        <div class="card-meta" aria-label="Parking details">
          ${lot.type.map(t => `<span class="meta-tag">${escHtml(t)}</span>`).join('')}
        </div>` : ''}
        <button
          class="btn-navigate"
          type="button"
          data-lat="${lot.lat}"
          data-lng="${lot.lng}"
          data-name="${escAttr(lot.label)}"
          aria-label="Navigate to ${escAttr(lot.label)}, ${value} ${unit} away"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Navigate
        </button>
      </article>
    `;
    el.resultsList.appendChild(li);
  });

  showState('resultsSection');
  updateFab();
}

function renderEmpty() {
  track('empty_state_hit', { radius: state.radius });
  setStatus('No parking found nearby', 'error');
  el.emptySubText.textContent = state.radius >= CONFIG.radiusExpanded
    ? `We searched within a ${CONFIG.radiusExpanded / 1000} km radius. OSM data may be sparse here — try a different area.`
    : `No parking found within ${CONFIG.radiusDefault / 1000} km.`;
  showState('emptyState');
}

function renderError(detail) {
  setStatus('Failed to load results', 'error');
  el.errorDetail.textContent = detail || 'Could not load parking data. Check your connection and try again.';
  showState('errorState');
}

function showFallback(note) {
  showState('fallbackPanel');
  if (note) {
    el.geocodeError.textContent = note;
    el.geocodeError.classList.remove('hidden');
  } else {
    el.geocodeError.classList.add('hidden');
  }
  setStatus('Enter your location manually', 'idle');
  el.fallbackInput.focus();
}

/* ─────────────────────────────────────────
   NAVIGATION HANDOFF (FR-5)
───────────────────────────────────────── */
function openNavigation(lat, lng, name) {
  track('navigate_tapped', { lat, lng, name });

  // Primary: geo URI (Android native, many apps)
  // Fallback: Google Maps universal URL (iOS Safari, desktop)
  const geoUri   = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
  const mapsUrl  = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Try geo: URI; browsers that don't support it will silently fail — fall through to Maps
  const anchor = document.createElement('a');
  anchor.href = geoUri;

  // Feature-detect: if we're on a mobile device, prefer geo:
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    // Attempt geo: link — if it fails the OS will ignore it
    window.location.href = geoUri;
    // After a short delay, fall through to Google Maps URL if geo: didn't open anything
    setTimeout(() => { window.open(mapsUrl, '_blank', 'noopener'); }, 800);
  } else {
    window.open(mapsUrl, '_blank', 'noopener');
  }
}

/* ─────────────────────────────────────────
   GEOCODING FALLBACK (FR-6)
   Uses Nominatim (OpenStreetMap) — free, no key required.
───────────────────────────────────────── */
async function geocodeFallback(query) {
  setStatus('Searching…', 'loading');
  el.geocodeError.classList.add('hidden');
  showState('fallbackPanel', 'skeletonState');

  try {
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q:              query + ', Kerala, India',
      format:         'json',
      limit:          '1',
      addressdetails: '0',
    });

    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'WIMP-parking-finder/1.0' },
    });
    if (!res.ok) throw new Error('Nominatim error');

    const results = await res.json();
    if (!results.length) {
      el.geocodeError.textContent = 'Location not found. Try a different name.';
      el.geocodeError.classList.remove('hidden');
      showState('fallbackPanel');
      setStatus('Location not found', 'error');
      return;
    }

    state.lat = parseFloat(results[0].lat);
    state.lng = parseFloat(results[0].lon);
    showState('skeletonState');
    setStatus('Location found — fetching parking…', 'loading');
    fetchParking(state.lat, state.lng, CONFIG.radiusDefault);

  } catch (err) {
    el.geocodeError.textContent = 'Could not search. Check your connection.';
    el.geocodeError.classList.remove('hidden');
    showState('fallbackPanel');
    setStatus('Search failed', 'error');
  }
}

/* ─────────────────────────────────────────
   FAB — Scroll to top
───────────────────────────────────────── */
function updateFab() {
  const show = state.lots.length > 5;
  el.fabTop.classList.toggle('visible', show);
}

/* ─────────────────────────────────────────
   ESCAPE HELPERS (XSS prevention)
───────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────── */
function bindEvents() {
  // Delegation for Navigate buttons (results rendered dynamically)
  el.resultsList.addEventListener('click', e => {
    const btn = e.target.closest('.btn-navigate');
    if (!btn) return;
    const { lat, lng, name } = btn.dataset;
    openNavigation(parseFloat(lat), parseFloat(lng), name);
  });

  // Permission prompt CTA
  el.btnGrantLocation?.addEventListener('click', requestLocation);

  // Manual entry toggle
  el.btnEnterManually?.addEventListener('click', () => showFallback());

  // Fallback search
  el.btnFallbackSearch?.addEventListener('click', () => {
    const q = el.fallbackInput.value.trim();
    if (!q) { el.fallbackInput.focus(); return; }
    geocodeFallback(q);
  });
  el.fallbackInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = el.fallbackInput.value.trim();
      if (q) geocodeFallback(q);
    }
  });

  // Retry after empty state
  el.btnRetryEmpty?.addEventListener('click', () => showFallback());

  // Retry after API error
  el.btnRetryError?.addEventListener('click', () => {
    if (state.lat && state.lng) {
      showState('skeletonState');
      fetchParking(state.lat, state.lng, CONFIG.radiusDefault);
    } else {
      showFallback();
    }
  });

  // FAB scroll to top
  el.fabTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    if (state.lots.length > 5) {
      el.fabTop.classList.toggle('visible', window.scrollY > 300);
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
function init() {
  bindEvents();

  if (!navigator.geolocation) {
    // Browser doesn't support geolocation at all — skip to fallback
    showFallback('Your browser does not support geolocation.');
    return;
  }

  // Show permission prompt briefly so user understands what's about to happen,
  // then auto-request after a very short moment (better UX than instant denial risk)
  showState('permissionPrompt');
  setStatus('Tap "Enable Location" to begin', 'idle');

  // If permission was previously granted, the browser resolves getCurrentPosition
  // immediately with no user dialog — so auto-request is safe to fire right away.
  // We show the prompt as a fallback in case the browser shows a dialog.
  requestLocation();
}

document.addEventListener('DOMContentLoaded', init);
