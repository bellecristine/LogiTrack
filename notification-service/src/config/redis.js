const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 60000,
        commandTimeout: 5000,
      };

      // Adicionar senha se configurada
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      this.connection = new Redis(redisConfig);

      // Event listeners
      this.connection.on('connect', () => {
        logger.info('Conectando ao Redis...');
      });

      this.connection.on('ready', () => {
        this.isConnected = true;
        logger.info(`Redis conectado: ${redisConfig.host}:${redisConfig.port}`);
      });

      this.connection.on('error', (err) => {
        this.isConnected = false;
        logger.error('Erro de conexão Redis:', err);
      });

      this.connection.on('close', () => {
        this.isConnected = false;
        logger.warn('Conexão Redis fechada');
      });

      this.connection.on('reconnecting', () => {
        logger.info('Reconectando ao Redis...');
      });

      // Conectar
      await this.connection.connect();
      
      return this.connection;
    } catch (error) {
      logger.error('Erro ao conectar com Redis:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.connection || !this.isConnected) {
      throw new Error('Redis não está conectado');
    }
    return this.connection;
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.quit();
        logger.info('Conexão Redis fechada');
      }
    } catch (error) {
      logger.error('Erro ao fechar conexão Redis:', error);
    }
  }

  async healthCheck() {
    try {
      if (!this.connection) {
        return false;
      }
      
      const result = await this.connection.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Health check Redis falhou:', error);
      return false;
    }
  }
}

// Singleton instance
const redisConnection = new RedisConnection();

module.exports = {
  redisConnection,
  createRedisConnection: () => redisConnection.connect(),
  getRedisConnection: () => redisConnection.getConnection(),
  disconnectRedis: () => redisConnection.disconnect(),
  redisHealthCheck: () => redisConnection.healthCheck()
}; 