require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const { scheduleAppointmentReminders } = require('./src/services/schedulerService');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Disponibilizar a conexão para os modelos
app.locals.db = pool;

// Rotas
app.get('/', (req, res) => {
  res.json({ message: 'API da Thayse Marianne funcionando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // Iniciar agendamento de lembretes
  if (process.env.NODE_ENV === 'production') {
    scheduleAppointmentReminders();
    console.log('Agendamento de lembretes iniciado');
  }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

module.exports = app;
