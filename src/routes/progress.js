const express = require('express');
const UserProgress = require('../models/UserProgress');
const { authenticateToken, authorizeResource } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Obter progresso do usuário atual
router.get('/my-progress', async (req, res) => {
  try {
    const progress = await UserProgress.findByUser(req.user._id);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter progresso específico de uma lição
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const progress = await UserProgress.findByUserAndLesson(req.user._id, req.params.lessonId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progresso não encontrado para esta lição'
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Iniciar ou atualizar progresso de uma lição
router.post('/lesson/:lessonId', async (req, res) => {
  try {
    const { status, score, timeSpent, notes } = req.body;
    const { lessonId } = req.params;
    
    // Verificar se já existe progresso
    let progress = await UserProgress.findByUserAndLesson(req.user._id, lessonId);
    
    if (progress) {
      // Atualizar progresso existente
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (score !== undefined) updateData.score = score;
      if (timeSpent !== undefined) updateData.time_spent = timeSpent;
      if (notes !== undefined) updateData.notes = notes;
      
      const success = await UserProgress.updateProgress(req.user._id, lessonId, updateData);
      
      if (success) {
        progress = await UserProgress.findByUserAndLesson(req.user._id, lessonId);
        res.json({
          success: true,
          message: 'Progresso atualizado com sucesso!',
          data: progress
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Erro ao atualizar progresso'
        });
      }
    } else {
      // Criar novo progresso
      const progressData = {
        user_id: req.user._id,
        lesson_id: lessonId,
        status: status || 'in_progress',
        score: score || 0,
        time_spent: timeSpent || 0,
        notes: notes || null
      };
      
      progress = await UserProgress.create(progressData);
      
      res.status(201).json({
        success: true,
        message: 'Progresso iniciado com sucesso!',
        data: progress
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Marcar lição como concluída
router.put('/lesson/:lessonId/complete', async (req, res) => {
  try {
    const { score = 100 } = req.body;
    const { lessonId } = req.params;
    
    const success = await UserProgress.markAsCompleted(req.user._id, lessonId, score);
    
    if (success) {
      const progress = await UserProgress.findByUserAndLesson(req.user._id, lessonId);
      res.json({
        success: true,
        message: 'Lição marcada como concluída!',
        data: progress
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao marcar lição como concluída'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar pontuação de uma lição
router.put('/lesson/:lessonId/score', async (req, res) => {
  try {
    const { score } = req.body;
    const { lessonId } = req.params;
    
    if (score === undefined || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Pontuação deve estar entre 0 e 100'
      });
    }
    
    const success = await UserProgress.updateScore(req.user._id, lessonId, score);
    
    if (success) {
      const progress = await UserProgress.findByUserAndLesson(req.user._id, lessonId);
      res.json({
        success: true,
        message: 'Pontuação atualizada com sucesso!',
        data: progress
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar pontuação'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Marcar/desmarcar lição como favorita
router.put('/lesson/:lessonId/favorite', async (req, res) => {
  try {
    const { favorite } = req.body;
    const { lessonId } = req.params;
    
    if (typeof favorite !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Campo favorite deve ser um booleano'
      });
    }
    
    const success = await UserProgress.updateProgress(req.user._id, lessonId, { favorite });
    
    if (success) {
      const progress = await UserProgress.findByUserAndLesson(req.user._id, lessonId);
      res.json({
        success: true,
        message: `Lição ${favorite ? 'marcada' : 'desmarcada'} como favorita!`,
        data: progress
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar favorito'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lições concluídas
router.get('/completed', async (req, res) => {
  try {
    const completedLessons = await UserProgress.getCompletedLessons(req.user._id);
    
    res.json({
      success: true,
      data: completedLessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lições em progresso
router.get('/in-progress', async (req, res) => {
  try {
    const inProgressLessons = await UserProgress.getInProgressLessons(req.user._id);
    
    res.json({
      success: true,
      data: inProgressLessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lições favoritas
router.get('/favorites', async (req, res) => {
  try {
    const favoriteLessons = await UserProgress.getFavoriteLessons(req.user._id);
    
    res.json({
      success: true,
      data: favoriteLessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas do usuário
router.get('/stats', async (req, res) => {
  try {
    const stats = await UserProgress.getUserStats(req.user._id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter ranking geral (top 10)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await UserProgress.getLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter progresso de outro usuário (apenas admin ou próprio usuário)
router.get('/user/:userId', authorizeResource('progress'), async (req, res) => {
  try {
    const progress = await UserProgress.findByUser(req.params.userId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas de outro usuário (apenas admin ou próprio usuário)
router.get('/user/:userId/stats', authorizeResource('progress'), async (req, res) => {
  try {
    const stats = await UserProgress.getUserStats(req.params.userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
