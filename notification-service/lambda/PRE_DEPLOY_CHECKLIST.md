# 📋 CHECKLIST PRÉ-DEPLOY - LogiTrack Lambda

## ✅ Pré-requisitos Obrigatórios

### 1. AWS CLI Configurado
```bash
# Instalar AWS CLI
# Windows: https://aws.amazon.com/cli/
# Linux/Mac: pip install awscli

# Configurar credenciais
aws configure
```

**Informações necessárias:**
- AWS Access Key ID
- AWS Secret Access Key  
- Default region name: `us-east-1`
- Default output format: `json`

### 2. Node.js e NPM
```bash
# Verificar versão (mínimo Node 20)
node --version
npm --version
```

### 3. Arquivo aws.env Configurado
Certifique-se que o arquivo `aws.env` existe com:
```env
FIREBASE_PROJECT_ID=logitrack-e8c64
FIREBASE_PRIVATE_KEY_ID=38cf2440d34e8def5616c6ca12f20499e812dc11
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@logitrack-e8c64.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=111691655992325464494
AWS_REGION=us-east-1
FUNCTION_NAME=logitrack-notifications
STAGE=prod
```

## 🚀 Comandos de Deploy

### Deploy em Produção
```bash
# Método 1: Script automatizado
chmod +x deploy.sh
./deploy.sh

# Método 2: NPM script
npm run deploy

# Método 3: Serverless direto
serverless deploy --stage prod
```

### Deploy em Desenvolvimento
```bash
# Método 1: Script de dev
chmod +x deploy-dev.sh
./deploy-dev.sh

# Método 2: NPM script
npm run deploy-dev
```

## 🧪 Testes Pós-Deploy

### 1. Teste de Saúde
```bash
# Após o deploy, teste o endpoint de saúde
curl -X GET https://[API-ID].execute-api.us-east-1.amazonaws.com/prod/notifications/health
```

### 2. Teste de Notificação
```bash
curl -X POST https://[API-ID].execute-api.us-east-1.amazonaws.com/prod/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste Deploy",
    "message": "Lambda funcionando!",
    "userType": "cliente"
  }'
```

## 📊 Monitoramento

### Ver Logs
```bash
npm run logs
# ou
serverless logs -f notificationHandler --stage prod
```

### Informações da Função
```bash
npm run info
# ou  
serverless info --stage prod
```

## 🔧 Troubleshooting

### Erro: AWS CLI não configurado
```bash
aws configure
aws sts get-caller-identity  # Testar
```

### Erro: Permissões IAM
Certifique-se que sua conta AWS tem:
- `lambda:*`
- `iam:*` 
- `apigateway:*`
- `logs:*`
- `cloudformation:*`

### Erro: Firebase
Verifique se as credenciais no `aws.env` estão corretas:
```bash
node test-lambda-local.js
```

## 🗑️ Remover Deploy

```bash
# Remover função da AWS
npm run remove
# ou
serverless remove --stage prod
```

## 📞 Endpoints Disponíveis Após Deploy

- `POST /notifications/trigger` - Enviar notificação
- `POST /notifications/register-device` - Registrar dispositivo
- `GET /notifications/health` - Status da API
- `PUT /notifications/settings/{deviceId}` - Configurações
- `GET /notifications/history` - Histórico
- `GET /notifications/stats` - Estatísticas 