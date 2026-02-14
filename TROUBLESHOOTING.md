<<<<<<< HEAD
# 🆘 Troubleshooting Tauri

## Erros Comuns e Soluções

### 1. "Rust not found" / "rustc not found"

**Erro:**
```
error: rust-analyzer server crashed 4 times
```

**Solução:**
```powershell
# Instale Rust
irm https://rustup.rs | iex

# Reinicie o terminal após instalação
# Verifique
rustc --version
```

---

### 2. "WiX not found" / Erro ao criar MSI

**Erro:**
```
Bundling desktop/installer.nsis as msi (Wix Toolset)
error: failed to bundle MSI: WiX not found
```

**Solução:**
1. Baixe: https://wixtoolset.org/releases/
2. Execute o instalador
3. Reinicie o computador
4. Tente novamente:
```powershell
npm run tauri:build:release
```

---

### 3. Porta 5173 já está em uso

**Erro:**
```
EADDRINUSE: address already in use :::5173
```

**Solução:**
```powershell
# Encontre o processo
netstat -ano | findstr :5173

# Mate o processo
taskkill /PID [PID] /F

# Ou use outra porta em vite.config.ts:
# server: { port: 5174 }
```

---

### 4. "app_lib not found" / Erro de compilação Rust

**Erro:**
```
error: could not compile `app`
```

**Solução:**
```powershell
# Limpe o cache Rust
Remove-Item -Path "src-tauri/target/" -Recurse -Force

# Tente novamente
npm run tauri:build
```

---

### 5. Visual C++ Build Tools não encontrado

**Erro:**
```
error: Microsoft Visual C++ Build Tools not found
```

**Solução:**
1. Baixe: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Execute o instalador
3. Marque: "Desktop development with C++"
4. Clique em "Install"
5. **Reinicie o computador**
6. Tente novamente

---

### 6. Compilação muito lenta

**Causa:** Primeira compilação Rust é sempre lenta

**Solução:**
- Paciência! Primeira vez: 5-15 minutos
- Próximas vezes: mais rápido
- Desabilite antivírus temporariamente (pode estar rastreando builds)

**Dica:** Se estiver MUITO lenta (>30 min):
```powershell
# Use compilação incremental
$env:CARGO_BUILD_JOBS = "1"
npm run tauri:build:release
```

---

### 7. App abre mas fica em branco

**Erro:** Janela abre mas sem conteúdo

**Solução:**
1. Verifique `tauri.conf.json`:
   - `frontendDist` deve ser `"../dist"`
   - `devUrl` deve ser `"http://localhost:5173"`

2. Certifique-se que frontend foi compilado:
```powershell
npm run build
npm run tauri:build
```

3. Verifique console:
```powershell
npm run tauri:dev
# Procure por erros na aba "Developer Tools"
```

---

### 8. Erro no instalar MSI criado

**Erro:** O arquivo `.msi` recusa instalar ou abre uma janela de erro

**Solução:**
1. Desabilite antivírus (pode estar bloqueando)
2. Execute como Administrador
3. Verifique `upgradeCode` em `tauri.conf.json` é único
4. Tente desinstalar versão anterior primeiro

---

### 9. App funciona em dev mas não em release

**Erro:** `npm run tauri:dev` funciona, mas o MSI não abre

**Causa:** Configuração incorreta

**Solução:**
1. Verifique `base: './'` em `vite.config.ts`
2. Compile frontend sem erros:
```powershell
npm run build
# Não deve ter warnings ou errors
```

3. Verifique `dist/` existe e tem `index.html`:
```powershell
dir dist/
```

4. Se OK, tente novamente:
```powershell
npm run tauri:build:release
```

---

### 10. Node modules corrompido

**Erro:** Erros aleatórios de imports

**Solução:**
```powershell
# Delete node_modules
Remove-Item -Path "node_modules" -Recurse -Force

# Reinstale
npm install

# Limpe Rust também
Remove-Item -Path "src-tauri/target" -Recurse -Force

# Tente novamente
npm run tauri:dev
```

---

## 🔍 Debug Mode

Para adicionar logs detalhados:

```powershell
# No arquivo src-tauri/src/lib.rs, mude:
# if cfg!(debug_assertions) {

# Para produção, adicione logs:
# app.handle().plugin(tauri_plugin_log::Builder::new().build())?;
```

---

## 📞 Se nada funcionar

1. ✅ Verifique todas as dependências do sistema instaladas
2. ✅ Reinicie o computador (resolve 90% dos problemas)
3. ✅ Limpe cache: `npm cache clean --force` + `Remove-Item src-tauri/target -Recurse`
4. ✅ Reinstale tudo: `npm install`
5. ✅ Leia [GUIA_TAURI_COMPLETO.md](GUIA_TAURI_COMPLETO.md)
6. ✅ Visite: https://tauri.app/v1/guides/

---

## ✅ Checklist de Verificação

Antes de chamar de problema, verifique:

- [ ] Rust instalado? `rustc --version`
- [ ] Node instalado? `npm --version`
- [ ] WiX instalado? `heat.exe --help`
- [ ] Visual C++ instalado? (check via "Add/Remove Programs")
- [ ] Computador reiniciado após instalar dependências?
- [ ] `npm install` executado?
- [ ] `npm run build` funciona sem erros?
- [ ] Porta 5173 está livre?
- [ ] Arquivo `dist/index.html` existe?
- [ ] `tauri.conf.json` tem `frontendDist: "../dist"`?

Se tudo OK e ainda não funciona, o problema é específico ao seu sistema.

---

**Último recurso:** Procure no GitHub Issues do Tauri: https://github.com/tauri-apps/tauri/issues
=======
# 🆘 Troubleshooting Tauri

## Erros Comuns e Soluções

### 1. "Rust not found" / "rustc not found"

**Erro:**
```
error: rust-analyzer server crashed 4 times
```

**Solução:**
```powershell
# Instale Rust
irm https://rustup.rs | iex

# Reinicie o terminal após instalação
# Verifique
rustc --version
```

---

### 2. "WiX not found" / Erro ao criar MSI

**Erro:**
```
Bundling desktop/installer.nsis as msi (Wix Toolset)
error: failed to bundle MSI: WiX not found
```

**Solução:**
1. Baixe: https://wixtoolset.org/releases/
2. Execute o instalador
3. Reinicie o computador
4. Tente novamente:
```powershell
npm run tauri:build:release
```

---

### 3. Porta 5173 já está em uso

**Erro:**
```
EADDRINUSE: address already in use :::5173
```

**Solução:**
```powershell
# Encontre o processo
netstat -ano | findstr :5173

# Mate o processo
taskkill /PID [PID] /F

# Ou use outra porta em vite.config.ts:
# server: { port: 5174 }
```

---

### 4. "app_lib not found" / Erro de compilação Rust

**Erro:**
```
error: could not compile `app`
```

**Solução:**
```powershell
# Limpe o cache Rust
Remove-Item -Path "src-tauri/target/" -Recurse -Force

# Tente novamente
npm run tauri:build
```

---

### 5. Visual C++ Build Tools não encontrado

**Erro:**
```
error: Microsoft Visual C++ Build Tools not found
```

**Solução:**
1. Baixe: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Execute o instalador
3. Marque: "Desktop development with C++"
4. Clique em "Install"
5. **Reinicie o computador**
6. Tente novamente

---

### 6. Compilação muito lenta

**Causa:** Primeira compilação Rust é sempre lenta

**Solução:**
- Paciência! Primeira vez: 5-15 minutos
- Próximas vezes: mais rápido
- Desabilite antivírus temporariamente (pode estar rastreando builds)

**Dica:** Se estiver MUITO lenta (>30 min):
```powershell
# Use compilação incremental
$env:CARGO_BUILD_JOBS = "1"
npm run tauri:build:release
```

---

### 7. App abre mas fica em branco

**Erro:** Janela abre mas sem conteúdo

**Solução:**
1. Verifique `tauri.conf.json`:
   - `frontendDist` deve ser `"../dist"`
   - `devUrl` deve ser `"http://localhost:5173"`

2. Certifique-se que frontend foi compilado:
```powershell
npm run build
npm run tauri:build
```

3. Verifique console:
```powershell
npm run tauri:dev
# Procure por erros na aba "Developer Tools"
```

---

### 8. Erro no instalar MSI criado

**Erro:** O arquivo `.msi` recusa instalar ou abre uma janela de erro

**Solução:**
1. Desabilite antivírus (pode estar bloqueando)
2. Execute como Administrador
3. Verifique `upgradeCode` em `tauri.conf.json` é único
4. Tente desinstalar versão anterior primeiro

---

### 9. App funciona em dev mas não em release

**Erro:** `npm run tauri:dev` funciona, mas o MSI não abre

**Causa:** Configuração incorreta

**Solução:**
1. Verifique `base: './'` em `vite.config.ts`
2. Compile frontend sem erros:
```powershell
npm run build
# Não deve ter warnings ou errors
```

3. Verifique `dist/` existe e tem `index.html`:
```powershell
dir dist/
```

4. Se OK, tente novamente:
```powershell
npm run tauri:build:release
```

---

### 10. Node modules corrompido

**Erro:** Erros aleatórios de imports

**Solução:**
```powershell
# Delete node_modules
Remove-Item -Path "node_modules" -Recurse -Force

# Reinstale
npm install

# Limpe Rust também
Remove-Item -Path "src-tauri/target" -Recurse -Force

# Tente novamente
npm run tauri:dev
```

---

## 🔍 Debug Mode

Para adicionar logs detalhados:

```powershell
# No arquivo src-tauri/src/lib.rs, mude:
# if cfg!(debug_assertions) {

# Para produção, adicione logs:
# app.handle().plugin(tauri_plugin_log::Builder::new().build())?;
```

---

## 📞 Se nada funcionar

1. ✅ Verifique todas as dependências do sistema instaladas
2. ✅ Reinicie o computador (resolve 90% dos problemas)
3. ✅ Limpe cache: `npm cache clean --force` + `Remove-Item src-tauri/target -Recurse`
4. ✅ Reinstale tudo: `npm install`
5. ✅ Leia [GUIA_TAURI_COMPLETO.md](GUIA_TAURI_COMPLETO.md)
6. ✅ Visite: https://tauri.app/v1/guides/

---

## ✅ Checklist de Verificação

Antes de chamar de problema, verifique:

- [ ] Rust instalado? `rustc --version`
- [ ] Node instalado? `npm --version`
- [ ] WiX instalado? `heat.exe --help`
- [ ] Visual C++ instalado? (check via "Add/Remove Programs")
- [ ] Computador reiniciado após instalar dependências?
- [ ] `npm install` executado?
- [ ] `npm run build` funciona sem erros?
- [ ] Porta 5173 está livre?
- [ ] Arquivo `dist/index.html` existe?
- [ ] `tauri.conf.json` tem `frontendDist: "../dist"`?

Se tudo OK e ainda não funciona, o problema é específico ao seu sistema.

---

**Último recurso:** Procure no GitHub Issues do Tauri: https://github.com/tauri-apps/tauri/issues
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
