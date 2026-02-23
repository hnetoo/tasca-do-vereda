const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function verifyIntegrations() {
  console.log('Verifying Integrations (API Keys, Webhooks, Biometric Devices)...');
  
  try {
    // 1. API Keys
    const apiKey = {
      name: 'Test Key',
      key: `test_key_${Date.now()}`,
      secret: 'test_secret',
      scopes: ['read', 'write']
    };
    
    const insertedKey = await sql`
      INSERT INTO api_keys ${sql(apiKey)} RETURNING id
    `;
    console.log('PASS: Insert API Key');
    
    const readKey = await sql`SELECT * FROM api_keys WHERE id = ${insertedKey[0].id}`;
    if (readKey.length > 0) console.log('PASS: Read API Key');
    else throw new Error('Failed to read API Key');
    
    await sql`DELETE FROM api_keys WHERE id = ${insertedKey[0].id}`;
    console.log('PASS: Delete API Key');

    // 2. Webhooks
    const webhook = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['order.created']
    };
    
    const insertedWebhook = await sql`
      INSERT INTO webhooks ${sql(webhook)} RETURNING id
    `;
    console.log('PASS: Insert Webhook');
    
    await sql`DELETE FROM webhooks WHERE id = ${insertedWebhook[0].id}`;
    console.log('PASS: Delete Webhook');

    // 3. Biometric Devices
    const device = {
      name: 'Test Device',
      ip_address: '192.168.1.100',
      port: 4370
    };
    
    const insertedDevice = await sql`
      INSERT INTO biometric_devices ${sql(device)} RETURNING id
    `;
    console.log('PASS: Insert Biometric Device');
    
    await sql`DELETE FROM biometric_devices WHERE id = ${insertedDevice[0].id}`;
    console.log('PASS: Delete Biometric Device');

  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyIntegrations();
