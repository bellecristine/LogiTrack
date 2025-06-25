require('dotenv').config({ path: './config.env' });
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Importar configurações e serviços
const { connectDB } = require('./src/config/database');
const { createRedisConnection } = require('./src/config/redis');
const logger = require('./src/utils/logger');

// Importar serviços
const queueService = require('./src/services/QueueService');
const emailService = require('./src/services/EmailService');
const webSocketService = require('./src/services/WebSocketService');

// Importar workers
const EmailWorker = require('./src/workers/EmailWorker');

class NotificationServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Notification Service...');

      // Conectar ao MongoDB
      await connectDB();

      // Conectar ao Redis
      await createRedisConnection();

      // Configurar Express
      this.setupExpress();

      // Inicializar serviços
      await this.initializeServices();

      // Configurar workers
      await this.setupWorkers();

      // Configurar rotas
      this.setupRoutes();

      // Configurar tratamento de erros
      this.setupErrorHandling();

      // Criar servidor HTTP
      this.server = http.createServer(this.app);

      // Inicializar WebSocket
      webSocketService.initialize(this.server);

      logger.info('✅ Notification Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  setupExpress() {
    // Middleware de segurança
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.api(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    logger.info('Express middleware configured');
  }

  async initializeServices() {
    try {
      // Inicializar serviço de filas
      await queueService.initialize();

      // Inicializar serviço de e-mail
      await emailService.initialize();

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  async setupWorkers() {
    try {
      // Worker de e-mail
      await queueService.createWorker(
        'email-notifications',
        async (job) => {
          switch (job.name) {
            case 'send-email':
              return await EmailWorker.processEmailJob(job);
            case 'send-bulk-email':
              return await EmailWorker.processBulkEmailJob(job);
            case 'send-welcome-email':
              return await EmailWorker.processWelcomeEmailJob(job);
            case 'send-delivery-update-email':
              return await EmailWorker.processDeliveryUpdateEmailJob(job);
            case 'send-campaign-email':
              return await EmailWorker.processCampaignEmailJob(job);
            default:
              throw new Error(`Unknown email job type: ${job.name}`);
          }
        },
        {
          concurrency: 3,
          limiter: {
            max: parseInt(process.env.EMAIL_RATE_LIMIT_MAX) || 100,
            duration: parseInt(process.env.EMAIL_RATE_LIMIT_DURATION) || 3600000
          }
        }
      );

      // Worker de notificações push (placeholder)
      await queueService.createWorker(
        'push-notifications',
        async (job) => {
          logger.queue('Processing push notification job', { jobId: job.id });
          // TODO: Implementar processamento de push notifications
          await job.updateProgress(50);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await job.updateProgress(100);
          return { success: true, jobId: job.id };
        },
        { concurrency: 5 }
      );

      // Worker de processamento de campanhas (placeholder)
      await queueService.createWorker(
        'campaign-processing',
        async (job) => {
          logger.queue('Processing campaign job', { jobId: job.id });
          // TODO: Implementar processamento de campanhas
          await job.updateProgress(50);
          await new Promise(resolve => setTimeout(resolve, 2000));
          await job.updateProgress(100);
          return { success: true, jobId: job.id };
        },
        { concurrency: 2 }
      );

      // Worker de analytics (placeholder)
      await queueService.createWorker(
        'analytics-tracking',
        async (job) => {
          logger.queue('Processing analytics job', { jobId: job.id });
          // TODO: Implementar tracking de analytics
          await job.updateProgress(100);
          return { success: true, jobId: job.id };
        },
        { concurrency: 10 }
      );

      // Worker de segmentação de usuários (placeholder)
      await queueService.createWorker(
        'user-segmentation',
        async (job) => {
          logger.queue('Processing user segmentation job', { jobId: job.id });
          // TODO: Implementar segmentação de usuários
          await job.updateProgress(50);
          await new Promise(resolve => setTimeout(resolve, 5000));
          await job.updateProgress(100);
          return { success: true, jobId: job.id };
        },
        { concurrency: 1 }
      );

      logger.info('All workers configured successfully');
    } catch (error) {
      logger.error('Failed to setup workers:', error);
      throw error;
    }
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'notification-service',
          version: '1.0.0',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          services: {
            database: 'connected',
            redis: 'connected',
            email: await emailService.getEmailStats(),
            websocket: webSocketService.getStats(),
            queues: await queueService.getAllQueueStats()
          }
        };

        res.json(health);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        service: 'notification-service',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: [
          'email-notifications',
          'push-notifications',
          'websocket-real-time',
          'campaign-management',
          'user-segmentation',
          'analytics-tracking'
        ],
        endpoints: {
          health: '/health',
          info: '/info',
          websocket: process.env.SOCKET_IO_PATH || '/socket.io'
        }
      });
    });

    // API Routes (placeholder)
    this.app.use('/api', (req, res, next) => {
      // TODO: Implementar rotas da API
      res.status(501).json({
        message: 'API routes not implemented yet',
        path: req.path,
        method: req.method
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        service: 'notification-service'
      });
    });

    logger.info('Routes configured');
  }

  setupErrorHandling() {
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      logger.error('Express error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        requestId: req.id
      });

      const statusCode = err.statusCode || err.status || 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          message: err.message,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Graceful shutdown signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });

    logger.info('Error handling configured');
  }

  async start() {
    try {
      const PORT = process.env.PORT || 3003;
      
      this.server.listen(PORT, () => {
        logger.info(`🚀 Notification Service running on port ${PORT}`);
        logger.info(`📧 Email service: ${emailService.isInitialized ? 'Ready' : 'Not ready'}`);
        logger.info(`🔌 WebSocket service: ${webSocketService.isInitialized ? 'Ready' : 'Not ready'}`);
        logger.info(`⚡ Queue service: Ready`);
        logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`🛑 Graceful shutdown initiated (${signal})`);

    try {
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Shutdown services
      await Promise.all([
        webSocketService.shutdown(),
        queueService.shutdown(),
        emailService.shutdown()
      ]);

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Initialize and start server
async function main() {
  try {
    const server = new NotificationServer();
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.error('Failed to start Notification Service:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  main();
}

module.exports = NotificationServer; 