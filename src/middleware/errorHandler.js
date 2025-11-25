const logger = require('../config/logger');

/**
 * Middleware global de tratamento de erros
 * Deve ser o último middleware registrado
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error('Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.email
  });

  // Erro de validação do Postgres
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado',
      error: 'Este registro já existe no sistema'
    });
  }

  // Erro de chave estrangeira
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referência inválida',
      error: 'O registro referenciado não existe'
    });
  }

  // Erro de formato inválido
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Formato de dados inválido',
      error: 'Um ou mais campos estão com formato incorreto'
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Erro interno do servidor' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rotas não encontradas
 */
const notFound = (req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  notFound
};
