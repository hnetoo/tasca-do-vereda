#!/usr/bin/env node

/**
 * Script para migrar Server Actions para funções client-side compatíveis com Tauri
 * Uso: node scripts/migrate-server-actions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src');
const ACTIONS_DIR = path.join(SRC_DIR, 'app/actions');

// Mapeamento de Server Actions para funções client-side
const actionMappings = {
  'getMenuData': 'getMenuDataClient',
  // Adicionar mais mapeamentos conforme necessário
};

function findServerActionUsages(dir) {
  const usages = [];
  
  function traverseDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        traverseDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Procurar por imports e chamadas de Server Actions
        for (const [serverAction, clientAction] of Object.entries(actionMappings)) {
          // Verificar imports
          const importRegex = new RegExp(`import\\s*{[^}]*${serverAction}[^}]*}\\s*from\\s*['"][^'"]*actions[^'"]*['"]`, 'g');
          if (importRegex.test(content)) {
            usages.push({
              file: filePath,
              type: 'import',
              action: serverAction,
              replacement: clientAction
            });
          }
          
          // Verificar chamadas diretas
          const callRegex = new RegExp(`\\b${serverAction}\\s*\\(`, 'g');
          if (callRegex.test(content)) {
            usages.push({
              file: filePath,
              type: 'call',
              action: serverAction,
              replacement: clientAction
            });
          }
        }
      }
    }
  }
  
  traverseDirectory(dir);
  return usages;
}

function replaceServerActionUsages(usages) {
  for (const usage of usages) {
    const content = fs.readFileSync(usage.file, 'utf8');
    let newContent = content;
    
    if (usage.type === 'import') {
      // Substituir import de Server Actions para client actions
      newContent = content.replace(
        /import\s*{([^}]+)}\s*from\s*['"][^'"]*actions[^'"]*['"]/g,
        (match, imports) => {
          const newImports = imports.replace(usage.action, usage.replacement);
          return `import { ${newImports} } from '@/utils/clientActions'`;
        }
      );
    } else if (usage.type === 'call') {
      // Substituir chamada da função
      const regex = new RegExp(`\\b${usage.action}\\s*\\(`, 'g');
      newContent = content.replace(regex, `${usage.replacement}(`);
    }
    
    if (newContent !== content) {
      fs.writeFileSync(usage.file, newContent);
      console.log(`✅ Updated ${usage.file} - replaced ${usage.action} with ${usage.replacement}`);
    }
  }
}

function main() {
  console.log('🔍 Searching for Server Action usages...');
  const usages = findServerActionUsages(SRC_DIR);
  
  if (usages.length === 0) {
    console.log('✅ No Server Action usages found');
    return;
  }
  
  console.log(`📝 Found ${usages.length} Server Action usages:`);
  usages.forEach(usage => {
    console.log(`  - ${usage.file} (${usage.type}): ${usage.action}`);
  });
  
  console.log('\n🔄 Replacing Server Actions with client-side functions...');
  replaceServerActionUsages(usages);
  
  console.log('\n✅ Migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the application to ensure all functionality works');
  console.log('2. Remove or comment out Server Action files in src/app/actions/');
  console.log('3. Update any remaining Server Actions manually if needed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { findServerActionUsages, replaceServerActionUsages };
