const express = require('express');
const router = express.Router();
const { AppError } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    
    if (email === 'test@example.com' && password === 'password') {
      
      //////

    } else {
      throw new AppError('Email ou senha inválidos', 401);
    }
  } catch (error) {
    next(error);
  }
});

// Registro
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    /////////

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: '1',
          name,
          email,
          role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 