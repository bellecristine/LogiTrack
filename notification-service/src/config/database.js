const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners para monitoramento
    mongoose.connection.on('error', (err) => {
      logger.error('Erro de conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado');
    });

    return conn;
  } catch (error) {
    logger.error('Erro ao conectar com MongoDB:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Conexão MongoDB fechada');
  } catch (error) {
    logger.error('Erro ao fechar conexão MongoDB:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB
}; 