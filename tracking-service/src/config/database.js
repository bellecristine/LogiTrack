const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

// Configuração do banco de dados
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'logitrack_tracking',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: {
    // Configurações específicas do PostgreSQL
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');

    // Verificar se a extensão PostGIS está disponível
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('✅ Extensão PostGIS habilitada');
    } catch (error) {
      console.warn('⚠️  PostGIS não disponível, funcionalidades geoespaciais limitadas:', error.message);
    }

    // Sincronizar modelos (criar tabelas se não existirem)
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false 
    });
    console.log('✅ Modelos sincronizados com o banco de dados');

    return sequelize;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    throw error;
  }
}

// Função para fechar conexão
async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('✅ Conexão com o banco de dados fechada');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
  }
}

// Função para verificar saúde do banco
async function checkDatabaseHealth() {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      message: 'Banco de dados conectado',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  sequelize,
  initializeDatabase,
  closeDatabase,
  checkDatabaseHealth
}; 