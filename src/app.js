const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { connectDB, checkConnection } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');


// Carregar variáveis de ambiente
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Middleware de compressão
app.use(compression());

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite por IP
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  optionsSuccessStatus: 200
}));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Front-end: página principal e assets (login, histórico, aba Banco de Dados)
const path = require('path');
const publicDir = path.join(__dirname, '..', 'public');

// Página principal (definida antes do static para garantir que GET / devolva o site)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// CSS, JS e demais arquivos estáticos do site
app.use(express.static(publicDir));

// Rota de status da API e do MongoDB (usada pela aba Banco de Dados para status de conexão)
app.get('/health', async (req, res) => {
  const dbStatus = await checkConnection();
  const healthy = dbStatus.connected;
  res.json({
    success: true,
    message: healthy ? 'API e MongoDB operacionais' : 'API online; MongoDB indisponível',
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbStatus.connected,
      ...(dbStatus.error && { error: dbStatus.error })
    }
  });
});

// Rotas da API
app.use('/api', routes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Tratamento de erros não capturados
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Conectar ao banco e só então iniciar o servidor (evita status "desconectado" ao abrir a aba Banco de Dados)
const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API disponível em: http://localhost:${PORT}/api`);
    console.log(`🔍 Status (API + MongoDB): http://localhost:${PORT}/health`);
  });
  return server;
};

let server;
startServer()
  .then(s => { server = s; })
  .catch(err => {
    console.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  });

// Graceful shutdown
const shutdown = () => {
  console.log('Encerrando servidor...');
  if (server) {
    server.close(() => {
      console.log('Servidor encerrado.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};
process.on('SIGTERM', () => { shutdown(); });
process.on('SIGINT', () => { shutdown(); });

module.exports = app;
