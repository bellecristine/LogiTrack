# 📧 Serviço de Notificação - LogiTrack

O Serviço de Notificação é um microserviço responsável por gerenciar e enviar notificações por e-mail, push notifications e notificações em tempo real via WebSocket para o sistema LogiTrack.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Notificações por E-mail**: Envio de e-mails usando Nodemailer com templates personalizados
- **Sistema de Filas**: Processamento assíncrono usando BullMQ com Redis
- **WebSocket Real-time**: Notificações em tempo real usando Socket.IO
- **Templates de E-mail**: Sistema de templates responsivos para diferentes tipos de notificação
- **Rate Limiting**: Controle de taxa de envio para evitar spam
- **Retry Logic**: Tentativas automáticas em caso de falha
- **Logging Estruturado**: Sistema de logs detalhado usando Winston
- **Health Checks**: Monitoramento da saúde do serviço

### 🔄 Em Desenvolvimento
- **Push Notifications**: Notificações push para dispositivos móveis
- **Campanhas Promocionais**: Sistema de campanhas de marketing
- **Segmentação de Usuários**: Segmentação inteligente baseada em comportamento
- **Analytics**: Tracking de abertura, cliques e conversões
- **API REST**: Endpoints para gerenciamento de notificações

## 📋 Pré-requisitos

- Node.js 16+
- MongoDB
- Redis
- Conta de e-mail para SMTP (Gmail, SendGrid, etc.)

## 🛠️ Instalação

1. **Clone o repositório e navegue para o diretório:**
```bash
cd notification-service
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp config.env.example config.env
# Edite o arquivo config.env com suas configurações
```

4. **Inicie os serviços necessários:**
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. **Inicie o serviço:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## ⚙️ Configuração

### Variáveis de Ambiente Principais

```env
# Servidor
PORT=3003
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/logitrack_notifications

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# E-mail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Socket.IO
SOCKET_IO_CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

## 📡 Endpoints

### Health Check
```
GET /health
```
Retorna o status de saúde do serviço e suas dependências.

### Informações do Serviço
```
GET /info
```
Retorna informações sobre o serviço e suas funcionalidades.

### WebSocket
```
WS /socket.io
```
Endpoint para conexões WebSocket em tempo real.

## 🔌 WebSocket API

### Autenticação
```javascript
const socket = io('http://localhost:3003', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Eventos Disponíveis

#### Cliente → Servidor
- `notification:read` - Marcar notificação como lida
- `delivery:subscribe` - Subscrever a atualizações de entrega
- `delivery:unsubscribe` - Cancelar subscrição
- `ping` - Verificar conexão

#### Servidor → Cliente
- `notification:welcome` - Mensagem de boas-vindas
- `notification:system` - Notificação do sistema
- `notification:campaign` - Notificação de campanha
- `notification:alert` - Notificação de alerta
- `delivery:update` - Atualização de entrega
- `pong` - Resposta ao ping

## 📧 Sistema de E-mail

### Templates Disponíveis

1. **delivery-update**: Atualizações de entrega
2. **welcome**: E-mail de boas-vindas
3. **notification**: Template genérico
4. **campaign**: Campanhas promocionais

### Exemplo de Uso

```javascript
// Adicionar job de e-mail à fila
await queueService.addEmailJob({
  to: 'user@example.com',
  subject: 'Bem-vindo ao LogiTrack',
  template: 'welcome',
  templateData: {
    userName: 'João Silva',
    dashboardUrl: 'https://app.logitrack.com/dashboard'
  },
  priority: 'normal'
});
```

## 🔄 Sistema de Filas

### Filas Disponíveis

1. **email-notifications**: Processamento de e-mails
2. **push-notifications**: Notificações push (em desenvolvimento)
3. **campaign-processing**: Processamento de campanhas
4. **analytics-tracking**: Tracking de eventos
5. **user-segmentation**: Segmentação de usuários

### Workers

Cada fila possui workers dedicados que processam os jobs de forma assíncrona com:
- Rate limiting
- Retry automático
- Logging detalhado
- Monitoramento de progresso

## 📊 Monitoramento

### Logs
Os logs são estruturados e organizados por contexto:
- `notification`: Operações de notificação
- `email`: Envio de e-mails
- `websocket`: Conexões WebSocket
- `queue`: Processamento de filas
- `campaign`: Campanhas
- `auth`: Autenticação
- `database`: Operações de banco
- `api`: Requisições HTTP

### Métricas
- Conexões WebSocket ativas
- Jobs processados por fila
- Taxa de sucesso/falha de e-mails
- Tempo de resposta
- Uso de memória

## 🔒 Segurança

- **Autenticação JWT**: Todas as conexões WebSocket requerem token válido
- **Rate Limiting**: Proteção contra spam e abuso
- **CORS**: Configuração adequada para diferentes origens
- **Helmet**: Headers de segurança HTTP
- **Validação**: Validação rigorosa de dados de entrada

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage
```

## 🚀 Deploy

### Docker
```bash
# Build da imagem
docker build -t logitrack-notification-service .

# Executar container
docker run -p 3003:3003 --env-file config.env logitrack-notification-service
```

### Docker Compose
```yaml
version: '3.8'
services:
  notification-service:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] API REST completa
- [ ] Push notifications (FCM/APNS)
- [ ] SMS notifications
- [ ] Sistema de templates visuais
- [ ] Dashboard de campanhas
- [ ] A/B testing para campanhas
- [ ] Integração com analytics
- [ ] Webhook callbacks
- [ ] Multi-tenancy

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Documentação OpenAPI
- [ ] Métricas Prometheus
- [ ] Clustering
- [ ] Cache distribuído

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento
- Consulte a documentação técnica

---

**LogiTrack Notification Service** - Mantendo você conectado e informado! 🚚📱 