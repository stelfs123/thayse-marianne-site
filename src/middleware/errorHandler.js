// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
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

module.exports = errorHandler;
