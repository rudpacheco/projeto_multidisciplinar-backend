const logger = require('../config/logger');

/**
 * Middleware de autorização por perfil de usuário
 * Verifica se o usuário tem um dos perfis permitidos
 * 
 * @param {Array} tiposPermitidos - Array com os tipos de usuário permitidos
 * @returns {Function} Middleware de autorização
 */
const authorize = (...tiposPermitidos) => {
  return (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Verificar se o tipo do usuário está na lista permitida
      if (!tiposPermitidos.includes(req.user.tipo)) {
        logger.warn(`Acesso negado para ${req.user.email} (${req.user.tipo}) ao tentar acessar recurso que requer: ${tiposPermitidos.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para acessar este recurso',
          perfil_requerido: tiposPermitidos,
          seu_perfil: req.user.tipo
        });
      }

      logger.debug(`Autorização concedida para ${req.user.email} (${req.user.tipo})`);
      next();

    } catch (error) {
      logger.error('Erro no middleware de autorização:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar autorização'
      });
    }
  };
};

module.exports = authorize;
