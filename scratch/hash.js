const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const dotEnvPath = path.join('/Users/polaroiddosa/Documents/Projects/SOUP', '.env.local');
const envContent = fs.readFileSync(dotEnvPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim();
  }
});

const salt = env.AUTH_SALT || 'wheremyparking-salt-2026';
const otp = process.argv[2];
if (!otp) {
  console.log('Usage: node hash.js <otp>');
  process.exit(1);
}
const hash = crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex');
console.log('OTP:', otp);
console.log('SALT:', salt);
console.log('HASH:', hash);
