# LogiTrack Authentication Service

Microserviço de autenticação para o sistema LogiTrack, responsável por gerenciar usuários, autenticação JWT e autorização.

## 🚀 Funcionalidades

### Autenticação
- ✅ Registro de usuários (client, driver, admin)
- ✅ Login com email e senha
- ✅ Geração de tokens JWT (access + refresh)
- ✅ Renovação de tokens
- ✅ Logout (revogação de tokens)
- ✅ Validação de tokens

### Gerenciamento de Usuários
- ✅ Listagem de usuários (admin)
- ✅ Visualização de perfil
- ✅ Atualização de dados
- ✅ Alteração de senha
- ✅ Ativação/desativação de contas
- ✅ Estatísticas de usuários

### Segurança
- ✅ Hash de senhas com bcrypt
- ✅ Rate limiting
- ✅ Validação de entrada
- ✅ Middleware de autorização
- ✅ Headers de segurança (Helmet)
- ✅ CORS configurável

## 🏗️ Arquitetura

```
auth-service/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração SQLite
│   ├── controllers/
│   │   ├── authController.js    # Controlador de autenticação
│   │   └── userController.js    # Controlador de usuários
│   ├── middleware/
│   │   ├── auth.js             # Middleware de autenticação
│   │   └── validation.js       # Validação de entrada
│   ├── models/
│   │   ├── User.js             # Modelo de usuário
│   │   └── RefreshToken.js     # Modelo de refresh token
│   ├── routes/
│   │   ├── auth.js             # Rotas de autenticação
│   │   └── users.js            # Rotas de usuários
│   ├── utils/
│   │   └── jwt.js              # Utilitários JWT
│   └── app.js                  # Aplicação Express
├── server.js                   # Ponto de entrada
├── config.env                  # Variáveis de ambiente
└── package.json               # Dependências
```

## 📡 API Endpoints

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/register` | Registrar usuário | ❌ |
| POST | `/login` | Login | ❌ |
| POST | `/refresh-token` | Renovar token | ❌ |
| POST | `/validate-token` | Validar token | ❌ |
| POST | `/logout` | Logout | ✅ |
| GET | `/me` | Perfil atual | ✅ |
| GET | `/health` | Health check | ❌ |

### Usuários (`/api/users`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar usuários | Admin |
| GET | `/:id` | Obter usuário | Owner/Admin |
| PUT | `/:id` | Atualizar usuário | Owner/Admin |
| PUT | `/change-password` | Alterar senha | ✅ |
| POST | `/:id/activate` | Ativar usuário | Admin |
| POST | `/:id/deactivate` | Desativar usuário | Admin |
| GET | `/stats/overview` | Estatísticas | Admin |
| POST | `/maintenance/cleanup-tokens` | Limpar tokens | Admin |

## 🔧 Configuração

### Variáveis de Ambiente (config.env)

```env
# Servidor
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=logitrack-auth
JWT_AUDIENCE=logitrack-app

# Banco de dados
DB_PATH=./database/auth.db

# Segurança
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 🗄️ Banco de Dados

### Tabela: users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT CHECK(user_type IN ('client', 'driver', 'admin')) NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔐 Tipos de Usuário

- **client**: Cliente que solicita entregas
- **driver**: Motorista que realiza entregas
- **admin**: Administrador do sistema

## 📝 Exemplos de Uso

### Registro
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MinhaSenh@123",
    "name": "João Silva",
    "user_type": "client"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MinhaSenh@123"
  }'
```

### Usar Token
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛡️ Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- Rate limiting por IP
- Validação rigorosa de entrada
- Headers de segurança com Helmet
- Tokens JWT com expiração
- Refresh tokens rotativos
- CORS configurável

## 🚦 Status

✅ **Completo** - Microserviço de autenticação totalmente implementado e pronto para uso.

### Próximos Passos
1. Testes unitários e de integração
2. Documentação OpenAPI/Swagger
3. Logs estruturados
4. Métricas e monitoramento
5. Deploy com Docker 