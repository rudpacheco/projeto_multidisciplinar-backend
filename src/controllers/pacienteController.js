const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Controller de Pacientes
 */
class PacienteController {
  
  /**
   * Listar todos os pacientes (apenas ADMIN e MEDICO)
   * GET /api/pacientes
   */
  async listarPacientes(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          u.id, u.nome, u.email, u.cpf, u.telefone, u.data_nascimento, u.endereco,
          p.numero_prontuario, p.tipo_sanguineo, p.alergias, p.condicoes_preexistentes,
          p.contato_emergencia, p.telefone_emergencia, p.plano_saude, p.numero_carteirinha,
          p.criado_em
        FROM usuarios u
        INNER JOIN pacientes p ON p.usuario_id = u.id
        WHERE u.tipo = 'PACIENTE' AND u.ativo = true
      `;

      const params = [];
      
      if (search) {
        query += ` AND (u.nome ILIKE $1 OR u.cpf LIKE $1 OR p.numero_prontuario LIKE $1)`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY u.nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM usuarios u
        INNER JOIN pacientes p ON p.usuario_id = u.id
        WHERE u.tipo = 'PACIENTE' AND u.ativo = true
        ${search ? `AND (u.nome ILIKE '%${search}%' OR u.cpf LIKE '%${search}%' OR p.numero_prontuario LIKE '%${search}%')` : ''}
      `;
      const countResult = await db.query(countQuery);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      });

    } catch (error) {
      logger.error('Erro ao listar pacientes:', error);
      next(error);
    }
  }

  /**
   * Buscar paciente por ID
   * GET /api/pacientes/:id
   */
  async buscarPaciente(req, res, next) {
    try {
      const { id } = req.params;
      const { tipo, id: userId } = req.user;

      // Paciente só pode ver seus próprios dados
      if (tipo === 'PACIENTE') {
        const pacienteCheck = await db.query('SELECT id FROM pacientes WHERE usuario_id = $1', [userId]);
        if (pacienteCheck.rows.length === 0 || pacienteCheck.rows[0].id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            message: 'Você só pode acessar seus próprios dados'
          });
        }
      }

      const result = await db.query(`
        SELECT 
          u.id, u.nome, u.email, u.cpf, u.telefone, u.data_nascimento, u.endereco,
          p.id as paciente_id, p.numero_prontuario, p.tipo_sanguineo, p.alergias, 
          p.condicoes_preexistentes, p.contato_emergencia, p.telefone_emergencia, 
          p.plano_saude, p.numero_carteirinha, p.criado_em, p.atualizado_em
        FROM usuarios u
        INNER JOIN pacientes p ON p.usuario_id = u.id
        WHERE p.id = $1 AND u.ativo = true
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      logger.error('Erro ao buscar paciente:', error);
      next(error);
    }
  }

  /**
   * Atualizar dados do paciente
   * PUT /api/pacientes/:id
   */
  async atualizarPaciente(req, res, next) {
    const client = await db.getClient();
    
    try {
      const { id } = req.params;
      const { tipo, id: userId } = req.user;
      const { nome, telefone, endereco, tipo_sanguineo, alergias, condicoes_preexistentes, contato_emergencia, telefone_emergencia, plano_saude, numero_carteirinha } = req.body;

      await client.query('BEGIN');

      // Verificar permissão
      const pacienteCheck = await client.query('SELECT usuario_id FROM pacientes WHERE id = $1', [id]);
      
      if (pacienteCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado'
        });
      }

      if (tipo === 'PACIENTE' && pacienteCheck.rows[0].usuario_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode atualizar seus próprios dados'
        });
      }

      // Atualizar dados do usuário
      if (nome || telefone || endereco) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nome) {
          updates.push(`nome = $${paramCount++}`);
          values.push(nome);
        }
        if (telefone) {
          updates.push(`telefone = $${paramCount++}`);
          values.push(telefone);
        }
        if (endereco) {
          updates.push(`endereco = $${paramCount++}`);
          values.push(endereco);
        }

        updates.push(`atualizado_em = CURRENT_TIMESTAMP`);
        values.push(pacienteCheck.rows[0].usuario_id);

        await client.query(`
          UPDATE usuarios SET ${updates.join(', ')}
          WHERE id = $${paramCount}
        `, values);
      }

      // Atualizar dados do paciente
      if (tipo_sanguineo || alergias || condicoes_preexistentes || contato_emergencia || telefone_emergencia || plano_saude || numero_carteirinha) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (tipo_sanguineo) {
          updates.push(`tipo_sanguineo = $${paramCount++}`);
          values.push(tipo_sanguineo);
        }
        if (alergias !== undefined) {
          updates.push(`alergias = $${paramCount++}`);
          values.push(alergias);
        }
        if (condicoes_preexistentes !== undefined) {
          updates.push(`condicoes_preexistentes = $${paramCount++}`);
          values.push(condicoes_preexistentes);
        }
        if (contato_emergencia) {
          updates.push(`contato_emergencia = $${paramCount++}`);
          values.push(contato_emergencia);
        }
        if (telefone_emergencia) {
          updates.push(`telefone_emergencia = $${paramCount++}`);
          values.push(telefone_emergencia);
        }
        if (plano_saude) {
          updates.push(`plano_saude = $${paramCount++}`);
          values.push(plano_saude);
        }
        if (numero_carteirinha) {
          updates.push(`numero_carteirinha = $${paramCount++}`);
          values.push(numero_carteirinha);
        }

        updates.push(`atualizado_em = CURRENT_TIMESTAMP`);
        values.push(id);

        await client.query(`
          UPDATE pacientes SET ${updates.join(', ')}
          WHERE id = $${paramCount}
        `, values);
      }

      await client.query('COMMIT');

      // Buscar dados atualizados
      const updated = await client.query(`
        SELECT 
          u.id, u.nome, u.email, u.cpf, u.telefone, u.data_nascimento, u.endereco,
          p.id as paciente_id, p.numero_prontuario, p.tipo_sanguineo, p.alergias, 
          p.condicoes_preexistentes, p.contato_emergencia, p.telefone_emergencia, 
          p.plano_saude, p.numero_carteirinha
        FROM usuarios u
        INNER JOIN pacientes p ON p.usuario_id = u.id
        WHERE p.id = $1
      `, [id]);

      logger.info(`Paciente atualizado: ID ${id}`);

      res.json({
        success: true,
        message: 'Paciente atualizado com sucesso',
        data: updated.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erro ao atualizar paciente:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Buscar histórico clínico do paciente
   * GET /api/pacientes/:id/historico
   */
  async buscarHistorico(req, res, next) {
    try {
      const { id } = req.params;
      const { tipo, id: userId } = req.user;

      // Verificar permissão
      if (tipo === 'PACIENTE') {
        const pacienteCheck = await db.query('SELECT usuario_id FROM pacientes WHERE id = $1', [id]);
        if (pacienteCheck.rows.length === 0 || pacienteCheck.rows[0].usuario_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Você só pode acessar seu próprio histórico'
          });
        }
      }

      // Buscar consultas
      const consultas = await db.query(`
        SELECT 
          c.id, c.data_hora, c.tipo, c.status, c.motivo, c.observacoes,
          u.nome as profissional_nome,
          ps.especialidade,
          uh.nome as unidade_nome
        FROM consultas c
        LEFT JOIN profissionais_saude ps ON ps.id = c.profissional_id
        LEFT JOIN usuarios u ON u.id = ps.usuario_id
        LEFT JOIN unidades_hospitalares uh ON uh.id = c.unidade_id
        WHERE c.paciente_id = $1
        ORDER BY c.data_hora DESC
        LIMIT 50
      `, [id]);

      // Buscar prontuários
      const prontuarios = await db.query(`
        SELECT 
          p.id, p.data_atendimento, p.queixa_principal, p.historia_doenca,
          p.exame_fisico, p.hipotese_diagnostica, p.conduta,
          u.nome as profissional_nome,
          ps.especialidade
        FROM prontuarios p
        LEFT JOIN profissionais_saude ps ON ps.id = p.profissional_id
        LEFT JOIN usuarios u ON u.id = ps.usuario_id
        WHERE p.paciente_id = $1
        ORDER BY p.data_atendimento DESC
        LIMIT 50
      `, [id]);

      // Buscar exames
      const exames = await db.query(`
        SELECT 
          e.id, e.tipo, e.nome, e.data_solicitacao, e.data_realizacao,
          e.resultado, e.observacoes,
          u.nome as profissional_solicitante
        FROM exames e
        LEFT JOIN profissionais_saude ps ON ps.id = e.profissional_solicitante_id
        LEFT JOIN usuarios u ON u.id = ps.usuario_id
        WHERE e.paciente_id = $1
        ORDER BY e.data_solicitacao DESC
        LIMIT 50
      `, [id]);

      // Buscar prescrições
      const prescricoes = await db.query(`
        SELECT 
          p.id, p.medicamento, p.dosagem, p.frequencia, p.duracao,
          p.orientacoes, p.data_prescricao, p.validade,
          u.nome as profissional_nome
        FROM prescricoes p
        LEFT JOIN profissionais_saude ps ON ps.id = p.profissional_id
        LEFT JOIN usuarios u ON u.id = ps.usuario_id
        WHERE p.paciente_id = $1
        ORDER BY p.data_prescricao DESC
        LIMIT 50
      `, [id]);

      res.json({
        success: true,
        data: {
          consultas: consultas.rows,
          prontuarios: prontuarios.rows,
          exames: exames.rows,
          prescricoes: prescricoes.rows
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar histórico:', error);
      next(error);
    }
  }

  /**
   * Desativar paciente (soft delete)
   * DELETE /api/pacientes/:id
   */
  async desativarPaciente(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(`
        UPDATE usuarios u
        SET ativo = false, atualizado_em = CURRENT_TIMESTAMP
        FROM pacientes p
        WHERE u.id = p.usuario_id AND p.id = $1
        RETURNING u.id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado'
        });
      }

      logger.info(`Paciente desativado: ID ${id}`);

      res.json({
        success: true,
        message: 'Paciente desativado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao desativar paciente:', error);
      next(error);
    }
  }
}

module.exports = new PacienteController();
