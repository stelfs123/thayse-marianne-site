const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// Registro de novo usuário
exports.register = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, phone } = req.body;

    // Verificar se o email já existe
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Este email já está em uso' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Inserir novo usuário
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role',
      [email, hashedPassword, full_name, phone, 'client']
    );

    // Criar perfil de cliente
    await pool.query(
      'INSERT INTO client_profiles (user_id) VALUES ($1)',
      [newUser.rows[0].id]
    );

    // Gerar token JWT
    const token = jwt.sign(
      { id: newUser.rows[0].id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Enviar email de boas-vindas
    try {
      await emailService.sendWelcomeEmail(newUser.rows[0]);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não interromper o fluxo se o email falhar
    }

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        full_name: newUser.rows[0].full_name,
        role: newUser.rows[0].role
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuário pelo email
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.rows[0].id]
    );

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        full_name: user.rows[0].full_name,
        role: user.rows[0].role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Recuperação de senha
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o email existe
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      // Por segurança, não informamos se o email existe ou não
      return res.json({ message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha' });
    }

    // Gerar token de redefinição de senha (válido por 1 hora)
    const resetToken = jwt.sign(
      { id: user.rows[0].id, action: 'reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enviar email com link para redefinição de senha
    try {
      await emailService.sendPasswordResetEmail(user.rows[0], resetToken);
    } catch (emailError) {
      console.error('Erro ao enviar email de redefinição de senha:', emailError);
      return res.status(500).json({ message: 'Erro ao enviar email de redefinição de senha' });
    }

    res.json({ message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha' });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Redefinição de senha
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Verificar se é um token de redefinição de senha
    if (decoded.action !== 'reset_password') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, decoded.id]
    );

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Buscar usuário
    const user = await pool.query(
      'SELECT id, email, full_name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Token válido',
      user: user.rows[0]
    });
  } catch (error) {
    console.error('Erro na verificação de token:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
