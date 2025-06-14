const express = require('express');
const UserController = require('../controllers/userController');
const { validateUpdateUser, validateChangePassword } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de usuários requerem autenticação
router.use(authenticateToken);

// Rotas que qualquer usuário autenticado pode acessar
router.get('/me', UserController.getUserById); // Redireciona para o próprio usuário
router.put('/change-password', validateChangePassword, UserController.changePassword);

// Rotas que requerem ser admin ou o próprio usuário
router.get('/:id', requireOwnershipOrAdmin, UserController.getUserById);
router.put('/:id', requireOwnershipOrAdmin, validateUpdateUser, UserController.updateUser);

// Rotas que requerem permissão de admin
router.get('/', requireAdmin, UserController.listUsers);
router.post('/:id/deactivate', requireAdmin, UserController.deactivateUser);
router.post('/:id/activate', requireAdmin, UserController.activateUser);
router.get('/stats/overview', requireAdmin, UserController.getUserStats);
router.post('/maintenance/cleanup-tokens', requireAdmin, UserController.cleanupExpiredTokens);

module.exports = router; 