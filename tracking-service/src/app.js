const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: './config.env' });

// Importar rotas
const deliveryRoutes = require('./routes/deliveries');
const locationRoutes = require('./routes/locations');

// Importar configuração do banco
const { initializeDatabase, checkDatabaseHealth } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Configurar Socket.IO para atualizações em tempo real
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para adicionar Socket.IO ao request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rotas de saúde
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      success: true,
      service: 'LogiTrack Tracking Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: dbHealth,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'LogiTrack Tracking Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota de informações da API
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    service: 'LogiTrack Tracking Service',
    version: '1.0.0',
    description: 'Microserviço de rastreamento em tempo real',
    endpoints: {
      deliveries: '/api/deliveries',
      locations: '/api/locations',
      health: '/health'
    },
    features: [
      'Gerenciamento de entregas',
      'Rastreamento em tempo real',
      'Cálculos geoespaciais',
      'WebSocket para atualizações live',
      'Busca por proximidade'
    ]
  });
});

// Rotas da API
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/locations', locationRoutes);

// Socket.IO para atualizações em tempo real
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  
  // Entrar em sala específica de uma entrega
  socket.on('join-delivery', (deliveryId) => {
    socket.join(`delivery-${deliveryId}`);
    console.log(`Cliente ${socket.id} entrou na sala da entrega ${deliveryId}`);
  });
  
  // Sair da sala de uma entrega
  socket.on('leave-delivery', (deliveryId) => {
    socket.leave(`delivery-${deliveryId}`);
    console.log(`Cliente ${socket.id} saiu da sala da entrega ${deliveryId}`);
  });
  
  // Entrar em sala de motorista
  socket.on('join-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Motorista ${driverId} conectado: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Função para emitir atualizações de localização via WebSocket
const emitLocationUpdate = (deliveryId, locationData) => {
  io.to(`delivery-${deliveryId}`).emit('location-update', {
    delivery_id: deliveryId,
    location: locationData,
    timestamp: new Date().toISOString()
  });
};

// Função para emitir atualizações de status de entrega
const emitDeliveryStatusUpdate = (deliveryId, statusData) => {
  io.to(`delivery-${deliveryId}`).emit('status-update', {
    delivery_id: deliveryId,
    status: statusData,
    timestamp: new Date().toISOString()
  });
};

// Disponibilizar funções WebSocket globalmente
global.emitLocationUpdate = emitLocationUpdate;
global.emitDeliveryStatusUpdate = emitDeliveryStatusUpdate;

// Middleware de tratamento de erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  // Erro de validação do Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }))
    });
  }
  
  // Erro de constraint do Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Dados duplicados',
      field: error.errors[0]?.path
    });
  }
  
  // Erro de conexão com banco
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Erro de conexão com o banco de dados'
    });
  }
  
  // Erro de CORS
  if (error.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado pelo CORS'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Inicializar banco de dados e servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initializeDatabase();
    
    const PORT = process.env.PORT || 3002;
    const SOCKET_PORT = process.env.SOCKET_PORT || 3003;
    
    // Iniciar servidor HTTP/WebSocket
    server.listen(PORT, () => {
      console.log(`🚀 Tracking Service rodando na porta ${PORT}`);
      console.log(`📡 WebSocket disponível na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API Info: http://localhost:${PORT}/api/info`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Recebido SIGTERM, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Recebido SIGINT, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io }; 