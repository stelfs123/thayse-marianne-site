const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Configurar API key do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Função para carregar template
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  return handlebars.compile(templateSource);
};

// Enviar email de confirmação de agendamento
exports.sendAppointmentConfirmation = async (appointment, client, service) => {
  try {
    const template = loadTemplate('appointment-confirmation');
    
    // Formatar data e hora
    const appointmentDate = new Date(appointment.start_time);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Preparar dados para o template
    const data = {
      client_name: client.full_name,
      service_name: service.name,
      appointment_date: formattedDate,
      appointment_time: formattedTime,
      duration: service.duration_minutes,
      appointment_link: `${process.env.FRONTEND_URL}/agendamentos/${appointment.id}`
    };
    
    // Renderizar HTML com os dados
    const html = template(data);
    
    // Configurar mensagem
    const msg = {
      to: client.email,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_NAME
      },
      subject: 'Confirmação de Agendamento - Thayse Marianne',
      html: html
    };
    
    // Enviar email
    await sgMail.send(msg);
    console.log(`Email de confirmação enviado para ${client.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    return false;
  }
};

// Enviar email de cancelamento de agendamento
exports.sendAppointmentCancellation = async (appointment, client, service) => {
  try {
    const template = loadTemplate('appointment-cancellation');
    
    // Formatar data e hora
    const appointmentDate = new Date(appointment.start_time);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Preparar dados para o template
    const data = {
      client_name: client.full_name,
      service_name: service.name,
      appointment_date: formattedDate,
      appointment_time: formattedTime,
      duration: service.duration_minutes
    };
    
    // Renderizar HTML com os dados
    const html = template(data);
    
    // Configurar mensagem
    const msg = {
      to: client.email,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_NAME
      },
      subject: 'Cancelamento de Agendamento - Thayse Marianne',
      html: html
    };
    
    // Enviar email
    await sgMail.send(msg);
    console.log(`Email de cancelamento enviado para ${client.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de cancelamento:', error);
    return false;
  }
};

// Enviar email de lembrete de agendamento
exports.sendAppointmentReminder = async (appointment, client, service) => {
  try {
    const template = loadTemplate('appointment-reminder');
    
    // Formatar data e hora
    const appointmentDate = new Date(appointment.start_time);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Preparar dados para o template
    const data = {
      client_name: client.full_name,
      service_name: service.name,
      appointment_date: formattedDate,
      appointment_time: formattedTime,
      duration: service.duration_minutes,
      appointment_link: `${process.env.FRONTEND_URL}/agendamentos/${appointment.id}`
    };
    
    // Renderizar HTML com os dados
    const html = template(data);
    
    // Configurar mensagem
    const msg = {
      to: client.email,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_NAME
      },
      subject: 'Lembrete de Agendamento - Thayse Marianne',
      html: html
    };
    
    // Enviar email
    await sgMail.send(msg);
    console.log(`Email de lembrete enviado para ${client.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de lembrete:', error);
    return false;
  }
};

// Enviar email de boas-vindas
exports.sendWelcomeEmail = async (user) => {
  try {
    const template = loadTemplate('welcome');
    
    // Preparar dados para o template
    const data = {
      client_name: user.full_name,
      login_link: `${process.env.FRONTEND_URL}/login`
    };
    
    // Renderizar HTML com os dados
    const html = template(data);
    
    // Configurar mensagem
    const msg = {
      to: user.email,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_NAME
      },
      subject: 'Bem-vindo(a) ao Thayse Marianne',
      html: html
    };
    
    // Enviar email
    await sgMail.send(msg);
    console.log(`Email de boas-vindas enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return false;
  }
};

// Enviar email de redefinição de senha
exports.sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const template = loadTemplate('password-reset');
    
    // Preparar dados para o template
    const data = {
      client_name: user.full_name,
      reset_link: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    };
    
    // Renderizar HTML com os dados
    const html = template(data);
    
    // Configurar mensagem
    const msg = {
      to: user.email,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_NAME
      },
      subject: 'Redefinição de Senha - Thayse Marianne',
      html: html
    };
    
    // Enviar email
    await sgMail.send(msg);
    console.log(`Email de redefinição de senha enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de redefinição de senha:', error);
    return false;
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentReminder,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
