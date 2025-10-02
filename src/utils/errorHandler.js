// Sistema de tratamento de erros centralizado

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros operacionais comuns
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflito de dados') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Muitas requisições') {
    super(message, 429);
  }
}

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // Erro de cast do MongoDB (ID inválido)
  if (err.name === 'CastError') {
    const message = 'ID inválido';
    error = new ValidationError(message);
  }

  // Erro de duplicação (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} já existe`;
    error = new ConflictError(message);
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AuthenticationError(message);
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AuthenticationError(message);
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'JSON inválido';
    error = new ValidationError(message);
  }

  // Definir status code padrão
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor';

  // Resposta de erro
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para capturar erros de rota não encontrada
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Rota');
  next(error);
};

// Middleware para capturar erros de método não permitido
const methodNotAllowedHandler = (req, res, next) => {
  const error = new AppError(`Método ${req.method} não permitido para ${req.originalUrl}`, 405);
  next(error);
};

// Função para criar erros personalizados
const createError = (message, statusCode = 500, isOperational = true) => {
  return new AppError(message, statusCode, isOperational);
};

// Função para validar e lançar erro se necessário
const validateOrThrow = (condition, message, statusCode = 400) => {
  if (!condition) {
    throw new AppError(message, statusCode);
  }
};

// Função para verificar se o erro é operacional
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Função para formatar erro para resposta da API
const formatErrorForResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: error.message || 'Erro interno do servidor',
      statusCode: error.statusCode || 500
    }
  };

  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Função para log de erros
const logError = (error, req = null) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    isOperational: error.isOperational !== undefined ? error.isOperational : true
  };

  if (req) {
    errorLog.request = {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null
    };
  }

  // Aqui você pode implementar diferentes tipos de log
  // Por exemplo, salvar em arquivo, enviar para serviço externo, etc.
  console.error('Error Log:', errorLog);

  return errorLog;
};

// Função para tratamento de erros não capturados
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logError(error);
    
    // Encerrar o processo de forma limpa
    process.exit(1);
  });
};

// Função para tratamento de rejeições de promessas não capturadas
const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Encerrar o processo de forma limpa
    process.exit(1);
  });
};

// Inicializar handlers de erros não capturados
handleUncaughtExceptions();
handleUnhandledRejections();

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  methodNotAllowedHandler,
  createError,
  validateOrThrow,
  isOperationalError,
  formatErrorForResponse,
  logError
};
