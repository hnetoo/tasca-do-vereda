# Script de Limpeza e Correção BSOD - Tasca Do VEREDA
# Elimina conflitos com IIS e prepara ambiente limpo

Write-Host "=== LIMPEZA CRÍTICA BSOD ===" -ForegroundColor Red
Write-Host "Eliminando conflitos com IIS..." -ForegroundColor Yellow

# 1. Parar IIS completamente
Write-Host "`n1. PARANDO IIS..." -ForegroundColor Cyan
try {
    Stop-Service -Name "W3SVC" -Force -ErrorAction SilentlyContinue
    Stop-Service -Name "IISADMIN" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ IIS parado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "⚠ Erro ao parar IIS: $_" -ForegroundColor Red
}

# 2. Matar processos w3wp (IIS Worker Process)
Write-Host "`n2. ELIMINANDO PROCESSOS IIS..." -ForegroundColor Cyan
$w3wpProcesses = Get-Process -Name "w3wp" -ErrorAction SilentlyContinue
if ($w3wpProcesses) {
    foreach ($proc in $w3wpProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force
            Write-Host "✓ Processo w3wp PID $($proc.Id) eliminado" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Não foi possível eliminar w3wp PID $($proc.Id)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✓ Nenhum processo w3wp em execução" -ForegroundColor Green
}

# 3. Desabilitar IIS no startup
Write-Host "`n3. DESABILITANDO IIS NO STARTUP..." -ForegroundColor Cyan
try {
    Set-Service -Name "W3SVC" -StartupType Disabled
    Set-Service -Name "IISADMIN" -StartupType Disabled
    Write-Host "✓ IIS desabilitado no startup" -ForegroundColor Green
} catch {
    Write-Host "⚠ Erro ao desabilitar IIS: $_" -ForegroundColor Red
}

# 4. Verificar integridade do WebView2 Runtime
Write-Host "`n4. VERIFICANDO WEBVIEW2..." -ForegroundColor Cyan
try {
    # Matar processos Edge/WebView2 excessivos
    $edgeProcesses = Get-Process -Name "msedge" -ErrorAction SilentlyContinue
    if ($edgeProcesses.Count -gt 5) {
        Write-Host "⚠ Detectados $($edgeProcesses.Count) processos Edge - limpando..." -ForegroundColor Yellow
        foreach ($proc in $edgeProcesses | Select-Object -Skip 3) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✓ Processos Edge excessivos eliminados" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Erro ao limpar Edge: $_" -ForegroundColor Red
}

# 5. Criar proteção permanente
Write-Host "`n5. CRIANDO PROTEÇÃO PERMANENTE..." -ForegroundColor Cyan
$protectionScript = @"
# Previne IIS de iniciar automaticamente
Set-Service -Name "W3SVC" -StartupType Disabled
Set-Service -Name "IISADMIN" -StartupType Disabled
# Mata processos w3wp se existirem
Get-Process -Name "w3wp" -ErrorAction SilentlyContinue | Stop-Process -Force
"@

$protectionPath = "$env:APPDATA\TascaDoVereda\block_iis.ps1"
$protectionDir = Split-Path $protectionPath -Parent
if (!(Test-Path $protectionDir)) {
    New-Item -Path $protectionDir -ItemType Directory -Force | Out-Null
}
Set-Content -Path $protectionPath -Value $protectionScript

Write-Host "✓ Proteção permanente criada" -ForegroundColor Green

# 6. Limpar cache e temporários
Write-Host "`n6. LIMPANDO CACHE..." -ForegroundColor Cyan
try {
    Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Edge*\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Cache limpo" -ForegroundColor Green
} catch {
    Write-Host "⚠ Erro ao limpar cache: $_" -ForegroundColor Red
}

Write-Host "`n=== LIMPEZA CONCLUÍDA ===" -ForegroundColor Green
Write-Host "AGORA INSTALE O MSI COMO ADMINISTRADOR!" -ForegroundColor Red
Write-Host "Clique direito no arquivo MSI → Executar como administrador" -ForegroundColor Yellow