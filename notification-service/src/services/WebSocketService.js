const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.io = null;
    this.server = null;
    this.connectedUsers = new Map();
    this.userRooms = new Map();
    this.isInitialized = false;
  }

  initialize(httpServer) {
    try {
      // Configurar Socket.IO
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || "*",
          methods: ["GET", "POST"],
          credentials: true
        },
        path: process.env.SOCKET_IO_PATH || '/socket.io',
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6,
        allowEIO3: true
      });

      this.server = httpServer;

      // Configurar middleware de autenticação
      this.io.use(this.authMiddleware.bind(this));

      // Configurar event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      logger.websocket('WebSocket service initialized successfully');
      
      return this.io;
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  async authMiddleware(socket, next) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logger.websocket('WebSocket connection rejected: No token provided', {
          socketId: socket.id,
          ip: socket.handshake.address
        });
        return next(new Error('Authentication error: No token provided'));
      }

      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Adicionar dados do usuário ao socket
      socket.userId = decoded.id || decoded.userId;
      socket.userType = decoded.userType || decoded.role;
      socket.userData = {
        id: socket.userId,
        email: decoded.email,
        name: decoded.name,
        userType: socket.userType
      };

      logger.websocket('WebSocket authentication successful', {
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType
      });

      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', {
        error: error.message,
        socketId: socket.id,
        ip: socket.handshake.address
      });
      next(new Error('Authentication error: Invalid token'));
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Event listeners globais
    this.io.engine.on('connection_error', (err) => {
      logger.error('WebSocket connection error:', err);
    });
  }

  handleConnection(socket) {
    const { userId, userType, userData } = socket;

    logger.websocket('User connected', {
      socketId: socket.id,
      userId,
      userType,
      totalConnections: this.io.engine.clientsCount
    });

    // Armazenar conexão do usuário
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);

    // Juntar o usuário às salas apropriadas
    this.joinUserRooms(socket);

    // Event handlers específicos do socket
    this.setupSocketEventHandlers(socket);

    // Enviar notificações pendentes
    this.sendPendingNotifications(socket);
  }

  setupSocketEventHandlers(socket) {
    const { userId, userType } = socket;

    // Evento de desconexão
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Marcar notificação como lida
    socket.on('notification:read', async (data) => {
      try {
        const { notificationId } = data;
        
        // Emitir confirmação
        socket.emit('notification:read:success', { notificationId });
        
        logger.websocket('Notification marked as read', {
          userId,
          notificationId,
          socketId: socket.id
        });
      } catch (error) {
        logger.error('Error marking notification as read:', error);
        socket.emit('notification:read:error', { error: error.message });
      }
    });

    // Subscrever a notificações de entrega específica
    socket.on('delivery:subscribe', (data) => {
      try {
        const { deliveryId } = data;
        const roomName = `delivery:${deliveryId}`;
        
        socket.join(roomName);
        socket.emit('delivery:subscribed', { deliveryId });
        
        logger.websocket('User subscribed to delivery updates', {
          userId,
          deliveryId,
          socketId: socket.id
        });
      } catch (error) {
        logger.error('Error subscribing to delivery:', error);
        socket.emit('delivery:subscribe:error', { error: error.message });
      }
    });

    // Cancelar subscrição de entrega
    socket.on('delivery:unsubscribe', (data) => {
      try {
        const { deliveryId } = data;
        const roomName = `delivery:${deliveryId}`;
        
        socket.leave(roomName);
        socket.emit('delivery:unsubscribed', { deliveryId });
        
        logger.websocket('User unsubscribed from delivery updates', {
          userId,
          deliveryId,
          socketId: socket.id
        });
      } catch (error) {
        logger.error('Error unsubscribing from delivery:', error);
        socket.emit('delivery:unsubscribe:error', { error: error.message });
      }
    });

    // Ping/Pong para manter conexão ativa
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Solicitar status de conexão
    socket.on('status', () => {
      socket.emit('status', {
        connected: true,
        userId,
        userType,
        rooms: Array.from(socket.rooms),
        timestamp: Date.now()
      });
    });
  }

  handleDisconnection(socket, reason) {
    const { userId, userType } = socket;

    logger.websocket('User disconnected', {
      socketId: socket.id,
      userId,
      userType,
      reason,
      totalConnections: this.io.engine.clientsCount - 1
    });

    // Remover socket do usuário
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      
      // Se não há mais sockets para este usuário, remover da lista
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  joinUserRooms(socket) {
    const { userId, userType } = socket;

    // Sala do usuário específico
    socket.join(`user:${userId}`);

    // Sala por tipo de usuário
    socket.join(`userType:${userType}`);

    // Salas globais
    socket.join('global');

    // Salas específicas por tipo de usuário
    switch (userType) {
      case 'client':
        socket.join('clients');
        break;
      case 'driver':
        socket.join('drivers');
        break;
      case 'operator':
        socket.join('operators');
        break;
      case 'admin':
        socket.join('admins');
        break;
    }

    logger.websocket('User joined rooms', {
      userId,
      userType,
      rooms: Array.from(socket.rooms)
    });
  }

  async sendPendingNotifications(socket) {
    try {
      const { userId } = socket;
      
      // Aqui você buscaria notificações pendentes do banco de dados
      // Por enquanto, vamos emitir um evento de boas-vindas
      socket.emit('notification:welcome', {
        type: 'system',
        title: 'Conectado com sucesso',
        message: 'Você está conectado ao sistema de notificações em tempo real.',
        timestamp: new Date().toISOString()
      });

      logger.websocket('Pending notifications sent', { userId });
    } catch (error) {
      logger.error('Error sending pending notifications:', error);
    }
  }

  // Métodos para enviar notificações
  sendToUser(userId, event, data) {
    try {
      if (!this.isInitialized) {
        logger.warn('WebSocket service not initialized');
        return false;
      }

      const roomName = `user:${userId}`;
      this.io.to(roomName).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.websocket('Notification sent to user', {
        userId,
        event,
        roomName
      });

      return true;
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      return false;
    }
  }

  sendToUserType(userType, event, data) {
    try {
      if (!this.isInitialized) {
        logger.warn('WebSocket service not initialized');
        return false;
      }

      const roomName = `userType:${userType}`;
      this.io.to(roomName).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.websocket('Notification sent to user type', {
        userType,
        event,
        roomName
      });

      return true;
    } catch (error) {
      logger.error('Error sending notification to user type:', error);
      return false;
    }
  }

  sendToDelivery(deliveryId, event, data) {
    try {
      if (!this.isInitialized) {
        logger.warn('WebSocket service not initialized');
        return false;
      }

      const roomName = `delivery:${deliveryId}`;
      this.io.to(roomName).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.websocket('Notification sent to delivery room', {
        deliveryId,
        event,
        roomName
      });

      return true;
    } catch (error) {
      logger.error('Error sending notification to delivery room:', error);
      return false;
    }
  }

  sendToAll(event, data) {
    try {
      if (!this.isInitialized) {
        logger.warn('WebSocket service not initialized');
        return false;
      }

      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.websocket('Notification sent to all users', { event });
      return true;
    } catch (error) {
      logger.error('Error sending notification to all users:', error);
      return false;
    }
  }

  // Métodos de notificação específicos
  sendDeliveryUpdate(deliveryId, userId, updateData) {
    // Enviar para o usuário específico
    this.sendToUser(userId, 'delivery:update', {
      deliveryId,
      ...updateData
    });

    // Enviar para todos que estão seguindo esta entrega
    this.sendToDelivery(deliveryId, 'delivery:update', {
      deliveryId,
      ...updateData
    });
  }

  sendSystemNotification(userType, notificationData) {
    this.sendToUserType(userType, 'notification:system', notificationData);
  }

  sendCampaignNotification(userId, campaignData) {
    this.sendToUser(userId, 'notification:campaign', campaignData);
  }

  sendAlertNotification(userId, alertData) {
    this.sendToUser(userId, 'notification:alert', {
      ...alertData,
      priority: 'high'
    });
  }

  // Métodos de gerenciamento
  getConnectedUsers() {
    const users = [];
    for (const [userId, sockets] of this.connectedUsers) {
      users.push({
        userId,
        socketCount: sockets.size,
        sockets: Array.from(sockets)
      });
    }
    return users;
  }

  getUserSocketCount(userId) {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      totalConnections: this.io?.engine?.clientsCount || 0,
      uniqueUsers: this.connectedUsers.size,
      rooms: this.io?.sockets?.adapter?.rooms?.size || 0
    };
  }

  async disconnectUser(userId, reason = 'Server disconnect') {
    try {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        for (const socketId of userSockets) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
        
        logger.websocket('User disconnected by server', { userId, reason });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error disconnecting user:', error);
      return false;
    }
  }

  async shutdown() {
    try {
      if (this.io) {
        // Notificar todos os clientes sobre o shutdown
        this.sendToAll('server:shutdown', {
          message: 'Servidor será reiniciado em breve. Reconectando automaticamente...'
        });

        // Aguardar um pouco para a mensagem ser enviada
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fechar todas as conexões
        this.io.close();
        
        // Limpar dados
        this.connectedUsers.clear();
        this.userRooms.clear();
        
        logger.websocket('WebSocket service shutdown completed');
      }
    } catch (error) {
      logger.error('Error during WebSocket service shutdown:', error);
    }
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService; 