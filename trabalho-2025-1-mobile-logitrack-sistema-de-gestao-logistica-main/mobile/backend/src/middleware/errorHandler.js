const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    logger.error('Error 💥', {
      error: err,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Produção
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Erro de programação: não vazar detalhes do erro
      logger.error('Error 💥', {
        error: err,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        status: 'error',
        message: 'Algo deu errado!'
      });
    }
  }
};

module.exports = {
  AppError,
  errorHandler
}; 