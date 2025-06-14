const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    const validation = await JWTUtils.validateAndGetPayload(token);
    
    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.error
      });
    }

    // Verificar se o usuário ainda existe e está ativo
    const user = await User.findById(validation.payload.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = user.toJSON();
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar tipo de usuário
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const userTypes = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    
    if (!userTypes.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Tipo de usuário não autorizado.'
      });
    }

    next();
  };
};

// Middleware para verificar se é admin
const requireAdmin = requireUserType('admin');

// Middleware para verificar se é cliente
const requireClient = requireUserType('client');

// Middleware para verificar se é motorista
const requireDriver = requireUserType('driver');

// Middleware para verificar se é cliente ou motorista
const requireClientOrDriver = requireUserType(['client', 'driver']);

// Middleware opcional de autenticação (não falha se não houver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const validation = await JWTUtils.validateAndGetPayload(token);
      
      if (validation.valid) {
        const user = await User.findById(validation.payload.id);
        if (user && user.is_active) {
          req.user = user.toJSON();
          req.token = token;
        }
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

// Middleware para verificar se o usuário pode acessar seus próprios dados
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  const requestedUserId = parseInt(req.params.userId || req.params.id);
  const currentUserId = req.user.id;
  const isAdmin = req.user.user_type === 'admin';

  if (!isAdmin && currentUserId !== requestedUserId) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Você só pode acessar seus próprios dados.'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireUserType,
  requireAdmin,
  requireClient,
  requireDriver,
  requireClientOrDriver,
  optionalAuth,
  requireOwnershipOrAdmin
}; 