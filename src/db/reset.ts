import { reset } from 'drizzle-seed';
import { db } from './index';
import * as schema from './schema';

async function main() {
  console.log('Resetting database...');
  await reset(db, schema);
  console.log('Database reset complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error resetting database:', err);
  process.exit(1);
});
