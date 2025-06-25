const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['promotional', 'informational', 'transactional', 'reminder'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Configurações de segmentação
  targetAudience: {
    userTypes: [{
      type: String,
      enum: ['client', 'driver', 'operator', 'admin']
    }],
    userSegments: [{
      type: String,
      enum: ['new_users', 'active_users', 'inactive_users', 'vip_users']
    }],
    locationBased: {
      enabled: { type: Boolean, default: false },
      cities: [String],
      regions: [String]
    },
    behaviorBased: {
      enabled: { type: Boolean, default: false },
      minDeliveries: Number,
      maxDeliveries: Number,
      lastActivityDays: Number
    },
    customFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  // Configurações de conteúdo
  content: {
    subject: {
      type: String,
      required: true,
      maxlength: 200
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    template: {
      type: String,
      required: true
    },
    templateData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    callToAction: {
      text: String,
      url: String,
      enabled: { type: Boolean, default: false }
    }
  },
  // Configurações de envio
  delivery: {
    channels: [{
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      required: true
    }],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    scheduledFor: {
      type: Date,
      index: true
    },
    timezone: {
      type: String,
      default: 'America/Sao_Paulo'
    },
    batchSize: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000
    },
    delayBetweenBatches: {
      type: Number,
      default: 60000, // 1 minuto em ms
      min: 1000
    }
  },
  // Configurações de teste A/B
  abTest: {
    enabled: { type: Boolean, default: false },
    variants: [{
      name: String,
      percentage: Number,
      content: {
        subject: String,
        title: String,
        message: String,
        template: String,
        templateData: mongoose.Schema.Types.Mixed
      }
    }]
  },
  // Estatísticas
  statistics: {
    targetedUsers: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    unsubscribedCount: { type: Number, default: 0 },
    lastProcessedAt: Date,
    completedAt: Date
  },
  // Metadados
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  approvedAt: {
    type: Date
  },
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
campaignSchema.index({ status: 1, 'delivery.scheduledFor': 1 });
campaignSchema.index({ type: 1, status: 1, createdAt: -1 });
campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ tags: 1 });

// Virtuals
campaignSchema.virtual('openRate').get(function() {
  if (this.statistics.deliveredCount === 0) return 0;
  return (this.statistics.openedCount / this.statistics.deliveredCount) * 100;
});

campaignSchema.virtual('clickRate').get(function() {
  if (this.statistics.openedCount === 0) return 0;
  return (this.statistics.clickedCount / this.statistics.openedCount) * 100;
});

campaignSchema.virtual('deliveryRate').get(function() {
  if (this.statistics.sentCount === 0) return 0;
  return (this.statistics.deliveredCount / this.statistics.sentCount) * 100;
});

campaignSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled' && this.delivery.scheduledFor && 
         this.delivery.scheduledFor > new Date();
});

campaignSchema.virtual('isReadyToSend').get(function() {
  return this.status === 'scheduled' && this.delivery.scheduledFor && 
         this.delivery.scheduledFor <= new Date();
});

// Métodos de instância
campaignSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

campaignSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

campaignSchema.methods.complete = function() {
  this.status = 'completed';
  this.statistics.completedAt = new Date();
  return this.save();
};

campaignSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

campaignSchema.methods.updateStatistics = function(stats) {
  Object.assign(this.statistics, stats);
  this.statistics.lastProcessedAt = new Date();
  return this.save();
};

campaignSchema.methods.incrementSent = function(count = 1) {
  this.statistics.sentCount += count;
  return this.save();
};

campaignSchema.methods.incrementDelivered = function(count = 1) {
  this.statistics.deliveredCount += count;
  return this.save();
};

campaignSchema.methods.incrementOpened = function(count = 1) {
  this.statistics.openedCount += count;
  return this.save();
};

campaignSchema.methods.incrementClicked = function(count = 1) {
  this.statistics.clickedCount += count;
  return this.save();
};

campaignSchema.methods.incrementFailed = function(count = 1) {
  this.statistics.failedCount += count;
  return this.save();
};

// Métodos estáticos
campaignSchema.statics.findScheduledCampaigns = function() {
  return this.find({
    status: 'scheduled',
    'delivery.scheduledFor': { $lte: new Date() }
  });
};

campaignSchema.statics.findActiveCampaigns = function() {
  return this.find({ status: 'active' });
};

campaignSchema.statics.getStatsByType = function(startDate, endDate) {
  const matchStage = {};
  
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
        _id: '$type',
        count: { $sum: 1 },
        totalSent: { $sum: '$statistics.sentCount' },
        totalDelivered: { $sum: '$statistics.deliveredCount' },
        totalOpened: { $sum: '$statistics.openedCount' },
        totalClicked: { $sum: '$statistics.clickedCount' }
      }
    }
  ]);
};

// Middleware pre-save
campaignSchema.pre('save', function(next) {
  // Validar que pelo menos um canal está selecionado
  if (!this.delivery.channels || this.delivery.channels.length === 0) {
    return next(new Error('At least one delivery channel must be selected'));
  }
  
  // Validar percentuais do teste A/B
  if (this.abTest.enabled && this.abTest.variants.length > 0) {
    const totalPercentage = this.abTest.variants.reduce((sum, variant) => sum + variant.percentage, 0);
    if (totalPercentage !== 100) {
      return next(new Error('A/B test variants must total 100%'));
    }
  }
  
  next();
});

// Middleware post-save para logs
campaignSchema.post('save', function(doc) {
  const logger = require('../utils/logger');
  logger.campaign('Campaign saved', {
    id: doc._id,
    name: doc.name,
    type: doc.type,
    status: doc.status
  });
});

module.exports = mongoose.model('Campaign', campaignSchema); 