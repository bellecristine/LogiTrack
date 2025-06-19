require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const orderRoutes = require('./routes/order.routes');

const app = express();

// Middleware de segurança e logging
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Limite de requisições por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Documentação Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pedidos - LogiTrack',
      version: '1.0.0',
      description: 'Gerenciamento de pedidos e cálculo de rotas otimizadas'
    }
  },
  apis: ['./routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas principais
app.use('/api/orders', orderRoutes);

// Middleware de erro
app.use(errorHandler);

// Conexão ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('🟢 Conectado ao MongoDB'))
.catch(err => {
  logger.error('🔴 Erro ao conectar no MongoDB:', err);
  process.exit(1);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
});
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const orderRoutes = require('./routes/order.routes');

const app = express();

// Middleware de segurança e logging
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Limite de requisições por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Documentação Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pedidos - LogiTrack',
      version: '1.0.0',
      description: 'Gerenciamento de pedidos e cálculo de rotas otimizadas'
    }
  },
  apis: ['./routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas principais
app.use('/api/orders', orderRoutes);

// Middleware de erro
app.use(errorHandler);

// Conexão ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('🟢 Conectado ao MongoDB'))
.catch(err => {
  logger.error('🔴 Erro ao conectar no MongoDB:', err);
  process.exit(1);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
});
