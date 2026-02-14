import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const requiredTables = ['categories', 'menu_items', 'restaurant_settings', 'audit_logs'];

const createC = (u, k) => createClient(u, k);

const tableExists = async (client, name) => {
  const { error } = await client.from(name).select('*').limit(1);
  return !error;
};

const measureLatency = async (fn) => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};

const batchLoadTest = async (fn, total, concurrency) => {
  let errors = 0;
  const latencies = [];
  const chunks = Math.ceil(total / concurrency);
  for (let i = 0; i < chunks; i += 1) {
    const batch = Array.from({ length: concurrency }, async () => {
      try {
        const latency = await measureLatency(fn);
        latencies.push(latency);
      } catch {
        errors += 1;
      }
    });
    await Promise.all(batch);
  }
  return { errors, latencies };
};

const validateAnon = async (client) => {
  const tests = {};
  const reads = ['categories', 'menu_items', 'restaurant_settings'];
  for (const t of reads) {
    tests[`read_${t}`] = await tableExists(client, t);
  }
  const { error: auditWriteErr } = await client
    .from('audit_logs')
    .insert([{ timestamp: new Date().toISOString(), level: 'INFO', message: 'VALIDATION_TEST', context: 'TEST', details: null }]);
  tests['audit_logs_write_restricted'] = !!auditWriteErr;
  return tests;
};

const validateServiceRole = async (client) => {
  let okWrite = false;
  let insertedId = null;
  const { data, error } = await client
    .from('audit_logs')
    .insert([{ timestamp: new Date().toISOString(), level: 'INFO', message: 'VALIDATION_TEST', context: 'TEST', details: null }])
    .select('id')
    .limit(1);
  if (!error) {
    okWrite = true;
    if (Array.isArray(data) && data.length > 0) {
      insertedId = data[0]?.id || null;
    }
  }
  if (insertedId) {
    await client.from('audit_logs').delete().eq('id', insertedId);
  }
  return { audit_logs_write_allowed: okWrite };
};

const main = async () => {
  if (!url || !anonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
  }
  const anonClient = createC(url, anonKey);
  const res = {};
  res.tables = {};
  for (const t of requiredTables) {
    res.tables[t] = await tableExists(anonClient, t);
  }
  res.anon = await validateAnon(anonClient);
  res.security = { https: url.startsWith('https://') };

  const latencyChecks = {};
  const baselineLatency = await measureLatency(async () => {
    await anonClient.from('categories').select('id').limit(1);
  });
  latencyChecks.baseline_ms = baselineLatency;

  const loadResult = await batchLoadTest(
    async () => anonClient.from('categories').select('id').limit(1),
    50,
    10
  );
  const avgLatency = loadResult.latencies.length > 0
    ? Math.round(loadResult.latencies.reduce((a, b) => a + b, 0) / loadResult.latencies.length)
    : 0;
  const maxLatency = loadResult.latencies.length > 0
    ? Math.max(...loadResult.latencies)
    : 0;
  latencyChecks.load_avg_ms = avgLatency;
  latencyChecks.load_max_ms = maxLatency;
  latencyChecks.load_errors = loadResult.errors;
  res.latency = latencyChecks;

  const failureRecovery = { failure_detected: false, recovery_ok: false };
  try {
    const invalidUrl = new URL(url);
    invalidUrl.hostname = `invalid.${invalidUrl.hostname}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    await fetch(invalidUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);
  } catch {
    failureRecovery.failure_detected = true;
  }
  try {
    await anonClient.from('categories').select('id').limit(1);
    failureRecovery.recovery_ok = true;
  } catch {
    failureRecovery.recovery_ok = false;
  }
  res.network = failureRecovery;

  const functions = {};
  try {
    const functionsUrl = new URL('/functions/v1/owner-events', url);
    const response = await fetch(functionsUrl.toString(), { method: 'GET' });
    functions.owner_events_reachable = response.status !== 404;
    functions.owner_events_status = response.status;
  } catch {
    functions.owner_events_reachable = false;
  }
  res.functions = functions;
  if (serviceKey) {
    const serviceClient = createC(url, serviceKey);
    res.service = await validateServiceRole(serviceClient);
  }
  const okTables = requiredTables.every(t => res.tables[t]);
  const okAnonReads = res.anon.read_categories && res.anon.read_menu_items && res.anon.read_restaurant_settings;
  const okAuditRestricted = res.anon.audit_logs_write_restricted === true;
  const okServiceWrite = res.service ? res.service.audit_logs_write_allowed === true : true;
  const okLatency = (res.latency?.load_max_ms ?? 0) <= 2000 && (res.latency?.load_errors ?? 0) === 0;
  const okNetwork = res.network?.failure_detected === true && res.network?.recovery_ok === true;
  const okFunctions = res.functions?.owner_events_reachable !== false;
  const okSecurity = res.security?.https === true;
  const success = okTables && okAnonReads && okAuditRestricted && okServiceWrite && okLatency && okNetwork && okFunctions && okSecurity;
  console.log(JSON.stringify({ success, details: res }, null, 2));
  process.exit(success ? 0 : 2);
};

await main();
