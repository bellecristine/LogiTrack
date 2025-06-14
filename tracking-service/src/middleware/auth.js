const jwt = require('jsonwebtoken');
const axios = require('axios');

// Middleware para autenticar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    // Verificar token localmente primeiro
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar se o token não expirou
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      // Adicionar informações do usuário ao request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        user_type: decoded.user_type,
        is_active: decoded.is_active
      };

      next();
    } catch (jwtError) {
      // Se falhar localmente, tentar validar com o auth-service
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const response = await axios.post(`${authServiceUrl}/api/auth/validate-token`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        if (response.data.success && response.data.data.user) {
          req.user = response.data.data.user;
          next();
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token inválido'
          });
        }
      } catch (authServiceError) {
        console.error('Erro ao validar token com auth-service:', authServiceError.message);
        return res.status(401).json({
          success: false,
          message: 'Erro na validação do token'
        });
      }
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário é motorista
const requireDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação requerida'
    });
  }

  if (req.user.user_type !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a motoristas'
    });
  }

  next();
};

// Middleware para verificar se o usuário é cliente
const requireClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação requerida'
    });
  }

  if (req.user.user_type !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a clientes'
    });
  }

  next();
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação requerida'
    });
  }

  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores'
    });
  }

  next();
};

// Middleware para verificar se o usuário pode acessar uma entrega específica
const requireDeliveryAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação requerida'
      });
    }

    const { deliveryId, trackingCode } = req.params;
    const { user_type, id: userId } = req.user;

    // Admin tem acesso a tudo
    if (user_type === 'admin') {
      return next();
    }

    // Buscar a entrega para verificar permissões
    const Delivery = require('../models/Delivery');
    let delivery;

    if (deliveryId) {
      delivery = await Delivery.findByPk(deliveryId);
    } else if (trackingCode) {
      delivery = await Delivery.findByTrackingCode(trackingCode);
    }

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Entrega não encontrada'
      });
    }

    // Verificar permissões baseadas no tipo de usuário
    let hasAccess = false;

    switch (user_type) {
      case 'client':
        hasAccess = delivery.client_id === userId;
        break;
      case 'driver':
        hasAccess = delivery.driver_id === userId;
        break;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a esta entrega'
      });
    }

    // Adicionar a entrega ao request para uso posterior
    req.delivery = delivery;
    next();

  } catch (error) {
    console.error('Erro no middleware de acesso à entrega:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware opcional de autenticação (não falha se não houver token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.exp && decoded.exp >= Date.now() / 1000) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        user_type: decoded.user_type,
        is_active: decoded.is_active
      };
    }
  } catch (error) {
    // Ignorar erros de token em autenticação opcional
  }

  next();
};

module.exports = {
  authenticateToken,
  requireDriver,
  requireClient,
  requireAdmin,
  requireDeliveryAccess,
  optionalAuth
}; 