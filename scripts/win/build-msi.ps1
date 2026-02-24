param(
  [switch]$SkipBuild = $false,
  [switch]$ValidateOnly = $false,
  [string]$CertificatePath = "",
  [string]$CertificatePassword = "",
  [string]$TimestampUrl = "http://timestamp.digicert.com"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Find-MSI {
  $candidates = @(
    "src-tauri\target\release\bundle\msi",
    "src-tauri\target\debug\bundle\msi",
    "src-tauri\target\bundle\msi"
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) {
      $msi = Get-ChildItem $p -Filter *.msi -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
      if ($msi) { return $msi.FullName }
    }
  }
  return $null
}

function Ensure-Tool {
  param([string]$Name)
  $exists = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $exists) {
    Write-Warning "$Name não encontrado no PATH. Algumas etapas podem ser ignoradas."
    return $false
  }
  return $true
}

Write-Host "=== Build MSI (Tauri + WiX) ==="

if (-not $SkipBuild -and -not $ValidateOnly) {
  Write-Host "1) Construindo aplicação para bundle MSI..."
  npm run build:tauri
  tauri build --target "msi"
}

$msiPath = Find-MSI
if (-not $msiPath) {
  Write-Error "MSI não encontrado após build. Verifique o diretório src-tauri\target\...\bundle\msi"
}
Write-Host "MSI localizado: $msiPath"

if ($ValidateOnly) {
  Write-Host "Modo validação: apenas verificar assinatura e integridade do MSI"
}

if ($CertificatePath -and -not $ValidateOnly) {
  if (-not (Ensure-Tool "signtool.exe")) {
    Write-Warning "signtool não encontrado. Assinatura será ignorada."
  } else {
    Write-Host "2) Assinando MSI..."
    $sigArgs = @("sign","/fd","SHA256","/tr",$TimestampUrl,"/td","SHA256","/v")
    if ($CertificatePassword) {
      $sigArgs += @("/f",$CertificatePath,"/p",$CertificatePassword,$msiPath)
    } else {
      $sigArgs += @("/f",$CertificatePath,$msiPath)
    }
    & signtool.exe @sigArgs
    Write-Host "Verificando assinatura..."
    & signtool.exe verify /pa /v $msiPath
  }
}

if (Ensure-Tool "msiexec.exe" -and -not $ValidateOnly) {
  Write-Host "3) Teste de instalação silenciosa (logging)..."
  $logDir = Join-Path $PSScriptRoot "..\..\logs"
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $installLog = Join-Path $logDir "install.log"
  $uninstallLog = Join-Path $logDir "uninstall.log"

  Write-Host "Instalando silenciosamente..."
  Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart /L*V `"$installLog`"" -Wait -NoNewWindow
  Write-Host "Desinstalando silenciosamente..."
  Start-Process msiexec.exe -ArgumentList "/x `"$msiPath`" /quiet /norestart /L*V `"$uninstallLog`"" -Wait -NoNewWindow
  Write-Host "Logs em: $logDir"
}

if (Ensure-Tool "msival2.exe") {
  Write-Host "4) Validação MSI (ICE)..."
  & msival2.exe "$msiPath" | Tee-Object -Variable msival
} else {
  Write-Warning "msival2.exe não encontrado. Skipping ICE validation."
}

Write-Host "=== Concluído ==="
