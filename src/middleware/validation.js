const { body } = require('express-validator');

// Validação para registro de usuário
exports.validateRegistration = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres'),
  body('full_name').notEmpty().withMessage('Nome completo é obrigatório'),
  body('phone').optional().isMobilePhone('pt-BR').withMessage('Número de telefone inválido')
];

// Validação para login
exports.validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Middleware para tratamento de erros
exports.errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);
  
  // Verificar tipo de erro
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }
  
  // Erro padrão
  res.status(500).json({ message: 'Erro interno do servidor' });
};
