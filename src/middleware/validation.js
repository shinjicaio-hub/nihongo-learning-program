const config = require('../config/config');

// Validação de registro
const validateRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  // Validar username
  if (!username || username.length < config.validation.username.minLength) {
    errors.push(`Nome de usuário deve ter pelo menos ${config.validation.username.minLength} caracteres`);
  }
  if (username && username.length > config.validation.username.maxLength) {
    errors.push(`Nome de usuário deve ter no máximo ${config.validation.username.maxLength} caracteres`);
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Email inválido');
  }

  // Validar senha
  if (!password || password.length < config.validation.password.minLength) {
    errors.push(`Senha deve ter pelo menos ${config.validation.password.minLength} caracteres`);
  }

  // Validar nome e sobrenome
  if (!firstName || firstName.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }
  if (!lastName || lastName.trim().length === 0) {
    errors.push('Sobrenome é obrigatório');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados de validação inválidos',
      errors
    });
  }

  next();
};

// Validação de login
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validar email
  if (!email || email.trim().length === 0) {
    errors.push('Email é obrigatório');
  }

  // Validar senha
  if (!password || password.trim().length === 0) {
    errors.push('Senha é obrigatória');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados de validação inválidos',
      errors
    });
  }

  next();
};

// Validação de dados de usuário para atualização
const validateUserUpdate = (req, res, next) => {
  const { firstName, lastName, level, preferences } = req.body;
  const errors = [];

  // Validar nome e sobrenome se fornecidos
  if (firstName !== undefined && firstName.trim().length === 0) {
    errors.push('Nome não pode estar vazio');
  }
  if (lastName !== undefined && lastName.trim().length === 0) {
    errors.push('Sobrenome não pode estar vazio');
  }

  // Validar nível se fornecido
  if (level && !Object.values(config.levels).includes(level)) {
    errors.push('Nível inválido');
  }

  // Validar preferências se fornecidas
  if (preferences) {
    if (preferences.studyTime && (preferences.studyTime < 5 || preferences.studyTime > 480)) {
      errors.push('Tempo de estudo deve estar entre 5 e 480 minutos');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados de validação inválidos',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateUserUpdate
};
