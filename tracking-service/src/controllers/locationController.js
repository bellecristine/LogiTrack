const Location = require('../models/Location');
const Delivery = require('../models/Delivery');
const geolib = require('geolib');

class LocationController {
  // Atualizar localização (motoristas)
  static async updateLocation(req, res) {
    try {
      const { deliveryId } = req.params;
      const { id: driverId } = req.user;
      const locationData = {
        ...req.body,
        delivery_id: deliveryId,
        driver_id: driverId,
        location_timestamp: req.body.location_timestamp || new Date()
      };

      // Verificar se a entrega existe e pertence ao motorista
      const delivery = await Delivery.findOne({
        where: {
          id: deliveryId,
          driver_id: driverId,
          is_active: true
        }
      });

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Entrega não encontrada ou não atribuída a você'
        });
      }

      // Verificar se a entrega pode ser rastreada
      if (!delivery.canBeTracked()) {
        return res.status(400).json({
          success: false,
          message: 'Esta entrega não pode ser rastreada no momento'
        });
      }

      // Criar nova localização
      const location = await Location.create(locationData);

      // Atualizar status da entrega se necessário
      if (req.body.update_type === 'pickup' && delivery.status === 'assigned') {
        await delivery.updateStatus('picked_up');
      } else if (req.body.update_type === 'delivery' && delivery.status === 'in_transit') {
        await delivery.updateStatus('delivered');
      } else if (delivery.status === 'assigned' || delivery.status === 'picked_up') {
        // Atualizar para em trânsito se ainda não estiver
        if (delivery.status !== 'in_transit') {
          await delivery.updateStatus('in_transit');
        }
      }

      res.status(201).json({
        success: true,
        message: 'Localização atualizada com sucesso',
        data: {
          location: location.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter localização atual de uma entrega
  static async getCurrentLocation(req, res) {
    try {
      const { deliveryId } = req.params;
      const delivery = req.delivery; // Vem do middleware requireDeliveryAccess

      if (!delivery.canBeTracked()) {
        return res.status(400).json({
          success: false,
          message: 'Esta entrega não pode ser rastreada no momento'
        });
      }

      const currentLocation = await Location.findLatestByDelivery(deliveryId);

      if (!currentLocation) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma localização encontrada para esta entrega'
        });
      }

      // Calcular distâncias se tiver coordenadas de destino
      let distanceToPickup = null;
      let distanceToDelivery = null;

      if (delivery.pickup_latitude && delivery.pickup_longitude) {
        distanceToPickup = currentLocation.distanceTo(
          delivery.pickup_latitude,
          delivery.pickup_longitude
        );
      }

      if (delivery.delivery_latitude && delivery.delivery_longitude) {
        distanceToDelivery = currentLocation.distanceTo(
          delivery.delivery_latitude,
          delivery.delivery_longitude
        );
      }

      res.json({
        success: true,
        data: {
          location: currentLocation.toJSON(),
          delivery_info: {
            id: delivery.id,
            tracking_code: delivery.tracking_code,
            status: delivery.status
          },
          distances: {
            to_pickup_meters: distanceToPickup,
            to_delivery_meters: distanceToDelivery
          },
          is_recent: currentLocation.isRecent()
        }
      });

    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter histórico de localizações
  static async getLocationHistory(req, res) {
    try {
      const { deliveryId } = req.params;
      const { page = 1, limit = 50, start_date, end_date } = req.query;
      const delivery = req.delivery; // Vem do middleware requireDeliveryAccess

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (start_date && end_date) {
        options.startDate = new Date(start_date);
        options.endDate = new Date(end_date);
      }

      const result = await Location.findTrackingHistory(deliveryId, options);

      // Calcular estatísticas da rota se houver localizações
      let routeStats = null;
      if (result.locations.length > 0) {
        routeStats = await Location.getRouteStats(deliveryId);
      }

      res.json({
        success: true,
        data: {
          locations: result.locations.map(loc => loc.toJSON()),
          route_stats: routeStats,
          pagination: {
            current_page: result.page,
            total_pages: result.totalPages,
            total_locations: result.total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao obter histórico de localizações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter localização atual do motorista (todas as entregas ativas)
  static async getDriverCurrentLocation(req, res) {
    try {
      const { id: driverId } = req.user;

      const currentLocation = await Location.findLatestByDriver(driverId);

      if (!currentLocation) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma localização encontrada'
        });
      }

      // Buscar entrega associada
      const delivery = await Delivery.findByPk(currentLocation.delivery_id);

      res.json({
        success: true,
        data: {
          location: currentLocation.toJSON(),
          delivery_info: delivery ? {
            id: delivery.id,
            tracking_code: delivery.tracking_code,
            status: delivery.status,
            pickup_address: delivery.pickup_address,
            delivery_address: delivery.delivery_address
          } : null,
          is_recent: currentLocation.isRecent()
        }
      });

    } catch (error) {
      console.error('Erro ao obter localização do motorista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualização em lote de localizações (para sincronização offline)
  static async batchUpdateLocations(req, res) {
    try {
      const { deliveryId } = req.params;
      const { id: driverId } = req.user;
      const { locations } = req.body;

      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Array de localizações é obrigatório'
        });
      }

      if (locations.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Máximo de 100 localizações por lote'
        });
      }

      // Verificar se a entrega existe e pertence ao motorista
      const delivery = await Delivery.findOne({
        where: {
          id: deliveryId,
          driver_id: driverId,
          is_active: true
        }
      });

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Entrega não encontrada ou não atribuída a você'
        });
      }

      // Preparar dados das localizações
      const locationData = locations.map(loc => ({
        ...loc,
        delivery_id: deliveryId,
        driver_id: driverId,
        location_timestamp: loc.location_timestamp || new Date()
      }));

      // Criar localizações em lote
      const createdLocations = await Location.bulkCreate(locationData, {
        validate: true,
        returning: true
      });

      // Atualizar status da entrega se necessário
      const hasPickupUpdate = locations.some(loc => loc.update_type === 'pickup');
      const hasDeliveryUpdate = locations.some(loc => loc.update_type === 'delivery');

      if (hasPickupUpdate && delivery.status === 'assigned') {
        await delivery.updateStatus('picked_up');
      } else if (hasDeliveryUpdate && delivery.status === 'in_transit') {
        await delivery.updateStatus('delivered');
      } else if (delivery.status === 'assigned') {
        await delivery.updateStatus('in_transit');
      }

      res.status(201).json({
        success: true,
        message: `${createdLocations.length} localizações atualizadas com sucesso`,
        data: {
          locations: createdLocations.map(loc => loc.toJSON()),
          total_created: createdLocations.length
        }
      });

    } catch (error) {
      console.error('Erro na atualização em lote:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar entregas próximas à localização atual do motorista
  static async findNearbyDeliveries(req, res) {
    try {
      const { id: driverId } = req.user;
      const { radius = 10 } = req.query;

      // Obter localização atual do motorista
      const currentLocation = await Location.findLatestByDriver(driverId);

      if (!currentLocation) {
        return res.status(404).json({
          success: false,
          message: 'Localização atual não encontrada'
        });
      }

      // Buscar entregas próximas
      const nearbyLocations = await Location.findNearbyDeliveries(
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(radius)
      );

      // Buscar informações das entregas
      const deliveryIds = nearbyLocations.map(loc => loc.delivery_id);
      const deliveries = await Delivery.findAll({
        where: {
          id: deliveryIds,
          is_active: true,
          status: ['assigned', 'picked_up', 'in_transit'] // Apenas entregas ativas
        }
      });

      // Combinar dados
      const result = deliveries.map(delivery => {
        const location = nearbyLocations.find(loc => loc.delivery_id === delivery.id);
        const distance = location ? geolib.getDistance(
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { latitude: location.latitude, longitude: location.longitude }
        ) : null;

        return {
          delivery: delivery.toJSON(),
          location: location ? location.toJSON() : null,
          distance_meters: distance,
          distance_km: distance ? Math.round(distance / 100) / 10 : null
        };
      });

      // Ordenar por distância
      result.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));

      res.json({
        success: true,
        data: {
          driver_location: currentLocation.toJSON(),
          nearby_deliveries: result,
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

  // Marcar checkpoint importante
  static async markCheckpoint(req, res) {
    try {
      const { deliveryId } = req.params;
      const { id: driverId } = req.user;
      const { latitude, longitude, notes } = req.body;

      // Verificar se a entrega existe e pertence ao motorista
      const delivery = await Delivery.findOne({
        where: {
          id: deliveryId,
          driver_id: driverId,
          is_active: true
        }
      });

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Entrega não encontrada ou não atribuída a você'
        });
      }

      // Criar checkpoint
      const checkpoint = await Location.create({
        delivery_id: deliveryId,
        driver_id: driverId,
        latitude,
        longitude,
        update_type: 'checkpoint',
        notes,
        location_timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Checkpoint marcado com sucesso',
        data: {
          checkpoint: checkpoint.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao marcar checkpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = LocationController; 