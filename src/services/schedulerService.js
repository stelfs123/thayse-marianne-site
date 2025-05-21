const cron = require('node-cron');
const pool = require('../config/database');
const emailService = require('./emailService');

// Agendar envio de lembretes diariamente às 10:00
exports.scheduleAppointmentReminders = () => {
  cron.schedule('0 10 * * *', async () => {
    try {
      console.log('Executando agendamento de lembretes de consulta...');
      
      // Buscar agendamentos para o dia seguinte
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      
      const appointmentsResult = await pool.query(
        `SELECT a.*, u.email, u.full_name, s.name as service_name, s.duration_minutes 
         FROM appointments a
         JOIN users u ON a.client_id = u.id
         JOIN services s ON a.service_id = s.id
         WHERE a.start_time >= $1 AND a.start_time < $2 AND a.status = 'confirmed'`,
        [tomorrow.toISOString(), dayAfterTomorrow.toISOString()]
      );
      
      // Enviar lembretes para cada agendamento
      for (const appointment of appointmentsResult.rows) {
        const client = {
          id: appointment.client_id,
          email: appointment.email,
          full_name: appointment.full_name
        };
        
        const service = {
          id: appointment.service_id,
          name: appointment.service_name,
          duration_minutes: appointment.duration_minutes
        };
        
        await emailService.sendAppointmentReminder(appointment, client, service);
      }
      
      console.log(`Lembretes enviados para ${appointmentsResult.rows.length} agendamentos`);
    } catch (error) {
      console.error('Erro ao enviar lembretes de agendamento:', error);
    }
  });
};

module.exports = {
  scheduleAppointmentReminders
};
