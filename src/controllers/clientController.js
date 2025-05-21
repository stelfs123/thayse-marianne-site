const pool = require('../config/database');
const emailService = require('../services/emailService');

// Obter perfil do cliente
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados do usuário
    const userResult = await pool.query(
      'SELECT id, email, full_name, phone, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar perfil do cliente
    const profileResult = await pool.query(
      'SELECT * FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    const profile = profileResult.rows.length > 0 ? profileResult.rows[0] : null;

    // Buscar assinatura ativa
    const subscriptionResult = await pool.query(
      `SELECT cs.*, sp.name as plan_name, sp.features 
       FROM client_subscriptions cs 
       JOIN subscription_plans sp ON cs.plan_id = sp.id 
       WHERE cs.client_id = $1 AND cs.status = 'active' 
       ORDER BY cs.end_date DESC 
       LIMIT 1`,
      [userId]
    );

    const subscription = subscriptionResult.rows.length > 0 ? subscriptionResult.rows[0] : null;

    res.json({
      user: userResult.rows[0],
      profile,
      subscription
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Atualizar perfil do cliente
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, birth_date, address, city, state, postal_code, emergency_contact, health_notes } = req.body;

    // Iniciar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Atualizar dados do usuário
      if (full_name || phone !== undefined) {
        const updateFields = [];
        const values = [];
        let valueIndex = 1;

        if (full_name) {
          updateFields.push(`full_name = $${valueIndex}`);
          values.push(full_name);
          valueIndex++;
        }

        if (phone !== undefined) {
          updateFields.push(`phone = $${valueIndex}`);
          values.push(phone);
          valueIndex++;
        }

        if (updateFields.length > 0) {
          values.push(userId);
          await client.query(
            `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${valueIndex}`,
            values
          );
        }
      }

      // Verificar se o perfil existe
      const profileCheck = await client.query(
        'SELECT * FROM client_profiles WHERE user_id = $1',
        [userId]
      );

      if (profileCheck.rows.length === 0) {
        // Criar perfil se não existir
        await client.query(
          `INSERT INTO client_profiles 
           (user_id, birth_date, address, city, state, postal_code, emergency_contact, health_notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, birth_date, address, city, state, postal_code, emergency_contact, health_notes]
        );
      } else {
        // Atualizar perfil existente
        await client.query(
          `UPDATE client_profiles SET 
           birth_date = COALESCE($1, birth_date),
           address = COALESCE($2, address),
           city = COALESCE($3, city),
           state = COALESCE($4, state),
           postal_code = COALESCE($5, postal_code),
           emergency_contact = COALESCE($6, emergency_contact),
           health_notes = COALESCE($7, health_notes),
           updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $8`,
          [birth_date, address, city, state, postal_code, emergency_contact, health_notes, userId]
        );
      }

      await client.query('COMMIT');

      res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter serviços disponíveis
exports.getServices = async (req, res) => {
  try {
    const servicesResult = await pool.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY name'
    );

    res.json(servicesResult.rows);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Verificar disponibilidade
exports.checkAvailability = async (req, res) => {
  try {
    const { date, service_id } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    const queryDate = new Date(date);
    const dayOfWeek = queryDate.getDay(); // 0 = Domingo, 6 = Sábado

    // Verificar disponibilidade regular para o dia da semana
    const availabilityResult = await pool.query(
      'SELECT * FROM availability WHERE day_of_week = $1 AND is_available = true',
      [dayOfWeek]
    );

    if (availabilityResult.rows.length === 0) {
      return res.json({ available: false, message: 'Não há atendimento neste dia da semana' });
    }

    // Verificar exceções para a data específica
    const exceptionResult = await pool.query(
      'SELECT * FROM availability_exceptions WHERE date = $1',
      [queryDate.toISOString().split('T')[0]]
    );

    if (exceptionResult.rows.length > 0 && !exceptionResult.rows[0].is_available) {
      return res.json({ 
        available: false, 
        message: exceptionResult.rows[0].reason || 'Não há atendimento nesta data' 
      });
    }

    // Buscar duração do serviço se fornecido
    let serviceDuration = 60; // Duração padrão em minutos
    if (service_id) {
      const serviceResult = await pool.query(
        'SELECT duration_minutes FROM services WHERE id = $1',
        [service_id]
      );
      if (serviceResult.rows.length > 0) {
        serviceDuration = serviceResult.rows[0].duration_minutes;
      }
    }

    // Buscar agendamentos existentes para a data
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsResult = await pool.query(
      'SELECT start_time, end_time FROM appointments WHERE start_time >= $1 AND end_time <= $2 AND status != $3',
      [startOfDay.toISOString(), endOfDay.toISOString(), 'cancelled']
    );

    // Calcular horários disponíveis
    const availability = availabilityResult.rows[0];
    const [startHour, startMinute] = availability.start_time.split(':').map(Number);
    const [endHour, endMinute] = availability.end_time.split(':').map(Number);

    const startTime = new Date(queryDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(queryDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Intervalo entre agendamentos (em minutos)
    const intervalMinutes = 15;
    
    // Calcular slots disponíveis
    const availableSlots = [];
    const bookedSlots = appointmentsResult.rows.map(app => ({
      start: new Date(app.start_time),
      end: new Date(app.end_time)
    }));

    let currentSlot = new Date(startTime);
    
    while (currentSlot.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
      const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);
      
      // Verificar se o slot está disponível
      const isAvailable = !bookedSlots.some(booking => 
        (currentSlot >= booking.start && currentSlot < booking.end) || 
        (slotEnd > booking.start && slotEnd <= booking.end) ||
        (currentSlot <= booking.start && slotEnd >= booking.end)
      );
      
      if (isAvailable) {
        availableSlots.push({
          start: new Date(currentSlot),
          end: slotEnd
        });
      }
      
      // Avançar para o próximo slot
      currentSlot = new Date(currentSlot.getTime() + intervalMinutes * 60000);
    }

    // Formatar slots para resposta
    const formattedSlots = availableSlots.map(slot => ({
      start_time: slot.start.toISOString(),
      end_time: slot.end.toISOString(),
      formatted_time: `${slot.start.getHours().toString().padStart(2, '0')}:${slot.start.getMinutes().toString().padStart(2, '0')}`
    }));

    res.json({
      available: formattedSlots.length > 0,
      available_slots: formattedSlots,
      service_duration: serviceDuration
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Criar agendamento
exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { service_id, start_time, subscription_id, notes } = req.body;

    if (!service_id || !start_time) {
      return res.status(400).json({ message: 'Serviço e horário são obrigatórios' });
    }

    // Buscar serviço
    const serviceResult = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    const service = serviceResult.rows[0];
    
    // Calcular horário de término
    const startTimeDate = new Date(start_time);
    const endTimeDate = new Date(startTimeDate.getTime() + service.duration_minutes * 60000);

    // Verificar se o horário está disponível
    const conflictResult = await pool.query(
      `SELECT * FROM appointments 
       WHERE ((start_time <= $1 AND end_time > $1) OR 
              (start_time < $2 AND end_time >= $2) OR
              (start_time >= $1 AND end_time <= $2)) AND
             status != 'cancelled'`,
      [startTimeDate.toISOString(), endTimeDate.toISOString()]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({ message: 'Horário não disponível' });
    }

    // Verificar assinatura se fornecida
    if (subscription_id) {
      const subscriptionResult = await pool.query(
        `SELECT * FROM client_subscriptions 
         WHERE id = $1 AND client_id = $2 AND status = 'active' AND sessions_remaining > 0`,
        [subscription_id, userId]
      );

      if (subscriptionResult.rows.length === 0) {
        return res.status(400).json({ message: 'Assinatura inválida ou sem sessões disponíveis' });
      }
    }

    // Iniciar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Criar agendamento
      const appointmentResult = await client.query(
        `INSERT INTO appointments 
         (client_id, service_id, subscription_id, start_time, end_time, status, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [userId, service_id, subscription_id, startTimeDate.toISOString(), endTimeDate.toISOString(), 'confirmed', notes]
      );

      // Atualizar assinatura se fornecida
      if (subscription_id) {
        await client.query(
          `UPDATE client_subscriptions 
           SET sessions_remaining = sessions_remaining - 1 
           WHERE id = $1`,
          [subscription_id]
        );
      }

      await client.query('COMMIT');

      // Buscar dados do cliente para email
      const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      // Enviar email de confirmação
      try {
        await emailService.sendAppointmentConfirmation(
          appointmentResult.rows[0],
          userResult.rows[0],
          service
        );
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError);
        // Não interromper o fluxo se o email falhar
      }

      res.status(201).json({
        message: 'Agendamento criado com sucesso',
        appointment: appointmentResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter agendamentos do cliente
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, past } = req.query;

    let query = `
      SELECT a.*, s.name as service_name, s.duration_minutes 
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.client_id = $1
    `;
    
    const queryParams = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (past === 'true') {
      query += ` AND a.end_time < CURRENT_TIMESTAMP`;
    } else if (past === 'false') {
      query += ` AND a.end_time >= CURRENT_TIMESTAMP`;
    }

    query += ` ORDER BY a.start_time`;
    
    if (past === 'true') {
      query += ` DESC`;
    } else {
      query += ` ASC`;
    }

    const appointmentsResult = await pool.query(query, queryParams);

    res.json(appointmentsResult.rows);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter detalhes de um agendamento
exports.getAppointmentDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;

    const appointmentResult = await pool.query(
      `SELECT a.*, s.name as service_name, s.description as service_description, s.duration_minutes 
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.id = $1 AND a.client_id = $2`,
      [appointmentId, userId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    res.json(appointmentResult.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar detalhes do agendamento:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Cancelar agendamento
exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointmentId = req.params.id;

    // Buscar agendamento
    const appointmentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND client_id = $2',
      [appointmentId, userId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    const appointment = appointmentResult.rows[0];
    
    // Verificar se o agendamento já foi cancelado
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Agendamento já foi cancelado' });
    }

    // Verificar se o agendamento já ocorreu
    const appointmentDate = new Date(appointment.start_time);
    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'Não é possível cancelar um agendamento que já ocorreu' });
    }

    // Verificar política de cancelamento (24 horas de antecedência)
    const cancellationDeadline = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();
    
    // Iniciar transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Cancelar agendamento
      await client.query(
        'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', appointmentId]
      );

      // Devolver sessão à assinatura se cancelado com antecedência
      if (now < cancellationDeadline && appointment.subscription_id) {
        await client.query(
          `UPDATE client_subscriptions 
           SET sessions_remaining = sessions_remaining + 1 
           WHERE id = $1`,
          [appointment.subscription_id]
        );
      }

      await client.query('COMMIT');

      // Buscar dados do cliente e serviço para email
      const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      const serviceResult = await pool.query(
        'SELECT * FROM services WHERE id = $1',
        [appointment.service_id]
      );

      // Enviar email de cancelamento
      try {
        await emailService.sendAppointmentCancellation(
          appointment,
          userResult.rows[0],
          serviceResult.rows[0]
        );
      } catch (emailError) {
        console.error('Erro ao enviar email de cancelamento:', emailError);
        // Não interromper o fluxo se o email falhar
      }

      res.json({ 
        message: 'Agendamento cancelado com sucesso',
        refund: now < cancellationDeadline && appointment.subscription_id ? true : false
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter planos disponíveis
exports.getAvailablePlans = async (req, res) => {
  try {
    const plansResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price'
    );

    res.json(plansResult.rows);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter assinatura ativa do cliente
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptionResult = await pool.query(
      `SELECT cs.*, sp.name as plan_name, sp.description as plan_description, sp.features 
       FROM client_subscriptions cs 
       JOIN subscription_plans sp ON cs.plan_id = sp.id 
       WHERE cs.client_id = $1 AND cs.status = 'active' 
       ORDER BY cs.end_date DESC 
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.json({ has_subscription: false });
    }

    res.json({
      has_subscription: true,
      subscription: subscriptionResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter avaliações do cliente
exports.getClientReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviewsResult = await pool.query(
      `SELECT r.*, s.name as service_name 
       FROM reviews r
       JOIN appointments a ON r.appointment_id = a.id
       JOIN services s ON a.service_id = s.id
       WHERE r.client_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(reviewsResult.rows);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Criar avaliação
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointment_id, rating, comment } = req.body;

    if (!appointment_id || !rating) {
      return res.status(400).json({ message: 'ID do agendamento e avaliação são obrigatórios' });
    }

    // Verificar se o agendamento existe e pertence ao cliente
    const appointmentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND client_id = $2 AND status = $3',
      [appointment_id, userId, 'completed']
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Agendamento não encontrado ou não elegível para avaliação' });
    }

    // Verificar se já existe uma avaliação para este agendamento
    const existingReviewResult = await pool.query(
      'SELECT * FROM reviews WHERE appointment_id = $1',
      [appointment_id]
    );

    if (existingReviewResult.rows.length > 0) {
      return res.status(400).json({ message: 'Já existe uma avaliação para este agendamento' });
    }

    // Criar avaliação
    const reviewResult = await pool.query(
      `INSERT INTO reviews 
       (client_id, appointment_id, rating, comment, is_approved, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, appointment_id, rating, comment, false, false]
    );

    res.status(201).json({
      message: 'Avaliação enviada com sucesso e aguardando aprovação',
      review: reviewResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Atualizar avaliação
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    // Verificar se a avaliação existe e pertence ao cliente
    const reviewResult = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND client_id = $2',
      [reviewId, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Verificar se a avaliação já foi aprovada
    if (reviewResult.rows[0].is_approved) {
      return res.status(400).json({ message: 'Não é possível editar uma avaliação já aprovada' });
    }

    // Atualizar avaliação
    await pool.query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating), 
           comment = COALESCE($2, comment),
           is_approved = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [rating, comment, reviewId]
    );

    res.json({ message: 'Avaliação atualizada com sucesso e aguardando aprovação' });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Excluir avaliação
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    // Verificar se a avaliação existe e pertence ao cliente
    const reviewResult = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND client_id = $2',
      [reviewId, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Excluir avaliação
    await pool.query(
      'DELETE FROM reviews WHERE id = $1',
      [reviewId]
    );

    res.json({ message: 'Avaliação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
