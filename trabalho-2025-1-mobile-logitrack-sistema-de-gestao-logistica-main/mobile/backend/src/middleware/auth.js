const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  try {
    // Obter o token do header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token não fornecido', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adc o usuário ao request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Token inválido', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Você não tem permissão para realizar esta ação', 403));
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
}; 