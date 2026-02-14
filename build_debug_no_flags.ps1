# Build de Debug para Isolar BSOD - SEM FLAGS WEBVIEW2
# Versão 1.1.72 - Debug puro

Write-Host "=== BUILD DEBUG BSOD ISOLATION ===" -ForegroundColor Red
Write-Host "Criando build SEM flags WebView2..." -ForegroundColor Yellow

# Atualizar versão para debug
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.version = "1.1.72-debug"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "✓ Versão atualizada para 1.1.72-debug" -ForegroundColor Green

# Criar config debug
copy "src-tauri\tauri.conf.json" "src-tauri\tauri.conf.debug.json"

Write-Host "✓ Config de debug criada" -ForegroundColor Green
Write-Host "`n=== EXECUTANDO BUILD DEBUG ===" -ForegroundColor Cyan

# Executar build
npm run tauri:build

Write-Host "`n=== BUILD DEBUG COMPLETO ===" -ForegroundColor Green
Write-Host "MSI Debug criado em:" -ForegroundColor Yellow
Write-Host "src-tauri\target\release\bundle\msi\" -ForegroundColor White
Write-Host "`nESTE BUILD NÃO TEM FLAGS WEBVIEW2!" -ForegroundColor Red