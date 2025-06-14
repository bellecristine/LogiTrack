const express = require('express');
const rateLimit = require('express-rate-limit');
const LocationController = require('../controllers/locationController');
const { 
  authenticateToken, 
  requireDriver, 
  requireDeliveryAccess 
} = require('../middleware/auth');
const {
  validateLocationUpdate,
  validateDeliveryId,
  validatePagination,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting para atualizações de localização
const locationUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 atualizações por minuto (1 por segundo)
  message: {
    success: false,
    message: 'Muitas atualizações de localização. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para atualizações em lote
const batchUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 lotes por 5 minutos
  message: {
    success: false,
    message: 'Limite de atualizações em lote excedido. Tente novamente em 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para consultas
const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 consultas por IP
  message: {
    success: false,
    message: 'Muitas consultas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rotas para motoristas atualizarem localização
router.post('/deliveries/:deliveryId/location',
  requireDriver,
  locationUpdateLimiter,
  validateDeliveryId,
  validateLocationUpdate,
  LocationController.updateLocation
);

// Atualização em lote (para sincronização offline)
router.post('/deliveries/:deliveryId/locations/batch',
  requireDriver,
  batchUpdateLimiter,
  validateDeliveryId,
  LocationController.batchUpdateLocations
);

// Marcar checkpoint importante
router.post('/deliveries/:deliveryId/checkpoint',
  requireDriver,
  validateDeliveryId,
  LocationController.markCheckpoint
);

// Rotas para consultar localização (clientes e motoristas)
router.get('/deliveries/:deliveryId/current',
  queryLimiter,
  validateDeliveryId,
  requireDeliveryAccess,
  LocationController.getCurrentLocation
);

router.get('/deliveries/:deliveryId/history',
  queryLimiter,
  validateDeliveryId,
  validatePagination,
  validateDateRange,
  requireDeliveryAccess,
  LocationController.getLocationHistory
);

// Rotas específicas para motoristas
router.get('/driver/current',
  requireDriver,
  LocationController.getDriverCurrentLocation
);

router.get('/driver/nearby-deliveries',
  requireDriver,
  queryLimiter,
  LocationController.findNearbyDeliveries
);

module.exports = router; 