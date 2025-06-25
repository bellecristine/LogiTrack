const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');
const emailService = require('../services/EmailService');
const pushNotificationService = require('../services/PushNotificationService');
const queueService = require('../services/QueueService');
const logger = require('../utils/logger');
const Joi = require('joi');

class NotificationController {
  
  /**
   * Endpoint principal para disparar notificações via API Gateway
   * POST /api/notifications/trigger
   */
  async triggerNotification(req, res) {
    try {
      // Validação do payload
      const schema = Joi.object({
        type: Joi.string().valid('delivery_update', 'order_status', 'promotion', 'system_alert').required(),
        recipients: Joi.object({
          userIds: Joi.array().items(Joi.string()),
          userTypes: Joi.array().items(Joi.string().valid('driver', 'client', 'operator')),
          deviceTokens: Joi.array().items(Joi.string()),
          topics: Joi.array().items(Joi.string()),
          emails: Joi.array().items(Joi.string().email())
        }).required(),
        content: Joi.object({
          title: Joi.string().required(),
          body: Joi.string().required(),
          imageUrl: Joi.string().uri().optional(),
          actionUrl: Joi.string().uri().optional(),
          actionText: Joi.string().optional()
        }).required(),
        channels: Joi.object({
          push: Joi.boolean().default(true),
          email: Joi.boolean().default(false),
          websocket: Joi.boolean().default(false)
        }).default({ push: true, email: false, websocket: false }),
        priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
        metadata: Joi.object().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.details
        });
      }

      const { type, recipients, content, channels, priority, metadata } = value;

      logger.info('🎯 Trigger de notificação recebido', {
        type,
        channels,
        priority,
        recipientsCount: Object.keys(recipients).length
      });

      // Criar registro da notificação
      const notification = new Notification({
        type,
        title: content.title,
        message: content.body,
        priority,
        channels: Object.keys(channels).filter(ch => channels[ch]),
        metadata: {
          ...metadata,
          triggeredBy: 'api_gateway',
          requestId: req.headers['x-request-id'] || `req_${Date.now()}`
        },
        status: 'processing'
      });

      await notification.save();

      // Processar diferentes tipos de destinatários
      const results = {
        push: { sent: 0, failed: 0, errors: [] },
        email: { sent: 0, failed: 0, errors: [] },
        websocket: { sent: 0, failed: 0, errors: [] }
      };

      // 1. Push Notifications
      if (channels.push) {
        const pushResult = await this._sendPushNotifications(recipients, content, type, metadata);
        results.push = pushResult;
      }

      // 2. Email Notifications
      if (channels.email) {
        const emailResult = await this._sendEmailNotifications(recipients, content, type, metadata);
        results.email = emailResult;
      }

      // 3. WebSocket Notifications (tempo real)
      if (channels.websocket) {
        const wsResult = await this._sendWebSocketNotifications(recipients, content, type, metadata);
        results.websocket = wsResult;
      }

      // Atualizar status da notificação
      const totalSent = results.push.sent + results.email.sent + results.websocket.sent;
      const totalFailed = results.push.failed + results.email.failed + results.websocket.failed;

      notification.status = totalSent > 0 ? 'sent' : 'failed';
      notification.deliveryStats = {
        totalRecipients: totalSent + totalFailed,
        successfulDeliveries: totalSent,
        failedDeliveries: totalFailed,
        deliveryRate: totalSent > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0
      };
      notification.sentAt = new Date();

      await notification.save();

      logger.info('✅ Notificação processada', {
        notificationId: notification._id,
        totalSent,
        totalFailed,
        deliveryRate: notification.deliveryStats.deliveryRate
      });

      res.status(200).json({
        success: true,
        data: {
          notificationId: notification._id,
          results,
          summary: {
            totalSent,
            totalFailed,
            deliveryRate: notification.deliveryStats.deliveryRate
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao processar trigger de notificação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Registrar token de dispositivo
   * POST /api/notifications/register-device
   */
  async registerDevice(req, res) {
    try {
      const schema = Joi.object({
        token: Joi.string().required(),
        userId: Joi.string().required(),
        userType: Joi.string().valid('driver', 'client', 'operator').required(),
        platform: Joi.string().valid('android', 'ios').required(),
        deviceInfo: Joi.object({
          model: Joi.string(),
          brand: Joi.string(),
          version: Joi.string(),
          appVersion: Joi.string()
        }).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.details
        });
      }

      const { token, userId, userType, platform, deviceInfo } = value;

      // Verificar se o token já existe
      let deviceToken = await DeviceToken.findOne({ token });

      if (deviceToken) {
        // Atualizar token existente
        deviceToken.userId = userId;
        deviceToken.userType = userType;
        deviceToken.platform = platform;
        deviceToken.deviceInfo = deviceInfo || deviceToken.deviceInfo;
        deviceToken.status = 'active';
        deviceToken.lastActive = new Date();
        await deviceToken.save();
      } else {
        // Criar novo token
        deviceToken = new DeviceToken({
          token,
          userId,
          userType,
          platform,
          deviceInfo,
          status: 'active'
        });
        await deviceToken.save();
      }

      // Subscrever a tópicos padrão baseado no tipo de usuário
      const defaultTopics = [`${userType}_notifications`, 'general_notifications'];
      for (const topic of defaultTopics) {
        await deviceToken.subscribeToTopic(topic);
        await pushNotificationService.subscribeToTopic(token, topic);
      }

      logger.info('📱 Token de dispositivo registrado', {
        userId,
        userType,
        platform,
        tokenPreview: token.substring(0, 20) + '...'
      });

      res.status(200).json({
        success: true,
        data: {
          deviceId: deviceToken._id,
          subscribedTopics: deviceToken.subscribedTopics
        }
      });

    } catch (error) {
      logger.error('Erro ao registrar token de dispositivo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Atualizar configurações de notificação
   * PUT /api/notifications/settings/:deviceId
   */
  async updateNotificationSettings(req, res) {
    try {
      const { deviceId } = req.params;
      
      const schema = Joi.object({
        deliveryUpdates: Joi.boolean(),
        promotionalCampaigns: Joi.boolean(),
        systemAlerts: Joi.boolean(),
        soundEnabled: Joi.boolean(),
        vibrationEnabled: Joi.boolean()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.details
        });
      }

      const deviceToken = await DeviceToken.findById(deviceId);
      if (!deviceToken) {
        return res.status(404).json({
          success: false,
          error: 'Dispositivo não encontrado'
        });
      }

      // Atualizar configurações
      Object.assign(deviceToken.notificationSettings, value);
      await deviceToken.save();

      logger.info('⚙️ Configurações de notificação atualizadas', {
        deviceId,
        settings: value
      });

      res.status(200).json({
        success: true,
        data: {
          deviceId,
          notificationSettings: deviceToken.notificationSettings
        }
      });

    } catch (error) {
      logger.error('Erro ao atualizar configurações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obter histórico de notificações
   * GET /api/notifications/history
   */
  async getNotificationHistory(req, res) {
    try {
      const { page = 1, limit = 20, type, status, userId } = req.query;

      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (userId) filter['metadata.userId'] = userId;

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-__v');

      const total = await Notification.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Métodos privados para envio por canal
   */
  async _sendPushNotifications(recipients, content, type, metadata) {
    const result = { sent: 0, failed: 0, errors: [] };

    try {
      // Coletar todos os tokens de dispositivo
      const deviceTokens = [];

      // Por IDs de usuário
      if (recipients.userIds && recipients.userIds.length > 0) {
        const tokens = await DeviceToken.find({
          userId: { $in: recipients.userIds },
          status: 'active'
        });
        deviceTokens.push(...tokens);
      }

      // Por tipos de usuário
      if (recipients.userTypes && recipients.userTypes.length > 0) {
        const tokens = await DeviceToken.find({
          userType: { $in: recipients.userTypes },
          status: 'active'
        });
        deviceTokens.push(...tokens);
      }

      // Por tokens específicos
      if (recipients.deviceTokens && recipients.deviceTokens.length > 0) {
        const tokens = await DeviceToken.find({
          token: { $in: recipients.deviceTokens },
          status: 'active'
        });
        deviceTokens.push(...tokens);
      }

      // Remover duplicatas
      const uniqueTokens = deviceTokens.filter((token, index, self) => 
        index === self.findIndex(t => t.token === token.token)
      );

      // Enviar para cada token
      for (const deviceToken of uniqueTokens) {
        try {
          const pushResult = await pushNotificationService.sendToDevice(
            deviceToken.token,
            {
              title: content.title,
              body: content.body,
              imageUrl: content.imageUrl
            },
            {
              type,
              actionUrl: content.actionUrl,
              actionText: content.actionText,
              ...metadata
            }
          );

          if (pushResult.success) {
            result.sent++;
            await deviceToken.incrementNotificationSent();
          } else {
            result.failed++;
            result.errors.push({
              token: deviceToken.token.substring(0, 20) + '...',
              error: pushResult.error
            });

            // Marcar token como inválido se necessário
            if (pushResult.shouldRemoveToken) {
              await deviceToken.markAsInvalid();
            }
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            token: deviceToken.token.substring(0, 20) + '...',
            error: error.message
          });
        }
      }

      // Enviar para tópicos
      if (recipients.topics && recipients.topics.length > 0) {
        for (const topic of recipients.topics) {
          try {
            const topicResult = await pushNotificationService.sendToTopic(
              topic,
              {
                title: content.title,
                body: content.body,
                imageUrl: content.imageUrl
              },
              {
                type,
                actionUrl: content.actionUrl,
                actionText: content.actionText,
                ...metadata
              }
            );

            if (topicResult.success) {
              result.sent += 1; // Estimativa para tópicos
            } else {
              result.failed += 1;
              result.errors.push({
                topic,
                error: topicResult.error
              });
            }
          } catch (error) {
            result.failed++;
            result.errors.push({
              topic,
              error: error.message
            });
          }
        }
      }

    } catch (error) {
      logger.error('Erro ao enviar push notifications:', error);
      result.errors.push({
        general: error.message
      });
    }

    return result;
  }

  async _sendEmailNotifications(recipients, content, type, metadata) {
    const result = { sent: 0, failed: 0, errors: [] };

    try {
      const emails = recipients.emails || [];
      
      // Buscar emails por userId se fornecido
      // (Isso requereria integração com o auth-service para buscar emails dos usuários)

      for (const email of emails) {
        try {
          const emailResult = await emailService.sendEmail({
            to: email,
            subject: content.title,
            template: 'notification',
            templateData: {
              title: content.title,
              message: content.body,
              actionUrl: content.actionUrl,
              actionText: content.actionText || 'Ver detalhes'
            }
          });

          if (emailResult.success) {
            result.sent++;
          } else {
            result.failed++;
            result.errors.push({
              email,
              error: emailResult.error
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            email,
            error: error.message
          });
        }
      }

    } catch (error) {
      logger.error('Erro ao enviar email notifications:', error);
      result.errors.push({
        general: error.message
      });
    }

    return result;
  }

  async _sendWebSocketNotifications(recipients, content, type, metadata) {
    const result = { sent: 0, failed: 0, errors: [] };

    try {
      // Implementar envio via WebSocket quando o serviço estiver rodando
      // Por enquanto, simular sucesso
      result.sent = recipients.userIds ? recipients.userIds.length : 0;
      
    } catch (error) {
      logger.error('Erro ao enviar WebSocket notifications:', error);
      result.errors.push({
        general: error.message
      });
    }

    return result;
  }
}

module.exports = new NotificationController(); 