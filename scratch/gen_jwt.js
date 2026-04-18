const crypto = require('crypto');

const header = { alg: 'HS256', typ: 'JWT' };
const payload = { 
  role: 'service_role', 
  iss: 'supabase-demo', // matched the anon key issuer
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

const secret = 'super-secret-jwt-token-with-at-least-32-characters';

function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const encodedHeader = base64UrlEncode(header);
const encodedPayload = base64UrlEncode(payload);

const signature = crypto
  .createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
console.log(jwt);
