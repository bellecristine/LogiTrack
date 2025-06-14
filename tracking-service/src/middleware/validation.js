const { body, param, query, validationResult } = require('express-validator');

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validações para criação de entrega
const validateCreateDelivery = [
  body('pickup_address')
    .notEmpty()
    .withMessage('Endereço de coleta é obrigatório')
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de coleta deve ter entre 10 e 500 caracteres'),
    
  body('delivery_address')
    .notEmpty()
    .withMessage('Endereço de entrega é obrigatório')
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de entrega deve ter entre 10 e 500 caracteres'),
    
  body('pickup_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de coleta deve estar entre -90 e 90'),
    
  body('pickup_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de coleta deve estar entre -180 e 180'),
    
  body('delivery_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de entrega deve estar entre -90 e 90'),
    
  body('delivery_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de entrega deve estar entre -180 e 180'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
    
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso deve ser um número positivo'),
    
  body('scheduled_pickup_time')
    .optional()
    .isISO8601()
    .withMessage('Data de coleta deve estar no formato ISO8601'),
    
  body('scheduled_delivery_time')
    .optional()
    .isISO8601()
    .withMessage('Data de entrega deve estar no formato ISO8601'),
    
  handleValidationErrors
];

// Validações para atualização de entrega
const validateUpdateDelivery = [
  body('pickup_address')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de coleta deve ter entre 10 e 500 caracteres'),
    
  body('delivery_address')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de entrega deve ter entre 10 e 500 caracteres'),
    
  body('pickup_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de coleta deve estar entre -90 e 90'),
    
  body('pickup_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de coleta deve estar entre -180 e 180'),
    
  body('delivery_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de entrega deve estar entre -90 e 90'),
    
  body('delivery_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de entrega deve estar entre -180 e 180'),
    
  body('status')
    .optional()
    .isIn(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
    .withMessage('Status deve ser: pending, assigned, picked_up, in_transit, delivered ou cancelled'),
    
  body('driver_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do motorista deve ser um número inteiro positivo'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
    
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso deve ser um número positivo'),
    
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres'),
    
  handleValidationErrors
];

// Validações para atualização de localização
const validateLocationUpdate = [
  body('latitude')
    .notEmpty()
    .withMessage('Latitude é obrigatória')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude deve estar entre -90 e 90'),
    
  body('longitude')
    .notEmpty()
    .withMessage('Longitude é obrigatória')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude deve estar entre -180 e 180'),
    
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precisão deve ser um número positivo'),
    
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude deve ser um número'),
    
  body('speed')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Velocidade deve estar entre 0 e 300 km/h'),
    
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Direção deve estar entre 0 e 360 graus'),
    
  body('location_timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp deve estar no formato ISO8601'),
    
  body('update_type')
    .optional()
    .isIn(['automatic', 'manual', 'checkpoint', 'pickup', 'delivery'])
    .withMessage('Tipo de atualização deve ser: automatic, manual, checkpoint, pickup ou delivery'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres'),
    
  body('device_info')
    .optional()
    .isObject()
    .withMessage('Informações do dispositivo devem ser um objeto'),
    
  handleValidationErrors
];

// Validações para parâmetros de ID
const validateDeliveryId = [
  param('deliveryId')
    .isInt({ min: 1 })
    .withMessage('ID da entrega deve ser um número inteiro positivo'),
    
  handleValidationErrors
];

// Validações para código de rastreamento
const validateTrackingCode = [
  param('trackingCode')
    .notEmpty()
    .withMessage('Código de rastreamento é obrigatório')
    .isLength({ min: 5, max: 50 })
    .withMessage('Código de rastreamento deve ter entre 5 e 50 caracteres')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Código de rastreamento deve conter apenas letras maiúsculas e números'),
    
  handleValidationErrors
];

// Validações para busca de entregas próximas
const validateNearbySearch = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude é obrigatória')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude deve estar entre -90 e 90'),
    
  query('longitude')
    .notEmpty()
    .withMessage('Longitude é obrigatória')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude deve estar entre -180 e 180'),
    
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Raio deve estar entre 0.1 e 100 km'),
    
  handleValidationErrors
];

// Validações para paginação
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve estar entre 1 e 100'),
    
  handleValidationErrors
];

// Validações para filtros de data
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Data inicial deve estar no formato ISO8601'),
    
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Data final deve estar no formato ISO8601'),
    
  handleValidationErrors
];

// Validação customizada para verificar se as coordenadas fazem sentido
const validateCoordinates = (req, res, next) => {
  const { pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude } = req.body;
  
  // Se tiver latitude, deve ter longitude também
  if ((pickup_latitude && !pickup_longitude) || (!pickup_latitude && pickup_longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Latitude e longitude de coleta devem ser fornecidas juntas'
    });
  }
  
  if ((delivery_latitude && !delivery_longitude) || (!delivery_latitude && delivery_longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Latitude e longitude de entrega devem ser fornecidas juntas'
    });
  }
  
  next();
};

// Validação para verificar se as datas fazem sentido
const validateDateLogic = (req, res, next) => {
  const { scheduled_pickup_time, scheduled_delivery_time } = req.body;
  
  if (scheduled_pickup_time && scheduled_delivery_time) {
    const pickupDate = new Date(scheduled_pickup_time);
    const deliveryDate = new Date(scheduled_delivery_time);
    
    if (deliveryDate <= pickupDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de entrega deve ser posterior à data de coleta'
      });
    }
  }
  
  next();
};

module.exports = {
  validateCreateDelivery,
  validateUpdateDelivery,
  validateLocationUpdate,
  validateDeliveryId,
  validateTrackingCode,
  validateNearbySearch,
  validatePagination,
  validateDateRange,
  validateCoordinates,
  validateDateLogic,
  handleValidationErrors
}; 