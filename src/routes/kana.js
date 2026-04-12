/**
 * Rotas para prática de kana (hiragana/katakana).
 * GET /random — retorna um kana aleatório (char, romaji, type).
 * GET /activity — retorna sessões recentes do usuário autenticado.
 * POST /session — registra resultado da sessão de prática (autenticado).
 */

const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

function getPositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

// Lista plana de kanas (char, romaji, type) — mesma base usada no front
const KANA_LIST = [
  { char: 'あ', romaji: 'a', type: 'hiragana' }, { char: 'い', romaji: 'i', type: 'hiragana' }, { char: 'う', romaji: 'u', type: 'hiragana' }, { char: 'え', romaji: 'e', type: 'hiragana' }, { char: 'お', romaji: 'o', type: 'hiragana' },
  { char: 'か', romaji: 'ka', type: 'hiragana' }, { char: 'き', romaji: 'ki', type: 'hiragana' }, { char: 'く', romaji: 'ku', type: 'hiragana' }, { char: 'け', romaji: 'ke', type: 'hiragana' }, { char: 'こ', romaji: 'ko', type: 'hiragana' },
  { char: 'さ', romaji: 'sa', type: 'hiragana' }, { char: 'し', romaji: 'shi', type: 'hiragana' }, { char: 'す', romaji: 'su', type: 'hiragana' }, { char: 'せ', romaji: 'se', type: 'hiragana' }, { char: 'そ', romaji: 'so', type: 'hiragana' },
  { char: 'た', romaji: 'ta', type: 'hiragana' }, { char: 'ち', romaji: 'chi', type: 'hiragana' }, { char: 'つ', romaji: 'tsu', type: 'hiragana' }, { char: 'て', romaji: 'te', type: 'hiragana' }, { char: 'と', romaji: 'to', type: 'hiragana' },
  { char: 'な', romaji: 'na', type: 'hiragana' }, { char: 'に', romaji: 'ni', type: 'hiragana' }, { char: 'ぬ', romaji: 'nu', type: 'hiragana' }, { char: 'ね', romaji: 'ne', type: 'hiragana' }, { char: 'の', romaji: 'no', type: 'hiragana' },
  { char: 'は', romaji: 'ha', type: 'hiragana' }, { char: 'ひ', romaji: 'hi', type: 'hiragana' }, { char: 'ふ', romaji: 'fu', type: 'hiragana' }, { char: 'へ', romaji: 'he', type: 'hiragana' }, { char: 'ほ', romaji: 'ho', type: 'hiragana' },
  { char: 'ま', romaji: 'ma', type: 'hiragana' }, { char: 'み', romaji: 'mi', type: 'hiragana' }, { char: 'む', romaji: 'mu', type: 'hiragana' }, { char: 'め', romaji: 'me', type: 'hiragana' }, { char: 'も', romaji: 'mo', type: 'hiragana' },
  { char: 'や', romaji: 'ya', type: 'hiragana' }, { char: 'ゆ', romaji: 'yu', type: 'hiragana' }, { char: 'よ', romaji: 'yo', type: 'hiragana' },
  { char: 'ら', romaji: 'ra', type: 'hiragana' }, { char: 'り', romaji: 'ri', type: 'hiragana' }, { char: 'る', romaji: 'ru', type: 'hiragana' }, { char: 'れ', romaji: 're', type: 'hiragana' }, { char: 'ろ', romaji: 'ro', type: 'hiragana' },
  { char: 'わ', romaji: 'wa', type: 'hiragana' }, { char: 'を', romaji: 'wo', type: 'hiragana' }, { char: 'ん', romaji: 'n', type: 'hiragana' },
  { char: 'ア', romaji: 'a', type: 'katakana' }, { char: 'イ', romaji: 'i', type: 'katakana' }, { char: 'ウ', romaji: 'u', type: 'katakana' }, { char: 'エ', romaji: 'e', type: 'katakana' }, { char: 'オ', romaji: 'o', type: 'katakana' },
  { char: 'カ', romaji: 'ka', type: 'katakana' }, { char: 'キ', romaji: 'ki', type: 'katakana' }, { char: 'ク', romaji: 'ku', type: 'katakana' }, { char: 'ケ', romaji: 'ke', type: 'katakana' }, { char: 'コ', romaji: 'ko', type: 'katakana' },
  { char: 'サ', romaji: 'sa', type: 'katakana' }, { char: 'シ', romaji: 'shi', type: 'katakana' }, { char: 'ス', romaji: 'su', type: 'katakana' }, { char: 'セ', romaji: 'se', type: 'katakana' }, { char: 'ソ', romaji: 'so', type: 'katakana' },
  { char: 'タ', romaji: 'ta', type: 'katakana' }, { char: 'チ', romaji: 'chi', type: 'katakana' }, { char: 'ツ', romaji: 'tsu', type: 'katakana' }, { char: 'テ', romaji: 'te', type: 'katakana' }, { char: 'ト', romaji: 'to', type: 'katakana' },
  { char: 'ナ', romaji: 'na', type: 'katakana' }, { char: 'ニ', romaji: 'ni', type: 'katakana' }, { char: 'ヌ', romaji: 'nu', type: 'katakana' }, { char: 'ネ', romaji: 'ne', type: 'katakana' }, { char: 'ノ', romaji: 'no', type: 'katakana' },
  { char: 'ハ', romaji: 'ha', type: 'katakana' }, { char: 'ヒ', romaji: 'hi', type: 'katakana' }, { char: 'フ', romaji: 'fu', type: 'katakana' }, { char: 'ヘ', romaji: 'he', type: 'katakana' }, { char: 'ホ', romaji: 'ho', type: 'katakana' },
  { char: 'マ', romaji: 'ma', type: 'katakana' }, { char: 'ミ', romaji: 'mi', type: 'katakana' }, { char: 'ム', romaji: 'mu', type: 'katakana' }, { char: 'メ', romaji: 'me', type: 'katakana' }, { char: 'モ', romaji: 'mo', type: 'katakana' },
  { char: 'ヤ', romaji: 'ya', type: 'katakana' }, { char: 'ユ', romaji: 'yu', type: 'katakana' }, { char: 'ヨ', romaji: 'yo', type: 'katakana' },
  { char: 'ラ', romaji: 'ra', type: 'katakana' }, { char: 'リ', romaji: 'ri', type: 'katakana' }, { char: 'ル', romaji: 'ru', type: 'katakana' }, { char: 'レ', romaji: 're', type: 'katakana' }, { char: 'ロ', romaji: 'ro', type: 'katakana' },
  { char: 'ワ', romaji: 'wa', type: 'katakana' }, { char: 'ヲ', romaji: 'wo', type: 'katakana' }, { char: 'ン', romaji: 'n', type: 'katakana' }
];

/** GET /api/kana/random — um kana aleatório (query: type=hiragana|katakana|both) */
router.get('/random', (req, res) => {
  try {
    const type = (req.query.type || 'both').toLowerCase();
    let pool = KANA_LIST;
    if (type === 'hiragana') pool = KANA_LIST.filter(k => k.type === 'hiragana');
    else if (type === 'katakana') pool = KANA_LIST.filter(k => k.type === 'katakana');
    const kana = pool[Math.floor(Math.random() * pool.length)];
    res.json({ success: true, data: kana });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/kana/activity — retorna sessões recentes para compor a ofensiva */
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const days = Math.min(getPositiveInt(req.query.days, 30), 365);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const db = getDB();
    const sessions = await db.collection('kana_practice_sessions')
      .find(
        {
          user_id: req.user._id,
          createdAt: { $gte: since }
        },
        {
          projection: { _id: 0, createdAt: 1 }
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: {
        days,
        sessions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/kana/session — registra resultado da atividade de kana (autenticado) */
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { alphabet, syllables, score, total, durationSeconds } = req.body;
    if (total == null || total < 0) {
      return res.status(400).json({ success: false, message: 'Total de questões é obrigatório.' });
    }
    const doc = {
      user_id: req.user._id,
      alphabet: alphabet || 'both',
      syllables: Array.isArray(syllables) ? syllables : [],
      score: Math.max(0, Number(score) || 0),
      total: Math.max(0, Number(total) || 0),
      durationSeconds: durationSeconds != null ? Math.max(0, Number(durationSeconds)) : null,
      createdAt: new Date()
    };
    const db = getDB();
    const result = await db.collection('kana_practice_sessions').insertOne(doc);
    res.status(201).json({
      success: true,
      message: 'Sessão registrada.',
      data: { _id: result.insertedId, ...doc }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

