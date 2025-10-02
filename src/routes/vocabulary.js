const express = require('express');
const Vocabulary = require('../models/Vocabulary');
const { authenticateToken, requireLevel } = require('../middleware/auth');

const router = express.Router();

// Obter vocabulário por lição
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const vocabulary = await Vocabulary.findByLesson(req.params.lessonId);
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter vocabulário por categoria
router.get('/category/:category', async (req, res) => {
  try {
    const { level, limit = 50 } = req.query;
    
    let vocabulary;
    if (level) {
      vocabulary = await Vocabulary.findByLevel(level);
      vocabulary = vocabulary.filter(vocab => vocab.category === req.params.category);
    } else {
      vocabulary = await Vocabulary.findByCategory(req.params.category);
    }
    
    // Limitar resultados
    if (limit) {
      vocabulary = vocabulary.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter vocabulário por nível
router.get('/level/:level', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    let vocabulary = await Vocabulary.findByLevel(req.params.level);
    
    // Filtrar por categoria se especificada
    if (category) {
      vocabulary = vocabulary.filter(vocab => vocab.category === category);
    }
    
    // Limitar resultados
    if (limit) {
      vocabulary = vocabulary.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar vocabulário por termo
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const { level, category, limit = 50 } = req.query;
    
    let vocabulary = await Vocabulary.search(term);
    
    // Filtrar por nível se especificado
    if (level) {
      vocabulary = vocabulary.filter(vocab => vocab.level === level);
    }
    
    // Filtrar por categoria se especificada
    if (category) {
      vocabulary = vocabulary.filter(vocab => vocab.category === category);
    }
    
    // Limitar resultados
    if (limit) {
      vocabulary = vocabulary.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter vocabulário aleatório para prática
router.get('/random/practice', async (req, res) => {
  try {
    const { level, category, limit = 10 } = req.query;
    
    const vocabulary = await Vocabulary.getRandomVocabulary(
      parseInt(limit), 
      level || null, 
      category || null
    );
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter vocabulário por ID
router.get('/:id', async (req, res) => {
  try {
    const vocabulary = await Vocabulary.findById(req.params.id);
    
    if (!vocabulary) {
      return res.status(404).json({
        success: false,
        message: 'Vocabulário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter vocabulário para revisão (requer autenticação)
router.get('/review/session', authenticateToken, async (req, res) => {
  try {
    const { level, category, limit = 20 } = req.query;
    
    // Verificar se o usuário tem nível suficiente
    if (level === 'advanced') {
      await requireLevel('intermediate')(req, res, () => {});
    } else if (level === 'intermediate') {
      await requireLevel('beginner')(req, res, () => {});
    }
    
    const vocabulary = await Vocabulary.getRandomVocabulary(
      parseInt(limit), 
      level || req.user.level, 
      category || null
    );
    
    res.json({
      success: true,
      data: {
        sessionId: Date.now().toString(),
        vocabulary,
        totalWords: vocabulary.length,
        level: level || req.user.level,
        category: category || 'mixed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter vocabulário para teste (requer autenticação)
router.get('/test/session', authenticateToken, async (req, res) => {
  try {
    const { level, category, limit = 15 } = req.query;
    
    // Verificar se o usuário tem nível suficiente
    if (level === 'advanced') {
      await requireLevel('intermediate')(req, res, () => {});
    } else if (level === 'intermediate') {
      await requireLevel('beginner')(req, res, () => {});
    }
    
    const vocabulary = await Vocabulary.getRandomVocabulary(
      parseInt(limit), 
      level || req.user.level, 
      category || null
    );
    
    // Criar questões de teste
    const testQuestions = vocabulary.map((vocab, index) => ({
      id: index + 1,
      question: vocab.japanese,
      options: [
        vocab.portuguese,
        // Aqui você pode adicionar opções incorretas baseadas em outros vocabulários
        'Opção incorreta 1',
        'Opção incorreta 2',
        'Opção incorreta 3'
      ],
      correctAnswer: vocab.portuguese,
      vocabularyId: vocab._id
    }));
    
    res.json({
      success: true,
      data: {
        sessionId: Date.now().toString(),
        testQuestions,
        totalQuestions: testQuestions.length,
        level: level || req.user.level,
        category: category || 'mixed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas do vocabulário
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Vocabulary.getVocabularyStats();
    
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

// Obter vocabulário por tags
router.get('/tags/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const { level, limit = 50 } = req.query;
    
    let vocabulary = await Vocabulary.findByLevel(level || 'beginner');
    
    // Filtrar por tag
    vocabulary = vocabulary.filter(vocab => 
      vocab.tags && vocab.tags.some(t => 
        t.toLowerCase().includes(tag.toLowerCase())
      )
    );
    
    // Limitar resultados
    if (limit) {
      vocabulary = vocabulary.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
