# Script PowerShell para iniciar o frontend Next.js em modo desenvolvimento
# Autor: Sistema WA-API
# Data: $(Get-Date -Format "yyyy-MM-dd")

Write-Host "=== INICIANDO FRONTEND NEXT.JS ===" -ForegroundColor Green
Write-Host "Diretório: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Porta: 3000" -ForegroundColor Cyan
Write-Host "" 

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script no diretório frontend-nextjs" -ForegroundColor Yellow
    exit 1
}

# Verificar se o nome do projeto está correto
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.name -ne "frontend-nextjs") {
    Write-Host "❌ Erro: Não está no diretório correto do frontend!" -ForegroundColor Red
    Write-Host "Nome do projeto: $($packageJson.name)" -ForegroundColor Yellow
    exit 1
}

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules não encontrado. Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro na instalação das dependências!" -ForegroundColor Red
        exit 1
    }
}

# Limpar cache do Next.js
Write-Host "🧹 Limpando cache do Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# Remover qualquer diretório app duplicado
if (Test-Path "app") {
    Write-Host "🗑️  Removendo diretório app duplicado..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "app"
}

# Verificar se a porta 3000 está em uso
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Porta 3000 já está em uso!" -ForegroundColor Yellow
    Write-Host "Deseja encerrar o processo? (y/n): " -NoNewline -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        $processId = $portInUse.OwningProcess
        Stop-Process -Id $processId -Force
        Write-Host "✅ Processo encerrado." -ForegroundColor Green
        Start-Sleep 2
    }
}

# Verificar estrutura do projeto Next.js
if (-not (Test-Path "src\app")) {
    Write-Host "❌ Erro: Diretório src/app não encontrado!" -ForegroundColor Red
    Write-Host "Estrutura Next.js incompleta" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Estrutura verificada com sucesso!" -ForegroundColor Green
Write-Host "📁 Diretório src/app encontrado" -ForegroundColor Cyan

# Executar Next.js
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Usar o comando correto do package.json local
npm run dev