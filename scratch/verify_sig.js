const crypto = require('crypto');

const secret = 'super-secret-jwt-token-with-at-least-32-characters';

function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// ANON Payload from .env.local
const header = { alg: 'HS256', typ: 'JWT' };
const payload = { 
  iss: 'supabase-demo', 
  role: 'anon', 
  exp: 1983812896 
};

const encodedHeader = base64UrlEncode(header);
const encodedPayload = base64UrlEncode(payload);

const signature = crypto
  .createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

console.log('Calculated Signature:', signature);
console.log('Expected Signature:  ', 'JTvP-9c7Og2n7aU7V6G8x4R5t5V7b9Z0x2Z4Y6W8V0U');
