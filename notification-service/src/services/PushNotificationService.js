const admin = require('firebase-admin');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.app = null;
  }

  async initialize() {
    try {
      // Verificar se Firebase está configurado
      if (!process.env.FIREBASE_PROJECT_ID) {
        logger.warn('Firebase não configurado. Push notifications desabilitadas.');
        return;
      }

      // Configuração do Firebase Admin SDK
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
      };

      // Inicializar Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      this.initialized = true;
      logger.info('🔥 Firebase Push Notification Service inicializado');
      
    } catch (error) {
      logger.error('Erro ao inicializar Firebase:', error);
      this.initialized = false;
    }
  }

  /**
   * Enviar notificação push para um dispositivo específico
   */
  async sendToDevice(deviceToken, notification, data = {}) {
    if (!this.initialized) {
      logger.warn('Firebase não inicializado. Pulando push notification.');
      return { success: false, error: 'Firebase não inicializado' };
    }

    try {
      const message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl || undefined
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: data.type || 'general'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            channelId: 'logitrack_notifications'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: notification.title,
                body: notification.body
              }
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      logger.info(`📱 Push notification enviada: ${response}`, {
        deviceToken: deviceToken.substring(0, 20) + '...',
        title: notification.title
      });

      return {
        success: true,
        messageId: response,
        deviceToken: deviceToken
      };

    } catch (error) {
      logger.error('Erro ao enviar push notification:', error);
      
      // Verificar se o token é inválido
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return {
          success: false,
          error: 'Token inválido',
          shouldRemoveToken: true,
          deviceToken: deviceToken
        };
      }

      return {
        success: false,
        error: error.message,
        deviceToken: deviceToken
      };
    }
  }

  /**
   * Enviar notificação para múltiplos dispositivos
   */
  async sendToMultipleDevices(deviceTokens, notification, data = {}) {
    if (!this.initialized) {
      logger.warn('Firebase não inicializado. Pulando push notifications.');
      return { success: false, error: 'Firebase não inicializado' };
    }

    if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      return { success: false, error: 'Nenhum token de dispositivo fornecido' };
    }

    try {
      const message = {
        tokens: deviceTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl || undefined
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: data.type || 'general'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            channelId: 'logitrack_notifications'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: notification.title,
                body: notification.body
              }
            }
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      
      logger.info(`📱 Push notifications enviadas: ${response.successCount}/${deviceTokens.length}`, {
        successCount: response.successCount,
        failureCount: response.failureCount,
        title: notification.title
      });

      // Processar tokens inválidos
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error?.code === 'messaging/invalid-registration-token' ||
             resp.error?.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(deviceTokens[idx]);
        }
      });

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens: invalidTokens,
        responses: response.responses
      };

    } catch (error) {
      logger.error('Erro ao enviar push notifications múltiplas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar notificação por tópico
   */
  async sendToTopic(topic, notification, data = {}) {
    if (!this.initialized) {
      logger.warn('Firebase não inicializado. Pulando push notification.');
      return { success: false, error: 'Firebase não inicializado' };
    }

    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl || undefined
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: data.type || 'general'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            channelId: 'logitrack_notifications'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: notification.title,
                body: notification.body
              }
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      logger.info(`📱 Push notification enviada para tópico: ${topic}`, {
        messageId: response,
        topic: topic,
        title: notification.title
      });

      return {
        success: true,
        messageId: response,
        topic: topic
      };

    } catch (error) {
      logger.error('Erro ao enviar push notification para tópico:', error);
      return {
        success: false,
        error: error.message,
        topic: topic
      };
    }
  }

  /**
   * Subscrever dispositivo a um tópico
   */
  async subscribeToTopic(deviceTokens, topic) {
    if (!this.initialized) {
      return { success: false, error: 'Firebase não inicializado' };
    }

    try {
      const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      
      logger.info(`📱 Dispositivos subscritos ao tópico: ${topic}`, {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      logger.error('Erro ao subscrever ao tópico:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desinscrever dispositivo de um tópico
   */
  async unsubscribeFromTopic(deviceTokens, topic) {
    if (!this.initialized) {
      return { success: false, error: 'Firebase não inicializado' };
    }

    try {
      const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      
      logger.info(`📱 Dispositivos desincritos do tópico: ${topic}`, {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      logger.error('Erro ao desinscrever do tópico:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validar token de dispositivo
   */
  async validateToken(deviceToken) {
    if (!this.initialized) {
      return { valid: false, error: 'Firebase não inicializado' };
    }

    try {
      // Tentar enviar uma mensagem de teste (dry run)
      const message = {
        token: deviceToken,
        notification: {
          title: 'Test',
          body: 'Test'
        },
        dryRun: true
      };

      await admin.messaging().send(message);
      return { valid: true };

    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { valid: false, error: 'Token inválido' };
      }
      
      return { valid: false, error: error.message };
    }
  }
}

// Exportar como singleton
module.exports = new PushNotificationService(); 