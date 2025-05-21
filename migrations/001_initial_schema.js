/* Migração inicial para criar as tabelas do banco de dados */

exports.up = pgm => {
  // Tabela de usuários
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    full_name: { type: 'varchar(255)', notNull: true },
    phone: { type: 'varchar(20)' },
    role: { type: 'varchar(20)', notNull: true, default: 'client' },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    last_login: { type: 'timestamp with time zone' }
  });

  // Tabela de perfis de clientes
  pgm.createTable('client_profiles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    birth_date: { type: 'date' },
    address: { type: 'text' },
    city: { type: 'varchar(100)' },
    state: { type: 'varchar(50)' },
    postal_code: { type: 'varchar(20)' },
    emergency_contact: { type: 'varchar(100)' },
    health_notes: { type: 'text' },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de planos de assinatura
  pgm.createTable('subscription_plans', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true },
    description: { type: 'text' },
    price: { type: 'decimal(10,2)', notNull: true },
    duration_days: { type: 'integer', notNull: true },
    sessions_included: { type: 'integer', notNull: true },
    features: { type: 'jsonb' },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de assinaturas de clientes
  pgm.createTable('client_subscriptions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    plan_id: { type: 'uuid', notNull: true, references: 'subscription_plans' },
    start_date: { type: 'timestamp with time zone', notNull: true },
    end_date: { type: 'timestamp with time zone', notNull: true },
    sessions_remaining: { type: 'integer', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'active' },
    payment_status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de serviços
  pgm.createTable('services', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true },
    description: { type: 'text' },
    duration_minutes: { type: 'integer', notNull: true },
    price: { type: 'decimal(10,2)', notNull: true },
    category: { type: 'varchar(50)' },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de agendamentos
  pgm.createTable('appointments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    service_id: { type: 'uuid', notNull: true, references: 'services' },
    subscription_id: { type: 'uuid', references: 'client_subscriptions' },
    start_time: { type: 'timestamp with time zone', notNull: true },
    end_time: { type: 'timestamp with time zone', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    notes: { type: 'text' },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de disponibilidade
  pgm.createTable('availability', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    day_of_week: { type: 'integer', notNull: true }, // 0 = Domingo, 6 = Sábado
    start_time: { type: 'time', notNull: true },
    end_time: { type: 'time', notNull: true },
    is_available: { type: 'boolean', default: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de exceções de disponibilidade
  pgm.createTable('availability_exceptions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    date: { type: 'date', notNull: true },
    start_time: { type: 'time' },
    end_time: { type: 'time' },
    is_available: { type: 'boolean', notNull: true },
    reason: { type: 'text' },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de avaliações
  pgm.createTable('reviews', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    appointment_id: { type: 'uuid', references: 'appointments' },
    rating: { type: 'integer', notNull: true, check: 'rating BETWEEN 1 AND 5' },
    comment: { type: 'text' },
    is_approved: { type: 'boolean', default: false },
    is_public: { type: 'boolean', default: false },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabela de configurações do site
  pgm.createTable('site_settings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    setting_key: { type: 'varchar(100)', notNull: true, unique: true },
    setting_value: { type: 'text' },
    setting_type: { type: 'varchar(50)', notNull: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Índices para melhorar a performance
  pgm.createIndex('appointments', 'client_id');
  pgm.createIndex('appointments', 'start_time');
  pgm.createIndex('appointments', 'status');
  pgm.createIndex('client_subscriptions', 'client_id');
  pgm.createIndex('client_subscriptions', 'status');
  pgm.createIndex('reviews', 'client_id');
  pgm.createIndex('reviews', 'is_approved');

  // Função para atualizar o campo updated_at
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    `
  );

  // Triggers para atualizar o campo updated_at
  const tables = [
    'users', 'client_profiles', 'subscription_plans', 'client_subscriptions',
    'services', 'appointments', 'availability', 'availability_exceptions',
    'reviews', 'site_settings'
  ];

  tables.forEach(table => {
    pgm.createTrigger(table, `update_${table}_updated_at`, {
      when: 'BEFORE',
      operation: 'UPDATE',
      level: 'ROW',
      function: 'update_updated_at_column'
    });
  });
};

exports.down = pgm => {
  // Remover triggers
  const tables = [
    'users', 'client_profiles', 'subscription_plans', 'client_subscriptions',
    'services', 'appointments', 'availability', 'availability_exceptions',
    'reviews', 'site_settings'
  ];

  tables.forEach(table => {
    pgm.dropTrigger(table, `update_${table}_updated_at`);
  });

  // Remover função
  pgm.dropFunction('update_updated_at_column', []);

  // Remover tabelas
  pgm.dropTable('reviews');
  pgm.dropTable('availability_exceptions');
  pgm.dropTable('availability');
  pgm.dropTable('appointments');
  pgm.dropTable('services');
  pgm.dropTable('client_subscriptions');
  pgm.dropTable('subscription_plans');
  pgm.dropTable('client_profiles');
  pgm.dropTable('site_settings');
  pgm.dropTable('users');
};
