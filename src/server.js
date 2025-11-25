const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const consultaRoutes = require('./routes/consultaRoutes');

const app = express();

// ==========================================
// MIDDLEWARES DE SEGURANÇA
// ==========================================
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// ==========================================
// MIDDLEWARES DE PARSING
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// LOGGING
// ==========================================
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// ==========================================
// ROTAS
// ==========================================

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env
  });
});

// Rota raiz - Servir página HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota de informações da API (JSON)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SGHSS - Sistema de Gestão Hospitalar e de Serviços de Saúde - VidaPlus',
    version: '1.0.0',
    documentation: '/docs/DOCUMENTACAO_API.md',
    endpoints: {
      auth: '/api/auth',
      pacientes: '/api/pacientes',
      consultas: '/api/consultas'
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/consultas', consultaRoutes);

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`🌍 Ambiente: ${config.server.env}`);
  logger.info(`📊 Health check disponível em: http://localhost:${PORT}/health`);
  console.log(`\n✅ SGHSS VidaPlus Backend iniciado com sucesso!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📚 Documentação: http://localhost:${PORT}/api/docs\n`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
