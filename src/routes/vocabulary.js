const express = require('express');
const Vocabulary = require('../models/Vocabulary');
const { getDB } = require('../config/database');
const { authenticateToken, requireLevel } = require('../middleware/auth');

const router = express.Router();

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDistractorPool(allWords, currentIndex, key = 'portuguese') {
  const seen = new Set();
  const pool = [];
  allWords.forEach((vocab, idx) => {
    if (idx === currentIndex) return;
    const value = vocab && vocab[key];
    if (!value || seen.has(value)) return;
    seen.add(value);
    pool.push(value);
  });
  return pool;
}

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

// Listar sessões do próprio usuário (mais recentes primeiro)
// Atenção: precisa ficar ANTES da rota '/:id' para não ser capturada por ela.
router.get('/my-sessions', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const db = getDB();
    const sessions = await db.collection('vocabulary_practice_sessions')
      .find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
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
    const { level, category, limit = 15, answerType } = req.query;
    const allowedAnswerTypes = ['portuguese', 'romaji'];
    const safeAnswerType = allowedAnswerTypes.includes(answerType) ? answerType : 'portuguese';

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

    // Buscar uma reserva extra para garantir distratores reais quando o lote for pequeno
    let fallbackPool = [];
    if (vocabulary.length < 4) {
      fallbackPool = await Vocabulary.getRandomVocabulary(
        20,
        level || req.user.level,
        category || null
      );
    }

    const fallbackPlaceholderLabel = safeAnswerType === 'romaji' ? 'romaji extra' : 'opção alternativa';

    const testQuestions = vocabulary.map((vocab, index) => {
      const correctAnswer = vocab[safeAnswerType];
      const localPool = buildDistractorPool(vocabulary, index, safeAnswerType);
      const fallbackOnlyOthers = fallbackPool
        .filter((v) => v && v[safeAnswerType] && v[safeAnswerType] !== correctAnswer)
        .map((v) => v[safeAnswerType]);
      const merged = Array.from(new Set([...localPool, ...fallbackOnlyOthers]))
        .filter((value) => value && value !== correctAnswer);
      const distractors = shuffle(merged).slice(0, 3);
      while (distractors.length < 3) {
        distractors.push(`(${fallbackPlaceholderLabel} ${distractors.length + 1})`);
      }
      const options = shuffle([correctAnswer, ...distractors.slice(0, 3)]);
      return {
        id: index + 1,
        question: vocab.japanese,
        romaji: vocab.romaji || null,
        portuguese: vocab.portuguese || null,
        options,
        correctAnswer,
        answerType: safeAnswerType,
        vocabularyId: vocab._id
      };
    });
    
    res.json({
      success: true,
      data: {
        sessionId: Date.now().toString(),
        testQuestions,
        totalQuestions: testQuestions.length,
        level: level || req.user.level,
        category: category || 'mixed',
        answerType: safeAnswerType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Registrar uma sessão de prática/revisão/teste/prova de vocabulário (autenticado)
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { mode, level, category, score, total, durationSeconds, examPoints, answerType } = req.body || {};
    const allowedModes = ['practice', 'review', 'test', 'exam'];
    const safeMode = allowedModes.includes(mode) ? mode : 'practice';
    const allowedAnswerTypes = ['portuguese', 'romaji'];
    const safeAnswerType = allowedAnswerTypes.includes(answerType) ? answerType : null;

    if (total == null || Number(total) < 0) {
      return res.status(400).json({ success: false, message: 'Total de questões é obrigatório.' });
    }

    const doc = {
      user_id: req.user._id,
      mode: safeMode,
      level: level || null,
      category: category || null,
      answerType: safeAnswerType,
      score: Math.max(0, Number(score) || 0),
      total: Math.max(0, Number(total) || 0),
      durationSeconds: durationSeconds != null ? Math.max(0, Number(durationSeconds)) : null,
      examPoints: examPoints != null ? Number(examPoints) : null,
      createdAt: new Date()
    };

    const db = getDB();
    const result = await db.collection('vocabulary_practice_sessions').insertOne(doc);
    res.status(201).json({
      success: true,
      message: 'Sessão registrada.',
      data: { _id: result.insertedId, ...doc }
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
