const jwt = require('jsonwebtoken');

class JWTUtils {
  // Gerar access token
  static generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'logitrack-auth-service',
        audience: 'logitrack-app'
      }
    );
  }

  // Verificar e decodificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'logitrack-auth-service',
        audience: 'logitrack-app'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token ainda não é válido');
      }
      throw new Error('Erro ao verificar token');
    }
  }

  // Decodificar token sem verificar (para debug)
  static decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }

  // Verificar se token está expirado
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Extrair payload do token sem verificar assinatura
  static getTokenPayload(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  // Gerar token com claims customizados
  static generateCustomToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'logitrack-auth-service',
      audience: 'logitrack-app'
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { ...defaultOptions, ...options }
    );
  }

  // Verificar token e retornar payload
  static async validateAndGetPayload(token) {
    try {
      const payload = this.verifyToken(token);
      return {
        valid: true,
        payload,
        error: null
      };
    } catch (error) {
      return {
        valid: false,
        payload: null,
        error: error.message
      };
    }
  }

  // Renovar token (gerar novo com mesmo payload)
  static renewToken(oldToken) {
    try {
      const payload = this.verifyToken(oldToken);
      
      // Remover campos automáticos do JWT
      const { iat, exp, iss, aud, ...userPayload } = payload;
      
      return this.generateAccessToken(userPayload);
    } catch (error) {
      throw new Error('Não foi possível renovar o token: ' + error.message);
    }
  }

  // Extrair informações do usuário do token
  static getUserFromToken(token) {
    try {
      const payload = this.verifyToken(token);
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        user_type: payload.user_type,
        is_active: payload.is_active
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = JWTUtils; 