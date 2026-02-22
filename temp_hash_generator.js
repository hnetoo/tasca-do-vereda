const bcrypt = require('bcrypt');

async function generateHashes() {
  const saltRounds = 10;
  const adminPin = '1234';
  const caixaPin = '2222';

  const adminPinHash = await bcrypt.hash(adminPin, saltRounds);
  const caixaPinHash = await bcrypt.hash(caixaPin, saltRounds);

  console.log('Admin PIN Hash:', adminPinHash);
  console.log('Caixa PIN Hash:', caixaPinHash);
}

generateHashes();