const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta de usuário desativada'
      });
    }

    // Adicionar informações do usuário ao request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário é admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Verificar se o usuário tem role de admin
    if (!req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Requer privilégios de administrador'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário pode acessar um recurso específico
const authorizeResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Admin pode acessar qualquer recurso
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar se o usuário está acessando seu próprio recurso
      const resourceId = req.params.id || req.params.userId;
      if (resourceId && resourceId === req.user._id.toString()) {
        return next();
      }

      // Verificar se o usuário está acessando um recurso relacionado a ele
      if (resourceType === 'progress' && req.params.userId === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este recurso'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para verificar nível mínimo do usuário
const requireLevel = (minLevel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const userLevel = req.user.level;
      const levelOrder = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3
      };

      if (levelOrder[userLevel] < levelOrder[minLevel]) {
        return res.status(403).json({
          success: false,
          message: `Nível mínimo requerido: ${minLevel}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  authorizeResource,
  requireLevel
};
