const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Configurar transporter
      await this.createTransporter();
      
      // Carregar templates
      await this.loadTemplates();
      
      // Verificar conexão (temporariamente desabilitado)
      // await this.verifyConnection();
      
      this.isInitialized = true;
      logger.email('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async createTransporter() {
    const config = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    };

    this.transporter = nodemailer.createTransport(config);
    
    // Event listeners
    this.transporter.on('idle', () => {
      logger.email('Email transporter is idle');
    });

    this.transporter.on('error', (err) => {
      logger.error('Email transporter error:', err);
    });

    logger.email('Email transporter created');
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.email('Email connection verified successfully');
    } catch (error) {
      logger.error('Email connection verification failed:', error);
      throw error;
    }
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Criar diretório se não existir
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        logger.email('Created email templates directory');
      }

      const files = await fs.readdir(templatesDir);
      const htmlFiles = files.filter(file => file.endsWith('.html'));

      for (const file of htmlFiles) {
        const templateName = path.basename(file, '.html');
        const templatePath = path.join(templatesDir, file);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        
        this.templates.set(templateName, templateContent);
        logger.email(`Loaded email template: ${templateName}`);
      }

      // Criar templates padrão se não existirem
      await this.createDefaultTemplates();
      
      logger.email(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates:', error);
      throw error;
    }
  }

  async createDefaultTemplates() {
    const defaultTemplates = {
      'delivery-update': this.getDeliveryUpdateTemplate(),
      'welcome': this.getWelcomeTemplate(),
      'notification': this.getNotificationTemplate(),
      'campaign': this.getCampaignTemplate()
    };

    const templatesDir = path.join(__dirname, '../templates/email');

    for (const [name, content] of Object.entries(defaultTemplates)) {
      if (!this.templates.has(name)) {
        const templatePath = path.join(templatesDir, `${name}.html`);
        
        try {
          await fs.access(templatePath);
        } catch {
          await fs.writeFile(templatePath, content, 'utf8');
          this.templates.set(name, content);
          logger.email(`Created default template: ${name}`);
        }
      }
    }
  }

  async sendEmail(emailData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Email service not initialized');
      }

      const {
        to,
        subject,
        template,
        templateData = {},
        from,
        attachments = [],
        priority = 'normal',
        replyTo
      } = emailData;

      // Validar dados obrigatórios
      if (!to || !subject) {
        throw new Error('Email "to" and "subject" are required');
      }

      // Processar template
      const html = await this.processTemplate(template, templateData);
      
      // Configurar opções do e-mail
      const mailOptions = {
        from: from || process.env.EMAIL_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        attachments,
        priority: this.getPriorityLevel(priority)
      };

      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }

      // Adicionar headers personalizados
      mailOptions.headers = {
        'X-Mailer': 'LogiTrack Notification Service',
        'X-Priority': this.getPriorityLevel(priority),
        'X-MSMail-Priority': priority === 'high' ? 'High' : 'Normal'
      };

      // Enviar e-mail
      const result = await this.transporter.sendMail(mailOptions);
      
      logger.email('Email sent successfully', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      return {
        success: true,
        messageId: result.messageId,
        envelope: result.envelope,
        response: result.response
      };

    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        to: emailData.to,
        subject: emailData.subject
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkEmails(emailsData, batchSize = 10) {
    try {
      const results = [];
      const batches = this.createBatches(emailsData, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        logger.email(`Processing email batch ${i + 1}/${batches.length}`, {
          batchSize: batch.length
        });

        const batchPromises = batch.map(emailData => this.sendEmail(emailData));
        const batchResults = await Promise.allSettled(batchPromises);
        
        results.push(...batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
        ));

        // Delay entre batches para evitar rate limiting
        if (i < batches.length - 1) {
          await this.delay(1000);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      logger.email('Bulk email sending completed', {
        total: results.length,
        success: successCount,
        failed: failCount
      });

      return {
        total: results.length,
        success: successCount,
        failed: failCount,
        results
      };

    } catch (error) {
      logger.error('Failed to send bulk emails:', error);
      throw error;
    }
  }

  async processTemplate(templateName, data = {}) {
    try {
      if (!templateName) {
        return data.message || '';
      }

      let template = this.templates.get(templateName);
      
      if (!template) {
        logger.warn(`Template not found: ${templateName}, using notification template`);
        template = this.templates.get('notification') || this.getNotificationTemplate();
      }

      // Substituir variáveis no template
      let processedTemplate = template;
      
      // Dados padrão
      const defaultData = {
        currentYear: new Date().getFullYear(),
        appName: 'LogiTrack',
        supportEmail: process.env.EMAIL_USER || 'support@logitrack.com',
        ...data
      };

      // Substituir variáveis {{variableName}}
      for (const [key, value] of Object.entries(defaultData)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedTemplate = processedTemplate.replace(regex, value || '');
      }

      return processedTemplate;
    } catch (error) {
      logger.error('Failed to process email template:', error);
      return data.message || 'Erro ao processar template de e-mail';
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getPriorityLevel(priority) {
    const levels = {
      'urgent': '1',
      'high': '2',
      'normal': '3',
      'low': '4'
    };
    return levels[priority] || levels.normal;
  }

  // Templates padrão
  getDeliveryUpdateTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atualização de Entrega - {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status { background: #10b981; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{appName}}</h1>
            <h2>Atualização de Entrega</h2>
        </div>
        <div class="content">
            <p>Olá {{customerName}},</p>
            <p>Sua entrega foi atualizada:</p>
            <div class="status">
                <strong>Status: {{status}}</strong>
            </div>
            <p><strong>Código de Rastreamento:</strong> {{trackingCode}}</p>
            <p><strong>Localização Atual:</strong> {{currentLocation}}</p>
            <p><strong>Previsão de Entrega:</strong> {{estimatedDelivery}}</p>
            {{#if trackingUrl}}
            <p style="text-align: center;">
                <a href="{{trackingUrl}}" class="button">Rastrear Entrega</a>
            </p>
            {{/if}}
        </div>
        <div class="footer">
            <p>© {{currentYear}} {{appName}}. Todos os direitos reservados.</p>
            <p>Em caso de dúvidas, entre em contato: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
  }

  getWelcomeTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bem-vindo ao {{appName}}!</h1>
        </div>
        <div class="content">
            <p>Olá {{userName}},</p>
            <p>Seja bem-vindo(a) ao {{appName}}! Estamos muito felizes em tê-lo(a) conosco.</p>
            <p>Com nossa plataforma, você pode:</p>
            <ul>
                <li>Rastrear suas entregas em tempo real</li>
                <li>Receber notificações sobre o status das entregas</li>
                <li>Gerenciar seus pedidos de forma eficiente</li>
                <li>Acessar histórico completo de entregas</li>
            </ul>
            <p style="text-align: center;">
                <a href="{{dashboardUrl}}" class="button">Acessar Dashboard</a>
            </p>
        </div>
        <div class="footer">
            <p>© {{currentYear}} {{appName}}. Todos os direitos reservados.</p>
            <p>Em caso de dúvidas, entre em contato: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
  }

  getNotificationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{appName}}</h1>
            <h2>{{title}}</h2>
        </div>
        <div class="content">
            <p>{{message}}</p>
            {{#if actionUrl}}
            <p style="text-align: center;">
                <a href="{{actionUrl}}" class="button">{{actionText}}</a>
            </p>
            {{/if}}
        </div>
        <div class="footer">
            <p>© {{currentYear}} {{appName}}. Todos os direitos reservados.</p>
            <p>Em caso de dúvidas, entre em contato: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
  }

  getCampaignTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .cta-button { background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{appName}}</h1>
            <h2>{{title}}</h2>
        </div>
        <div class="content">
            {{#if highlight}}
            <div class="highlight">
                <strong>{{highlight}}</strong>
            </div>
            {{/if}}
            <p>{{message}}</p>
            {{#if ctaUrl}}
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{ctaUrl}}" class="cta-button">{{ctaText}}</a>
            </p>
            {{/if}}
        </div>
        <div class="footer">
            <p>© {{currentYear}} {{appName}}. Todos os direitos reservados.</p>
            <p>Em caso de dúvidas, entre em contato: {{supportEmail}}</p>
            <p><a href="{{unsubscribeUrl}}" style="color: #666;">Cancelar inscrição</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  async getEmailStats() {
    return {
      isInitialized: this.isInitialized,
      templatesLoaded: this.templates.size,
      transporterReady: this.transporter ? true : false
    };
  }

  async shutdown() {
    try {
      if (this.transporter) {
        this.transporter.close();
        logger.email('Email service shutdown completed');
      }
    } catch (error) {
      logger.error('Error during email service shutdown:', error);
    }
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService; 