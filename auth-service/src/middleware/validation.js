const { body, validationResult } = require('express-validator');

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validações para registro de usuário
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .isLength({ min: 5, max: 100 })
    .withMessage('Email deve ter entre 5 e 100 caracteres'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
    
  body('user_type')
    .isIn(['client', 'driver', 'admin'])
    .withMessage('Tipo de usuário deve ser: client, driver ou admin'),
    
  handleValidationErrors
];

// Validações para login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha deve ter no máximo 128 caracteres'),
    
  handleValidationErrors
];

// Validações para refresh token
const validateRefreshToken = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token é obrigatório')
    .isLength({ min: 10 })
    .withMessage('Refresh token inválido'),
    
  handleValidationErrors
];

// Validações para atualização de usuário
const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .isLength({ min: 5, max: 100 })
    .withMessage('Email deve ter entre 5 e 100 caracteres'),
    
  body('password')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    
  body('user_type')
    .optional()
    .isIn(['client', 'driver', 'admin'])
    .withMessage('Tipo de usuário deve ser: client, driver ou admin'),
    
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active deve ser um valor booleano'),
    
  handleValidationErrors
];

// Validações para mudança de senha
const validateChangePassword = [
  body('current_password')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
    
  body('new_password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nova senha deve ter entre 8 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Validação para parâmetros de ID
const validateUserId = [
  body('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
    
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateUpdateUser,
  validateChangePassword,
  validateUserId,
  handleValidationErrors
}; 