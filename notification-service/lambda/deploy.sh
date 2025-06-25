#!/bin/bash

# ==========================================
# SCRIPT DE DEPLOY - LOGITRACK LAMBDA
# Deploy em Produção com Serverless Framework
# ==========================================

echo "🚀 Iniciando deploy da Lambda LogiTrack Notifications..."

# Verificar se os arquivos necessários existem
if [ ! -f "notification-handler.js" ]; then
    echo "❌ Erro: arquivo notification-handler.js não encontrado!"
    exit 1
fi

if [ ! -f "serverless.yml" ]; then
    echo "❌ Erro: arquivo serverless.yml não encontrado!"
    exit 1
fi

if [ ! -f "aws.env" ]; then
    echo "❌ Erro: arquivo aws.env não encontrado!"
    echo "💡 Crie o arquivo aws.env com as configurações do Firebase"
    exit 1
fi

# Carregar variáveis de ambiente do arquivo aws.env
echo "🔧 Carregando configurações..."
export $(cat aws.env | grep -v '^#' | xargs)

# Verificar se as variáveis críticas estão definidas
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ FIREBASE_PROJECT_ID não está definida no aws.env"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"

# Verificar se o AWS CLI está configurado
echo "🔍 Verificando configurações AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Erro: AWS CLI não configurado!"
    echo "💡 Execute: aws configure"
    exit 1
fi

echo "✅ AWS CLI configurado corretamente"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se serverless está instalado
if ! command -v serverless &> /dev/null; then
    echo "📦 Instalando Serverless Framework globalmente..."
    npm install -g serverless
fi

# Teste rápido da configuração
echo "🧪 Testando configuração Firebase..."
node -e "
const admin = require('firebase-admin');
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID
    })
  });
  console.log('✅ Firebase configurado corretamente');
} catch (error) {
  console.log('❌ Erro na configuração Firebase:', error.message);
  process.exit(1);
}
"

# Deploy usando Serverless Framework
echo "🚀 Fazendo deploy com Serverless Framework..."
echo "📍 Região: ${AWS_REGION:-us-east-1}"
echo "🏷️  Stage: prod"

serverless deploy --stage prod --verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy realizado com sucesso!"
    
    # Mostrar informações da função
    echo "📋 Informações da função:"
    serverless info --stage prod
    
    # Testar a função
    echo ""
    echo "🧪 Testando endpoint de saúde..."
    ENDPOINT=$(serverless info --stage prod | grep -o 'https://[^/]*/[^/]*/notifications' | head -1)
    if [ ! -z "$ENDPOINT" ]; then
        curl -X GET "$ENDPOINT/health" -H "Content-Type: application/json"
        echo ""
    fi
    
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo "🔗 Sua API está disponível nos endpoints mostrados acima"
    
else
    echo "❌ Erro no deploy!"
    echo "💡 Verifique:"
    echo "   - Configurações AWS (aws configure)"
    echo "   - Arquivo aws.env com credenciais Firebase"
    echo "   - Permissões IAM adequadas"
    exit 1
fi

echo ""
echo "📚 Comandos úteis:"
echo "   npm run logs     - Ver logs da função"
echo "   npm run info     - Informações da função"
echo "   npm run remove   - Remover a função"
echo "   npm run dev      - Executar localmente"
echo ""
echo "🔗 Endpoints disponíveis:"
echo "   POST /notifications/trigger"
echo "   POST /notifications/register-device"
echo "   GET  /notifications/health"
echo "   PUT  /notifications/settings/{deviceId}"
echo "   GET  /notifications/history"
echo "   GET  /notifications/stats" 