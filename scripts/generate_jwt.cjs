const crypto = require('crypto');
require('dotenv').config();

const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-secret-here';
const projectRef = 'ratzyxwpzrqbtpheygch'; // The correct project ID (from package.json)

function sign(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const payload = {
  iss: 'supabase',
  ref: projectRef,
  role: 'service_role',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10 // 10 years
};

const jwt = sign(payload, secret);
console.log('Generated JWT:', jwt);

// Update .env file automatically?
// Better to just output it for now.
