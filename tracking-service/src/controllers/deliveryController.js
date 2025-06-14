const Delivery = require('../models/Delivery');
const Location = require('../models/Location');
const geolib = require('geolib');

class DeliveryController {
  // Criar nova entrega
  static async createDelivery(req, res) {
    try {
      const deliveryData = {
        ...req.body,
        client_id: req.user.id,
        tracking_code: Delivery.generateTrackingCode()
      };

      // Calcular distância estimada se tiver coordenadas
      if (deliveryData.pickup_latitude && deliveryData.pickup_longitude &&
          deliveryData.delivery_latitude && deliveryData.delivery_longitude) {
        
        const distance = geolib.getDistance(
          { latitude: deliveryData.pickup_latitude, longitude: deliveryData.pickup_longitude },
          { latitude: deliveryData.delivery_latitude, longitude: deliveryData.delivery_longitude }
        );
        
        deliveryData.estimated_distance_km = distance / 1000; // Converter para km
        
        // Estimar duração baseada na distância (velocidade média de 40 km/h)
        deliveryData.estimated_duration_minutes = Math.round((distance / 1000) / 40 * 60);
      }

      const delivery = await Delivery.create(deliveryData);

      res.status(201).json({
        success: true,
        message: 'Entrega criada com sucesso',
        data: {
          delivery: delivery.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Listar entregas do usuário
  static async listDeliveries(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const { user_type, id: userId } = req.user;

      let result;

      switch (user_type) {
        case 'client':
          result = await Delivery.findByClient(userId, { page, limit, status });
          break;
        case 'driver':
          result = await Delivery.findByDriver(userId, { page, limit, status });
          break;
        case 'admin':
          // Admin pode ver todas as entregas
          const whereClause = { is_active: true };
          if (status) whereClause.status = status;
          
          const offset = (page - 1) * limit;
          const { count, rows } = await Delivery.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
          });
          
          result = {
            deliveries: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
          };
          break;
        default:
          return res.status(403).json({
            success: false,
            message: 'Tipo de usuário não autorizado'
          });
      }

      res.json({
        success: true,
        data: {
          deliveries: result.deliveries.map(delivery => delivery.toJSON()),
          pagination: {
            current_page: result.page,
            total_pages: result.totalPages,
            total_deliveries: result.total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao listar entregas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter entrega por ID
  static async getDeliveryById(req, res) {
    try {
      const { deliveryId } = req.params;
      const delivery = req.delivery; // Vem do middleware requireDeliveryAccess

      // Buscar localização mais recente se a entrega pode ser rastreada
      let currentLocation = null;
      if (delivery.canBeTracked()) {
        currentLocation = await Location.findLatestByDelivery(delivery.id);
      }

      res.json({
        success: true,
        data: {
          delivery: delivery.toJSON(),
          current_location: currentLocation ? currentLocation.toJSON() : null
        }
      });

    } catch (error) {
      console.error('Erro ao obter entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter entrega por código de rastreamento
  static async getDeliveryByTrackingCode(req, res) {
    try {
      const { trackingCode } = req.params;
      const delivery = req.delivery; // Vem do middleware requireDeliveryAccess

      // Buscar localização mais recente se a entrega pode ser rastreada
      let currentLocation = null;
      if (delivery.canBeTracked()) {
        currentLocation = await Location.findLatestByDelivery(delivery.id);
      }

      // Buscar histórico de localizações (últimas 10)
      const locationHistory = await Location.findTrackingHistory(delivery.id, { limit: 10 });

      res.json({
        success: true,
        data: {
          delivery: delivery.toJSON(),
          current_location: currentLocation ? currentLocation.toJSON() : null,
          location_history: locationHistory.locations.map(loc => loc.toJSON())
        }
      });

    } catch (error) {
      console.error('Erro ao obter entrega por código:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar entrega
  static async updateDelivery(req, res) {
    try {
      const delivery = req.delivery; // Vem do middleware requireDeliveryAccess
      const updateData = req.body;
      const { user_type } = req.user;

      // Verificar permissões baseadas no tipo de usuário
      if (user_type === 'client') {
        // Cliente só pode atualizar certas informações e apenas se a entrega estiver pendente
        if (delivery.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: 'Entrega não pode ser modificada neste status'
          });
        }
        
        // Filtrar campos que o cliente pode atualizar
        const allowedFields = ['pickup_address', 'delivery_address', 'pickup_latitude', 
                              'pickup_longitude', 'delivery_latitude', 'delivery_longitude', 
                              'description', 'weight', 'scheduled_pickup_time', 'scheduled_delivery_time'];
        
        Object.keys(updateData).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete updateData[key];
          }
        });
      } else if (user_type === 'driver') {
        // Motorista pode atualizar status e observações
        const allowedFields = ['status', 'notes'];
        
        Object.keys(updateData).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete updateData[key];
          }
        });
      }
      // Admin pode atualizar qualquer campo

      // Recalcular distância se coordenadas foram alteradas
      if ((updateData.pickup_latitude || updateData.pickup_longitude ||
           updateData.delivery_latitude || updateData.delivery_longitude) &&
          delivery.pickup_latitude && delivery.pickup_longitude &&
          delivery.delivery_latitude && delivery.delivery_longitude) {
        
        const newPickupLat = updateData.pickup_latitude || delivery.pickup_latitude;
        const newPickupLng = updateData.pickup_longitude || delivery.pickup_longitude;
        const newDeliveryLat = updateData.delivery_latitude || delivery.delivery_latitude;
        const newDeliveryLng = updateData.delivery_longitude || delivery.delivery_longitude;
        
        const distance = geolib.getDistance(
          { latitude: newPickupLat, longitude: newPickupLng },
          { latitude: newDeliveryLat, longitude: newDeliveryLng }
        );
        
        updateData.estimated_distance_km = distance / 1000;
        updateData.estimated_duration_minutes = Math.round((distance / 1000) / 40 * 60);
      }

      // Atualizar timestamps baseado no status
      if (updateData.status) {
        const now = new Date();
        switch (updateData.status) {
          case 'picked_up':
            updateData.actual_pickup_time = now;
            break;
          case 'delivered':
            updateData.actual_delivery_time = now;
            break;
        }
      }

      const updatedDelivery = await delivery.update(updateData);

      res.json({
        success: true,
        message: 'Entrega atualizada com sucesso',
        data: {
          delivery: updatedDelivery.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atribuir motorista à entrega (apenas admin)
  static async assignDriver(req, res) {
    try {
      const delivery = req.delivery;
      const { driver_id } = req.body;

      if (delivery.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Entrega deve estar pendente para atribuir motorista'
        });
      }

      const updatedDelivery = await delivery.update({
        driver_id,
        status: 'assigned'
      });

      res.json({
        success: true,
        message: 'Motorista atribuído com sucesso',
        data: {
          delivery: updatedDelivery.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao atribuir motorista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cancelar entrega
  static async cancelDelivery(req, res) {
    try {
      const delivery = req.delivery;
      const { notes } = req.body;
      const { user_type } = req.user;

      // Verificar se pode ser cancelada
      if (['delivered', 'cancelled'].includes(delivery.status)) {
        return res.status(400).json({
          success: false,
          message: 'Entrega não pode ser cancelada neste status'
        });
      }

      // Cliente só pode cancelar se estiver pendente ou atribuída
      if (user_type === 'client' && !['pending', 'assigned'].includes(delivery.status)) {
        return res.status(400).json({
          success: false,
          message: 'Entrega não pode mais ser cancelada pelo cliente'
        });
      }

      const updatedDelivery = await delivery.updateStatus('cancelled', notes);

      res.json({
        success: true,
        message: 'Entrega cancelada com sucesso',
        data: {
          delivery: updatedDelivery.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao cancelar entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar entregas próximas
  static async findNearbyDeliveries(req, res) {
    try {
      const { latitude, longitude, radius = 10 } = req.query;

      const nearbyLocations = await Location.findNearbyDeliveries(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius)
      );

      // Buscar informações das entregas
      const deliveryIds = nearbyLocations.map(loc => loc.delivery_id);
      const deliveries = await Delivery.findAll({
        where: {
          id: deliveryIds,
          is_active: true
        }
      });

      // Combinar dados de entrega com localização
      const result = deliveries.map(delivery => {
        const location = nearbyLocations.find(loc => loc.delivery_id === delivery.id);
        return {
          delivery: delivery.toJSON(),
          location: location ? location.toJSON() : null,
          distance_km: location ? geolib.getDistance(
            { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
            { latitude: location.latitude, longitude: location.longitude }
          ) / 1000 : null
        };
      });

      // Ordenar por distância
      result.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

      res.json({
        success: true,
        data: {
          nearby_deliveries: result,
          search_center: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          },
          radius_km: parseFloat(radius),
          total_found: result.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar entregas próximas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter estatísticas de entregas
  static async getDeliveryStats(req, res) {
    try {
      const { user_type, id: userId } = req.user;

      let whereClause = { is_active: true };
      
      // Filtrar por usuário se não for admin
      if (user_type === 'client') {
        whereClause.client_id = userId;
      } else if (user_type === 'driver') {
        whereClause.driver_id = userId;
      }

      const [
        totalDeliveries,
        pendingDeliveries,
        assignedDeliveries,
        inTransitDeliveries,
        deliveredDeliveries,
        cancelledDeliveries
      ] = await Promise.all([
        Delivery.count({ where: whereClause }),
        Delivery.count({ where: { ...whereClause, status: 'pending' } }),
        Delivery.count({ where: { ...whereClause, status: 'assigned' } }),
        Delivery.count({ where: { ...whereClause, status: 'in_transit' } }),
        Delivery.count({ where: { ...whereClause, status: 'delivered' } }),
        Delivery.count({ where: { ...whereClause, status: 'cancelled' } })
      ]);

      res.json({
        success: true,
        data: {
          total_deliveries: totalDeliveries,
          by_status: {
            pending: pendingDeliveries,
            assigned: assignedDeliveries,
            in_transit: inTransitDeliveries,
            delivered: deliveredDeliveries,
            cancelled: cancelledDeliveries
          },
          completion_rate: totalDeliveries > 0 ? 
            Math.round((deliveredDeliveries / totalDeliveries) * 100) : 0
        }
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = DeliveryController; 