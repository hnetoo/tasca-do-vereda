// Script para corrigir todas as APIs que usam SUPABASE_SERVICE_ROLE_KEY
// Substituir por NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

// Arquivos que precisam ser corrigidos
const filesToFix = [
  'categories/route.ts',
  'check-tables/route.ts',
  'customers/route.ts',
  'dishes/route.ts',
  'debug/create-test-order/route.ts',
  'debug/data/route.ts',
  'debug/route.ts',
  'debug/simple/route.ts',
  'debug/tables/route.ts',
  'emergency-sync/route.ts',
  'expenses/hybrid-route.ts',
  'orders/hybrid-route.ts',
  'reservations/route.ts',
  'roles/route.ts',
  'sync-cloud-data/route.ts',
  'tables/route.ts',
  'test-data/route.ts',
  'test-order/route.ts'
];

filesToFix.forEach(file => {
  const filePath = path.join(apiDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir todas as ocorrências
    content = content.replace(/process\.env\.SUPABASE_SERVICE_ROLE_KEY/g, 'process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`❌ Not found: ${file}`);
  }
});

console.log('🎯 All APIs fixed!');
