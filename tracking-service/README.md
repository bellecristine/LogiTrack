# LogiTrack Tracking Service

Microserviço de rastreamento em tempo real para o sistema LogiTrack, responsável por gerenciar entregas e localização de veículos.

## 🚀 Funcionalidades

### Gerenciamento de Entregas
- ✅ Criação e edição de entregas
- ✅ Códigos de rastreamento únicos
- ✅ Status de entrega (pendente, atribuída, coletada, em trânsito, entregue, cancelada)
- ✅ Atribuição de motoristas
- ✅ Cálculo automático de distâncias e estimativas
- ✅ Histórico completo de entregas

### Rastreamento em Tempo Real
- ✅ Atualizações de localização GPS
- ✅ WebSocket para notificações live
- ✅ Histórico de rotas percorridas
- ✅ Checkpoints importantes
- ✅ Sincronização offline (batch updates)
- ✅ Cálculo de estatísticas de rota

### Funcionalidades Geoespaciais
- ✅ Busca de entregas próximas
- ✅ Cálculos de distância precisos
- ✅ Suporte a coordenadas geográficas
- ✅ Integração com PostgreSQL + PostGIS
- ✅ Otimização para consultas espaciais

### Segurança e Performance
- ✅ Autenticação JWT integrada
- ✅ Rate limiting inteligente
- ✅ Validação robusta de dados
- ✅ Controle de acesso por tipo de usuário
- ✅ Logs detalhados

## 🏗️ Arquitetura

```
tracking-service/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração PostgreSQL + PostGIS
│   ├── models/
│   │   ├── Delivery.js          # Modelo de entregas
│   │   └── Location.js          # Modelo de localizações
│   ├── controllers/
│   │   ├── deliveryController.js # Lógica de entregas
│   │   └── locationController.js # Lógica de rastreamento
│   ├── middleware/
│   │   ├── auth.js              # Autenticação JWT
│   │   └── validation.js        # Validação de dados
│   ├── routes/
│   │   ├── deliveries.js        # Rotas de entregas
│   │   └── locations.js         # Rotas de localização
│   └── app.js                   # Aplicação principal
├── server.js                    # Ponto de entrada
├── package.json                 # Dependências
├── config.env                   # Configurações
└── README.md                    # Documentação
```

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados principal
- **PostGIS** - Extensão geoespacial
- **Sequelize** - ORM para PostgreSQL
- **Socket.IO** - WebSocket para tempo real
- **JWT** - Autenticação
- **Geolib** - Cálculos geográficos
- **Helmet** - Segurança HTTP
- **Express Rate Limit** - Controle de taxa

## 📋 Pré-requisitos

- Node.js 16+
- PostgreSQL 12+ com PostGIS
- Auth Service rodando (porta 3001)

## ⚙️ Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
```sql
-- Criar banco de dados
CREATE DATABASE logitrack_tracking;

-- Habilitar PostGIS
CREATE EXTENSION postgis;
```

### 3. Configurar Variáveis de Ambiente
Edite o arquivo `config.env`:

```env
# Servidor
PORT=3002
NODE_ENV=development

# Banco de dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=logitrack_tracking
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT (mesmo do auth-service)
JWT_SECRET=sua_chave_secreta

# Auth Service
AUTH_SERVICE_URL=http://localhost:3001
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O serviço estará disponível em:
- **API REST**: http://localhost:3002
- **WebSocket**: ws://localhost:3002
- **Health Check**: http://localhost:3002/health

## 📡 API Endpoints

### Entregas

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| GET | `/api/deliveries` | Listar entregas | Autenticado |
| POST | `/api/deliveries` | Criar entrega | Cliente |
| GET | `/api/deliveries/:id` | Obter entrega | Proprietário |
| PUT | `/api/deliveries/:id` | Atualizar entrega | Proprietário |
| DELETE | `/api/deliveries/:id/cancel` | Cancelar entrega | Proprietário |
| GET | `/api/deliveries/tracking/:code` | Rastrear por código | Proprietário |
| GET | `/api/deliveries/search/nearby` | Buscar próximas | Autenticado |
| GET | `/api/deliveries/stats` | Estatísticas | Autenticado |

### Localização

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|---------|
| POST | `/api/locations/deliveries/:id/location` | Atualizar localização | Motorista |
| POST | `/api/locations/deliveries/:id/locations/batch` | Atualização em lote | Motorista |
| POST | `/api/locations/deliveries/:id/checkpoint` | Marcar checkpoint | Motorista |
| GET | `/api/locations/deliveries/:id/current` | Localização atual | Proprietário |
| GET | `/api/locations/deliveries/:id/history` | Histórico de rota | Proprietário |
| GET | `/api/locations/driver/current` | Localização do motorista | Motorista |
| GET | `/api/locations/driver/nearby-deliveries` | Entregas próximas | Motorista |

## 🔌 WebSocket Events

### Cliente se conecta
```javascript
socket.emit('join-delivery', deliveryId);
```

### Receber atualizações de localização
```javascript
socket.on('location-update', (data) => {
  console.log('Nova localização:', data);
});
```

### Receber atualizações de status
```javascript
socket.on('status-update', (data) => {
  console.log('Status atualizado:', data);
});
```

## 📊 Modelos de Dados

### Delivery (Entrega)
```javascript
{
  id: Integer,
  tracking_code: String,
  client_id: Integer,
  driver_id: Integer,
  status: Enum,
  pickup_address: String,
  pickup_latitude: Decimal,
  pickup_longitude: Decimal,
  delivery_address: String,
  delivery_latitude: Decimal,
  delivery_longitude: Decimal,
  estimated_distance_km: Decimal,
  estimated_duration_minutes: Integer,
  // ... outros campos
}
```

### Location (Localização)
```javascript
{
  id: Integer,
  delivery_id: Integer,
  driver_id: Integer,
  latitude: Decimal,
  longitude: Decimal,
  accuracy: Decimal,
  speed: Decimal,
  heading: Decimal,
  location_timestamp: Date,
  update_type: Enum,
  // ... outros campos
}
```

## 🔒 Autenticação

O serviço integra com o Auth Service para validação de tokens JWT:

```javascript
// Header obrigatório
Authorization: Bearer <jwt_token>
```

### Tipos de Usuário
- **Client**: Pode criar e gerenciar suas entregas
- **Driver**: Pode atualizar localização e status
- **Admin**: Acesso completo a todas as funcionalidades

## 🌍 Funcionalidades Geoespaciais

### Cálculo de Distâncias
```javascript
// Distância entre dois pontos
const distance = geolib.getDistance(
  { latitude: lat1, longitude: lng1 },
  { latitude: lat2, longitude: lng2 }
);
```

### Busca por Proximidade
```javascript
// Encontrar entregas em um raio de 10km
GET /api/deliveries/search/nearby?latitude=-23.5505&longitude=-46.6333&radius=10
```

## 📈 Monitoramento

### Health Check
```bash
curl http://localhost:3002/health
```

### Logs
- Todas as requisições são logadas
- Erros são capturados e registrados
- WebSocket connections são monitoradas

## 🔧 Rate Limiting

- **Atualizações de localização**: 60/minuto
- **Criação de entregas**: 10/hora
- **Consultas gerais**: 100/15min
- **Batch updates**: 10/5min

## 🚀 Deploy

### Docker (Recomendado)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

### Variáveis de Produção
```env
NODE_ENV=production
DB_HOST=seu_postgres_host
JWT_SECRET=chave_super_secreta
```

## 🤝 Integração com Outros Serviços

### Auth Service
- Validação de tokens JWT
- Verificação de permissões
- Dados do usuário

### Frontend (Flutter)
- WebSocket para atualizações live
- API REST para operações CRUD
- Mapas integrados

## 📝 Exemplos de Uso

### Criar Entrega
```javascript
POST /api/deliveries
{
  "pickup_address": "Rua A, 123, São Paulo",
  "delivery_address": "Rua B, 456, São Paulo",
  "pickup_latitude": -23.5505,
  "pickup_longitude": -46.6333,
  "delivery_latitude": -23.5515,
  "delivery_longitude": -46.6343,
  "description": "Pacote frágil"
}
```

### Atualizar Localização
```javascript
POST /api/locations/deliveries/1/location
{
  "latitude": -23.5510,
  "longitude": -46.6338,
  "accuracy": 5.0,
  "speed": 45.5,
  "heading": 180.0
}
```

### Rastrear Entrega
```javascript
GET /api/deliveries/tracking/LT1234567890
```

## 🐛 Troubleshooting

### Erro de Conexão com PostgreSQL
- Verificar se o PostgreSQL está rodando
- Confirmar credenciais no config.env
- Verificar se PostGIS está instalado

### Token JWT Inválido
- Verificar se Auth Service está rodando
- Confirmar se JWT_SECRET é o mesmo nos dois serviços

### WebSocket não conecta
- Verificar CORS no config.env
- Confirmar porta do Socket.IO

## 📄 Licença

MIT License - LogiTrack Team 