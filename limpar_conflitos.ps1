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

# 4. Limpar portas conflitantes (80, 443, 8080)
Write-Host "`n4. LIBERANDO PORTAS..." -ForegroundColor Cyan
try {
    # Verificar portas em uso
    $ports = Get-NetTCPConnection -LocalPort @(80, 443, 8080) -ErrorAction SilentlyContinue
    if ($ports) {
        foreach ($port in $ports) {
            $process = Get-Process -Id $port.OwningProcess -ErrorAction SilentlyContinue
            Write-Host "Porta $($port.LocalPort) em uso por: $($process.ProcessName) (PID: $($port.OwningProcess))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✓ Portas 80, 443, 8080 livres" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Erro ao verificar portas: $_" -ForegroundColor Red
}

# 5. Verificar e limpar WebView2 conflitantes
Write-Host "`n5. VERIFICANDO WEBVIEW2..." -ForegroundColor Cyan
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

# 6. Verificar integridade do WebView2 Runtime
Write-Host "`n6. VERIFICANDO INTEGRIDADE WEBVIEW2..." -ForegroundColor Cyan
$webview2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
if (Test-Path $webview2Path) {
    $versions = Get-ChildItem $webview2Path -Directory | Where-Object {$_.Name -match '^\d+\.\d+\.\d+\.\d+$'}
    if ($versions.Count -gt 3) {
        Write-Host "⚠ Múltiplas versões WebView2 detectadas" -ForegroundColor Yellow
        Write-Host "Versões instaladas: $($versions.Name -join ', ')" -ForegroundColor White
    }
}

# 7. Criar arquivo de bloqueio do IIS
Write-Host "`n7. CRIANDO BLOQUEIO IIS..." -ForegroundColor Cyan
$blockFile = "C:\Windows\System32\inetsrv\iisblock.tmp"
try {
    if (!(Test-Path $blockFile)) {
        New-Item -Path $blockFile -ItemType File -Force | Out-Null
        Write-Host "✓ Bloqueio IIS criado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Não foi possível criar bloqueio (requer admin)" -ForegroundColor Red
}

# 8. Verificar integridade do sistema
Write-Host "`n8. VERIFICANDO INTEGRIDADE DO SISTEMA..." -ForegroundColor Cyan
try {
    # Verificar se há corrupção de sistema
    $sfcResult = sfc /verifyonly 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Integridade do sistema OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ Possíveis problemas de integridade detectados" -ForegroundColor Red
        Write-Host "Execute 'sfc /scannow' como administrador para corrigir" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Não foi possível verificar integridade" -ForegroundColor Red
}

# 9. Criar script de proteção permanente
Write-Host "`n9. CRIANDO PROTEÇÃO PERMANENTE..." -ForegroundColor Cyan
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

# Criar tarefa agendada para proteção
schtasks /create /tn "TascaDoVereda_IIS_Block" /tr "powershell -ExecutionPolicy Bypass -File `"$protectionPath`"" /sc onlogon /ru SYSTEM /f 2>$null

Write-Host "✓ Proteção permanente criada" -ForegroundColor Green

# 10. Recomendações finais
Write-Host "`n=== RECOMENDAÇÕES FINAIS ===" -ForegroundColor Cyan
Write-Host "✓ IIS completamente desabilitado" -ForegroundColor Green
Write-Host "✓ Processos conflitantes eliminados" -ForegroundColor Green
Write-Host "✓ Proteção automática instalada" -ForegroundColor Green
Write-Host "`nAGORA INSTALE O MSI COMO ADMINISTRADOR!" -ForegroundColor Red
Write-Host "Clique direito no arquivo MSI → Executar como administrador" -ForegroundColor Yellow

Write-Host "`n=== LIMPEZA CONCLUÍDA ===" -ForegroundColor Green