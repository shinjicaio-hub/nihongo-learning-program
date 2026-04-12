require('dotenv').config();
const { connectDB, getDB } = require('../src/config/database');

const LESSON_SEED = [
  {
    key: 'intro-hiragana',
    title: 'Introdução ao Hiragana',
    description: 'Aprenda os primeiros caracteres hiragana básicos',
    level: 'beginner',
    category: 'hiragana',
    order: 1,
    content: [
      'Os hiraganas são a base da escrita japonesa',
      'Começaremos com as vogais: あ, い, う, え, お',
      'Cada caractere representa um som específico'
    ],
    exercises: [
      {
        type: 'multiple_choice',
        question: 'Qual é o som do caractere あ?',
        options: ['a', 'i', 'u', 'e', 'o'],
        correct: 0
      }
    ],
    duration: 30,
    isActive: true,
    prerequisites: [],
    tags: ['hiragana', 'basico', 'vogais']
  },
  {
    key: 'hiragana-linha-k',
    title: 'Hiragana - Linha K',
    description: 'Aprenda os caracteres hiragana da linha K',
    level: 'beginner',
    category: 'hiragana',
    order: 2,
    content: [
      'A linha K: か, き, く, け, こ',
      'Estes caracteres sao formados adicionando sons consonantais as vogais',
      'Pratique a leitura de cada caractere em sequencia'
    ],
    exercises: [
      {
        type: 'writing',
        question: 'Escreva o caractere para o som "ka"',
        answer: 'か'
      }
    ],
    duration: 45,
    isActive: true,
    prerequisites: ['intro-hiragana'],
    tags: ['hiragana', 'consoantes', 'linha-k']
  },
  {
    key: 'intro-katakana',
    title: 'Introdução ao Katakana',
    description: 'Aprenda os caracteres katakana básicos',
    level: 'beginner',
    category: 'katakana',
    order: 1,
    content: [
      'Os katakanas sao usados principalmente para palavras de origem estrangeira',
      'Comece pelas vogais: ア, イ, ウ, エ, オ',
      'As formas sao mais retas e angulares que no hiragana'
    ],
    exercises: [
      {
        type: 'matching',
        question: 'Relacione os katakanas com seus sons',
        pairs: [
          { katakana: 'ア', sound: 'a' },
          { katakana: 'イ', sound: 'i' },
          { katakana: 'ウ', sound: 'u' }
        ]
      }
    ],
    duration: 40,
    isActive: true,
    prerequisites: ['intro-hiragana'],
    tags: ['katakana', 'basico', 'vogais']
  },
  {
    key: 'vocab-cumprimentos',
    title: 'Vocabulário Básico - Cumprimentos',
    description: 'Aprenda cumprimentos essenciais em japones',
    level: 'beginner',
    category: 'vocabulary',
    order: 1,
    content: [
      'こんにちは (konnichiwa) - Ola',
      'おはよう (ohayou) - Bom dia',
      'こんばんは (konbanwa) - Boa noite',
      'ありがとう (arigatou) - Obrigado'
    ],
    exercises: [
      {
        type: 'translation',
        question: 'Como se diz "obrigado" em japones?',
        answer: 'ありがとう'
      }
    ],
    duration: 25,
    isActive: true,
    prerequisites: ['intro-hiragana'],
    tags: ['vocabulario', 'cumprimentos', 'basico']
  }
];

const VOCABULARY_SEED = [
  {
    lessonKey: 'vocab-cumprimentos',
    japanese: 'こんにちは',
    romaji: 'konnichiwa',
    portuguese: 'Ola',
    english: 'Hello',
    category: 'cumprimentos',
    level: 'beginner',
    example_sentence: 'こんにちは、田中さん',
    example_translation: 'Ola, Sr. Tanaka',
    notes: 'Usado durante o dia',
    tags: ['saudacao', 'dia']
  },
  {
    lessonKey: 'vocab-cumprimentos',
    japanese: 'ありがとう',
    romaji: 'arigatou',
    portuguese: 'Obrigado',
    english: 'Thank you',
    category: 'cumprimentos',
    level: 'beginner',
    example_sentence: 'ありがとうございます',
    example_translation: 'Muito obrigado',
    notes: 'Forma casual. ありがとうございます e mais formal.',
    tags: ['saudacao', 'educacao']
  },
  {
    lessonKey: 'vocab-cumprimentos',
    japanese: 'おはよう',
    romaji: 'ohayou',
    portuguese: 'Bom dia',
    english: 'Good morning',
    category: 'cumprimentos',
    level: 'beginner',
    example_sentence: 'おはようございます',
    example_translation: 'Bom dia (formal)',
    notes: 'Usado no periodo da manha.',
    tags: ['manha', 'saudacao']
  },
  {
    lessonKey: 'intro-hiragana',
    japanese: 'あさ',
    romaji: 'asa',
    portuguese: 'Manha',
    english: 'Morning',
    category: 'substantivos',
    level: 'beginner',
    example_sentence: 'あさです',
    example_translation: 'E de manha',
    notes: 'Boa palavra para treinar as vogais do hiragana.',
    tags: ['hiragana', 'vogais']
  },
  {
    lessonKey: 'hiragana-linha-k',
    japanese: 'かさ',
    romaji: 'kasa',
    portuguese: 'Guarda-chuva',
    english: 'Umbrella',
    category: 'substantivos',
    level: 'beginner',
    example_sentence: 'かさをもっています',
    example_translation: 'Estou com um guarda-chuva',
    notes: 'Ajuda a praticar a linha K.',
    tags: ['hiragana', 'linha-k']
  },
  {
    lessonKey: 'intro-katakana',
    japanese: 'コーヒー',
    romaji: 'koohii',
    portuguese: 'Cafe',
    english: 'Coffee',
    category: 'emprestimos',
    level: 'beginner',
    example_sentence: 'コーヒーをのみます',
    example_translation: 'Eu tomo cafe',
    notes: 'Palavra estrangeira tipica escrita em katakana.',
    tags: ['katakana', 'emprestimos']
  }
];

async function upsertLesson(db, lessonData) {
  const now = new Date();
  await db.collection('lessons').updateOne(
    { title: lessonData.title },
    {
      $set: {
        description: lessonData.description,
        level: lessonData.level,
        category: lessonData.category,
        order: lessonData.order,
        content: lessonData.content,
        exercises: lessonData.exercises,
        duration: lessonData.duration,
        isActive: lessonData.isActive,
        prerequisites: lessonData.prerequisites,
        tags: lessonData.tags,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  return db.collection('lessons').findOne({ title: lessonData.title });
}

async function upsertVocabulary(db, vocabularyData, lessonId) {
  const now = new Date();
  await db.collection('vocabulary').updateOne(
    { japanese: vocabularyData.japanese, lesson_id: lessonId },
    {
      $set: {
        romaji: vocabularyData.romaji,
        portuguese: vocabularyData.portuguese,
        english: vocabularyData.english,
        lesson_id: lessonId,
        category: vocabularyData.category,
        level: vocabularyData.level,
        example_sentence: vocabularyData.example_sentence,
        example_translation: vocabularyData.example_translation,
        notes: vocabularyData.notes,
        tags: vocabularyData.tags,
        isActive: true,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );
}

async function seed() {
  try {
    console.log('Conectando ao banco...');
    await connectDB();
    const db = getDB();

    console.log('Garantindo lições e vocabulario de exemplo sem apagar dados existentes...');
    const lessonsByKey = new Map();

    for (const lesson of LESSON_SEED) {
      const savedLesson = await upsertLesson(db, lesson);
      lessonsByKey.set(lesson.key, savedLesson);
    }

    for (const vocab of VOCABULARY_SEED) {
      const lesson = lessonsByKey.get(vocab.lessonKey);
      if (!lesson || !lesson._id) continue;
      await upsertVocabulary(db, vocab, lesson._id);
    }

    const lessonCount = await db.collection('lessons').countDocuments({ isActive: true });
    const vocabularyCount = await db.collection('vocabulary').countDocuments({ isActive: true });

    console.log('Seed concluido com sucesso.');
    console.log('Licoes ativas:', lessonCount);
    console.log('Vocabulario ativo:', vocabularyCount);
  } catch (error) {
    console.error('Falha ao executar seed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
