const express = require('express');
const { body, query } = require('express-validator');
const pacienteController = require('../controllers/pacienteController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');

const router = express.Router();

/**
 * @route   GET /api/pacientes
 * @desc    Listar todos os pacientes
 * @access  Private (ADMIN, MEDICO, ENFERMEIRO)
 */
router.get('/',
  authenticate,
  authorize('ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve estar entre 1 e 100'),
    query('search').optional().trim()
  ],
  validate,
  pacienteController.listarPacientes
);

/**
 * @route   GET /api/pacientes/:id
 * @desc    Buscar paciente por ID
 * @access  Private (Próprio paciente, ADMIN, MEDICO, ENFERMEIRO)
 */
router.get('/:id',
  authenticate,
  authorize('PACIENTE', 'ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO'),
  pacienteController.buscarPaciente
);

/**
 * @route   PUT /api/pacientes/:id
 * @desc    Atualizar dados do paciente
 * @access  Private (Próprio paciente, ADMIN)
 */
router.put('/:id',
  authenticate,
  authorize('PACIENTE', 'ADMINISTRADOR'),
  [
    body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('telefone').optional().trim(),
    body('endereco').optional().trim(),
    body('tipo_sanguineo').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Tipo sanguíneo inválido'),
    body('alergias').optional(),
    body('condicoes_preexistentes').optional(),
    body('contato_emergencia').optional().trim(),
    body('telefone_emergencia').optional().trim(),
    body('plano_saude').optional().trim(),
    body('numero_carteirinha').optional().trim()
  ],
  validate,
  audit('ATUALIZAR_PACIENTE'),
  pacienteController.atualizarPaciente
);

/**
 * @route   GET /api/pacientes/:id/historico
 * @desc    Buscar histórico clínico do paciente
 * @access  Private (Próprio paciente, ADMIN, MEDICO, ENFERMEIRO)
 */
router.get('/:id/historico',
  authenticate,
  authorize('PACIENTE', 'ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO'),
  pacienteController.buscarHistorico
);

/**
 * @route   DELETE /api/pacientes/:id
 * @desc    Desativar paciente
 * @access  Private (ADMIN)
 */
router.delete('/:id',
  authenticate,
  authorize('ADMINISTRADOR'),
  audit('DESATIVAR_PACIENTE'),
  pacienteController.desativarPaciente
);

module.exports = router;
