param(
  [switch]$SkipNode = $false,
  [switch]$SkipRust = $false,
  [switch]$SkipVSBuildTools = $false,
  [switch]$SkipWiX = $false
)

$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "OK: $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Warning $msg }

function Install-Node {
  if ($SkipNode) { return }
  Write-Step "Instalando Node.js 22.x (LTS)"
  $nodeMsi = Join-Path $env:TEMP "node-v22.11.0-x64.msi"
  try {
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -OutFile $nodeMsi
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -NoNewWindow
    Write-Ok "Node.js instalado"
  } catch {
    Write-Warn "Falha ao instalar Node.js: $($_.Exception.Message)"
  }
}

function Install-Rust {
  if ($SkipRust) { return }
  Write-Step "Instalando Rust (rustup)"
  $rustup = Join-Path $env:TEMP "rustup-init.exe"
  try {
    Invoke-WebRequest -Uri "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile $rustup
    Start-Process $rustup -ArgumentList "-y" -Wait -NoNewWindow
    Write-Ok "Rust instalado"
  } catch {
    Write-Warn "Falha ao instalar Rust: $($_.Exception.Message)"
  }
}

function Install-VSBuildTools {
  if ($SkipVSBuildTools) { return }
  Write-Step "Instalando Visual Studio Build Tools 2022 (VCTools)"
  $vsbt = Join-Path $env:TEMP "vs_BuildTools.exe"
  try {
    Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_BuildTools.exe" -OutFile $vsbt
    $args = @(
      "--quiet","--wait","--norestart","--nocache",
      "--installPath","C:\BuildTools",
      "--add","Microsoft.VisualStudio.Workload.VCTools",
      "--includeRecommended"
    )
    Start-Process $vsbt -ArgumentList $args -Wait -NoNewWindow
    Write-Ok "VS Build Tools instalado"
  } catch {
    Write-Warn "Falha ao instalar VS Build Tools: $($_.Exception.Message)"
  }
}

function Install-WiX {
  if ($SkipWiX) { return }
  Write-Step "Instalando WiX Toolset 3.11"
  $wix = Join-Path $env:TEMP "wix311.exe"
  try {
    Invoke-WebRequest -Uri "https://github.com/wixtoolset/wix3/releases/download/wix3112rtm/wix311.exe" -OutFile $wix
    Start-Process $wix -ArgumentList "/quiet /norestart" -Wait -NoNewWindow
    Write-Ok "WiX Toolset instalado"
  } catch {
    Write-Warn "Falha ao instalar WiX Toolset: $($_.Exception.Message)"
  }
}

function Validate-Env {
  Write-Step "Validando versões instaladas"
  try {
    $nodePath = "C:\Program Files\nodejs\node.exe"
    if (Test-Path $nodePath) {
      & $nodePath --version
      & "C:\Program Files\nodejs\npm.cmd" --version
    } else {
      Write-Warn "Node.js não encontrado em C:\Program Files\nodejs"
    }
  } catch { Write-Warn "Validação Node falhou: $($_.Exception.Message)" }

  try {
    $cargo = "$env:USERPROFILE\.cargo\bin\cargo.exe"
    $rustc = "$env:USERPROFILE\.cargo\bin\rustc.exe"
    if (Test-Path $rustc) { & $rustc --version } else { Write-Warn "rustc não encontrado (PATH pode precisar de relogar)" }
    if (Test-Path $cargo) { & $cargo --version } else { Write-Warn "cargo não encontrado (PATH pode precisar de relogar)" }
  } catch { Write-Warn "Validação Rust falhou: $($_.Exception.Message)" }

  Write-Ok "msiexec disponível"
}

Write-Host "=== Instalação de Dependências do Sistema ===" -ForegroundColor Yellow
Install-Node
Install-Rust
Install-VSBuildTools
Install-WiX
Validate-Env
Write-Host "=== Concluído ===" -ForegroundColor Yellow
