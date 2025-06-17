const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const deliveryRoutes = require('./delivery.routes');
const userRoutes = require('./user.routes');
const { authenticate } = require('../middleware/auth');

// Rotas públicas
router.use('/auth', authRoutes);

// Middleware de autenticação para rotas protegidas
router.use(authenticate);

// Rotas protegidas
router.use('/deliveries', deliveryRoutes);
router.use('/users', userRoutes);

module.exports = router; 