const express = require('express');
const User = require('../models/User');
const { authenticateToken, authorizeResource } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Obter perfil do usuário atual
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil do usuário atual
router.put('/profile', validateUserUpdate, async (req, res) => {
  try {
    const { firstName, lastName, level, preferences } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (level !== undefined) updateData.level = level;
    if (preferences !== undefined) updateData.preferences = preferences;

    const success = await User.updateProfile(req.user._id, updateData);
    
    if (success) {
      const updatedUser = await User.findById(req.user._id);
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso!',
        data: updatedUser.toJSON()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar perfil'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter usuário por ID (apenas admin ou próprio usuário)
router.get('/:id', authorizeResource('user'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar usuário por ID (apenas admin ou próprio usuário)
router.put('/:id', authorizeResource('user'), validateUserUpdate, async (req, res) => {
  try {
    const { firstName, lastName, level, preferences, isActive } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (level !== undefined) updateData.level = level;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (isActive !== undefined) updateData.isActive = isActive;

    const success = await User.updateProfile(req.params.id, updateData);
    
    if (success) {
      const updatedUser = await User.findById(req.params.id);
      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso!',
        data: updatedUser.toJSON()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar usuário'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Desativar conta do usuário atual
router.delete('/profile', async (req, res) => {
  try {
    const success = await User.updateProfile(req.user._id, { isActive: false });
    
    if (success) {
      res.json({
        success: true,
        message: 'Conta desativada com sucesso!'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar conta'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas do usuário atual
router.get('/profile/stats', async (req, res) => {
  try {
    // Aqui você pode adicionar lógica para buscar estatísticas do usuário
    // como lições completadas, tempo de estudo, etc.
    res.json({
      success: true,
      data: {
        level: req.user.level,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin,
        preferences: req.user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
