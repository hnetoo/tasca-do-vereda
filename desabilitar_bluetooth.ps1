# Desabilitar Bluetooth - Solução para BSOD
# O erro do Bluetooth está causando o crash

Write-Host "=== DESABILITANDO BLUETOOTH ===" -ForegroundColor Red
Write-Host "Eliminando driver problemático..." -ForegroundColor Yellow

# 1. Parar serviço Bluetooth
Write-Host "`n1. Parando serviço Bluetooth..." -ForegroundColor Cyan
try {
    Stop-Service -Name "bthserv" -Force -ErrorAction SilentlyContinue
    Set-Service -Name "bthserv" -StartupType Disabled
    Write-Host "✓ Serviço Bluetooth desabilitado" -ForegroundColor Green
} catch {
    Write-Host "⚠ Erro ao desabilitar Bluetooth: $_" -ForegroundColor Red
}

# 2. Desabilitar adaptador Bluetooth via Device Manager
Write-Host "`n2. Desabilitando adaptador Bluetooth..." -ForegroundColor Cyan
try {
    # Encontrar adaptadores Bluetooth
    $bluetoothDevices = Get-PnpDevice | Where-Object {$_.FriendlyName -like "*Bluetooth*" -or $_.Class -eq "Bluetooth"}
    
    if ($bluetoothDevices) {
        foreach ($device in $bluetoothDevices) {
            Write-Host "Desabilitando: $($device.FriendlyName)" -ForegroundColor Yellow
            Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
            Write-Host "✓ $($device.FriendlyName) desabilitado" -ForegroundColor Green
        }
    } else {
        Write-Host "Nenhum dispositivo Bluetooth encontrado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Erro ao desabilitar dispositivos: $_" -ForegroundColor Red
}

# 3. Prevenir que Bluetooth volte a iniciar
Write-Host "`n3. Criando proteção permanente..." -ForegroundColor Cyan

# Criar script de proteção
$protectionScript = @"
# Previne Bluetooth de iniciar
Set-Service -Name "bthserv" -StartupType Disabled
Get-PnpDevice | Where-Object {_.FriendlyName -like "*Bluetooth*" -or _.Class -eq "Bluetooth"} | ForEach-Object {
    Disable-PnpDevice -InstanceId _.InstanceId -Confirm:false -ErrorAction SilentlyContinue
}
"@

$protectionPath = "$env:APPDATA\TascaDoVereda\disable_bluetooth.ps1"
$protectionDir = Split-Path $protectionPath -Parent
if (!(Test-Path $protectionDir)) {
    New-Item -Path $protectionDir -ItemType Directory -Force | Out-Null
}
Set-Content -Path $protectionPath -Value $protectionScript

# Criar tarefa agendada
schtasks /create /tn "TascaDoVereda_Disable_Bluetooth" /tr "powershell -ExecutionPolicy Bypass -File `"$protectionPath`"" /sc onlogon /ru SYSTEM /f 2>$null

Write-Host "✓ Proteção Bluetooth criada" -ForegroundColor Green

# 4. Verificar resultado
Write-Host "`n4. VERIFICANDO RESULTADO..." -ForegroundColor Cyan
$bluetoothStatus = Get-Service -Name "bthserv" -ErrorAction SilentlyContinue
if ($bluetoothStatus) {
    Write-Host "Status do Bluetooth: $($bluetoothStatus.Status)" -ForegroundColor White
    Write-Host "Startup Type: $($bluetoothStatus.StartType)" -ForegroundColor White
}

Write-Host "`n=== BLUETOOTH DESABILITADO ===" -ForegroundColor Green
Write-Host "AGORA TESTE O MSI DEBUG SEM FLAGS!" -ForegroundColor Red
Write-Host "Arquivo MSI: src-tauri\target\release\bundle\msi\Tasca Do VEREDA_1.1.71_x64_en-US.msi" -ForegroundColor Yellow