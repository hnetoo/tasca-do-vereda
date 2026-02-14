#!/bin/bash
# Script de build Tauri para Tasca Do VEREDA

echo "======================================"
echo "🚀 Tauri Build - Tasca Do VEREDA"
echo "======================================"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validar Rust
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}❌ Rust não está instalado!${NC}"
    echo "Instale em: https://rustup.rs/"
    exit 1
fi

# Validar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências verificadas${NC}"

# Menu
echo ""
echo "Escolha uma opção:"
echo "1) Dev (com hot reload)"
echo "2) Build Release (otimizado)"
echo "3) Build Debug"
echo "4) Limpar cache e rebuild"
echo ""
read -p "Opção (1-4): " option

case $option in
    1)
        echo -e "${YELLOW}Iniciando desenvolvimento...${NC}"
        npm run tauri:dev
        ;;
    2)
        echo -e "${YELLOW}Compilando para release...${NC}"
        npm run tauri:build:release
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Build concluído!${NC}"
            echo "Instalador: src-tauri/target/release/bundle/msi/"
        fi
        ;;
    3)
        echo -e "${YELLOW}Compilando para debug...${NC}"
        npm run tauri:build
        ;;
    4)
        echo -e "${YELLOW}Limpando cache...${NC}"
        rm -rf src-tauri/target/
        npm run tauri:build:release
        ;;
    *)
        echo -e "${RED}Opção inválida!${NC}"
        exit 1
        ;;
esac
