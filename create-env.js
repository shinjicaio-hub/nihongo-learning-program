const fs = require('fs');
const path = require('path');

// Conteúdo do arquivo .env seguro
const envContent = `# Configurações do Servidor
PORT=3001
HOST=localhost
NODE_ENV=development

# Configurações do Banco de Dados
MONGODB_URI=mongodb://localhost:27017/nihongo_learning

# Configurações de JWT
JWT_SECRET=minha_chave_secreta_jwt_super_segura_2024

# Configurações de CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://localhost:3002

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Segurança
BCRYPT_SALT_ROUNDS=10
SESSION_SECRET=minha_chave_secreta_sessao_super_segura_2024

# Configurações de Email (opcional)
#SMTP_HOST=smtp.gmail.com
#SMTP_PORT=587
#SMTP_USER=seu_email@gmail.com
#SMTP_PASS=sua_senha_de_app

# Configurações de Upload de Arquivos
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Configurações de Cache (opcional)
REDIS_URL=redis://localhost:6379

# Configurações de Monitoramento (opcional)
SENTRY_DSN=sua_dsn_do_sentry
`;

// Criar o arquivo .env
const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log('🔐 Credenciais seguras configuradas');
  console.log('📝 MongoDB configurado para localhost:27017');
} catch (error) {
  console.error('❌ Erro ao criar .env:', error.message);
}

