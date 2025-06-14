const bcrypt = require('bcryptjs');
const database = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.user_type = data.user_type;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Criar novo usuário
  static async create(userData) {
    try {
      const db = database.getDb();
      
      // Hash da senha
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const result = await db.run(
        `INSERT INTO users (email, password, name, user_type) 
         VALUES (?, ?, ?, ?)`,
        [userData.email, hashedPassword, userData.name, userData.user_type]
      );

      return await User.findById(result.lastID);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    try {
      const db = database.getDb();
      const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
      return user ? new User(user) : null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const db = database.getDb();
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      return user ? new User(user) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verificar senha
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Atualizar usuário
  async update(updateData) {
    try {
      const db = database.getDb();
      
      const fields = [];
      const values = [];
      
      if (updateData.name) {
        fields.push('name = ?');
        values.push(updateData.name);
      }
      
      if (updateData.email) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      
      if (updateData.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(updateData.password, saltRounds);
        fields.push('password = ?');
        values.push(hashedPassword);
      }
      
      if (updateData.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(updateData.is_active);
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.id);

      await db.run(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await User.findById(this.id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  // Desativar usuário
  async deactivate() {
    return await this.update({ is_active: false });
  }

  // Ativar usuário
  async activate() {
    return await this.update({ is_active: true });
  }

  // Listar usuários com paginação
  static async findAll(options = {}) {
    try {
      const db = database.getDb();
      const { page = 1, limit = 10, user_type, is_active } = options;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const whereParams = [];

      if (user_type) {
        whereClause += 'WHERE user_type = ?';
        whereParams.push(user_type);
      }

      if (is_active !== undefined) {
        whereClause += whereClause ? ' AND is_active = ?' : 'WHERE is_active = ?';
        whereParams.push(is_active);
      }

      const users = await db.all(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...whereParams, limit, offset]
      );

      const total = await db.get(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        whereParams
      );

      return {
        users: users.map(user => new User(user)),
        total: total.count,
        page,
        totalPages: Math.ceil(total.count / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Converter para JSON (sem senha)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User; 