const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  // Token do dispositivo (FCM)
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // ID do usuário associado
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Tipo de usuário (driver, client, operator)
  userType: {
    type: String,
    enum: ['driver', 'client', 'operator'],
    required: true,
    index: true
  },

  // Plataforma do dispositivo
  platform: {
    type: String,
    enum: ['android', 'ios'],
    required: true
  },

  // Informações do dispositivo
  deviceInfo: {
    model: String,
    brand: String,
    version: String,
    appVersion: String
  },

  // Status do token
  status: {
    type: String,
    enum: ['active', 'inactive', 'invalid'],
    default: 'active',
    index: true
  },

  // Tópicos subscritos
  subscribedTopics: [{
    type: String
  }],

  // Configurações de notificação
  notificationSettings: {
    deliveryUpdates: {
      type: Boolean,
      default: true
    },
    promotionalCampaigns: {
      type: Boolean,
      default: true
    },
    systemAlerts: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    vibrationEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Estatísticas
  stats: {
    totalNotificationsSent: {
      type: Number,
      default: 0
    },
    lastNotificationSent: Date,
    totalNotificationsOpened: {
      type: Number,
      default: 0
    },
    lastNotificationOpened: Date
  },

  // Última vez que o token foi validado
  lastValidated: {
    type: Date,
    default: Date.now
  },

  // Última atividade do dispositivo
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compostos para consultas otimizadas
deviceTokenSchema.index({ userId: 1, status: 1 });
deviceTokenSchema.index({ userType: 1, status: 1 });
deviceTokenSchema.index({ platform: 1, status: 1 });
deviceTokenSchema.index({ lastActive: 1, status: 1 });

// Virtual para verificar se o token está ativo
deviceTokenSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual para verificar se o token precisa ser validado
deviceTokenSchema.virtual('needsValidation').get(function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return this.lastValidated < oneWeekAgo;
});

// Método para atualizar última atividade
deviceTokenSchema.methods.updateActivity = function() {
  this.lastActive = new Date();
  return this.save();
};

// Método para marcar como inválido
deviceTokenSchema.methods.markAsInvalid = function() {
  this.status = 'invalid';
  return this.save();
};

// Método para incrementar estatísticas de notificação enviada
deviceTokenSchema.methods.incrementNotificationSent = function() {
  this.stats.totalNotificationsSent += 1;
  this.stats.lastNotificationSent = new Date();
  return this.save();
};

// Método para incrementar estatísticas de notificação aberta
deviceTokenSchema.methods.incrementNotificationOpened = function() {
  this.stats.totalNotificationsOpened += 1;
  this.stats.lastNotificationOpened = new Date();
  return this.save();
};

// Método para subscrever a um tópico
deviceTokenSchema.methods.subscribeToTopic = function(topic) {
  if (!this.subscribedTopics.includes(topic)) {
    this.subscribedTopics.push(topic);
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para desinscrever de um tópico
deviceTokenSchema.methods.unsubscribeFromTopic = function(topic) {
  this.subscribedTopics = this.subscribedTopics.filter(t => t !== topic);
  return this.save();
};

// Middleware para atualizar lastValidated quando o status muda para ativo
deviceTokenSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active') {
    this.lastValidated = new Date();
  }
  next();
});

// Métodos estáticos
deviceTokenSchema.statics.findActiveByUserId = function(userId) {
  return this.find({ userId, status: 'active' });
};

deviceTokenSchema.statics.findActiveByUserType = function(userType) {
  return this.find({ userType, status: 'active' });
};

deviceTokenSchema.statics.findByTopics = function(topics) {
  return this.find({ 
    subscribedTopics: { $in: topics },
    status: 'active'
  });
};

deviceTokenSchema.statics.cleanupInvalidTokens = function() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  return this.deleteMany({
    $or: [
      { status: 'invalid' },
      { lastActive: { $lt: oneMonthAgo } }
    ]
  });
};

deviceTokenSchema.statics.getTokensNeedingValidation = function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return this.find({
    status: 'active',
    lastValidated: { $lt: oneWeekAgo }
  });
};

module.exports = mongoose.model('DeviceToken', deviceTokenSchema); 