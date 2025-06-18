# API Gateway - LogiTrack

Este é o ponto central de entrada para o sistema LogiTrack, roteando requisições para os microserviços de autenticação (auth-service) e rastreamento (tracking-service).

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie os microsserviços
   ```bash
   npm start
   ```

2. Inicie o gateway:
   ```bash
   npm start
   ```

## Rotas disponíveis

- `/auth/*` → encaminha para o Auth Service (`/api/auth/*`)
- `/users/*` → encaminha para o Auth Service (`/api/users/*`)
- `/tracking/deliveries/*` → encaminha para Tracking Service (`/api/deliveries/*`)
- `/tracking/locations/*` → encaminha para Tracking Service (`/api/locations/*`)
- `/tracking/health` → health check do Tracking Service
- `/tracking/info` → info do Tracking Service
- `/health` → health check do próprio gateway
