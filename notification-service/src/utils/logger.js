const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'notification-service'}] ${level}: ${message} ${metaStr}`;
  })
);

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'notification-service',
    pid: process.pid
  },
  transports: [
    // Log de erros
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log combinado
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log específico do serviço
    new winston.transports.File({
      filename: path.join(logDir, 'notification-service.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  
  // Tratamento de exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // Tratamento de rejeições não capturadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Métodos auxiliares para contexto específico
logger.notification = (message, meta = {}) => {
  logger.info(message, { context: 'notification', ...meta });
};

logger.email = (message, meta = {}) => {
  logger.info(message, { context: 'email', ...meta });
};

logger.websocket = (message, meta = {}) => {
  logger.info(message, { context: 'websocket', ...meta });
};

logger.queue = (message, meta = {}) => {
  logger.info(message, { context: 'queue', ...meta });
};

logger.campaign = (message, meta = {}) => {
  logger.info(message, { context: 'campaign', ...meta });
};

logger.auth = (message, meta = {}) => {
  logger.info(message, { context: 'auth', ...meta });
};

logger.database = (message, meta = {}) => {
  logger.info(message, { context: 'database', ...meta });
};

logger.api = (message, meta = {}) => {
  logger.info(message, { context: 'api', ...meta });
};

// Middleware para Express
logger.expressMiddleware = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.api('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });
    
    next();
  };
};

module.exports = logger; 