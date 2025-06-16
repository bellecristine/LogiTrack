const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    try {
      // Garantir que o diretório database existe
      const dbDir = path.dirname(process.env.DB_PATH || './database/auth.db');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = await open({
        filename: process.env.DB_PATH || './database/auth.db',
        driver: sqlite3.Database
      });

      await this.createTables();
      console.log('✅ Banco de dados conectado com sucesso');
      return this.db;
    } catch (error) {
      console.error('❌ Erro ao conectar com o banco de dados:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      // Tabela de usuários
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          user_type TEXT NOT NULL CHECK (user_type IN ('client', 'driver', 'admin')),
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tabela de refresh tokens
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      // Índices para performance
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      `);

      console.log('✅ Tabelas criadas/verificadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error);
      throw error;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Banco de dados não conectado');
    }
    return this.db;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      console.log('✅ Conexão com banco de dados fechada');
    }
  }
}

const database = new Database();

// Função para inicializar o banco de dados
async function initializeDatabase() {
  return await database.connect();
}

module.exports = {
  database,
  initializeDatabase
}; 