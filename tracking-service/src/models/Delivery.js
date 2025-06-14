const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Identificação da entrega
  tracking_code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 50]
    }
  },
  
  // IDs dos usuários (referências para o auth-service)
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1
    }
  },
  
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: true,
      min: 1
    }
  },
  
  // Status da entrega
  status: {
    type: DataTypes.ENUM(
      'pending',      // Pendente
      'assigned',     // Atribuída a motorista
      'picked_up',    // Coletada
      'in_transit',   // Em trânsito
      'delivered',    // Entregue
      'cancelled'     // Cancelada
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  
  // Informações da entrega
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  // Endereços
  pickup_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  pickup_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  
  pickup_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  delivery_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  
  delivery_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  
  // Timestamps importantes
  scheduled_pickup_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  scheduled_delivery_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  actual_pickup_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  actual_delivery_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Estimativas
  estimated_distance_km: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  estimated_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  // Observações
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Metadados
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'deliveries',
  indexes: [
    {
      fields: ['tracking_code']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['driver_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['pickup_latitude', 'pickup_longitude']
    },
    {
      fields: ['delivery_latitude', 'delivery_longitude']
    }
  ]
});

// Métodos de instância
Delivery.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Converter coordenadas para números
  if (values.pickup_latitude) values.pickup_latitude = parseFloat(values.pickup_latitude);
  if (values.pickup_longitude) values.pickup_longitude = parseFloat(values.pickup_longitude);
  if (values.delivery_latitude) values.delivery_latitude = parseFloat(values.delivery_latitude);
  if (values.delivery_longitude) values.delivery_longitude = parseFloat(values.delivery_longitude);
  if (values.weight) values.weight = parseFloat(values.weight);
  if (values.estimated_distance_km) values.estimated_distance_km = parseFloat(values.estimated_distance_km);
  
  return values;
};

// Método para atualizar status
Delivery.prototype.updateStatus = async function(newStatus, notes = null) {
  const now = new Date();
  
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  // Atualizar timestamps baseado no status
  switch (newStatus) {
    case 'picked_up':
      this.actual_pickup_time = now;
      break;
    case 'delivered':
      this.actual_delivery_time = now;
      break;
  }
  
  await this.save();
  return this;
};

// Método para verificar se pode ser rastreada
Delivery.prototype.canBeTracked = function() {
  return ['assigned', 'picked_up', 'in_transit'].includes(this.status) && this.driver_id;
};

// Métodos estáticos
Delivery.findByTrackingCode = async function(trackingCode) {
  return await this.findOne({
    where: { tracking_code: trackingCode, is_active: true }
  });
};

Delivery.findByClient = async function(clientId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const offset = (page - 1) * limit;
  
  const whereClause = { client_id: clientId, is_active: true };
  if (status) whereClause.status = status;
  
  const { count, rows } = await this.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  return {
    deliveries: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
};

Delivery.findByDriver = async function(driverId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const offset = (page - 1) * limit;
  
  const whereClause = { driver_id: driverId, is_active: true };
  if (status) whereClause.status = status;
  
  const { count, rows } = await this.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  return {
    deliveries: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
};

// Gerar código de rastreamento único
Delivery.generateTrackingCode = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `LT${timestamp}${random}`.toUpperCase();
};

module.exports = Delivery; 