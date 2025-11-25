const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Controller de Consultas
 */
class ConsultaController {
  
  /**
   * Agendar nova consulta
   * POST /api/consultas
   */
  async agendarConsulta(req, res, next) {
    const client = await db.getClient();
    
    try {
      const { paciente_id, profissional_id, unidade_id, data_hora, tipo, motivo, observacoes } = req.body;
      const { tipo: tipoUsuario, id: userId } = req.user;

      await client.query('BEGIN');

      // Se for paciente, só pode agendar para si mesmo
      if (tipoUsuario === 'PACIENTE') {
        const pacienteCheck = await client.query(
          'SELECT id FROM pacientes WHERE usuario_id = $1',
          [userId]
        );
        
        if (pacienteCheck.rows.length === 0 || pacienteCheck.rows[0].id !== paciente_id) {
          return res.status(403).json({
            success: false,
            message: 'Você só pode agendar consultas para si mesmo'
          });
        }
      }

      // Verificar se o profissional existe
      const profissional = await client.query(
        'SELECT id FROM profissionais_saude WHERE id = $1',
        [profissional_id]
      );

      if (profissional.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profissional não encontrado'
        });
      }

      // Verificar se já existe consulta no mesmo horário para o profissional
      const conflito = await client.query(`
        SELECT id FROM consultas 
        WHERE profissional_id = $1 
        AND data_hora = $2 
        AND status NOT IN ('CANCELADA', 'FALTOU')
      `, [profissional_id, data_hora]);

      if (conflito.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma consulta agendada para este profissional neste horário'
        });
      }

      // Criar consulta
      const link_telemedicina = tipo === 'TELEMEDICINA' 
        ? `https://meet.vidaplus.com.br/${Date.now()}-${paciente_id}`
        : null;

      const result = await client.query(`
        INSERT INTO consultas 
        (paciente_id, profissional_id, unidade_id, data_hora, tipo, motivo, observacoes, link_telemedicina)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [paciente_id, profissional_id, unidade_id, data_hora, tipo || 'PRESENCIAL', motivo, observacoes, link_telemedicina]);

      await client.query('COMMIT');

      logger.info(`Consulta agendada: ID ${result.rows[0].id} - Paciente: ${paciente_id} - Profissional: ${profissional_id}`);

      res.status(201).json({
        success: true,
        message: 'Consulta agendada com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erro ao agendar consulta:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Listar consultas
   * GET /api/consultas
   */
  async listarConsultas(req, res, next) {
    try {
      const { tipo, id: userId } = req.user;
      const { page = 1, limit = 10, status, tipo: tipoConsulta, data_inicio, data_fim } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          c.id, c.data_hora, c.tipo, c.status, c.motivo, c.observacoes, 
          c.link_telemedicina, c.duracao_minutos, c.criado_em,
          pac_u.nome as paciente_nome, pac.numero_prontuario,
          prof_u.nome as profissional_nome, ps.especialidade,
          uh.nome as unidade_nome
        FROM consultas c
        LEFT JOIN pacientes pac ON pac.id = c.paciente_id
        LEFT JOIN usuarios pac_u ON pac_u.id = pac.usuario_id
        LEFT JOIN profissionais_saude ps ON ps.id = c.profissional_id
        LEFT JOIN usuarios prof_u ON prof_u.id = ps.usuario_id
        LEFT JOIN unidades_hospitalares uh ON uh.id = c.unidade_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      // Filtrar por tipo de usuário
      if (tipo === 'PACIENTE') {
        const paciente = await db.query('SELECT id FROM pacientes WHERE usuario_id = $1', [userId]);
        if (paciente.rows.length > 0) {
          query += ` AND c.paciente_id = $${paramCount++}`;
          params.push(paciente.rows[0].id);
        }
      } else if (['MEDICO', 'ENFERMEIRO', 'TECNICO'].includes(tipo)) {
        const profissional = await db.query('SELECT id FROM profissionais_saude WHERE usuario_id = $1', [userId]);
        if (profissional.rows.length > 0) {
          query += ` AND c.profissional_id = $${paramCount++}`;
          params.push(profissional.rows[0].id);
        }
      }

      // Filtros adicionais
      if (status) {
        query += ` AND c.status = $${paramCount++}`;
        params.push(status);
      }

      if (tipoConsulta) {
        query += ` AND c.tipo = $${paramCount++}`;
        params.push(tipoConsulta);
      }

      if (data_inicio) {
        query += ` AND c.data_hora >= $${paramCount++}`;
        params.push(data_inicio);
      }

      if (data_fim) {
        query += ` AND c.data_hora <= $${paramCount++}`;
        params.push(data_fim);
      }

      query += ` ORDER BY c.data_hora DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      logger.error('Erro ao listar consultas:', error);
      next(error);
    }
  }

  /**
   * Buscar consulta por ID
   * GET /api/consultas/:id
   */
  async buscarConsulta(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(`
        SELECT 
          c.*,
          pac_u.nome as paciente_nome, pac_u.cpf as paciente_cpf, 
          pac_u.telefone as paciente_telefone, pac.numero_prontuario,
          prof_u.nome as profissional_nome, ps.especialidade, ps.registro_profissional,
          uh.nome as unidade_nome, uh.endereco as unidade_endereco
        FROM consultas c
        LEFT JOIN pacientes pac ON pac.id = c.paciente_id
        LEFT JOIN usuarios pac_u ON pac_u.id = pac.usuario_id
        LEFT JOIN profissionais_saude ps ON ps.id = c.profissional_id
        LEFT JOIN usuarios prof_u ON prof_u.id = ps.usuario_id
        LEFT JOIN unidades_hospitalares uh ON uh.id = c.unidade_id
        WHERE c.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consulta não encontrada'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      logger.error('Erro ao buscar consulta:', error);
      next(error);
    }
  }

  /**
   * Atualizar status da consulta
   * PUT /api/consultas/:id/status
   */
  async atualizarStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;

      const result = await db.query(`
        UPDATE consultas 
        SET status = $1, observacoes = $2, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [status, observacoes, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consulta não encontrada'
        });
      }

      logger.info(`Status da consulta ${id} atualizado para: ${status}`);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
      next(error);
    }
  }

  /**
   * Cancelar consulta
   * DELETE /api/consultas/:id
   */
  async cancelarConsulta(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo_cancelamento } = req.body;

      const result = await db.query(`
        UPDATE consultas 
        SET status = 'CANCELADA', 
            observacoes = CONCAT(COALESCE(observacoes, ''), ' | Cancelamento: ', $1),
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2 AND status IN ('AGENDADA', 'CONFIRMADA')
        RETURNING *
      `, [motivo_cancelamento || 'Não informado', id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consulta não encontrada ou não pode ser cancelada'
        });
      }

      logger.info(`Consulta cancelada: ID ${id}`);

      res.json({
        success: true,
        message: 'Consulta cancelada com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      logger.error('Erro ao cancelar consulta:', error);
      next(error);
    }
  }

  /**
   * Buscar horários disponíveis de um profissional
   * GET /api/consultas/disponibilidade/:profissional_id
   */
  async buscarDisponibilidade(req, res, next) {
    try {
      const { profissional_id } = req.params;
      const { data } = req.query;

      if (!data) {
        return res.status(400).json({
          success: false,
          message: 'Data é obrigatória (formato: YYYY-MM-DD)'
        });
      }

      // Buscar disponibilidade do profissional
      const profissional = await db.query(
        'SELECT disponibilidade FROM profissionais_saude WHERE id = $1',
        [profissional_id]
      );

      if (profissional.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profissional não encontrado'
        });
      }

      // Buscar consultas já agendadas
      const consultas = await db.query(`
        SELECT data_hora, duracao_minutos 
        FROM consultas 
        WHERE profissional_id = $1 
        AND DATE(data_hora) = $2 
        AND status NOT IN ('CANCELADA', 'FALTOU')
        ORDER BY data_hora
      `, [profissional_id, data]);

      const disponibilidade = profissional.rows[0].disponibilidade;
      const consultasAgendadas = consultas.rows.map(c => ({
        hora: new Date(c.data_hora).toTimeString().substring(0, 5),
        duracao: c.duracao_minutos
      }));

      res.json({
        success: true,
        data: {
          disponibilidade,
          consultas_agendadas: consultasAgendadas
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar disponibilidade:', error);
      next(error);
    }
  }
}

module.exports = new ConsultaController();
