const fs = require('fs');

const CF_TOKEN = '***REMOVED-CF-TOKEN***';
const ZONE_ID = 'bc5bb34362fc41afd02c80de73001192';
const LB_IP = '91.98.222.135';
const DOMAIN = 'whereismyparking.com';

async function apiCall(endpoint, method = 'GET', body = null) {
  const url = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  const data = await res.json();
  if (!data.success) {
    console.error(`Error in ${method} ${endpoint}:`, JSON.stringify(data.errors));
  }
  return data;
}

async function run() {
  console.log('🚀 Starting Cloudflare autonomous setup...');

  // 1. Setup DNS Records
  console.log('\n📡 Configuring DNS Records...');
  const dnsRecords = await apiCall('/dns_records');
  const existingA = dnsRecords.result.find(r => r.name === DOMAIN && r.type === 'A');
  const existingWww = dnsRecords.result.find(r => r.name === `www.${DOMAIN}`);

  if (existingA) {
    console.log(`Updating existing A record for ${DOMAIN}`);
    await apiCall(`/dns_records/${existingA.id}`, 'PUT', { type: 'A', name: DOMAIN, content: LB_IP, proxied: true });
  } else {
    console.log(`Creating A record for ${DOMAIN}`);
    await apiCall('/dns_records', 'POST', { type: 'A', name: DOMAIN, content: LB_IP, proxied: true });
  }

  if (existingWww) {
    console.log(`Updating existing WWW record`);
    await apiCall(`/dns_records/${existingWww.id}`, 'PUT', { type: 'CNAME', name: `www.${DOMAIN}`, content: DOMAIN, proxied: true });
  } else {
    console.log(`Creating WWW record`);
    await apiCall('/dns_records', 'POST', { type: 'CNAME', name: `www.${DOMAIN}`, content: DOMAIN, proxied: true });
  }

  // 2. Configure Zone Settings
  console.log('\n⚙️ Configuring Zone Settings (SSL, Minify, Cache, etc.)...');
  const settings = [
    { id: 'ssl', value: 'flexible' }, // Hetzner LB currently only listens on port 80
    { id: 'always_use_https', value: 'on' },
    { id: 'minify', value: { css: 'on', html: 'on', js: 'on' } },
    { id: 'brotli', value: 'on' },
    { id: 'early_hints', value: 'on' },
    { id: 'always_online', value: 'on' },
    { id: 'browser_cache_ttl', value: 14400 },
    { id: 'ip_geolocation', value: 'on' }
  ];

  for (const setting of settings) {
    console.log(`Setting ${setting.id} = ${typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value}`);
    await apiCall(`/settings/${setting.id}`, 'PATCH', { value: setting.value });
  }

  // 3. Page Rules (Bypass Cache for API)
  console.log('\n📜 Configuring Page Rules...');
  const rules = await apiCall('/pagerules');
  const apiRuleExists = rules.result.find(r => r.targets[0].constraint.value === `*${DOMAIN}/api/*`);
  
  if (!apiRuleExists) {
    console.log('Adding Cache Bypass rule for /api/*');
    await apiCall('/pagerules', 'POST', {
      targets: [
        { target: 'url', constraint: { operator: 'matches', value: `*${DOMAIN}/api/*` } }
      ],
      actions: [
        { id: 'cache_level', value: 'bypass' }
      ],
      priority: 1,
      status: 'active'
    });
  } else {
    console.log('Cache Bypass rule already exists.');
  }

  // 4. Purge Cache
  console.log('\n🧹 Purging existing cache...');
  await apiCall('/purge_cache', 'POST', { purge_everything: true });

  console.log('\n✅ Cloudflare setup is complete!');
  console.log('Traffic is now routing securely through the Cloudflare edge network to the Hetzner Load Balancer.');
}

run().catch(err => console.error(err));
