# Site da Thayse Marianne - Guia de Deploy

Este repositório contém o código completo do site da Thayse Marianne, uma plataforma para serviços de estética e massoterapia com sistema de agendamento, área de cliente, planos de assinatura e painel administrativo.

## Visão Geral

O site foi desenvolvido para proporcionar uma experiência única para clientes de serviços de estética e massoterapia, criando uma ponte digital eficiente e elegante entre a profissional e suas clientes.

### Principais Funcionalidades

- **Sistema de Agendamento**: Marcação de sessões com escolha de data, horário e serviço
- **Área da Cliente**: Acesso personalizado para acompanhar histórico e agendamentos
- **Planos de Assinatura**: Planos Bronze, Prata, Ouro e Diamante com benefícios exclusivos
- **Painel Administrativo**: Gerenciamento completo de agendamentos e clientes
- **Sistema de Feedback**: Avaliações de clientes com moderação pela profissional

## Tecnologias Utilizadas

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS
- **Autenticação**: JWT
- **Email**: Serviço de notificações por email
- **Deploy**: Railway

## Estrutura do Projeto

```
thayse-marianne-site/
├── server.js                 # Ponto de entrada do backend
├── package.json              # Dependências do backend
├── .env.example              # Exemplo de variáveis de ambiente
├── Procfile                  # Configuração para deploy
├── src/                      # Código-fonte do backend
│   ├── controllers/          # Controladores da API
│   ├── middleware/           # Middlewares (autenticação, validação)
│   ├── routes/               # Rotas da API
│   ├── services/             # Serviços (email, agendamento)
│   └── templates/            # Templates de email
├── migrations/               # Scripts de migração do banco de dados
└── client/                   # Frontend React
    ├── package.json          # Dependências do frontend
    └── src/                  # Código-fonte do frontend
```

## Credenciais de Acesso Padrão

Após o deploy, você pode acessar o painel administrativo com:

- **Email**: admin@thaysemarianne.com
- **Senha**: admin2025

**Importante**: Altere a senha após o primeiro login.
