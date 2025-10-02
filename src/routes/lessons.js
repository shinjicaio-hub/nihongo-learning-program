const express = require('express');
const Lesson = require('../models/Lesson');
const Vocabulary = require('../models/Vocabulary');
const { authenticateToken, requireLevel } = require('../middleware/auth');

const router = express.Router();

// Obter todas as lições ativas
router.get('/', async (req, res) => {
  try {
    const { level, category, limit = 50, page = 1 } = req.query;
    
    let lessons;
    if (level && category) {
      lessons = await Lesson.findByLevelAndCategory(level, category);
    } else if (level) {
      lessons = await Lesson.findByLevel(level);
    } else {
      lessons = await Lesson.getAllActive();
    }

    // Paginação simples
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLessons = lessons.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        lessons: paginatedLessons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(lessons.length / limit),
          totalLessons: lessons.length,
          hasNextPage: endIndex < lessons.length,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lição por ID
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lição não encontrada'
      });
    }

    // Buscar vocabulário relacionado à lição
    const vocabulary = await Vocabulary.findByLesson(req.params.id);

    res.json({
      success: true,
      data: {
        lesson,
        vocabulary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lição por ID com vocabulário
router.get('/:id/vocabulary', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lição não encontrada'
      });
    }

    const vocabulary = await Vocabulary.findByLesson(req.params.id);

    res.json({
      success: true,
      data: {
        lesson: {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          level: lesson.level,
          category: lesson.category
        },
        vocabulary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter próxima lição
router.get('/:id/next', async (req, res) => {
  try {
    const nextLesson = await Lesson.getNextLesson(req.params.id);
    
    if (!nextLesson) {
      return res.status(404).json({
        success: false,
        message: 'Não há próxima lição disponível'
      });
    }

    res.json({
      success: true,
      data: nextLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lição anterior
router.get('/:id/previous', async (req, res) => {
  try {
    const previousLesson = await Lesson.getPreviousLesson(req.params.id);
    
    if (!previousLesson) {
      return res.status(404).json({
        success: false,
        message: 'Não há lição anterior disponível'
      });
    }

    res.json({
      success: false,
      data: previousLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar lições por termo
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const { level, category } = req.query;
    
    let lessons = await Lesson.getAllActive();
    
    // Filtrar por termo de busca
    const searchTerm = term.toLowerCase();
    lessons = lessons.filter(lesson => 
      lesson.title.toLowerCase().includes(searchTerm) ||
      lesson.description.toLowerCase().includes(searchTerm) ||
      lesson.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    // Filtrar por nível se especificado
    if (level) {
      lessons = lessons.filter(lesson => lesson.level === level);
    }
    
    // Filtrar por categoria se especificada
    if (category) {
      lessons = lessons.filter(lesson => lesson.category === category);
    }

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lições por nível (requer autenticação para níveis avançados)
router.get('/level/:level', authenticateToken, async (req, res) => {
  try {
    const { level } = req.params;
    
    // Verificar se o usuário tem nível suficiente
    if (level === 'advanced' || level === 'intermediate') {
      await requireLevel(level === 'advanced' ? 'intermediate' : 'beginner')(req, res, () => {});
    }
    
    const lessons = await Lesson.findByLevel(level);
    
    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lições por categoria
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { level } = req.query;
    
    let lessons;
    if (level) {
      lessons = await Lesson.findByLevelAndCategory(level, category);
    } else {
      lessons = await Lesson.getAllActive().filter(lesson => lesson.category === category);
    }
    
    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas das lições
router.get('/stats/overview', async (req, res) => {
  try {
    const allLessons = await Lesson.getAllActive();
    
    const stats = {
      total: allLessons.length,
      byLevel: {},
      byCategory: {},
      byStatus: {
        active: allLessons.filter(lesson => lesson.isActive).length,
        inactive: allLessons.filter(lesson => !lesson.isActive).length
      }
    };
    
    // Estatísticas por nível
    allLessons.forEach(lesson => {
      stats.byLevel[lesson.level] = (stats.byLevel[lesson.level] || 0) + 1;
    });
    
    // Estatísticas por categoria
    allLessons.forEach(lesson => {
      stats.byCategory[lesson.category] = (stats.byCategory[lesson.category] || 0) + 1;
    });
    
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
