const emailService = require('../services/EmailService');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class EmailWorker {
  static async processEmailJob(job) {
    try {
      const { data } = job;
      const {
        notificationId,
        to,
        subject,
        template,
        templateData,
        priority = 'normal',
        from,
        replyTo,
        attachments = []
      } = data;

      logger.email('Processing email job', {
        jobId: job.id,
        notificationId,
        to,
        subject
      });

      // Atualizar progresso
      await job.updateProgress(10);

      // Buscar notificação no banco se ID foi fornecido
      let notification = null;
      if (notificationId) {
        notification = await Notification.findById(notificationId);
        if (!notification) {
          throw new Error(`Notification ${notificationId} not found`);
        }
      }

      await job.updateProgress(20);

      // Preparar dados do e-mail
      const emailData = {
        to,
        subject,
        template: template || 'notification',
        templateData: {
          ...templateData,
          // Adicionar dados da notificação se disponível
          ...(notification && {
            title: notification.title,
            message: notification.message,
            ...notification.data
          })
        },
        from,
        replyTo,
        attachments,
        priority
      };

      await job.updateProgress(40);

      // Enviar e-mail
      const result = await emailService.sendEmail(emailData);

      await job.updateProgress(80);

      if (result.success) {
        // Atualizar notificação como enviada
        if (notification) {
          await notification.markAsSent();
          
          // Atualizar dados específicos do e-mail
          notification.emailData = {
            to,
            from: from || process.env.EMAIL_USER,
            subject,
            template,
            templateData
          };
          
          await notification.save();
        }

        await job.updateProgress(100);

        logger.email('Email sent successfully', {
          jobId: job.id,
          notificationId,
          messageId: result.messageId,
          to
        });

        return {
          success: true,
          messageId: result.messageId,
          notificationId,
          sentAt: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Failed to send email');
      }

    } catch (error) {
      logger.error('Email job failed', {
        jobId: job.id,
        error: error.message,
        notificationId: job.data.notificationId
      });

      // Atualizar notificação como falha
      if (job.data.notificationId) {
        try {
          const notification = await Notification.findById(job.data.notificationId);
          if (notification) {
            await notification.markAsFailed(error.message);
          }
        } catch (updateError) {
          logger.error('Failed to update notification status:', updateError);
        }
      }

      throw error;
    }
  }

  static async processBulkEmailJob(job) {
    try {
      const { data } = job;
      const { emails, batchSize = 10 } = data;

      logger.email('Processing bulk email job', {
        jobId: job.id,
        emailCount: emails.length,
        batchSize
      });

      await job.updateProgress(5);

      const results = await emailService.sendBulkEmails(emails, batchSize);

      await job.updateProgress(90);

      // Atualizar notificações baseado nos resultados
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const result = results.results[i];

        if (email.notificationId) {
          try {
            const notification = await Notification.findById(email.notificationId);
            if (notification) {
              if (result.success) {
                await notification.markAsSent();
              } else {
                await notification.markAsFailed(result.error || 'Bulk email failed');
              }
            }
          } catch (error) {
            logger.error('Failed to update notification in bulk job:', error);
          }
        }
      }

      await job.updateProgress(100);

      logger.email('Bulk email job completed', {
        jobId: job.id,
        total: results.total,
        success: results.success,
        failed: results.failed
      });

      return {
        success: true,
        total: results.total,
        successCount: results.success,
        failedCount: results.failed,
        results: results.results
      };

    } catch (error) {
      logger.error('Bulk email job failed', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  static async processWelcomeEmailJob(job) {
    try {
      const { data } = job;
      const { userId, userEmail, userName, userType } = data;

      logger.email('Processing welcome email job', {
        jobId: job.id,
        userId,
        userEmail,
        userType
      });

      await job.updateProgress(20);

      const emailData = {
        to: userEmail,
        subject: 'Bem-vindo ao LogiTrack!',
        template: 'welcome',
        templateData: {
          userName: userName || 'Usuário',
          userType,
          dashboardUrl: `${process.env.API_GATEWAY_URL}/dashboard`
        },
        priority: 'normal'
      };

      await job.updateProgress(50);

      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        await job.updateProgress(100);

        logger.email('Welcome email sent successfully', {
          jobId: job.id,
          userId,
          messageId: result.messageId
        });

        return {
          success: true,
          messageId: result.messageId,
          userId,
          sentAt: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Failed to send welcome email');
      }

    } catch (error) {
      logger.error('Welcome email job failed', {
        jobId: job.id,
        error: error.message,
        userId: job.data.userId
      });

      throw error;
    }
  }

  static async processDeliveryUpdateEmailJob(job) {
    try {
      const { data } = job;
      const {
        deliveryId,
        customerEmail,
        customerName,
        status,
        trackingCode,
        currentLocation,
        estimatedDelivery
      } = data;

      logger.email('Processing delivery update email job', {
        jobId: job.id,
        deliveryId,
        customerEmail,
        status
      });

      await job.updateProgress(20);

      const emailData = {
        to: customerEmail,
        subject: `Atualização da sua entrega - ${trackingCode}`,
        template: 'delivery-update',
        templateData: {
          customerName: customerName || 'Cliente',
          status,
          trackingCode,
          currentLocation,
          estimatedDelivery,
          trackingUrl: `${process.env.API_GATEWAY_URL}/tracking/${trackingCode}`
        },
        priority: 'high'
      };

      await job.updateProgress(50);

      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        await job.updateProgress(100);

        logger.email('Delivery update email sent successfully', {
          jobId: job.id,
          deliveryId,
          messageId: result.messageId
        });

        return {
          success: true,
          messageId: result.messageId,
          deliveryId,
          sentAt: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Failed to send delivery update email');
      }

    } catch (error) {
      logger.error('Delivery update email job failed', {
        jobId: job.id,
        error: error.message,
        deliveryId: job.data.deliveryId
      });

      throw error;
    }
  }

  static async processCampaignEmailJob(job) {
    try {
      const { data } = job;
      const {
        campaignId,
        userEmail,
        userName,
        subject,
        template,
        templateData,
        unsubscribeUrl
      } = data;

      logger.email('Processing campaign email job', {
        jobId: job.id,
        campaignId,
        userEmail
      });

      await job.updateProgress(20);

      const emailData = {
        to: userEmail,
        subject,
        template: template || 'campaign',
        templateData: {
          userName: userName || 'Cliente',
          unsubscribeUrl: unsubscribeUrl || `${process.env.API_GATEWAY_URL}/unsubscribe`,
          ...templateData
        },
        priority: 'low'
      };

      await job.updateProgress(50);

      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        await job.updateProgress(100);

        logger.email('Campaign email sent successfully', {
          jobId: job.id,
          campaignId,
          messageId: result.messageId
        });

        return {
          success: true,
          messageId: result.messageId,
          campaignId,
          sentAt: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Failed to send campaign email');
      }

    } catch (error) {
      logger.error('Campaign email job failed', {
        jobId: job.id,
        error: error.message,
        campaignId: job.data.campaignId
      });

      throw error;
    }
  }
}

module.exports = EmailWorker; 