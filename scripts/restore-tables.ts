
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

// Helper for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

// Status mapping
const statusMap: Record<string, string> = {
  'LIVRE': 'AVAILABLE',
  'OCUPADO': 'OCCUPIED',
  'RESERVADO': 'RESERVED',
  'PAGAMENTO': 'PAYMENT',
  'SUJO': 'DIRTY',
  'MANUTENCAO': 'MAINTENANCE'
};

async function restoreTables() {
  try {
    const backupPath = path.resolve(process.cwd(), 'legacy_data/tasca_backup_2026-02-15.json');
    if (!fs.existsSync(backupPath)) {
      console.error('Backup file not found:', backupPath);
      process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    const tables = backupData.state?.tables || [];

    if (tables.length === 0) {
      console.log('No tables found in backup.');
      return;
    }

    console.log(`Found ${tables.length} tables in backup. Restoring...`);

    // Prepare rows for insertion
    const rowsToInsert = tables.map((t: any) => ({
      number: t.id, // Map backup ID to number
      name: t.name,
      seats: t.seats,
      zone: t.zone,
      shape: t.shape,
      x: t.x,
      y: t.y,
      width: t.width || 100, // Default if missing
      height: t.height || 100, // Default if missing
      rotation: t.rotation || 0,
      status: statusMap[t.status] || 'AVAILABLE',
      is_active: true
    }));

    // Clear existing tables to avoid duplicates/conflicts? 
    // Or just insert if empty. check-schema said it's empty.
    // But let's be safe and check count first.
    
    const countResult = await sql`SELECT count(*) FROM restaurant_tables`;
    const count = parseInt(countResult[0].count);
    
    if (count > 0) {
      console.log(`Table restaurant_tables is not empty (${count} rows). Skipping restore to avoid duplicates.`);
      // Optional: Delete all? No, that's dangerous without user consent.
      // But since I just migrated and know it's empty...
      // Actually check-schema said it's empty.
    } else {
        await sql`
          INSERT INTO restaurant_tables ${sql(rowsToInsert, 
            'number', 'name', 'seats', 'zone', 'shape', 'x', 'y', 'width', 'height', 'rotation', 'status', 'is_active'
          )}
        `;
        console.log('Successfully restored tables!');
    }

  } catch (error) {
    console.error('Error restoring tables:', error);
  } finally {
    await sql.end();
  }
}

restoreTables();
