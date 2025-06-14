const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

class UserController {
  // Listar usuários (apenas admin)
  static async listUsers(req, res) {
    try {
      const { page = 1, limit = 10, user_type, is_active } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_type,
        is_active: is_active !== undefined ? is_active === 'true' : undefined
      };

      const result = await User.findAll(options);

      res.json({
        success: true,
        data: {
          users: result.users.map(user => user.toJSON()),
          pagination: {
            current_page: result.page,
            total_pages: result.totalPages,
            total_users: result.total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter usuário por ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar usuário
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await User.findById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se o email já está em uso por outro usuário
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(409).json({
            success: false,
            message: 'Email já está em uso por outro usuário'
          });
        }
      }

      const updatedUser = await user.update(updateData);

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: {
          user: updatedUser.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Alterar senha
  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await user.verifyPassword(current_password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      await user.update({ password: new_password });

      // Revogar todos os refresh tokens para forçar novo login
      await RefreshToken.revokeAllByUserId(userId);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso. Faça login novamente.'
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Desativar usuário
  static async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (!user.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Usuário já está desativado'
        });
      }

      const updatedUser = await user.deactivate();

      // Revogar todos os refresh tokens do usuário
      await RefreshToken.revokeAllByUserId(user.id);

      res.json({
        success: true,
        message: 'Usuário desativado com sucesso',
        data: {
          user: updatedUser.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Ativar usuário
  static async activateUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (user.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Usuário já está ativo'
        });
      }

      const updatedUser = await user.activate();

      res.json({
        success: true,
        message: 'Usuário ativado com sucesso',
        data: {
          user: updatedUser.toJSON()
        }
      });

    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter estatísticas de usuários (apenas admin)
  static async getUserStats(req, res) {
    try {
      const [totalUsers, activeUsers, clientUsers, driverUsers, adminUsers] = await Promise.all([
        User.findAll({ limit: 1 }),
        User.findAll({ is_active: true, limit: 1 }),
        User.findAll({ user_type: 'client', limit: 1 }),
        User.findAll({ user_type: 'driver', limit: 1 }),
        User.findAll({ user_type: 'admin', limit: 1 })
      ]);

      res.json({
        success: true,
        data: {
          total_users: totalUsers.total,
          active_users: activeUsers.total,
          inactive_users: totalUsers.total - activeUsers.total,
          users_by_type: {
            clients: clientUsers.total,
            drivers: driverUsers.total,
            admins: adminUsers.total
          }
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

  // Limpar tokens expirados (tarefa de manutenção)
  static async cleanupExpiredTokens(req, res) {
    try {
      const deletedCount = await RefreshToken.cleanExpired();

      res.json({
        success: true,
        message: `${deletedCount} tokens expirados foram removidos`,
        data: {
          deleted_tokens: deletedCount
        }
      });

    } catch (error) {
      console.error('Erro ao limpar tokens expirados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UserController; 