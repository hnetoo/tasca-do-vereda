# Script de Diagnóstico BSOD para Tasca Do VEREDA
# Executa verificações completas do sistema

Write-Host "=== DIAGNÓSTICO BSOD TASCA DO VEREDA ===" -ForegroundColor Red
Write-Host "Iniciando análise completa do sistema..." -ForegroundColor Yellow

# 1. Verificar logs de tela azul recentes
Write-Host "`n1. ANALISANDO LOGS DE BSOD RECENTES..." -ForegroundColor Cyan
$bsodEvents = Get-WinEvent -FilterHashtable @{LogName='System'; ID=1001; Level=1} -ErrorAction SilentlyContinue | Select-Object -First 5
if ($bsodEvents) {
    Write-Host "BSODs detectados nos últimos dias:" -ForegroundColor Red
    foreach ($event in $bsodEvents) {
        Write-Host "  Data: $($event.TimeCreated) - ID: $($event.Id)" -ForegroundColor White
        Write-Host "  Mensagem: $($event.Message)" -ForegroundColor White
    }
} else {
    Write-Host "Nenhum BSOD encontrado nos logs recentes" -ForegroundColor Green
}

# 2. Verificar arquivos de minidump
Write-Host "`n2. ANALISANDO ARQUIVOS DE MINIDUMP..." -ForegroundColor Cyan
$dumpPath = "$env:SystemRoot\Minidump"
if (Test-Path $dumpPath) {
    $dumps = Get-ChildItem $dumpPath -Filter *.dmp | Sort-Object LastWriteTime -Descending | Select-Object -First 3
    if ($dumps) {
        Write-Host "Arquivos de minidump encontrados:" -ForegroundColor Red
        foreach ($dump in $dumps) {
            Write-Host "  $($dump.Name) - $($dump.LastWriteTime)" -ForegroundColor White
            Write-Host "  Tamanho: $([math]::Round($dump.Length/1MB, 2)) MB" -ForegroundColor White
        }
    } else {
        Write-Host "Nenhum arquivo de minidump encontrado" -ForegroundColor Yellow
    }
} else {
    Write-Host "Pasta de minidump não encontrada" -ForegroundColor Yellow
}

# 3. Verificar drivers problemáticos
Write-Host "`n3. VERIFICANDO DRIVERS EM CONFLITO..." -ForegroundColor Cyan
try {
    $problemDevices = Get-WmiObject Win32_PnPEntity | Where-Object {$_.ConfigManagerErrorCode -ne 0}
    if ($problemDevices) {
        Write-Host "Dispositivos com problemas detectados:" -ForegroundColor Red
        foreach ($device in $problemDevices) {
            Write-Host "  $($device.Name) - Erro: $($device.ConfigManagerErrorCode)" -ForegroundColor White
        }
    } else {
        Write-Host "Nenhum dispositivo com problemas detectado" -ForegroundColor Green
    }
} catch {
    Write-Host "Erro ao verificar dispositivos: $_" -ForegroundColor Red
}

# 4. Verificar WebView2 Runtime
Write-Host "`n4. VERIFICANDO WEBVIEW2 RUNTIME..." -ForegroundColor Cyan
$webview2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
if (Test-Path $webview2Path) {
    $webview2Versions = Get-ChildItem $webview2Path -Directory | Where-Object {$_.Name -match '^\d+\.\d+\.\d+\.\d+$'} | Sort-Object Name -Descending | Select-Object -First 3
    if ($webview2Versions) {
        Write-Host "Versões do WebView2 instaladas:" -ForegroundColor Yellow
        foreach ($version in $webview2Versions) {
            Write-Host "  $($version.Name)" -ForegroundColor White
        }
    }
} else {
    Write-Host "WebView2 Runtime não encontrado" -ForegroundColor Red
}

# 5. Verificar memória RAM
Write-Host "`n5. VERIFICANDO MEMÓRIA RAM..." -ForegroundColor Cyan
try {
    $memory = Get-WmiObject Win32_PhysicalMemory
    $totalMemory = [math]::Round(($memory | Measure-Object Capacity -Sum).Sum / 1GB, 2)
    Write-Host "Memória total instalada: $totalMemory GB" -ForegroundColor White
    
    # Verificar erros de memória
    $memoryErrors = Get-WinEvent -FilterHashtable @{LogName='System'; ID=19,20,21,22} -ErrorAction SilentlyContinue | Select-Object -First 3
    if ($memoryErrors) {
        Write-Host "Erros de memória detectados:" -ForegroundColor Red
        foreach ($error in $memoryErrors) {
            Write-Host "  $($error.TimeCreated): $($error.Message)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "Erro ao verificar memória: $_" -ForegroundColor Red
}

# 6. Verificar temperatura da CPU
Write-Host "`n6. VERIFICANDO TEMPERATURA DO SISTEMA..." -ForegroundColor Cyan
try {
    $temp = Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" -ErrorAction SilentlyContinue
    if ($temp) {
        $currentTemp = ($temp.CurrentTemperature / 10 - 273.15)
        Write-Host "Temperatura atual: $([math]::Round($currentTemp, 1))°C" -ForegroundColor White
        if ($currentTemp -gt 80) {
            Write-Host "ATENÇÃO: Temperatura alta detectada!" -ForegroundColor Red
        }
    } else {
        Write-Host "Não foi possível ler temperatura (requer privilégios elevados)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Erro ao verificar temperatura: $_" -ForegroundColor Red
}

# 7. Verificar disco rígido
Write-Host "`n7. VERIFICANDO INTEGRIDADE DO DISCO..." -ForegroundColor Cyan
try {
    $disk = Get-WmiObject Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "C:"}
    $freeSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
    $totalSpace = [math]::Round($disk.Size / 1GB, 2)
    $usedPercent = [math]::Round((($totalSpace - $freeSpace) / $totalSpace) * 100, 1)
    
    Write-Host "Espaço em disco C: $freeSpace GB livres de $totalSpace GB total" -ForegroundColor White
    Write-Host "Uso do disco: $usedPercent%" -ForegroundColor White
    
    if ($usedPercent -gt 90) {
        Write-Host "ATENÇÃO: Disco quase cheio!" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao verificar disco: $_" -ForegroundColor Red
}

# 8. Verificar logs do aplicativo Tasca
Write-Host "`n8. VERIFICANDO LOGS DO TASCA DO VEREDA..." -ForegroundColor Cyan
$appLogs = Get-WinEvent -FilterHashtable @{LogName='Application'; Level=1,2} -ErrorAction SilentlyContinue | Where-Object {$_.Message -like "*Tasca*" -or $_.Message -like "*WebView*"} | Select-Object -First 5
if ($appLogs) {
    Write-Host "Logs do Tasca encontrados:" -ForegroundColor Yellow
    foreach ($log in $appLogs) {
        Write-Host "  $($log.TimeCreated): $($log.LevelDisplayName) - $($log.Message)" -ForegroundColor White
    }
} else {
    Write-Host "Nenhum log específico do Tasca encontrado" -ForegroundColor Green
}

# 9. Verificar processos em execução
Write-Host "`n9. VERIFICANDO PROCESSOS EM CONFLITO..." -ForegroundColor Cyan
$conflictProcesses = @("iisexpress", "w3wp", "msedge", "chrome", "firefox", "opera")
foreach ($proc in $conflictProcesses) {
    $running = Get-Process $proc -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "Processo $proc está em execução (PID: $($running.Id))" -ForegroundColor Yellow
    }
}

# 10. Recomendações finais
Write-Host "`n=== RECOMENDAÇÕES ===" -ForegroundColor Cyan
Write-Host "1. Se houver minidumps, analisar com WinDbg ou BlueScreenView" -ForegroundColor White
Write-Host "2. Verificar se há atualizações de drivers disponíveis" -ForegroundColor White
Write-Host "3. Executar teste de memória (Windows Memory Diagnostic)" -ForegroundColor White
Write-Host "4. Desinstalar e reinstalar WebView2 Runtime se necessário" -ForegroundColor White
Write-Host "5. Executar 'sfc /scannow' para verificar integridade do sistema" -ForegroundColor White
Write-Host "6. Verificar se há conflitos com antivírus ou firewalls" -ForegroundColor White

Write-Host "`n=== DIAGNOSTICO COMPLETO ===" -ForegroundColor Green