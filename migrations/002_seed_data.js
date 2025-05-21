/* Migração para inserir dados iniciais no banco de dados */

exports.up = pgm => {
  // Inserir planos de assinatura
  pgm.sql(`
    INSERT INTO subscription_plans (name, description, price, duration_days, sessions_included, features)
    VALUES 
    ('Bronze', 'Plano básico com acesso a serviços essenciais', 200.00, 30, 2, '["2 sessões por mês", "Agendamento prioritário", "Desconto em produtos"]'),
    ('Prata', 'Plano intermediário com mais benefícios', 350.00, 30, 4, '["4 sessões por mês", "Agendamento prioritário", "Desconto em produtos", "1 serviço premium incluso"]'),
    ('Ouro', 'Plano avançado com benefícios exclusivos', 500.00, 30, 6, '["6 sessões por mês", "Agendamento VIP", "Desconto em produtos", "2 serviços premium inclusos", "Atendimento em horários especiais"]'),
    ('Diamante', 'Plano premium com todos os benefícios', 800.00, 30, 10, '["10 sessões por mês", "Agendamento VIP", "Desconto máximo em produtos", "Todos os serviços premium inclusos", "Atendimento em horários especiais", "Consulta personalizada"]')
  `);

  // Inserir serviços
  pgm.sql(`
    INSERT INTO services (name, description, duration_minutes, price, category)
    VALUES 
    ('Massagem Relaxante', 'Massagem corporal para relaxamento e alívio do estresse', 60, 150.00, 'Massagem'),
    ('Massagem Terapêutica', 'Massagem focada em pontos específicos para alívio de dores', 60, 180.00, 'Massagem'),
    ('Drenagem Linfática', 'Técnica que estimula o sistema linfático', 60, 200.00, 'Estética'),
    ('Limpeza de Pele', 'Tratamento completo para limpeza profunda da pele', 90, 220.00, 'Estética Facial'),
    ('Peeling Facial', 'Renovação celular para uma pele mais jovem', 45, 180.00, 'Estética Facial'),
    ('Depilação Completa', 'Serviço de depilação para diversas áreas', 120, 250.00, 'Depilação')
  `);

  // Inserir disponibilidade padrão (segunda a sexta, 9h às 18h)
  pgm.sql(`
    INSERT INTO availability (day_of_week, start_time, end_time)
    VALUES 
    (1, '09:00:00', '18:00:00'), -- Segunda
    (2, '09:00:00', '18:00:00'), -- Terça
    (3, '09:00:00', '18:00:00'), -- Quarta
    (4, '09:00:00', '18:00:00'), -- Quinta
    (5, '09:00:00', '18:00:00')  -- Sexta
  `);

  // Inserir configurações do site
  pgm.sql(`
    INSERT INTO site_settings (setting_key, setting_value, setting_type)
    VALUES 
    ('site_name', 'Thayse Marianne', 'string'),
    ('contact_email', 'contato@thaysemarianne.com', 'string'),
    ('contact_phone', '(XX) XXXXX-XXXX', 'string'),
    ('appointment_interval_minutes', '15', 'integer'),
    ('max_appointments_per_day', '10', 'integer'),
    ('enable_email_notifications', 'true', 'boolean')
  `);

  // Inserir usuário administrador (senha: admin2025)
  pgm.sql(`
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ('admin@thaysemarianne.com', '$2b$10$X7SLlrZO9Z3eDlJX3Dvw8eJqD5xTqAX6HvKPJaJK5H1JxQ5Hb5Kxe', 'Administrador', 'admin')
  `);
};

exports.down = pgm => {
  // Remover dados inseridos
  pgm.sql(`DELETE FROM users WHERE email = 'admin@thaysemarianne.com'`);
  pgm.sql(`DELETE FROM site_settings`);
  pgm.sql(`DELETE FROM availability`);
  pgm.sql(`DELETE FROM services`);
  pgm.sql(`DELETE FROM subscription_plans`);
};
