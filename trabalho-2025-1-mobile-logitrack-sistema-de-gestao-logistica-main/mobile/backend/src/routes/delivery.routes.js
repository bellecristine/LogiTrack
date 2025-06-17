const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/auth');

// Listar entregas
router.get('/', authorize(['client', 'driver', 'operator']), async (req, res, next) => {
  try {
    /////

    res.json({
      status: 'success',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
});

// Obter detalhes de uma entrega
router.get('/:id', authorize(['client', 'driver', 'operator']), async (req, res, next) => {
  try {
    const { id } = req.params;
////////

    res.json({
      status: 'success',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
});

// Criar nova entrega
router.post('/', authorize(['client']), async (req, res, next) => {
  try {
    const { origin, destination } = req.body;
///////////


    res.status(201).json({
      status: 'success',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar status da entrega
router.patch('/:id/status', authorize(['driver']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;
 ///////////
 

    res.json({
      status: 'success',
      data: trackingUpdate
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 