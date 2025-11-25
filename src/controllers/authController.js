const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Controller de Autenticação
 */
class AuthController {
  
  /**
   * Registrar novo usuário
   * POST /api/auth/register
   */
  async register(req, res, next) {
    const client = await db.getClient();
    
    try {
      const { nome, email, senha, tipo, cpf, telefone, data_nascimento, endereco, dados_adicionais } = req.body;

      await client.query('BEGIN');

      // Verificar se email ou CPF já existem
      const userExists = await client.query(
        'SELECT id FROM usuarios WHERE email = $1 OR cpf = $2',
        [email, cpf]
      );

      if (userExists.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email ou CPF já cadastrados'
        });
      }

      // Criptografar senha
      const senhaHash = await bcrypt.hash(senha, config.bcrypt.rounds);

      // Criar usuário
      const usuario = await client.query(`
        INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, nome, email, tipo, cpf, telefone, data_nascimento, ativo, criado_em
      `, [nome, email, senhaHash, tipo, cpf, telefone, data_nascimento, endereco]);

      const usuarioId = usuario.rows[0].id;

      // Criar registro específico baseado no tipo
      if (tipo === 'PACIENTE' && dados_adicionais) {
        const { tipo_sanguineo, alergias, condicoes_preexistentes, contato_emergencia, telefone_emergencia, plano_saude, numero_carteirinha } = dados_adicionais;
        
        // Gerar número de prontuário único
        const numeroProntuario = `PRONT${String(usuarioId).padStart(6, '0')}`;
        
        await client.query(`
          INSERT INTO pacientes (usuario_id, numero_prontuario, tipo_sanguineo, alergias, condicoes_preexistentes, contato_emergencia, telefone_emergencia, plano_saude, numero_carteirinha)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [usuarioId, numeroProntuario, tipo_sanguineo, alergias, condicoes_preexistentes, contato_emergencia, telefone_emergencia, plano_saude, numero_carteirinha]);
      }

      if ((tipo === 'MEDICO' || tipo === 'ENFERMEIRO' || tipo === 'TECNICO') && dados_adicionais) {
        const { especialidade, registro_profissional, conselho, disponibilidade } = dados_adicionais;
        
        await client.query(`
          INSERT INTO profissionais_saude (usuario_id, especialidade, registro_profissional, conselho, disponibilidade)
          VALUES ($1, $2, $3, $4, $5)
        `, [usuarioId, especialidade, registro_profissional, conselho, JSON.stringify(disponibilidade)]);
      }

      await client.query('COMMIT');

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: usuario.rows[0].id, 
          email: usuario.rows[0].email, 
          tipo: usuario.rows[0].tipo,
          nome: usuario.rows[0].nome
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      logger.info(`Novo usuário registrado: ${email} (${tipo})`);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          usuario: usuario.rows[0],
          token
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erro ao registrar usuário:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Login de usuário
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      // Buscar usuário
      const result = await db.query(
        'SELECT id, nome, email, senha_hash, tipo, cpf, telefone, ativo FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      const usuario = result.rows[0];

      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        return res.status(403).json({
          success: false,
          message: 'Usuário desativado. Entre em contato com o administrador.'
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

      if (!senhaValida) {
        logger.warn(`Tentativa de login com senha incorreta: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          tipo: usuario.tipo,
          nome: usuario.nome
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Remover senha do objeto de resposta
      delete usuario.senha_hash;

      logger.info(`Login bem-sucedido: ${email} (${usuario.tipo})`);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          usuario,
          token
        }
      });

    } catch (error) {
      logger.error('Erro ao fazer login:', error);
      next(error);
    }
  }

  /**
   * Obter perfil do usuário autenticado
   * GET /api/auth/me
   */
  async getProfile(req, res, next) {
    try {
      const { id, tipo } = req.user;

      // Buscar dados do usuário
      let query = `
        SELECT u.id, u.nome, u.email, u.tipo, u.cpf, u.telefone, u.data_nascimento, u.endereco, u.ativo, u.criado_em
        FROM usuarios u
        WHERE u.id = $1
      `;

      // Se for paciente, buscar dados adicionais
      if (tipo === 'PACIENTE') {
        query = `
          SELECT u.id, u.nome, u.email, u.tipo, u.cpf, u.telefone, u.data_nascimento, u.endereco, u.ativo, u.criado_em,
                 p.numero_prontuario, p.tipo_sanguineo, p.alergias, p.condicoes_preexistentes, 
                 p.contato_emergencia, p.telefone_emergencia, p.plano_saude, p.numero_carteirinha
          FROM usuarios u
          LEFT JOIN pacientes p ON p.usuario_id = u.id
          WHERE u.id = $1
        `;
      }

      // Se for profissional de saúde, buscar dados adicionais
      if (['MEDICO', 'ENFERMEIRO', 'TECNICO'].includes(tipo)) {
        query = `
          SELECT u.id, u.nome, u.email, u.tipo, u.cpf, u.telefone, u.data_nascimento, u.endereco, u.ativo, u.criado_em,
                 ps.especialidade, ps.registro_profissional, ps.conselho, ps.disponibilidade
          FROM usuarios u
          LEFT JOIN profissionais_saude ps ON ps.usuario_id = u.id
          WHERE u.id = $1
        `;
      }

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      logger.error('Erro ao buscar perfil:', error);
      next(error);
    }
  }

  /**
   * Alterar senha
   * PUT /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { id } = req.user;
      const { senha_atual, senha_nova } = req.body;

      // Buscar senha atual
      const result = await db.query(
        'SELECT senha_hash FROM usuarios WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senha_atual, result.rows[0].senha_hash);

      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(senha_nova, config.bcrypt.rounds);

      // Atualizar senha
      await db.query(
        'UPDATE usuarios SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2',
        [novaSenhaHash, id]
      );

      logger.info(`Senha alterada para usuário ID: ${id}`);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();
