const fetch = require('node-fetch');

const URL = 'http://127.0.0.1:54321/users'; // Removed /rest/v1
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRaw() {
  try {
    const res = await fetch(URL, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testRaw();
