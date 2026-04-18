const fetch = require('node-fetch');

const URL = 'http://127.0.0.1:54321/users'; // Removed /rest/v1
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc3NjU0Mzg4NywiZXhwIjoyMDkxOTAzODg3fQ.L7c5WveK4lcPw8lwcl_dDJhoKdWSzNiWtxssW45PxKM';

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
