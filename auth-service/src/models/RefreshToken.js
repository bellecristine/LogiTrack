const crypto = require('crypto');
const database = require('../config/database');

class RefreshToken {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.token = data.token;
    this.expires_at = data.expires_at;
    this.created_at = data.created_at;
  }

  // Criar novo refresh token
  static async create(userId) {
    try {
      const db = database.getDb();
      
      // Gerar token único
      const token = crypto.randomBytes(64).toString('hex');
      
      // Calcular data de expiração (7 dias por padrão)
      const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      const expiresAt = new Date();
      
      // Converter string de tempo para milliseconds
      const timeValue = parseInt(expiresIn.slice(0, -1));
      const timeUnit = expiresIn.slice(-1);
      
      switch (timeUnit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + timeValue);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + timeValue);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + timeValue);
          break;
        default:
          expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 dias
      }

      const result = await db.run(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) 
         VALUES (?, ?, ?)`,
        [userId, token, expiresAt.toISOString()]
      );

      return await RefreshToken.findById(result.lastID);
    } catch (error) {
      throw error;
    }
  }

  // Buscar refresh token por ID
  static async findById(id) {
    try {
      const db = database.getDb();
      const token = await db.get('SELECT * FROM refresh_tokens WHERE id = ?', [id]);
      return token ? new RefreshToken(token) : null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar refresh token por token
  static async findByToken(token) {
    try {
      const db = database.getDb();
      const refreshToken = await db.get('SELECT * FROM refresh_tokens WHERE token = ?', [token]);
      return refreshToken ? new RefreshToken(refreshToken) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verificar se o token é válido
  isValid() {
    const now = new Date();
    const expiresAt = new Date(this.expires_at);
    return now < expiresAt;
  }

  // Revogar token (deletar)
  async revoke() {
    try {
      const db = database.getDb();
      await db.run('DELETE FROM refresh_tokens WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Revogar todos os tokens de um usuário
  static async revokeAllByUserId(userId) {
    try {
      const db = database.getDb();
      const result = await db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
      return result.changes;
    } catch (error) {
      throw error;
    }
  }

  // Limpar tokens expirados
  static async cleanExpired() {
    try {
      const db = database.getDb();
      const now = new Date().toISOString();
      const result = await db.run('DELETE FROM refresh_tokens WHERE expires_at < ?', [now]);
      return result.changes;
    } catch (error) {
      throw error;
    }
  }

  // Buscar tokens de um usuário
  static async findByUserId(userId) {
    try {
      const db = database.getDb();
      const tokens = await db.all('SELECT * FROM refresh_tokens WHERE user_id = ?', [userId]);
      return tokens.map(token => new RefreshToken(token));
    } catch (error) {
      throw error;
    }
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      token: this.token,
      expires_at: this.expires_at,
      created_at: this.created_at,
      is_valid: this.isValid()
    };
  }
}

module.exports = RefreshToken; 