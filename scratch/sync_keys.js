const crypto = require('crypto');

const secret = process.env.SUPABASE_JWT_SECRET;

function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const anonKey = createJWT({ 
  role: 'anon', 
  iss: 'supabase-demo', 
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) 
}, secret);

const serviceKey = createJWT({ 
  role: 'service_role', 
  iss: 'supabase-demo', 
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) 
}, secret);

console.log('ANON_KEY=' + anonKey);
console.log('SERVICE_KEY=' + serviceKey);
