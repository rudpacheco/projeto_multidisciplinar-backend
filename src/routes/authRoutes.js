const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post('/register',
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('tipo').isIn(['PACIENTE', 'MEDICO', 'ENFERMEIRO', 'TECNICO', 'ADMINISTRADOR']).withMessage('Tipo de usuário inválido'),
    body('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF deve ter 11 dígitos'),
    body('telefone').optional(),
    body('data_nascimento').optional().isDate().withMessage('Data de nascimento inválida'),
    body('endereco').optional()
  ],
  validate,
  audit('REGISTRO_USUARIO'),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').notEmpty().withMessage('Senha é obrigatória')
  ],
  validate,
  audit('LOGIN'),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Obter perfil do usuário autenticado
 * @access  Private
 */
router.get('/me',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  [
    body('senha_atual').notEmpty().withMessage('Senha atual é obrigatória'),
    body('senha_nova').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
  ],
  validate,
  audit('ALTERACAO_SENHA'),
  authController.changePassword
);

module.exports = router;
