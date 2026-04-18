const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

async function testAuthFlow() {
  const phone = '+919999999999'; // Whitelisted in .env.local
  
  console.log('--- Phase 06 Auth Flow UAT ---');

  // 1. Send OTP
  console.log('\n[Step 1] Sending OTP for whitelisted admin...');
  try {
    const res = await axios.post(`${BASE_URL}/send-otp`, { phone, isAdmin: true });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error (Expected if DB/SMS down):', err.response?.data || err.message);
  }

  // 2. Cooldown Test
  console.log('\n[Step 2] Testing Cooldown (immediate resend)...');
  try {
    const res = await axios.post(`${BASE_URL}/send-otp`, { phone, isAdmin: true });
    console.log('Error (Unexpected): Success should fail due to cooldown');
  } catch (err) {
    if (err.response?.status === 429) {
      console.log('Passed: Cooldown active. Seconds remaining:', err.response.data.seconds_remaining);
    } else {
      console.log('Error (Unexpected):', err.response?.data || err.message);
    }
  }

  // 3. Admin Block Test
  console.log('\n[Step 3] Testing non-whitelisted admin attempt...');
  try {
    const res = await axios.post(`${BASE_URL}/send-otp`, { phone: '+911234567890', isAdmin: true });
    console.log('Error (Unexpected): Success should fail for non-whitelist');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('Passed: Blocked non-whitelist admin.');
    } else {
      console.log('Error (Unexpected):', err.response?.data || err.message);
    }
  }

  console.log('\n--- UAT Script Finished ---');
}

testAuthFlow();
