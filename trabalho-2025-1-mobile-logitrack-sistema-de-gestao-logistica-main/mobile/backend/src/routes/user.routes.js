const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/auth');

// Obter perfil do usuário
router.get('/profile', authorize(['client', 'driver', 'operator']), async (req, res, next) => {
  try {
  
    /////

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar perfil do usuário
router.patch('/profile', authorize(['client', 'driver', 'operator']), async (req, res, next) => {
  try {
    const { name, email } = req.body;

    ////////

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Listar motoristas (apenas para operadores)
router.get('/drivers', authorize(['operator']), async (req, res, next) => {
  try {
   
    ////////

    res.json({
      status: 'success',
      data: drivers
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar status do motorista
router.patch('/drivers/:id/status', authorize(['driver']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verifica se o motorista está tentando atualizar seu próprio status
    if (id !== req.user.id) {
      throw new AppError('Não autorizado a atualizar status de outro motorista', 403);
    }

    // TODO: Implementar atualização real com banco de dados
    // Por enquanto, apenas simula a atualização
    const driver = {
      id,
      status,
      updatedAt: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: driver
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 