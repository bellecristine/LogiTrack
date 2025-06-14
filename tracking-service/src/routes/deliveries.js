const express = require('express');
const rateLimit = require('express-rate-limit');
const DeliveryController = require('../controllers/deliveryController');
const { 
  authenticateToken, 
  requireClient, 
  requireAdmin, 
  requireDeliveryAccess 
} = require('../middleware/auth');
const {
  validateCreateDelivery,
  validateUpdateDelivery,
  validateDeliveryId,
  validateTrackingCode,
  validateNearbySearch,
  validatePagination,
  validateCoordinates,
  validateDateLogic
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting para criação de entregas
const createDeliveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 entregas por hora por usuário
  message: {
    success: false,
    message: 'Limite de criação de entregas excedido. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para consultas
const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 consultas por IP
  message: {
    success: false,
    message: 'Muitas consultas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rotas públicas (com autenticação)
router.get('/', validatePagination, DeliveryController.listDeliveries);
router.get('/stats', DeliveryController.getDeliveryStats);

// Rotas para clientes
router.post('/', 
  requireClient,
  createDeliveryLimiter,
  validateCreateDelivery,
  validateCoordinates,
  validateDateLogic,
  DeliveryController.createDelivery
);

// Rotas que requerem acesso específico à entrega
router.get('/:deliveryId', 
  validateDeliveryId,
  requireDeliveryAccess,
  DeliveryController.getDeliveryById
);

router.put('/:deliveryId',
  validateDeliveryId,
  validateUpdateDelivery,
  validateCoordinates,
  validateDateLogic,
  requireDeliveryAccess,
  DeliveryController.updateDelivery
);

router.delete('/:deliveryId/cancel',
  validateDeliveryId,
  requireDeliveryAccess,
  DeliveryController.cancelDelivery
);

// Rotas por código de rastreamento (acesso mais restrito)
router.get('/tracking/:trackingCode',
  queryLimiter,
  validateTrackingCode,
  requireDeliveryAccess,
  DeliveryController.getDeliveryByTrackingCode
);

// Rotas administrativas
router.put('/:deliveryId/assign-driver',
  validateDeliveryId,
  requireAdmin,
  requireDeliveryAccess,
  DeliveryController.assignDriver
);

// Rotas de busca geográfica
router.get('/search/nearby',
  queryLimiter,
  validateNearbySearch,
  DeliveryController.findNearbyDeliveries
);

module.exports = router; 