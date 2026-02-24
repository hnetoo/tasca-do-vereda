 
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function main() {
  const migrationPath = path.join(
    __dirname,
    '..',
    '..',
    'supabase',
    'migrations',
    '20260224160000_financial_transactions_view.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(migrationPath, 'utf8');

  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error(
      'DATABASE_URL not set. Please set a Postgres connection string (service role recommended) and rerun:\n' +
        '  set DATABASE_URL=postgres://user:pass@host:5432/db\n' +
        '  npm run db:apply:financial'
    );
    process.exit(1);
  }

  const sql = postgres(conn, { ssl: { rejectUnauthorized: false } });
  try {
    console.log('Applying financial_transactions migration...');
    await sql.unsafe(sqlText);
    console.log('Migration applied successfully.');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});

