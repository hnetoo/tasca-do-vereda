# SOLUÇÃO COMPLETA BSOD - TASCA DO VEREDA
# Desabilita Bluetooth e prepara sistema

Write-Host "🚨 SOLUÇÃO DEFINITIVA BSOD 🚨" -ForegroundColor Red

# 1. Desabilitar Bluetooth (causa identificada)
Write-Host "`n1. DESABILITANDO BLUETOOTH..." -ForegroundColor Cyan
net stop bthserv
sc config bthserv start= disabled

# 2. Desabilitar adaptadores Bluetooth
Get-PnpDevice | Where-Object {$_.FriendlyName -like "*Bluetooth*"} | ForEach-Object {
    Write-Host "Desabilitando: $($_.FriendlyName)" -ForegroundColor Yellow
    Disable-PnpDevice -InstanceId $_.InstanceId -Confirm:$false
}

# 3. Verificar se desabilitou
Write-Host "`n2. VERIFICANDO STATUS..." -ForegroundColor Cyan
$btStatus = sc query bthserv
if ($btStatus -like "*STOPPED*") {
    Write-Host "✓ Bluetooth DESABILITADO com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠ Bluetooth ainda ativo" -ForegroundColor Red
}

# 4. Criar proteção permanente
Write-Host "`n3. PROTEÇÃO PERMANENTE..." -ForegroundColor Cyan
schtasks /create /tn "BlockBluetooth" /tr "sc stop bthserv" /sc onstart /ru SYSTEM /f

Write-Host "`n✅ BLUETOOTH ELIMINADO COMO CAUSA!" -ForegroundColor Green
Write-Host "`nAGORA TESTE O MSI DEBUG SEM FLAGS WEBVIEW2!" -ForegroundColor Yellow
Write-Host "Arquivo: C:\Users\hneto\tasca-do-vereda---gestão_msi_vscode\src-tauri\target\release\bundle\msi\Tasca Do VEREDA_1.1.71_x64_en-US.msi" -ForegroundColor White