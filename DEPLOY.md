# Guia de Deploy - Site da Thayse Marianne

Este guia contém instruções detalhadas para fazer o deploy do site da Thayse Marianne no Railway usando o GitHub.

## Passo 1: Preparar o Repositório no GitHub

1. Acesse [GitHub](https://github.com) e faça login na sua conta (stelfs123)
2. Clique no botão "+" no canto superior direito e selecione "New repository"
3. Configure o novo repositório:
   - Nome: `thayse-marianne-site`
   - Descrição: `Site de serviços de estética e massoterapia da Thayse Marianne`
   - Visibilidade: Public (ou Private se preferir)
   - Não inicialize com README, .gitignore ou licença
4. Clique em "Create repository"

## Passo 2: Fazer Upload dos Arquivos para o GitHub

### Usando a Interface Web do GitHub (Método Mais Simples)

1. No seu novo repositório vazio, clique no link "uploading an existing file"
2. Arraste todos os arquivos e pastas deste ZIP para a área de upload
3. Adicione uma mensagem de commit: "Initial commit - Site da Thayse Marianne"
4. Clique em "Commit changes"

### Usando Git na Linha de Comando (Alternativa)

Se preferir usar Git na linha de comando:

```bash
# Clone o repositório vazio
git clone https://github.com/stelfs123/thayse-marianne-site.git

# Copie todos os arquivos para a pasta clonada
# (Extraia o ZIP e copie todo o conteúdo para a pasta do repositório)

# Navegue para a pasta do repositório
cd thayse-marianne-site

# Adicione todos os arquivos ao Git
git add .

# Faça o commit inicial
git commit -m "Initial commit - Site da Thayse Marianne"

# Envie para o GitHub
git push origin main
```

## Passo 3: Deploy no Railway

1. Acesse [Railway](https://railway.app/) e faça login com sua conta
2. Clique em "New Project" no dashboard
3. Selecione "Deploy from GitHub repo"
4. Conecte sua conta GitHub se ainda não estiver conectada
5. Selecione o repositório `thayse-marianne-site`
6. Railway detectará automaticamente que é um projeto Node.js e iniciará o deploy

## Passo 4: Adicionar o Banco de Dados PostgreSQL

1. No dashboard do projeto, clique em "New Service"
2. Selecione "Database" e depois "PostgreSQL"
3. Aguarde a criação do banco de dados (isso pode levar alguns segundos)

## Passo 5: Configurar Variáveis de Ambiente

1. No serviço principal (Node.js), vá para a aba "Variables"
2. Adicione as seguintes variáveis:
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=thayse-marianne-secret-key-2025
   JWT_EXPIRES_IN=7d
   EMAIL_FROM=contato@thaysemarianne.com
   EMAIL_NAME=Thayse Marianne
   ```

3. Clique em "Add" para salvar as variáveis
4. O Railway iniciará automaticamente um novo deploy com as variáveis configuradas

## Passo 6: Verificar o Deploy

1. Aguarde até que o status do deploy mude para "Deployed"
2. Clique na URL gerada pelo Railway para acessar o site
3. Verifique se a página inicial carrega corretamente

## Passo 7: Acessar o Painel Administrativo

1. Acesse a URL do site seguida de `/login`
2. Use as credenciais de administrador:
   - Email: admin@thaysemarianne.com
   - Senha: admin2025
3. Após o primeiro login, altere a senha do administrador em "Configurações"

## Passo 8: Configuração de Domínio Personalizado (Opcional)

1. No serviço principal, vá para a aba "Settings"
2. Role até a seção "Domains"
3. Clique em "Custom Domain"
4. Digite seu domínio (ex: thaysemarianne.com)
5. Siga as instruções para configurar os registros DNS:

   **Opção 1: Registro CNAME (recomendado)**
   - Tipo: CNAME
   - Nome/Host: www (ou @ para o domínio raiz)
   - Valor/Destino: o domínio fornecido pelo Railway
   - TTL: 3600 (ou Automático)

   **Opção 2: Registros A**
   - Tipo: A
   - Nome/Host: @ (para o domínio raiz)
   - Valor: os endereços IP fornecidos pelo Railway
   - TTL: 3600 (ou Automático)

6. Após configurar os registros DNS, clique em "Verify" no Railway
7. A propagação DNS pode levar de alguns minutos até 48 horas

## Solução de Problemas Comuns

### Erro no Banco de Dados
- Verifique se a variável `DATABASE_URL` está configurada corretamente
- Confirme que o serviço PostgreSQL está ativo no Railway

### Erro no Deploy
- Verifique os logs na aba "Logs" do serviço
- Certifique-se de que todas as variáveis de ambiente estão configuradas

### Problemas de Login
- Verifique se o banco de dados foi inicializado corretamente
- Os dados iniciais (incluindo o usuário admin) são criados automaticamente na primeira execução

### Erro 404 em Rotas do Frontend
- Certifique-se de que o build do frontend foi concluído com sucesso
- Verifique os logs do deploy para identificar possíveis erros

## Próximos Passos

Após o deploy bem-sucedido:

1. Personalize as informações do site através do painel administrativo
2. Configure os serviços disponíveis e horários de atendimento
3. Adicione os planos de assinatura com seus respectivos benefícios
4. Teste o sistema de agendamento e notificações
5. Convide algumas clientes para testar o sistema antes do lançamento oficial

Para qualquer dúvida ou problema durante o deploy, consulte a documentação do Railway ou entre em contato com o desenvolvedor.
