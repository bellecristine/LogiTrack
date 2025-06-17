# LogiTrack API Gateway

API Gateway para o sistema LogiTrack, desenvolvido com Express.js.

## Requisitos

- Node.js 14.x ou superior
- npm 6.x ou superior

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
cd backend
npm install
```
3. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```
4. Configure as variáveis de ambiente no arquivo `.env`

## Executando o projeto

### Iniciar o servidor em desenvolv
```bash
npm run dev
```

### Produção
```bash
npm start
```

## Estrutura do Projeto

```
backend/
├── src/
│   ├── middleware/     # Middlewares da aplicação
│   ├── routes/         # Rotas da API
│   ├── utils/          # Utilitários
│   └── index.js        # Ponto de entrada da aplicação
├── .env.example        # Exemplo de variáveis de ambiente
├── package.json        # Dependências e scripts
└── README.md          # Documentação
```

## Endpoints da API

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário

### Entregas

- `GET /api/deliveries` - Listar entregas
- `GET /api/deliveries/:id` - Obter detalhes de uma entrega
- `POST /api/deliveries` - Criar nova entrega
- `PATCH /api/deliveries/:id/status` - Atualizar status da entrega

### Usuários

- `GET /api/users/profile` - Obter perfil do usuário
- `PATCH /api/users/profile` - Atualizar perfil do usuário
- `GET /api/users/drivers` - Listar motoristas (apenas operadores)
- `PATCH /api/users/drivers/:id/status` - Atualizar status do motorista

## Segurança

- Autenticação via JWT
- Rate limiting para prevenir abusos
- CORS configurado para permitir apenas origens específicas
- Headers de segurança com Helmet

## Logs

- Logs de erro são salvos em arquivos
- Logs de desenvolvimento são exibidos no console
- Formato JSON para logs em produção

## Próximos Passos

1. Implementar integração com banco de dados
2. Adicionar validação de dados com Joi
3. Implementar sistema de notificações
4. Adicionar testes automatizados
5. Configurar CI/CD 