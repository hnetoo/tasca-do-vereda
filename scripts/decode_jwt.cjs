const jwt = process.argv[2];
if (!jwt) {
  console.error('Please provide a JWT');
  process.exit(1);
}

const [header, payload, signature] = jwt.split('.');
const decodedPayload = Buffer.from(payload, 'base64url').toString('utf8');
console.log(JSON.parse(decodedPayload));
