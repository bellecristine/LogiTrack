const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const JWTUtils = require('../utils/jwt');

class AuthController {
  // Registrar novo usuário
  static async register(req, res) {
    try {
      const { email, password, name, user_type } = req.body;

      // Verificar se o email já existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }

      // Criar novo usuário
      const user = await User.create({
        email,
        password,
        name,
        user_type
      });

      // Gerar tokens
      const accessToken = JWTUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        is_active: user.is_active
      });

      const refreshToken = await RefreshToken.create(user.id);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: user.toJSON(),
          access_token: accessToken,
          refresh_token: refreshToken.token,
          token_type: 'Bearer',
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Login de usuário
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuário por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se o usuário está ativo
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Conta desativada. Entre em contato com o suporte.'
        });
      }

      // Verificar senha
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Revogar tokens antigos (opcional - para maior segurança)
      await RefreshToken.revokeAllByUserId(user.id);

      // Gerar novos tokens
      const accessToken = JWTUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        is_active: user.is_active
      });

      const refreshToken = await RefreshToken.create(user.id);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: user.toJSON(),
          access_token: accessToken,
          refresh_token: refreshToken.token,
          token_type: 'Bearer',
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Renovar token usando refresh token
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      // Buscar refresh token
      const refreshTokenObj = await RefreshToken.findByToken(refresh_token);
      if (!refreshTokenObj) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido'
        });
      }

      // Verificar se o token ainda é válido
      if (!refreshTokenObj.isValid()) {
        await refreshTokenObj.revoke();
        return res.status(401).json({
          success: false,
          message: 'Refresh token expirado'
        });
      }

      // Buscar usuário
      const user = await User.findById(refreshTokenObj.user_id);
      if (!user || !user.is_active) {
        await refreshTokenObj.revoke();
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo'
        });
      }

      // Gerar novo access token
      const accessToken = JWTUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        is_active: user.is_active
      });

      // Opcionalmente, gerar novo refresh token
      const newRefreshToken = await RefreshToken.create(user.id);
      await refreshTokenObj.revoke(); // Revogar o token antigo

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          access_token: accessToken,
          refresh_token: newRefreshToken.token,
          token_type: 'Bearer',
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Erro na renovação do token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Logout (revogar tokens)
  static async logout(req, res) {
    try {
      const userId = req.user.id;

      // Revogar todos os refresh tokens do usuário
      await RefreshToken.revokeAllByUserId(userId);

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Validar token JWT
  static async validateToken(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      const validation = await JWTUtils.validateAndGetPayload(token);

      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          message: validation.error
        });
      }

      // Verificar se o usuário ainda existe e está ativo
      const user = await User.findById(validation.payload.id);
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo'
        });
      }

      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: user.toJSON(),
          token_info: {
            issued_at: new Date(validation.payload.iat * 1000),
            expires_at: new Date(validation.payload.exp * 1000),
            issuer: validation.payload.iss,
            audience: validation.payload.aud
          }
        }
      });

    } catch (error) {
      console.error('Erro na validação do token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter informações do usuário atual
  static async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
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
      console.error('Erro ao obter informações do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AuthController; 