const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Middleware para validação de dados
 * Processa os resultados das validações do express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      campo: err.path || err.param,
      mensagem: err.msg,
      valor_recebido: err.value
    }));

    logger.warn('Validação falhou:', errorMessages);

    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = validate;
