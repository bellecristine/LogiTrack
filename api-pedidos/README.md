# 📦 LogiTrack - API de Pedidos

API de gerenciamento de pedidos do sistema **LogiTrack**, integrando funcionalidades de rastreamento e autenticação via **API Gateway**. Utiliza **MongoDB** como banco de dados e **OpenRouteService** para geolocalização e rotas.

---

## 🚀 Como Rodar

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/api-pedidos.git
cd api-pedidos
2. Instale as dependências
bash
Copiar
Editar
npm install
3. Configure o arquivo .env
Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

env
Copiar
Editar
PORT=3000
MONGO_URI=mongodb://localhost:27017/api-pedidos
OPENROUTE_API_KEY=5b3ce3597851110001cf6248e31b6ec87a07403ebce83e5e97e31f5a
⚠️ Importante: Não compartilhe sua chave real publicamente. Adicione o .env ao .gitignore.

4. Inicie a aplicação
bash
Copiar
Editar
npm start
A API estará disponível em: http://localhost:3000

🌐 Rotas Disponíveis
🔐 Auth Service
Rota	Descrição
/auth/*	Encaminha para o serviço de autenticação
/users/*	Encaminha para o serviço de usuários

🚚 Tracking Service
Rota	Descrição
/tracking/deliveries/*	Requisições para entregas
/tracking/locations/*	Localizações e rotas
/tracking/health	Health check do serviço de tracking
/tracking/info	Informações sobre o serviço

❤️ API Gateway
Rota	Descrição
/health	Health check do próprio gateway

📦 Pedidos (API atual)
Método	Rota	Descrição
POST	/pedidos	Criar um novo pedido
GET	/pedidos	Listar todos os pedidos
GET	/pedidos/:id	Buscar pedido por ID
PUT	/pedidos/:id	Atualizar um pedido
DELETE	/pedidos/:id	Excluir um pedido

🗺️ Chave da OpenRouteService
Para funcionalidades de rota e geolocalização:

Acesse: https://openrouteservice.org/sign-up/

Crie uma conta gratuita.

Gere sua API Key no painel de usuário.

Adicione a chave ao seu .env como OPENROUTE_API_KEY.

🧪 Testes
Recomenda-se utilizar ferramentas como:

Postman

Insomnia

cURL

📁 Estrutura do Projeto
pgsql
Copiar
Editar
api-pedidos/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
├── .env
├── package.json
└── README.md
🛠 Tecnologias Utilizadas
Node.js

Express.js

MongoDB + Mongoose

OpenRouteService API

API Gateway

Microsserviços REST

🤝 Contribuição
Contribuições são bem-vindas!
Sinta-se à vontade para abrir issues, enviar pull requests ou propor melhorias.

