const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Referência para a entrega
  delivery_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1
    }
  },
  
  // ID do motorista
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1
    }
  },
  
  // Coordenadas geográficas
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90,
      notNull: {
        msg: 'Latitude é obrigatória'
      }
    }
  },
  
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180,
      notNull: {
        msg: 'Longitude é obrigatória'
      }
    }
  },
  
  // Precisão da localização (em metros)
  accuracy: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  // Altitude (em metros)
  altitude: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  
  // Velocidade (km/h)
  speed: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 300 // Limite razoável para veículos
    }
  },
  
  // Direção (graus, 0-360)
  heading: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 360
    }
  },
  
  // Timestamp da localização (pode ser diferente do created_at)
  location_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // Tipo de atualização
  update_type: {
    type: DataTypes.ENUM(
      'automatic',    // Atualização automática
      'manual',       // Atualização manual
      'checkpoint',   // Checkpoint importante
      'pickup',       // Coleta
      'delivery'      // Entrega
    ),
    defaultValue: 'automatic'
  },
  
  // Endereço aproximado (geocoding reverso)
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Observações
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Metadados do dispositivo
  device_info: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  
  // Status da localização
  is_valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'locations',
  indexes: [
    {
      fields: ['delivery_id']
    },
    {
      fields: ['driver_id']
    },
    {
      fields: ['location_timestamp']
    },
    {
      fields: ['latitude', 'longitude']
    },
    {
      fields: ['delivery_id', 'location_timestamp']
    },
    {
      fields: ['driver_id', 'location_timestamp']
    },
    {
      fields: ['update_type']
    }
  ]
});

// Métodos de instância
Location.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Converter coordenadas para números
  if (values.latitude) values.latitude = parseFloat(values.latitude);
  if (values.longitude) values.longitude = parseFloat(values.longitude);
  if (values.accuracy) values.accuracy = parseFloat(values.accuracy);
  if (values.altitude) values.altitude = parseFloat(values.altitude);
  if (values.speed) values.speed = parseFloat(values.speed);
  if (values.heading) values.heading = parseFloat(values.heading);
  
  return values;
};

// Método para calcular distância até um ponto
Location.prototype.distanceTo = function(targetLat, targetLng) {
  const geolib = require('geolib');
  
  return geolib.getDistance(
    { latitude: this.latitude, longitude: this.longitude },
    { latitude: targetLat, longitude: targetLng }
  );
};

// Método para verificar se a localização é recente
Location.prototype.isRecent = function(maxAgeMinutes = 30) {
  const now = new Date();
  const locationTime = new Date(this.location_timestamp);
  const diffMinutes = (now - locationTime) / (1000 * 60);
  
  return diffMinutes <= maxAgeMinutes;
};

// Métodos estáticos
Location.findLatestByDelivery = async function(deliveryId) {
  return await this.findOne({
    where: { 
      delivery_id: deliveryId,
      is_valid: true 
    },
    order: [['location_timestamp', 'DESC']]
  });
};

Location.findLatestByDriver = async function(driverId) {
  return await this.findOne({
    where: { 
      driver_id: driverId,
      is_valid: true 
    },
    order: [['location_timestamp', 'DESC']]
  });
};

Location.findTrackingHistory = async function(deliveryId, options = {}) {
  const { page = 1, limit = 50, startDate, endDate } = options;
  const offset = (page - 1) * limit;
  
  const whereClause = { 
    delivery_id: deliveryId,
    is_valid: true 
  };
  
  if (startDate && endDate) {
    whereClause.location_timestamp = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  const { count, rows } = await this.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['location_timestamp', 'DESC']]
  });
  
  return {
    locations: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
};

// Buscar entregas próximas a uma localização
Location.findNearbyDeliveries = async function(latitude, longitude, radiusKm = 10) {
  const geolib = require('geolib');
  
  // Buscar localizações recentes (últimas 2 horas)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const recentLocations = await this.findAll({
    where: {
      location_timestamp: {
        [sequelize.Sequelize.Op.gte]: twoHoursAgo
      },
      is_valid: true
    },
    order: [['location_timestamp', 'DESC']]
  });
  
  // Filtrar por distância
  const nearbyLocations = recentLocations.filter(location => {
    const distance = geolib.getDistance(
      { latitude, longitude },
      { latitude: location.latitude, longitude: location.longitude }
    );
    
    return distance <= (radiusKm * 1000); // Converter km para metros
  });
  
  // Agrupar por delivery_id para pegar apenas a mais recente de cada entrega
  const deliveryMap = new Map();
  nearbyLocations.forEach(location => {
    const deliveryId = location.delivery_id;
    if (!deliveryMap.has(deliveryId) || 
        location.location_timestamp > deliveryMap.get(deliveryId).location_timestamp) {
      deliveryMap.set(deliveryId, location);
    }
  });
  
  return Array.from(deliveryMap.values());
};

// Calcular estatísticas de uma rota
Location.getRouteStats = async function(deliveryId) {
  const locations = await this.findAll({
    where: { 
      delivery_id: deliveryId,
      is_valid: true 
    },
    order: [['location_timestamp', 'ASC']]
  });
  
  if (locations.length < 2) {
    return {
      total_distance: 0,
      total_duration: 0,
      average_speed: 0,
      max_speed: 0,
      points_count: locations.length
    };
  }
  
  const geolib = require('geolib');
  let totalDistance = 0;
  let maxSpeed = 0;
  
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    
    // Calcular distância entre pontos
    const distance = geolib.getDistance(
      { latitude: prev.latitude, longitude: prev.longitude },
      { latitude: curr.latitude, longitude: curr.longitude }
    );
    
    totalDistance += distance;
    
    // Verificar velocidade máxima
    if (curr.speed && curr.speed > maxSpeed) {
      maxSpeed = curr.speed;
    }
  }
  
  const startTime = new Date(locations[0].location_timestamp);
  const endTime = new Date(locations[locations.length - 1].location_timestamp);
  const totalDuration = (endTime - startTime) / 1000; // em segundos
  
  const averageSpeed = totalDuration > 0 ? 
    (totalDistance / 1000) / (totalDuration / 3600) : 0; // km/h
  
  return {
    total_distance: Math.round(totalDistance), // metros
    total_duration: Math.round(totalDuration), // segundos
    average_speed: Math.round(averageSpeed * 100) / 100, // km/h
    max_speed: Math.round(maxSpeed * 100) / 100, // km/h
    points_count: locations.length
  };
};

module.exports = Location; 