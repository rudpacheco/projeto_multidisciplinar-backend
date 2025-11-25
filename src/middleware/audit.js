const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Middleware de auditoria para LGPD
 * Registra todas as ações realizadas no sistema
 */
const audit = (acao) => {
  return async (req, res, next) => {
    // Armazenar dados originais do response.json
    const originalJson = res.json.bind(res);

    // Sobrescrever res.json para capturar a resposta
    res.json = async function(data) {
      try {
        // Registrar auditoria apenas se houver usuário autenticado
        if (req.user) {
          const auditLog = {
            usuario_id: req.user.id,
            acao: acao || `${req.method} ${req.originalUrl}`,
            tabela_afetada: extrairTabelaAfetada(req.originalUrl),
            registro_id: extrairRegistroId(req.params, data),
            dados_anteriores: req.body?.dados_anteriores || null,
            dados_novos: req.method !== 'GET' ? req.body : null,
            ip_origem: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          };

          await registrarAuditoria(auditLog);
        }
      } catch (error) {
        logger.error('Erro ao registrar auditoria:', error);
        // Não interromper a requisição por erro de auditoria
      }

      // Chamar o json original
      return originalJson(data);
    };

    next();
  };
};

/**
 * Registra log de auditoria no banco de dados
 */
async function registrarAuditoria(logData) {
  try {
    await db.query(`
      INSERT INTO logs_auditoria 
      (usuario_id, acao, tabela_afetada, registro_id, dados_anteriores, dados_novos, ip_origem, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      logData.usuario_id,
      logData.acao,
      logData.tabela_afetada,
      logData.registro_id,
      JSON.stringify(logData.dados_anteriores),
      JSON.stringify(logData.dados_novos),
      logData.ip_origem,
      logData.user_agent
    ]);

    logger.info(`[AUDITORIA] ${logData.acao} - Usuário: ${logData.usuario_id} - IP: ${logData.ip_origem}`);
  } catch (error) {
    logger.error('Erro ao salvar log de auditoria:', error);
  }
}

/**
 * Extrai o nome da tabela afetada baseado na URL
 */
function extrairTabelaAfetada(url) {
  const match = url.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'desconhecido';
}

/**
 * Extrai o ID do registro afetado
 */
function extrairRegistroId(params, responseData) {
  if (params.id) return params.id;
  if (responseData?.data?.id) return responseData.data.id;
  return null;
}

module.exports = audit;
