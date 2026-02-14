# Guia de Instalação v1.1.68

## Pré-requisitos
- Node.js 18+
- Rust toolchain (stable)
- WiX Toolset (para MSI)

## Instalação e build
1. Instalar dependências:
   - npm install
2. Compilar frontend:
   - npm run build
3. Gerar instalador:
   - npm run tauri:build:release

## Local do MSI
- src-tauri/target/release/bundle/msi

## Nota
- Recomenda-se executar lint e typecheck antes do build final.
