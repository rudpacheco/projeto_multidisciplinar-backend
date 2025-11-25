const express = require('express');
const { body, query } = require('express-validator');
const consultaController = require('../controllers/consultaController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');

const router = express.Router();

/**
 * @route   POST /api/consultas
 * @desc    Agendar nova consulta
 * @access  Private (PACIENTE, MEDICO, ENFERMEIRO, ADMIN)
 */
router.post('/',
  authenticate,
  authorize('PACIENTE', 'MEDICO', 'ENFERMEIRO', 'ADMINISTRADOR'),
  [
    body('paciente_id').isInt().withMessage('ID do paciente é obrigatório'),
    body('profissional_id').isInt().withMessage('ID do profissional é obrigatório'),
    body('unidade_id').optional().isInt(),
    body('data_hora').isISO8601().withMessage('Data e hora inválidos'),
    body('tipo').optional().isIn(['PRESENCIAL', 'TELEMEDICINA']).withMessage('Tipo de consulta inválido'),
    body('motivo').optional().trim(),
    body('observacoes').optional().trim()
  ],
  validate,
  audit('AGENDAR_CONSULTA'),
  consultaController.agendarConsulta
);

/**
 * @route   GET /api/consultas
 * @desc    Listar consultas
 * @access  Private
 */
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['AGENDADA', 'CONFIRMADA', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA', 'FALTOU']),
    query('tipo').optional().isIn(['PRESENCIAL', 'TELEMEDICINA']),
    query('data_inicio').optional().isISO8601(),
    query('data_fim').optional().isISO8601()
  ],
  validate,
  consultaController.listarConsultas
);

/**
 * @route   GET /api/consultas/disponibilidade/:profissional_id
 * @desc    Buscar horários disponíveis de um profissional
 * @access  Private
 */
router.get('/disponibilidade/:profissional_id',
  authenticate,
  [
    query('data').notEmpty().withMessage('Data é obrigatória').isDate().withMessage('Data inválida')
  ],
  validate,
  consultaController.buscarDisponibilidade
);

/**
 * @route   GET /api/consultas/:id
 * @desc    Buscar consulta por ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  consultaController.buscarConsulta
);

/**
 * @route   PUT /api/consultas/:id/status
 * @desc    Atualizar status da consulta
 * @access  Private (MEDICO, ENFERMEIRO, ADMIN)
 */
router.put('/:id/status',
  authenticate,
  authorize('MEDICO', 'ENFERMEIRO', 'ADMINISTRADOR'),
  [
    body('status').isIn(['AGENDADA', 'CONFIRMADA', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA', 'FALTOU']).withMessage('Status inválido'),
    body('observacoes').optional().trim()
  ],
  validate,
  audit('ATUALIZAR_STATUS_CONSULTA'),
  consultaController.atualizarStatus
);

/**
 * @route   DELETE /api/consultas/:id
 * @desc    Cancelar consulta
 * @access  Private (PACIENTE, MEDICO, ADMIN)
 */
router.delete('/:id',
  authenticate,
  authorize('PACIENTE', 'MEDICO', 'ADMINISTRADOR'),
  [
    body('motivo_cancelamento').optional().trim()
  ],
  validate,
  audit('CANCELAR_CONSULTA'),
  consultaController.cancelarConsulta
);

module.exports = router;
