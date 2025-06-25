# ==========================================
# SCRIPT DE DEPLOY SIMPLIFICADO - PowerShell
# LogiTrack Notifications Lambda
# ==========================================

Write-Host "🚀 Iniciando deploy da Lambda LogiTrack Notifications..." -ForegroundColor Green

# Verificar se os arquivos necessários existem
if (-not (Test-Path "notification-handler.js")) {
    Write-Host "❌ Erro: arquivo notification-handler.js não encontrado!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "serverless.yml")) {
    Write-Host "❌ Erro: arquivo serverless.yml não encontrado!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "aws.env")) {
    Write-Host "❌ Erro: arquivo aws.env não encontrado!" -ForegroundColor Red
    Write-Host "💡 Crie o arquivo aws.env com as configurações do Firebase" -ForegroundColor Yellow
    exit 1
}

# Carregar variáveis de ambiente do arquivo aws.env
Write-Host "🔧 Carregando configurações..." -ForegroundColor Cyan
Get-Content "aws.env" | ForEach-Object {
    if ($_ -match "^([^#=][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Verificar se as variáveis críticas estão definidas
if (-not $env:FIREBASE_PROJECT_ID) {
    Write-Host "❌ FIREBASE_PROJECT_ID não está definida no aws.env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Variáveis de ambiente configuradas" -ForegroundColor Green

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
npm install

# Testar configuração Firebase
Write-Host "🧪 Testando configuração Firebase..." -ForegroundColor Cyan
$testScript = @"
const admin = require('firebase-admin');
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID
    })
  });
  console.log('OK');
} catch (error) {
  console.log('ERROR: ' + error.message);
  process.exit(1);
}
"@

node -e $testScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na configuração Firebase" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Firebase configurado corretamente" -ForegroundColor Green

# Verificar se AWS CLI está disponível
$awsAvailable = $false
try {
    $null = aws --version 2>$null
    $awsAvailable = $true
    Write-Host "✅ AWS CLI disponível" -ForegroundColor Green
} catch {
    Write-Host "⚠️ AWS CLI não encontrado - usando npx serverless" -ForegroundColor Yellow
}

# Deploy usando Serverless Framework
Write-Host "🚀 Fazendo deploy com Serverless Framework..." -ForegroundColor Green
Write-Host "📍 Região: $($env:AWS_REGION)" -ForegroundColor Cyan
Write-Host "🏷️ Stage: prod" -ForegroundColor Cyan

if ($awsAvailable) {
    # Verificar configuração AWS
    try {
        $null = aws sts get-caller-identity 2>$null
        Write-Host "✅ AWS CLI configurado corretamente" -ForegroundColor Green
        
        # Deploy com serverless global
        serverless deploy --stage prod --verbose
    } catch {
        Write-Host "❌ AWS CLI não configurado!" -ForegroundColor Red
        Write-Host "💡 Execute: aws configure" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⚠️ Deploy sem AWS CLI - apenas teste local disponível" -ForegroundColor Yellow
    Write-Host "📖 Para deploy real, instale AWS CLI seguindo: INSTALL_AWS_CLI.md" -ForegroundColor Yellow
    
    # Teste local
    Write-Host "🧪 Iniciando servidor local para testes..." -ForegroundColor Cyan
    Write-Host "🌐 Servidor estará disponível em: http://localhost:3003" -ForegroundColor Green
    Write-Host "📞 Endpoints:" -ForegroundColor Cyan
    Write-Host "   GET  http://localhost:3003/notifications/health" -ForegroundColor White
    Write-Host "   POST http://localhost:3003/notifications/trigger" -ForegroundColor White
    Write-Host "" 
    Write-Host "🛑 Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
    
    npx serverless offline
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "" 
    Write-Host "✅ Processo concluído com sucesso!" -ForegroundColor Green
    Write-Host "🎉 LogiTrack Notifications está pronto!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no processo!" -ForegroundColor Red
    Write-Host "💡 Verifique:" -ForegroundColor Yellow
    Write-Host "   - Configurações AWS (se fazendo deploy real)" -ForegroundColor White
    Write-Host "   - Arquivo aws.env com credenciais Firebase" -ForegroundColor White
    Write-Host "   - Conexão com internet" -ForegroundColor White
} 