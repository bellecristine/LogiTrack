# 🚀 LogiTrack Notifications - AWS Lambda

Sistema de push notifications serverless usando **AWS Lambda + Firebase Cloud Messaging**.

## 🏗️ Arquitetura

```
[App Mobile] → [API Gateway] → [AWS Lambda] → [Firebase FCM] → [Dispositivos]
```

## 📁 Estrutura

```
lambda/
├── notification-handler.js    # Função Lambda principal
├── package.json              # Dependências
├── serverless.yml           # Configuração Serverless Framework
├── deploy.sh                # Script de deploy
├── test-lambda-local.js     # Teste local
└── README.md               # Este arquivo
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Configure estas variáveis antes do deploy:

```bash
export FIREBASE_PROJECT_ID=logitrack-e8c64
export FIREBASE_PRIVATE_KEY_ID=38cf2440d34e8def5616c6ca12f20499e812dc11
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@logitrack-e8c64.iam.gserviceaccount.com
export FIREBASE_CLIENT_ID=111691655992325464494
```

### 2. Instalar Dependências

```bash
cd lambda
npm install
```

### 3. Testar Localmente

```bash
node test-lambda-local.js
```

## 🚀 Deploy

### Opção 1: Serverless Framework (Recomendado)

```bash
# Instalar Serverless
npm install -g serverless

# Deploy
serverless deploy --stage prod
```

### Opção 2: Script Automático

```bash
chmod +x deploy.sh
./deploy.sh
```

### Opção 3: AWS CLI Manual

```bash
# Criar pacote
zip -r notification-lambda.zip .

# Criar função
aws lambda create-function \
  --function-name logitrack-notifications \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler notification-handler.handler \
  --zip-file fileb://notification-lambda.zip

# Atualizar código
aws lambda update-function-code \
  --function-name logitrack-notifications \
  --zip-file fileb://notification-lambda.zip
```

## 📱 API

### Endpoint

```
POST /notifications/trigger
```

### Payload

```json
{
  "type": "delivery_update",
  "title": "🚚 Entrega Atualizada",
  "message": "Seu pedido está a caminho!",
  "tokens": ["fcm_token_1", "fcm_token_2"],
  "userIds": ["user_123"],
  "userTypes": ["client"],
  "data": {
    "orderId": "ORD-001",
    "status": "in_transit"
  }
}
```

### Resposta

```json
{
  "success": true,
  "message": "Notificação processada via Lambda",
  "type": "delivery_update",
  "title": "🚚 Entrega Atualizada",
  "body": "Seu pedido está a caminho!",
  "results": [
    {
      "token": "fcm_token_1",
      "success": true,
      "messageId": "0:1234567890..."
    }
  ],
  "lambda": {
    "requestId": "abc-123-def",
    "functionName": "logitrack-notifications-prod",
    "region": "us-east-1"
  },
  "firebase": {
    "project": "logitrack-e8c64"
  },
  "timestamp": "2025-06-25T21:30:00.000Z"
}
```

## 🧪 Testes

### Teste Local

```bash
node test-lambda-local.js
```

### Teste na AWS

```bash
# Via AWS CLI
aws lambda invoke \
  --function-name logitrack-notifications \
  --payload '{"title":"Teste","message":"Hello Lambda!"}' \
  response.json

# Via curl (se tiver API Gateway)
curl -X POST https://abc123.execute-api.us-east-1.amazonaws.com/prod/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","message":"Hello Lambda!"}'
```

## 📊 Monitoramento

### CloudWatch Logs

```bash
aws logs tail /aws/lambda/logitrack-notifications-prod --follow
```

### Métricas

- **Invocations**: Número de execuções
- **Duration**: Tempo de execução
- **Errors**: Erros ocorridos
- **Throttles**: Execuções limitadas

## 🔒 Segurança

### IAM Role Mínima

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Variáveis de Ambiente

- Use **AWS Systems Manager Parameter Store** para produção
- Nunca commite credenciais no código
- Use **AWS Secrets Manager** para dados sensíveis

## 💰 Custos

### Estimativa (1M notificações/mês)

- **Lambda**: ~$0.20 (128MB, 1s execução)
- **API Gateway**: ~$3.50
- **Firebase**: Gratuito (até 10M mensagens)
- **Total**: ~$3.70/mês

### Otimizações

- Use **Lambda Provisioned Concurrency** para latência baixa
- Configure **Dead Letter Queue** para reprocessamento
- Use **Lambda Layers** para dependências compartilhadas

## 🚀 Vantagens da Lambda

✅ **Serverless**: Sem gerenciamento de servidor  
✅ **Escalabilidade**: Auto-scaling automático  
✅ **Custo**: Pague apenas pelo uso  
✅ **Disponibilidade**: 99.95% SLA  
✅ **Integração**: Fácil integração com AWS  

## 📝 Próximos Passos

1. **Deploy na AWS**
2. **Configurar API Gateway**
3. **Integrar com app mobile**
4. **Configurar monitoramento**
5. **Implementar DLQ e retry**

---

**🎉 Sistema pronto para produção com AWS Lambda!** 