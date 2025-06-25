# 🚀 Como Usar Notificações Push via API Gateway

Este guia mostra como disparar notificações push para celular através do API Gateway do LogiTrack.

## 📋 Endpoints Disponíveis

### Via API Gateway (Porta 3000)
```
POST   /notifications/trigger          # Disparar notificação
POST   /notifications/register-device  # Registrar dispositivo móvel
PUT    /notifications/settings/:id     # Atualizar configurações
GET    /notifications/history          # Histórico de notificações
GET    /notifications/stats            # Estatísticas
GET    /notifications/health           # Health check
```

### Direto no Notification Service (Porta 3003)
```
POST   /api/notifications/trigger      # Disparar notificação
POST   /api/notifications/register-device
GET    /api/notifications/history
GET    /api/notifications/stats
GET    /health
```

## 🎯 1. Disparar Notificação Push

### Endpoint:
```
POST http://localhost:3000/notifications/trigger
```

### Payload Exemplo - Atualização de Entrega:
```json
{
  "type": "delivery_update",
  "recipients": {
    "userTypes": ["driver", "client"],
    "userIds": ["user123", "user456"],
    "topics": ["delivery_notifications"]
  },
  "content": {
    "title": "📦 Sua entrega está chegando!",
    "body": "Entrega #12345 chegará em 10 minutos",
    "imageUrl": "https://app.logitrack.com/images/delivery.png",
    "actionUrl": "https://app.logitrack.com/track/12345",
    "actionText": "Acompanhar"
  },
  "channels": {
    "push": true,
    "email": false,
    "websocket": true
  },
  "priority": "high",
  "metadata": {
    "deliveryId": "12345",
    "driverId": "driver001",
    "estimatedArrival": "2025-01-25T15:30:00Z"
  }
}
```

### Payload Exemplo - Promoção:
```json
{
  "type": "promotion",
  "recipients": {
    "topics": ["general_notifications"],
    "userTypes": ["client"]
  },
  "content": {
    "title": "🎉 50% OFF na primeira entrega!",
    "body": "Aproveite nossa promoção especial. Válido até amanhã!",
    "imageUrl": "https://app.logitrack.com/images/promo.png",
    "actionUrl": "https://app.logitrack.com/promo/50off",
    "actionText": "Aproveitar"
  },
  "channels": {
    "push": true,
    "email": true
  },
  "priority": "normal",
  "metadata": {
    "campaignId": "promo001",
    "discount": 50
  }
}
```

### Resposta:
```json
{
  "success": true,
  "data": {
    "notificationId": "67890abcdef",
    "results": {
      "push": {
        "sent": 15,
        "failed": 2,
        "errors": []
      },
      "email": {
        "sent": 8,
        "failed": 0,
        "errors": []
      }
    },
    "summary": {
      "totalSent": 23,
      "totalFailed": 2,
      "deliveryRate": 92.0
    }
  }
}
```

## 📱 2. Registrar Dispositivo Móvel

### Endpoint:
```
POST http://localhost:3000/notifications/register-device
```

### Payload:
```json
{
  "token": "fcm_token_do_dispositivo_aqui",
  "userId": "user123",
  "userType": "driver",
  "platform": "android",
  "deviceInfo": {
    "model": "Samsung Galaxy S21",
    "brand": "Samsung", 
    "version": "12.0",
    "appVersion": "1.2.0"
  }
}
```

### Resposta:
```json
{
  "success": true,
  "data": {
    "deviceId": "device_id_123",
    "subscribedTopics": [
      "driver_notifications",
      "general_notifications"
    ]
  }
}
```

## ⚙️ 3. Configurar Notificações

### Endpoint:
```
PUT http://localhost:3000/notifications/settings/device_id_123
```

### Payload:
```json
{
  "deliveryUpdates": true,
  "promotionalCampaigns": false,
  "systemAlerts": true,
  "soundEnabled": true,
  "vibrationEnabled": false
}
```

## 📊 4. Obter Estatísticas

### Endpoint:
```
GET http://localhost:3000/notifications/stats
```

### Resposta:
```json
{
  "success": true,
  "data": {
    "notifications": {
      "total": 1250,
      "sent": 1180,
      "failed": 70,
      "successRate": "94.40"
    },
    "devices": {
      "total": 850,
      "active": 780,
      "inactive": 70
    }
  }
}
```

## 📋 5. Histórico de Notificações

### Endpoint:
```
GET http://localhost:3000/notifications/history?page=1&limit=10&type=delivery_update
```

### Resposta:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification123",
        "type": "delivery_update",
        "title": "Entrega chegando",
        "status": "sent",
        "createdAt": "2025-01-25T14:30:00Z",
        "deliveryStats": {
          "totalRecipients": 25,
          "successfulDeliveries": 23,
          "deliveryRate": 92.0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 125,
      "pages": 13
    }
  }
}
```

## 🔧 Exemplos de Uso por Contexto

### 🚚 Quando um motorista atualiza a localização:
```javascript
// No seu backend, quando receber atualização de GPS
const notificationPayload = {
  type: "delivery_update",
  recipients: {
    userIds: [clienteId], // ID do cliente que está esperando
    topics: ["delivery_notifications"]
  },
  content: {
    title: "📍 Motorista se aproximando",
    body: `${nomeMotorista} está a ${distancia}km de você`,
    actionUrl: `https://app.logitrack.com/track/${entregaId}`,
    actionText: "Ver no mapa"
  },
  channels: { push: true },
  priority: "normal",
  metadata: {
    deliveryId: entregaId,
    driverId: motoristaId,
    currentLocation: { lat, lng },
    estimatedArrival: estimativaChegada
  }
};

// Enviar via API Gateway
fetch('http://localhost:3000/notifications/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(notificationPayload)
});
```

### 📦 Quando uma entrega é finalizada:
```javascript
const notificationPayload = {
  type: "delivery_update", 
  recipients: {
    userIds: [clienteId],
    userTypes: ["client"]
  },
  content: {
    title: "✅ Entrega concluída!",
    body: "Sua entrega foi realizada com sucesso. Avalie nosso serviço!",
    actionUrl: `https://app.logitrack.com/rate/${entregaId}`,
    actionText: "Avaliar"
  },
  channels: { 
    push: true, 
    email: true 
  },
  priority: "normal",
  metadata: {
    deliveryId: entregaId,
    completedAt: new Date().toISOString(),
    rating: true
  }
};
```

### 🎯 Campanha promocional:
```javascript
const campaignPayload = {
  type: "promotion",
  recipients: {
    topics: ["client_notifications"],
    userTypes: ["client"]
  },
  content: {
    title: "🔥 Black Friday LogiTrack!",
    body: "Frete grátis em todas as entregas hoje!",
    imageUrl: "https://app.logitrack.com/images/blackfriday.png",
    actionUrl: "https://app.logitrack.com/promo/blackfriday",
    actionText: "Aproveitar"
  },
  channels: { 
    push: true, 
    email: true 
  },
  priority: "low",
  metadata: {
    campaignId: "blackfriday2025",
    validUntil: "2025-11-29T23:59:59Z"
  }
};
```

## 🛡️ Autenticação e Segurança

### Headers Recomendados:
```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'sua_api_key_aqui',        // Opcional
  'X-Service-Name': 'tracking-service',    // Identificação
  'X-Request-ID': 'req_' + Date.now()     // Para rastreamento
};
```

## 📱 Configuração no App Mobile

### Android (Kotlin):
```kotlin
// Registrar token FCM quando o app iniciar
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    val token = task.result
    
    // Enviar para API
    val deviceData = mapOf(
        "token" to token,
        "userId" to currentUserId,
        "userType" to userType, // "driver", "client", "operator"
        "platform" to "android",
        "deviceInfo" to mapOf(
            "model" to Build.MODEL,
            "brand" to Build.BRAND,
            "version" to Build.VERSION.RELEASE,
            "appVersion" to BuildConfig.VERSION_NAME
        )
    )
    
    // POST para /notifications/register-device
    apiService.registerDevice(deviceData)
}
```

### iOS (Swift):
```swift
// Registrar token FCM
Messaging.messaging().token { token, error in
    guard let token = token else { return }
    
    let deviceData = [
        "token": token,
        "userId": currentUserId,
        "userType": userType,
        "platform": "ios",
        "deviceInfo": [
            "model": UIDevice.current.model,
            "version": UIDevice.current.systemVersion,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"]
        ]
    ]
    
    // POST para /notifications/register-device
    apiService.registerDevice(deviceData)
}
```

## 🔍 Monitoramento e Debug

### Logs do API Gateway:
```bash
# Ver logs em tempo real
tail -f api-gateway/logs/access.log

# Verificar health
curl http://localhost:3000/health
```

### Logs do Notification Service:
```bash
# Ver logs em tempo real  
tail -f notification-service/logs/notification-service.log

# Verificar health
curl http://localhost:3003/health
```

### Testar conectividade:
```bash
# Teste completo
cd notification-service
node test-trigger.js

# Teste via API Gateway
curl -X POST http://localhost:3000/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{"type":"system_alert","recipients":{"topics":["general_notifications"]},"content":{"title":"Teste","body":"Mensagem de teste"},"channels":{"push":true}}'
```

## 🚀 Deploy e Produção

### Variáveis de Ambiente:
```env
# API Gateway
NOTIFICATION_SERVICE_URL=http://notification-service:3003

# Notification Service  
FIREBASE_PROJECT_ID=logitrack-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@logitrack-prod.iam.gserviceaccount.com
```

### Docker Compose:
```yaml
version: '3.8'
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - NOTIFICATION_SERVICE_URL=http://notification-service:3003
      
  notification-service:
    build: ./notification-service
    ports:
      - "3003:3003"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
```

---

## ✅ Checklist de Implementação

- [ ] Configurar Firebase Project
- [ ] Obter credenciais Firebase Admin SDK
- [ ] Configurar variáveis de ambiente
- [ ] Implementar registro de dispositivo no app mobile
- [ ] Testar trigger de notificação
- [ ] Configurar monitoramento
- [ ] Implementar tratamento de erros
- [ ] Configurar rate limiting
- [ ] Testar em produção

**🎯 Com essa implementação, você terá notificações push funcionando perfeitamente via API Gateway!** 