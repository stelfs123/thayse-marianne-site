const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware para verificar token JWT
exports.verifyToken = (req, res, next) => {
  try {
    // Obter token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acesso não autorizado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
      }

      // Adicionar dados do usuário ao objeto de requisição
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Erro na verificação de token:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Middleware para verificar se o usuário é admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }

    // Verificar se o usuário existe e é admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
