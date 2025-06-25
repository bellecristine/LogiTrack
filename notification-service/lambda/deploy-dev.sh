#!/bin/bash

# ==========================================
# SCRIPT DE DEPLOY - DESENVOLVIMENTO
# Deploy rápido para testes
# ==========================================

echo "🚀 Deploy em desenvolvimento - LogiTrack Notifications..."

# Carregar variáveis de ambiente
export $(cat aws.env | grep -v '^#' | xargs)

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Deploy para desenvolvimento
echo "🚀 Fazendo deploy para desenvolvimento..."
serverless deploy --stage dev

if [ $? -eq 0 ]; then
    echo "✅ Deploy de desenvolvimento concluído!"
    serverless info --stage dev
else
    echo "❌ Erro no deploy de desenvolvimento!"
    exit 1
fi 