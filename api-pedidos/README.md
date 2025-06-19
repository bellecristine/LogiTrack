# 📦 API de Pedidos - LogiTrack

Este serviço é responsável pelo gerenciamento de pedidos dentro da plataforma **LogiTrack**. Ele se comunica com outros microserviços por meio de um **API Gateway**, utiliza **MongoDB** como banco de dados e a **OpenRouteService API** para funcionalidades de rota e geolocalização.

---

## 🚀 Como Rodar

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/api-pedidos.git
cd api-pedidos
2. Instalar Dependências
bash
Copiar
Editar
npm install
3. Configurar Variáveis de Ambiente
Crie um arquivo .env na raiz do projeto com o seguinte conteúdo:

env
Copiar
Editar
PORT=3000
MONGO_URI=mongodb://localhost:27017/api-pedidos
OPENROUTE_API_KEY=5b3ce3597851110001cf6248e31b6ec87a07403ebce83e5e97e31f5a
⚠️ Importante: Não compartilhe sua chave real de API publicamente. Adicione o .env ao .gitignore.

4. Iniciar a API
bash
Copiar
Editar
npm start
A API será executada em: http://localhost:3000

📡 Rotas Disponíveis (via API Gateway)
🔐 Auth Service
GET /auth/* → Redireciona para o Auth Service (/api/auth/*)

GET /users/* → Redireciona para o Auth Service (/api/users/*)

🚚 Tracking Service
GET /tracking/deliveries/* → Redireciona para o Tracking Service (/api/deliveries/*)

GET /tracking/locations/* → Redireciona para o Tracking Service (/api/locations/*)

GET /tracking/health → Health check do Tracking Service

GET /tracking/info → Informações do Tracking Service

❤️ API Gateway
GET /health → Health check do próprio Gateway

🗺️ Como Obter uma Chave da OpenRouteService
Acesse: https://openrouteservice.org/sign-up/

Crie uma conta gratuita.

Acesse o painel do usuário e gere uma API Key.

Cole a chave no arquivo .env no campo OPENROUTE_API_KEY.

🧪 Testes
Você pode utilizar ferramentas como Postman, Insomnia ou cURL para testar os endpoints disponíveis.

📁 Estrutura do Projeto (Exemplo)
pgsql
Copiar
Editar
api-pedidos/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── index.js
├── .env
├── package.json
└── README.md
🛠️ Tecnologias Utilizadas
Node.js

Express.js

MongoDB

Mongoose

OpenRouteService API

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir um issue ou enviar um pull request.