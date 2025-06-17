require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(helmet()); // Segurança
app.use(cors()); // CORS
app.use(express.json()); // Parser JSON
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // Logging

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Rotas
app.use('/api', routes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`API Gateway rodando na porta ${PORT}`);
}); 