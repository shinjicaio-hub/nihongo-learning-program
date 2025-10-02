const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const lessonRoutes = require('./lessons');
const vocabularyRoutes = require('./vocabulary');
const progressRoutes = require('./progress');
const adminRoutes = require('./admin');

const router = express.Router();

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de usuários (protegidas)
router.use('/users', userRoutes);

// Rotas de lições
router.use('/lessons', lessonRoutes);

// Rotas de vocabulário
router.use('/vocabulary', vocabularyRoutes);

// Rotas de progresso (protegidas)
router.use('/progress', progressRoutes);

// Rotas administrativas (protegidas)
router.use('/admin', adminRoutes);

// Rota de status da API
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
