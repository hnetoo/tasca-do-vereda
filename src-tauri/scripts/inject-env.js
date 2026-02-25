// Script to inject environment variables for Tauri build
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../../src/utils/env.ts');
const distDir = path.join(__dirname, '../../dist');

// Read environment variables
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173',
  NEXT_PUBLIC_TAURI_BUILD: 'true',
  NODE_ENV: process.env.NODE_ENV || 'production'
};

// Create injection script
const injectionScript = `
// Injected environment variables for Tauri build
if (typeof window !== 'undefined') {
  window.__ENV__ = ${JSON.stringify(envVars, null, 2)};
}
`;

// Write injection script to dist directory
const injectionFile = path.join(distDir, 'env-injection.js');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
fs.writeFileSync(injectionFile, injectionScript);

console.log('Environment variables injected for Tauri build');
console.log('Variables:', Object.keys(envVars));
