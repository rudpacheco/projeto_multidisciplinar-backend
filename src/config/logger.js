const winston = require('winston');
const path = require('path');

// Definir formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Criar logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // Arquivo de erros
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    // Arquivo combinado
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    }),
    // Arquivo de auditoria (LGPD)
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/audit.log'),
      level: 'info'
    })
  ]
});

module.exports = logger;
