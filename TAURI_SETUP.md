<<<<<<< HEAD
# 🚀 Tauri Setup - Tasca Do VEREDA

## Instalação Completa do Tauri

Este projeto foi configurado para funcionar com **Tauri 2.x**, um framework moderno para criar aplicações desktop com React/Rust.

### ✅ O que foi configurado:

1. **Tauri CLI & API** - Instalados via npm
2. **Estrutura Rust** - Pasta `src-tauri/` com Cargo.toml otimizado
3. **Build Tools** - MSI installer (Windows) configurado
4. **Vite Config** - Otimizado para Tauri (porta 5173, dist)
5. **Scripts NPM** - Comandos para dev e build com Tauri

### 🔧 Comandos Disponíveis

```bash
# Desenvolvimento (hot reload)
npm run tauri:dev

# Build da aplicação (release otimizado)
npm run tauri:build:release

# Build com debug
npm run tauri:build
```

### 📋 Requisitos do Sistema

Para compilar o Tauri com suporte a Windows MSI, você precisa:

1. **Visual Studio C++ Build Tools** (obrigatório)
   - Baixe de: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Instale com suporte a "Desktop development with C++"

2. **Rust** (obrigatório)
   - Baixe de: https://rustup.rs/
   - Execute o instalador e siga as instruções

3. **WiX Toolset** (obrigatório para MSI)
   - Baixe de: https://wixtoolset.org/releases/
   - Instale a versão mais recente

4. **Node.js** (já instalado)

### 🚢 Estrutura de Build

```
src-tauri/          ← Código Rust & Configuração
├── src/            ← Código Rust (lib.rs, main.rs)
├── icons/          ← Ícones (128x128.png, icon.ico, etc)
├── Cargo.toml      ← Dependências Rust
└── tauri.conf.json ← Configuração principal do Tauri

dist/              ← Frontend compilado (criado por: npm run build)
```

### 📦 Criando o Instalador

```bash
# 1. Compile a aplicação
npm run tauri:build:release

# 2. O instalador MSI será criado em:
# src-tauri/target/release/bundle/msi/

# O arquivo será algo como:
# Tasca Do VEREDA_1.0.0_x64_pt-BR.msi
```

### ✨ Características

✅ **Hot Reload** em desenvolvimento
✅ **Compilação otimizada** em release
✅ **Instalador MSI** para distribuição Windows
✅ **Icones** escaláveis
✅ **Suporte a múltiplas janelas**
✅ **Segurança integrada** com Tauri
✅ **Logging automático**

### 🐛 Troubleshooting

#### "Rust não encontrado"
```bash
# Instale Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### "WiX não encontrado"
- Reinstale o WiX Toolset
- Adicione ao PATH do Windows

#### Porta 5173 ocupada
```bash
# Kill processo na porta
netstat -ano | findstr :5173
taskkill /PID [PID] /F
```

### 🎨 Próximos Passos

1. ✅ Execute `npm run tauri:dev` para testar
2. ✅ Customize o `tauri.conf.json` conforme necessário
3. ✅ Adicione ícones profissionais em `src-tauri/icons/`
4. ✅ Execute `npm run tauri:build:release` para criar o instalador
5. ✅ Distribua o arquivo `.msi` aos usuários

### 📝 Configuração do Tauri

A configuração principal está em: `src-tauri/tauri.conf.json`

Principais opções:
- `width/height` - Tamanho da janela
- `minWidth/minHeight` - Tamanho mínimo
- `devUrl` - URL de desenvolvimento (5173)
- `frontendDist` - Diretório do build (dist/)
- `bundle.targets` - Formatos: msi, nsis, exe

=======
# 🚀 Tauri Setup - Tasca Do VEREDA

## Instalação Completa do Tauri

Este projeto foi configurado para funcionar com **Tauri 2.x**, um framework moderno para criar aplicações desktop com React/Rust.

### ✅ O que foi configurado:

1. **Tauri CLI & API** - Instalados via npm
2. **Estrutura Rust** - Pasta `src-tauri/` com Cargo.toml otimizado
3. **Build Tools** - MSI installer (Windows) configurado
4. **Vite Config** - Otimizado para Tauri (porta 5173, dist)
5. **Scripts NPM** - Comandos para dev e build com Tauri

### 🔧 Comandos Disponíveis

```bash
# Desenvolvimento (hot reload)
npm run tauri:dev

# Build da aplicação (release otimizado)
npm run tauri:build:release

# Build com debug
npm run tauri:build
```

### 📋 Requisitos do Sistema

Para compilar o Tauri com suporte a Windows MSI, você precisa:

1. **Visual Studio C++ Build Tools** (obrigatório)
   - Baixe de: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Instale com suporte a "Desktop development with C++"

2. **Rust** (obrigatório)
   - Baixe de: https://rustup.rs/
   - Execute o instalador e siga as instruções

3. **WiX Toolset** (obrigatório para MSI)
   - Baixe de: https://wixtoolset.org/releases/
   - Instale a versão mais recente

4. **Node.js** (já instalado)

### 🚢 Estrutura de Build

```
src-tauri/          ← Código Rust & Configuração
├── src/            ← Código Rust (lib.rs, main.rs)
├── icons/          ← Ícones (128x128.png, icon.ico, etc)
├── Cargo.toml      ← Dependências Rust
└── tauri.conf.json ← Configuração principal do Tauri

dist/              ← Frontend compilado (criado por: npm run build)
```

### 📦 Criando o Instalador

```bash
# 1. Compile a aplicação
npm run tauri:build:release

# 2. O instalador MSI será criado em:
# src-tauri/target/release/bundle/msi/

# O arquivo será algo como:
# Tasca Do VEREDA_1.0.0_x64_pt-BR.msi
```

### ✨ Características

✅ **Hot Reload** em desenvolvimento
✅ **Compilação otimizada** em release
✅ **Instalador MSI** para distribuição Windows
✅ **Icones** escaláveis
✅ **Suporte a múltiplas janelas**
✅ **Segurança integrada** com Tauri
✅ **Logging automático**

### 🐛 Troubleshooting

#### "Rust não encontrado"
```bash
# Instale Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### "WiX não encontrado"
- Reinstale o WiX Toolset
- Adicione ao PATH do Windows

#### Porta 5173 ocupada
```bash
# Kill processo na porta
netstat -ano | findstr :5173
taskkill /PID [PID] /F
```

### 🎨 Próximos Passos

1. ✅ Execute `npm run tauri:dev` para testar
2. ✅ Customize o `tauri.conf.json` conforme necessário
3. ✅ Adicione ícones profissionais em `src-tauri/icons/`
4. ✅ Execute `npm run tauri:build:release` para criar o instalador
5. ✅ Distribua o arquivo `.msi` aos usuários

### 📝 Configuração do Tauri

A configuração principal está em: `src-tauri/tauri.conf.json`

Principais opções:
- `width/height` - Tamanho da janela
- `minWidth/minHeight` - Tamanho mínimo
- `devUrl` - URL de desenvolvimento (5173)
- `frontendDist` - Diretório do build (dist/)
- `bundle.targets` - Formatos: msi, nsis, exe

>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
