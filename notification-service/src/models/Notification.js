const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'push', 'sms', 'in_app'],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['delivery_update', 'system', 'marketing', 'alert', 'reminder'],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },
  deliveredAt: {
    type: Date,
    index: true
  },
  readAt: {
    type: Date,
    index: true
  },
  failedAt: {
    type: Date,
    index: true
  },
  errorMessage: {
    type: String,
    maxlength: 500
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: 0,
    max: 5
  },
  // Campos específicos para e-mail
  emailData: {
    to: String,
    from: String,
    subject: String,
    template: String,
    templateData: mongoose.Schema.Types.Mixed
  },
  // Campos específicos para push
  pushData: {
    deviceToken: String,
    badge: Number,
    sound: String,
    clickAction: String
  },
  // Metadados
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: String,
    campaignId: mongoose.Schema.Types.ObjectId,
    deliveryId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compostos para consultas eficientes
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1, createdAt: -1 });
notificationSchema.index({ category: 1, status: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ 'metadata.campaignId': 1, status: 1 });

// Virtual para tempo decorrido
notificationSchema.virtual('timeElapsed').get(function() {
  if (this.sentAt) {
    return Date.now() - this.sentAt.getTime();
  }
  return null;
});

// Virtual para verificar se está expirada
notificationSchema.virtual('isExpired').get(function() {
  if (this.scheduledFor && this.status === 'pending') {
    return Date.now() > this.scheduledFor.getTime() + (24 * 60 * 60 * 1000); // 24 horas
  }
  return false;
});

// Métodos de instância
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  return this.save();
};

notificationSchema.methods.canRetry = function() {
  return this.retryCount < this.maxRetries && this.status === 'failed';
};

// Métodos estáticos
notificationSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    userId,
    status: 'pending',
    $or: [
      { scheduledFor: { $lte: new Date() } },
      { scheduledFor: { $exists: false } }
    ]
  }).sort({ priority: -1, createdAt: 1 });
};

notificationSchema.statics.findByCategory = function(category, limit = 50) {
  return this.find({ category })
    .sort({ createdAt: -1 })
    .limit(limit);
};

notificationSchema.statics.getStatsByUser = function(userId, startDate, endDate) {
  const matchStage = { userId };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Middleware pre-save
notificationSchema.pre('save', function(next) {
  // Validar dados específicos por tipo
  if (this.type === 'email' && (!this.emailData || !this.emailData.to)) {
    return next(new Error('Email data is required for email notifications'));
  }
  
  if (this.type === 'push' && (!this.pushData || !this.pushData.deviceToken)) {
    return next(new Error('Push data is required for push notifications'));
  }
  
  next();
});

// Middleware post-save para logs
notificationSchema.post('save', function(doc) {
  const logger = require('../utils/logger');
  logger.notification('Notification saved', {
    id: doc._id,
    userId: doc.userId,
    type: doc.type,
    status: doc.status
  });
});

module.exports = mongoose.model('Notification', notificationSchema); 