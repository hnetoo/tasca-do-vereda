import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs/promises';

const log = (...args) => console.log('[RLS-DISABLE]', ...args);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Aborting.');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 2,
  connect_timeout: 10,
  idle_timeout: 10,
});

async function listTables() {
  const rows = await sql/* sql */`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  return rows.map(r => r.tablename);
}

async function listPolicies() {
  const rows = await sql/* sql */`
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;
  return rows;
}

async function disableRLSForAll(tables) {
  for (const t of tables) {
    log(`Disabling RLS on table: ${t}`);
    // Use identifier quoting via sql helper
    await sql/* sql */`ALTER TABLE ${sql('public')}.${sql(t)} DISABLE ROW LEVEL SECURITY`;
  }
}

async function dropAllPolicies(policies) {
  for (const p of policies) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        log(`Dropping policy: ${p.policyname} on ${p.tablename} (attempt ${attempts + 1})`);
        await sql/* sql */`DROP POLICY IF EXISTS ${sql(p.policyname)} ON ${sql('public')}.${sql(p.tablename)}`;
        break;
      } catch (e) {
        attempts++;
        log(`Drop policy failed: ${e.message}`);
        await new Promise(res => setTimeout(res, 300 * attempts));
        if (attempts >= 3) throw e;
      }
    }
  }
}

async function verifyStatus(tables) {
  const rels = await sql/* sql */`
    SELECT c.relname AS tablename, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind = 'r'
  `;
  const status = rels.map(r => ({
    table: r.tablename,
    rls_enabled: !!r.relrowsecurity,
    force_rls: !!r.relforcerowsecurity,
  }));
  const remainingPolicies = await listPolicies();
  return { status, remainingPolicies };
}

async function testSelectVisibility(tables) {
  const results = [];
  for (const t of tables) {
    try {
      const cnt = await sql/* sql */`SELECT COUNT(*)::int AS count FROM ${sql('public')}.${sql(t)}`;
      results.push({ table: t, count: cnt[0]?.count ?? 0, ok: true });
    } catch (e) {
      results.push({ table: t, error: e.message, ok: false });
    }
  }
  return results;
}

async function writeReport({ tables, disabledPoliciesBefore, verification, selectResults }) {
  const lines = [];
  lines.push(`# RLS Disabled Report`);
  lines.push('');
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`## Tables in public schema (${tables.length})`);
  for (const t of tables) lines.push(`- ${t}`);
  lines.push('');
  lines.push(`## Policies dropped (${disabledPoliciesBefore.length})`);
  for (const p of disabledPoliciesBefore) lines.push(`- ${p.tablename}: ${p.policyname}`);
  lines.push('');
  lines.push(`## Verification (pg_class)`);
  for (const s of verification.status) {
    lines.push(`- ${s.table}: rls_enabled=${s.rls_enabled}, force_rls=${s.force_rls}`);
  }
  lines.push('');
  lines.push(`## Remaining policies (pg_policies): ${verification.remainingPolicies.length}`);
  lines.push('');
  lines.push(`## SELECT visibility test`);
  for (const r of selectResults) {
    if (r.ok) lines.push(`- ${r.table}: count=${r.count}`);
    else lines.push(`- ${r.table}: ERROR=${r.error}`);
  }
  const reportPath = 'docs/RLS_DISABLED.md';
  await fs.writeFile(reportPath, lines.join('\n'), 'utf-8');
  log(`Report written to ${reportPath}`);
}

async function main() {
  try {
    log('Listing tables...');
    const tables = await listTables();
    log(`Found ${tables.length} tables`);

    log('Listing policies (before)...');
    const policiesBefore = await listPolicies();
    log(`Found ${policiesBefore.length} policies to drop`);

    log('Disabling RLS on all tables...');
    await disableRLSForAll(tables);

    log('Dropping all policies...');
    await dropAllPolicies(policiesBefore);

    log('Verifying status...');
    const verification = await verifyStatus(tables);
    log(`Remaining policies: ${verification.remainingPolicies.length}`);

    log('Testing SELECT visibility...');
    const selectResults = await testSelectVisibility(tables);
    const failed = selectResults.filter(r => !r.ok);
    if (failed.length > 0) {
      log(`Warning: ${failed.length} tables had SELECT errors`);
    }

    await writeReport({
      tables,
      disabledPoliciesBefore: policiesBefore,
      verification,
      selectResults
    });
  } catch (e) {
    console.error('Error disabling RLS:', e);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

await main();
