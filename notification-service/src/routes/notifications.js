const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const logger = require('../utils/logger');

// Middleware para log de requests
router.use((req, res, next) => {
  logger.info(`📡 API Request: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id']
  });
  next();
});

/**
 * @route POST /api/notifications/trigger
 * @desc Disparar notificação via API Gateway
 * @access Public (deve ser protegido por API Key no gateway)
 */
router.post('/trigger', notificationController.triggerNotification);

/**
 * @route POST /api/notifications/register-device
 * @desc Registrar token de dispositivo móvel
 * @access Public
 */
router.post('/register-device', notificationController.registerDevice);

/**
 * @route PUT /api/notifications/settings/:deviceId
 * @desc Atualizar configurações de notificação do dispositivo
 * @access Public
 */
router.put('/settings/:deviceId', notificationController.updateNotificationSettings);

/**
 * @route GET /api/notifications/history
 * @desc Obter histórico de notificações
 * @access Public
 */
router.get('/history', notificationController.getNotificationHistory);

/**
 * @route GET /api/notifications/health
 * @desc Health check específico para notificações
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      pushNotifications: true,
      emailNotifications: true,
      webSocketNotifications: true
    }
  });
});

/**
 * @route POST /api/notifications/test
 * @desc Endpoint para testar notificações (desenvolvimento)
 * @access Public
 */
router.post('/test', async (req, res) => {
  try {
    const { type = 'test', message = 'Teste de notificação LogiTrack' } = req.body;
    
    // Simular trigger de notificação de teste
    const testPayload = {
      type: 'system_alert',
      recipients: {
        topics: ['general_notifications']
      },
      content: {
        title: '🧪 Teste LogiTrack',
        body: message,
        actionUrl: 'https://github.com',
        actionText: 'Ver GitHub'
      },
      channels: {
        push: true,
        email: false,
        websocket: false
      },
      priority: 'normal',
      metadata: {
        testMode: true,
        triggeredAt: new Date().toISOString()
      }
    };

    // Simular request para o controller
    req.body = testPayload;
    await notificationController.triggerNotification(req, res);

  } catch (error) {
    logger.error('Erro no teste de notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no teste',
      message: error.message
    });
  }
});

/**
 * @route GET /api/notifications/stats
 * @desc Obter estatísticas de notificações
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const DeviceToken = require('../models/DeviceToken');

    const [
      totalNotifications,
      sentNotifications,
      failedNotifications,
      activeDevices,
      totalDevices
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: 'sent' }),
      Notification.countDocuments({ status: 'failed' }),
      DeviceToken.countDocuments({ status: 'active' }),
      DeviceToken.countDocuments()
    ]);

    const stats = {
      notifications: {
        total: totalNotifications,
        sent: sentNotifications,
        failed: failedNotifications,
        successRate: totalNotifications > 0 ? (sentNotifications / totalNotifications * 100).toFixed(2) : 0
      },
      devices: {
        total: totalDevices,
        active: activeDevices,
        inactive: totalDevices - activeDevices
      },
      lastUpdated: new Date().toISOString()
    };

    logger.info('📊 Estatísticas de notificação consultadas', stats);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

module.exports = router; 