const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e anexa os dados do usuário à requisição
 */
const authenticate = (req, res, next) => {
  try {
    // Buscar token no header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }

    const token = parts[1];

    // Verificar e decodificar o token
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn(`Tentativa de acesso com token inválido: ${err.message}`);
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }

      // Anexar dados do usuário à requisição
      req.user = {
        id: decoded.id,
        email: decoded.email,
        tipo: decoded.tipo,
        nome: decoded.nome
      };

      logger.debug(`Usuário autenticado: ${decoded.email} (${decoded.tipo})`);
      next();
    });

  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar autenticação'
    });
  }
};

module.exports = authenticate;
