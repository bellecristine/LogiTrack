require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Configurações de ambiente
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

// Segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Logging
app.use(morgan('dev'));

// Health check do gateway
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/auth',
      tracking: '/tracking',
      notifications: '/notifications'
    },
    services: {
      auth: AUTH_SERVICE_URL,
      tracking: TRACKING_SERVICE_URL,
      notifications: NOTIFICATION_SERVICE_URL
    },
    endpoints: {
      notificationTrigger: '/notifications/trigger',
      deviceRegistration: '/notifications/register-device',
      notificationSettings: '/notifications/settings/:deviceId',
      notificationHistory: '/notifications/history',
      notificationStats: '/notifications/stats'
    }
  });
});

// Proxy para Auth Service (auth)
app.use('/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/auth': '/api/auth' },
}));

// Proxy para Auth Service (users)
app.use('/users', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/users': '/api/users' },
}));

// Proxy para Tracking Service (entregas)
app.use('/tracking/deliveries', createProxyMiddleware({
  target: TRACKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/tracking/deliveries': '/api/deliveries' },
}));

// Proxy para Tracking Service (localizações)
app.use('/tracking/locations', createProxyMiddleware({
  target: TRACKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/tracking/locations': '/api/locations' },
}));

// Proxy para health/info do Tracking Service
app.use('/tracking/health', createProxyMiddleware({
  target: TRACKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/tracking/health': '/health' },
}));
app.use('/tracking/info', createProxyMiddleware({
  target: TRACKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/tracking/info': '/api/info' },
}));

// Proxy para Notification Service - Trigger de notificações
app.use('/notifications/trigger', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/trigger': '/api/notifications/trigger' },
  onProxyReq: (proxyReq, req, res) => {
    // Adicionar header de identificação do API Gateway
    proxyReq.setHeader('X-Gateway-Source', 'api-gateway');
    proxyReq.setHeader('X-Request-ID', `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }
}));

// Proxy para Notification Service - Registro de dispositivos
app.use('/notifications/register-device', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/register-device': '/api/notifications/register-device' },
}));

// Proxy para Notification Service - Configurações
app.use('/notifications/settings', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/settings': '/api/notifications/settings' },
}));

// Proxy para Notification Service - Histórico e estatísticas
app.use('/notifications/history', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/history': '/api/notifications/history' },
}));

app.use('/notifications/stats', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/stats': '/api/notifications/stats' },
}));

// Proxy para health/info do Notification Service
app.use('/notifications/health', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/health': '/health' },
}));

app.use('/notifications/info', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications/info': '/info' },
}));

// Rota para enviar e-mail via Lambda 
app.post('/api/send-email', async (req, res) => {
  try {
    const { nomeEntrega, destinatario } = req.body;
    
    if (!nomeEntrega || !destinatario) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios não fornecidos: nomeEntrega e destinatario'
      });
    }

    const payload = {
      nomeEntrega,
      destinatario
    };

    const command = new InvokeCommand({
      FunctionName: 'emailSender', 
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse'
    });

    const { Payload } = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(Payload).toString());
    
    res.status(200).json({
      success: true,
      message: result.body
    });
    
  } catch (error) {
    console.error('Erro ao invocar Lambda:', error);
    res.status(500).json({
      error: 'Falha ao enviar e-mail',
      details: error.message
    });
  }
});


// 404 para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado no API Gateway',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway rodando na porta ${PORT}`);
}); 
