# Script de build Tauri para Tasca Do VEREDA (Windows)

Write-Host "======================================" -ForegroundColor Green
Write-Host "🚀 Tauri Build - Tasca Do VEREDA" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Validar Rust
try {
    rustc --version | Out-Null
    Write-Host "✅ Rust encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust não está instalado!" -ForegroundColor Red
    Write-Host "Instale em: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# Validar Node.js
try {
    node --version | Out-Null
    Write-Host "✅ Node.js encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não está instalado!" -ForegroundColor Red
    exit 1
}

# Validar WiX (para MSI)
$wiXPath = Get-Command "heat.exe" -ErrorAction SilentlyContinue
if ($null -eq $wiXPath) {
    Write-Host "⚠️  WiX Toolset não encontrado (opcional)" -ForegroundColor Yellow
    Write-Host "   Baixe em: https://wixtoolset.org/releases/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Escolha uma opção:" -ForegroundColor Cyan
Write-Host "1) Dev (com hot reload)"
Write-Host "2) Build Release (otimizado - cria instalador MSI)"
Write-Host "3) Build Debug"
Write-Host "4) Limpar cache e rebuild"
Write-Host "5) Sair"
Write-Host ""

$option = Read-Host "Digite a opção (1-5)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "Iniciando desenvolvimento..." -ForegroundColor Yellow
        Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Gray
        Write-Host ""
        npm run tauri:dev
    }
    "2" {
        Write-Host ""
        Write-Host "Compilando para release..." -ForegroundColor Yellow
        Write-Host "Isto pode levar alguns minutos..." -ForegroundColor Gray
        Write-Host ""
        npm run tauri:build:release
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Instalador (MSI) localizado em:" -ForegroundColor Cyan
            Write-Host "src-tauri\target\release\bundle\msi\" -ForegroundColor White
            Write-Host ""
            Write-Host "Para distribuir, encontre o arquivo .msi gerado" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "❌ Erro na compilação!" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "Compilando para debug..." -ForegroundColor Yellow
        npm run tauri:build
    }
    "4" {
        Write-Host ""
        Write-Host "Limpando cache Rust..." -ForegroundColor Yellow
        Remove-Item -Path "src-tauri\target\" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Iniciando novo build..." -ForegroundColor Yellow
        npm run tauri:build:release
    }
    default {
        Write-Host ""
        Write-Host "Saindo..." -ForegroundColor Yellow
    }
}
