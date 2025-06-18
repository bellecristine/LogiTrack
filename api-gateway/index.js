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
      tracking: '/tracking'
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