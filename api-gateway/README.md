# API Gateway - LogiTrack

Este é o ponto central de entrada para o sistema LogiTrack, roteando requisições para os microserviços de autenticação (auth-service) e rastreamento (tracking-service).

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente (opcional):
   Crie um arquivo `.env` na pasta `api-gateway` se quiser customizar as URLs dos serviços ou a porta do gateway.
   
   Exemplo:
   ```env
   PORT=3000
   AUTH_SERVICE_URL=http://localhost:3001
   TRACKING_SERVICE_URL=http://localhost:3002
   ALLOWED_ORIGINS=http://localhost:3000
   ```

3. Inicie o gateway:
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

## Observações
- O gateway não deve conter lógica de negócio, apenas roteamento e segurança.
- Certifique-se de que os serviços estejam rodando nas portas corretas.
- Para produção, ajuste as variáveis de ambiente conforme necessário. 