
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'tasca_backup_2026-02-15.json');

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);

    console.log('Estrutura do JSON de backup:');
    for (const key in json) {
        if (Object.hasOwnProperty.call(json, key)) {
            const value = json[key];
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    console.log(`- ${key}: Array (tamanho: ${value.length})`);
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        console.log(`  Primeiro item do array (${key}[0]) chaves: ${Object.keys(value[0]).join(', ')}`);
                    }
                } else {
                    console.log(`- ${key}: Objeto (chaves: ${Object.keys(value).join(', ')})`);
                }
            } else {
                console.log(`- ${key}: ${typeof value}`);
            }
        }
    }
} catch (error) {
    console.error('Erro ao ler ou analisar o ficheiro JSON:', error);
}
