const fetch = require('node-fetch');

const URL = 'http://127.0.0.1:54321/otp_sessions';
const SERVICE_KEY = '***REMOVED-JWT***';

async function testUpsert() {
  try {
    const payload = {
      phone: '+919999999999',
      otp_hash: 'test-hash',
      expires_at: new Date(Date.now() + 300000).toISOString(),
      last_sent_at: new Date().toISOString(),
      attempts: 0
    };

    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates' // This is PostgREST upsert
      },
      body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testUpsert();
