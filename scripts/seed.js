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
  },
  {
    key: 'vocab-numeros',
    title: 'Vocabulário Básico - Números',
    description: 'Aprenda os números de 1 a 10 em japones',
    level: 'beginner',
    category: 'vocabulary',
    order: 2,
    content: [
      'いち (ichi) - 1',
      'に (ni) - 2',
      'さん (san) - 3',
      'よん / し (yon/shi) - 4',
      'ご (go) - 5'
    ],
    duration: 25,
    isActive: true,
    prerequisites: ['intro-hiragana'],
    tags: ['vocabulario', 'numeros', 'basico']
  },
  {
    key: 'vocab-familia',
    title: 'Vocabulário Básico - Família',
    description: 'Membros da família em japones',
    level: 'beginner',
    category: 'vocabulary',
    order: 3,
    content: [
      'おとうさん (otousan) - pai',
      'おかあさん (okaasan) - mae',
      'あに / おにいさん (ani / oniisan) - irmao mais velho',
      'いもうと (imouto) - irma mais nova'
    ],
    duration: 30,
    isActive: true,
    prerequisites: ['intro-hiragana'],
    tags: ['vocabulario', 'familia', 'basico']
  },
  {
    key: 'vocab-comida',
    title: 'Vocabulário Básico - Comida e bebida',
    description: 'Palavras essenciais sobre alimentos e bebidas',
    level: 'beginner',
    category: 'vocabulary',
    order: 4,
    content: [
      'ごはん (gohan) - arroz/refeicao',
      'みず (mizu) - agua',
      'おちゃ (ocha) - cha',
      'たまご (tamago) - ovo'
    ],
    duration: 30,
    isActive: true,
    prerequisites: ['intro-hiragana'],
    tags: ['vocabulario', 'comida', 'basico']
  },
  {
    key: 'vocab-cotidiano',
    title: 'Vocabulário Intermediário - Cotidiano',
    description: 'Palavras intermediarias para conversacao do dia a dia',
    level: 'intermediate',
    category: 'vocabulary',
    order: 5,
    content: [
      '学校 (gakkou) - escola',
      '電車 (densha) - trem',
      '友達 (tomodachi) - amigo',
      '勉強 (benkyou) - estudo'
    ],
    duration: 35,
    isActive: true,
    prerequisites: ['vocab-cumprimentos'],
    tags: ['vocabulario', 'cotidiano', 'intermediario']
  },
  {
    key: 'vocab-verbos',
    title: 'Vocabulário Intermediário - Verbos comuns',
    description: 'Verbos comuns para situacoes do dia a dia',
    level: 'intermediate',
    category: 'vocabulary',
    order: 6,
    content: [
      '食べる (taberu) - comer',
      '飲む (nomu) - beber',
      '行く (iku) - ir',
      '見る (miru) - ver/assistir'
    ],
    duration: 40,
    isActive: true,
    prerequisites: ['vocab-cumprimentos'],
    tags: ['vocabulario', 'verbos', 'intermediario']
  }
];

const VOCABULARY_SEED = [
  // Cumprimentos (beginner)
  { lessonKey: 'vocab-cumprimentos', japanese: 'こんにちは', romaji: 'konnichiwa', portuguese: 'Olá', english: 'Hello', category: 'cumprimentos', level: 'beginner', example_sentence: 'こんにちは、田中さん', example_translation: 'Olá, Sr. Tanaka', notes: 'Usado durante o dia', tags: ['saudacao', 'dia'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'おはよう', romaji: 'ohayou', portuguese: 'Bom dia', english: 'Good morning', category: 'cumprimentos', level: 'beginner', example_sentence: 'おはようございます', example_translation: 'Bom dia (formal)', notes: 'Usado de manhã.', tags: ['manha', 'saudacao'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'こんばんは', romaji: 'konbanwa', portuguese: 'Boa noite', english: 'Good evening', category: 'cumprimentos', level: 'beginner', example_sentence: 'こんばんは、お元気ですか', example_translation: 'Boa noite, como vai?', notes: 'Usado a partir do entardecer.', tags: ['noite', 'saudacao'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'ありがとう', romaji: 'arigatou', portuguese: 'Obrigado', english: 'Thank you', category: 'cumprimentos', level: 'beginner', example_sentence: 'ありがとうございます', example_translation: 'Muito obrigado', notes: 'Forma casual. ありがとうございます é mais formal.', tags: ['saudacao', 'educacao'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'すみません', romaji: 'sumimasen', portuguese: 'Desculpa / com licença', english: 'Excuse me', category: 'cumprimentos', level: 'beginner', notes: 'Pode pedir desculpa ou chamar atenção educadamente.', tags: ['educacao'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'はい', romaji: 'hai', portuguese: 'Sim', english: 'Yes', category: 'cumprimentos', level: 'beginner', tags: ['basico'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'いいえ', romaji: 'iie', portuguese: 'Não', english: 'No', category: 'cumprimentos', level: 'beginner', tags: ['basico'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'さようなら', romaji: 'sayounara', portuguese: 'Adeus', english: 'Goodbye', category: 'cumprimentos', level: 'beginner', notes: 'Despedida formal e mais definitiva.', tags: ['despedida'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'またね', romaji: 'matane', portuguese: 'Até logo', english: 'See you', category: 'cumprimentos', level: 'beginner', notes: 'Despedida casual entre amigos.', tags: ['despedida'] },
  { lessonKey: 'vocab-cumprimentos', japanese: 'お元気ですか', romaji: 'ogenki desu ka', portuguese: 'Como você está?', english: 'How are you?', category: 'cumprimentos', level: 'beginner', tags: ['pergunta'] },

  // Números (beginner)
  { lessonKey: 'vocab-numeros', japanese: 'いち', romaji: 'ichi', portuguese: 'um', english: 'one', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'に', romaji: 'ni', portuguese: 'dois', english: 'two', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'さん', romaji: 'san', portuguese: 'três', english: 'three', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'よん', romaji: 'yon', portuguese: 'quatro', english: 'four', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'ご', romaji: 'go', portuguese: 'cinco', english: 'five', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'ろく', romaji: 'roku', portuguese: 'seis', english: 'six', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'なな', romaji: 'nana', portuguese: 'sete', english: 'seven', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'はち', romaji: 'hachi', portuguese: 'oito', english: 'eight', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'きゅう', romaji: 'kyuu', portuguese: 'nove', english: 'nine', category: 'numeros', level: 'beginner', tags: ['numero'] },
  { lessonKey: 'vocab-numeros', japanese: 'じゅう', romaji: 'juu', portuguese: 'dez', english: 'ten', category: 'numeros', level: 'beginner', tags: ['numero'] },

  // Família (beginner)
  { lessonKey: 'vocab-familia', japanese: 'おとうさん', romaji: 'otousan', portuguese: 'pai', english: 'father', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'おかあさん', romaji: 'okaasan', portuguese: 'mãe', english: 'mother', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'おにいさん', romaji: 'oniisan', portuguese: 'irmão mais velho', english: 'older brother', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'おねえさん', romaji: 'oneesan', portuguese: 'irmã mais velha', english: 'older sister', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'おとうと', romaji: 'otouto', portuguese: 'irmão mais novo', english: 'younger brother', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'いもうと', romaji: 'imouto', portuguese: 'irmã mais nova', english: 'younger sister', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'おじいさん', romaji: 'ojiisan', portuguese: 'avô', english: 'grandfather', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'おばあさん', romaji: 'obaasan', portuguese: 'avó', english: 'grandmother', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'こども', romaji: 'kodomo', portuguese: 'criança', english: 'child', category: 'familia', level: 'beginner', tags: ['familia'] },
  { lessonKey: 'vocab-familia', japanese: 'かぞく', romaji: 'kazoku', portuguese: 'família', english: 'family', category: 'familia', level: 'beginner', tags: ['familia'] },

  // Comida e bebida (beginner)
  { lessonKey: 'vocab-comida', japanese: 'ごはん', romaji: 'gohan', portuguese: 'arroz / refeição', english: 'rice / meal', category: 'comida', level: 'beginner', tags: ['comida'] },
  { lessonKey: 'vocab-comida', japanese: 'みず', romaji: 'mizu', portuguese: 'água', english: 'water', category: 'bebida', level: 'beginner', example_sentence: 'みずをください', example_translation: 'Água, por favor', tags: ['bebida'] },
  { lessonKey: 'vocab-comida', japanese: 'おちゃ', romaji: 'ocha', portuguese: 'chá', english: 'tea', category: 'bebida', level: 'beginner', tags: ['bebida'] },
  { lessonKey: 'vocab-comida', japanese: 'たまご', romaji: 'tamago', portuguese: 'ovo', english: 'egg', category: 'comida', level: 'beginner', tags: ['comida'] },
  { lessonKey: 'vocab-comida', japanese: 'パン', romaji: 'pan', portuguese: 'pão', english: 'bread', category: 'comida', level: 'beginner', notes: 'Originalmente do português "pão".', tags: ['comida', 'emprestimos'] },
  { lessonKey: 'vocab-comida', japanese: 'りんご', romaji: 'ringo', portuguese: 'maçã', english: 'apple', category: 'comida', level: 'beginner', tags: ['comida', 'fruta'] },
  { lessonKey: 'vocab-comida', japanese: 'さかな', romaji: 'sakana', portuguese: 'peixe', english: 'fish', category: 'comida', level: 'beginner', tags: ['comida'] },
  { lessonKey: 'vocab-comida', japanese: 'にく', romaji: 'niku', portuguese: 'carne', english: 'meat', category: 'comida', level: 'beginner', tags: ['comida'] },
  { lessonKey: 'vocab-comida', japanese: 'コーヒー', romaji: 'koohii', portuguese: 'café', english: 'coffee', category: 'bebida', level: 'beginner', tags: ['katakana', 'bebida'] },
  { lessonKey: 'vocab-comida', japanese: 'ぎゅうにゅう', romaji: 'gyuunyuu', portuguese: 'leite', english: 'milk', category: 'bebida', level: 'beginner', tags: ['bebida'] },

  // Hiragana (vogais e linha K)
  { lessonKey: 'intro-hiragana', japanese: 'あさ', romaji: 'asa', portuguese: 'manhã', english: 'morning', category: 'substantivos', level: 'beginner', example_sentence: 'あさです', example_translation: 'É de manhã', notes: 'Boa palavra para treinar as vogais do hiragana.', tags: ['hiragana', 'vogais'] },
  { lessonKey: 'intro-hiragana', japanese: 'いえ', romaji: 'ie', portuguese: 'casa', english: 'house', category: 'substantivos', level: 'beginner', tags: ['hiragana'] },
  { lessonKey: 'intro-hiragana', japanese: 'うみ', romaji: 'umi', portuguese: 'mar', english: 'sea', category: 'substantivos', level: 'beginner', tags: ['hiragana'] },
  { lessonKey: 'intro-hiragana', japanese: 'え', romaji: 'e', portuguese: 'desenho / pintura', english: 'picture', category: 'substantivos', level: 'beginner', tags: ['hiragana'] },
  { lessonKey: 'intro-hiragana', japanese: 'おとこ', romaji: 'otoko', portuguese: 'homem', english: 'man', category: 'substantivos', level: 'beginner', tags: ['hiragana'] },
  { lessonKey: 'hiragana-linha-k', japanese: 'かさ', romaji: 'kasa', portuguese: 'guarda-chuva', english: 'umbrella', category: 'substantivos', level: 'beginner', example_sentence: 'かさをもっています', example_translation: 'Estou com um guarda-chuva', notes: 'Ajuda a praticar a linha K.', tags: ['hiragana', 'linha-k'] },
  { lessonKey: 'hiragana-linha-k', japanese: 'きいろ', romaji: 'kiiro', portuguese: 'amarelo', english: 'yellow', category: 'cores', level: 'beginner', tags: ['hiragana', 'cor'] },
  { lessonKey: 'hiragana-linha-k', japanese: 'くも', romaji: 'kumo', portuguese: 'nuvem', english: 'cloud', category: 'natureza', level: 'beginner', tags: ['hiragana', 'linha-k'] },
  { lessonKey: 'hiragana-linha-k', japanese: 'けさ', romaji: 'kesa', portuguese: 'esta manhã', english: 'this morning', category: 'tempo', level: 'beginner', tags: ['hiragana', 'linha-k'] },
  { lessonKey: 'hiragana-linha-k', japanese: 'こころ', romaji: 'kokoro', portuguese: 'coração', english: 'heart / mind', category: 'substantivos', level: 'beginner', tags: ['hiragana', 'linha-k'] },

  // Katakana (empréstimos)
  { lessonKey: 'intro-katakana', japanese: 'コーヒー', romaji: 'koohii', portuguese: 'café', english: 'coffee', category: 'emprestimos', level: 'beginner', tags: ['katakana', 'bebida'] },
  { lessonKey: 'intro-katakana', japanese: 'テレビ', romaji: 'terebi', portuguese: 'televisão', english: 'television', category: 'emprestimos', level: 'beginner', tags: ['katakana'] },
  { lessonKey: 'intro-katakana', japanese: 'カメラ', romaji: 'kamera', portuguese: 'câmera', english: 'camera', category: 'emprestimos', level: 'beginner', tags: ['katakana'] },
  { lessonKey: 'intro-katakana', japanese: 'バス', romaji: 'basu', portuguese: 'ônibus', english: 'bus', category: 'transporte', level: 'beginner', tags: ['katakana', 'transporte'] },
  { lessonKey: 'intro-katakana', japanese: 'タクシー', romaji: 'takushii', portuguese: 'táxi', english: 'taxi', category: 'transporte', level: 'beginner', tags: ['katakana', 'transporte'] },
  { lessonKey: 'intro-katakana', japanese: 'ホテル', romaji: 'hoteru', portuguese: 'hotel', english: 'hotel', category: 'emprestimos', level: 'beginner', tags: ['katakana', 'viagem'] },
  { lessonKey: 'intro-katakana', japanese: 'パソコン', romaji: 'pasokon', portuguese: 'computador', english: 'PC', category: 'tecnologia', level: 'beginner', notes: 'Encurtamento de personal computer.', tags: ['katakana'] },
  { lessonKey: 'intro-katakana', japanese: 'チョコレート', romaji: 'chokoreeto', portuguese: 'chocolate', english: 'chocolate', category: 'comida', level: 'beginner', tags: ['katakana', 'comida'] },

  // Cotidiano (intermediate)
  { lessonKey: 'vocab-cotidiano', japanese: '学校', romaji: 'gakkou', portuguese: 'escola', english: 'school', category: 'cotidiano', level: 'intermediate', example_sentence: '学校に行く', example_translation: 'Ir para a escola', notes: 'Composta por 学 (gaku) + 校 (kou).', tags: ['kanji', 'cotidiano'] },
  { lessonKey: 'vocab-cotidiano', japanese: '電車', romaji: 'densha', portuguese: 'trem', english: 'train', category: 'transporte', level: 'intermediate', tags: ['kanji', 'transporte'] },
  { lessonKey: 'vocab-cotidiano', japanese: '友達', romaji: 'tomodachi', portuguese: 'amigo', english: 'friend', category: 'pessoas', level: 'intermediate', tags: ['kanji', 'pessoas'] },
  { lessonKey: 'vocab-cotidiano', japanese: '勉強', romaji: 'benkyou', portuguese: 'estudo', english: 'study', category: 'cotidiano', level: 'intermediate', tags: ['kanji', 'cotidiano'] },
  { lessonKey: 'vocab-cotidiano', japanese: '会社', romaji: 'kaisha', portuguese: 'empresa', english: 'company', category: 'cotidiano', level: 'intermediate', tags: ['kanji', 'trabalho'] },
  { lessonKey: 'vocab-cotidiano', japanese: '駅', romaji: 'eki', portuguese: 'estação', english: 'station', category: 'lugar', level: 'intermediate', tags: ['kanji', 'transporte'] },
  { lessonKey: 'vocab-cotidiano', japanese: '時間', romaji: 'jikan', portuguese: 'tempo / hora', english: 'time', category: 'tempo', level: 'intermediate', tags: ['kanji'] },
  { lessonKey: 'vocab-cotidiano', japanese: '今日', romaji: 'kyou', portuguese: 'hoje', english: 'today', category: 'tempo', level: 'intermediate', tags: ['kanji', 'tempo'] },

  // Verbos (intermediate)
  { lessonKey: 'vocab-verbos', japanese: '食べる', romaji: 'taberu', portuguese: 'comer', english: 'to eat', category: 'verbos', level: 'intermediate', example_sentence: 'ご飯を食べる', example_translation: 'Comer arroz', notes: 'Verbo do grupo 2 (ichidan).', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '飲む', romaji: 'nomu', portuguese: 'beber', english: 'to drink', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '行く', romaji: 'iku', portuguese: 'ir', english: 'to go', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '来る', romaji: 'kuru', portuguese: 'vir', english: 'to come', category: 'verbos', level: 'intermediate', notes: 'Verbo irregular.', tags: ['verbo', 'irregular'] },
  { lessonKey: 'vocab-verbos', japanese: '見る', romaji: 'miru', portuguese: 'ver / assistir', english: 'to see / to watch', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '読む', romaji: 'yomu', portuguese: 'ler', english: 'to read', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '書く', romaji: 'kaku', portuguese: 'escrever', english: 'to write', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '話す', romaji: 'hanasu', portuguese: 'falar', english: 'to speak', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '聞く', romaji: 'kiku', portuguese: 'ouvir / perguntar', english: 'to listen / to ask', category: 'verbos', level: 'intermediate', tags: ['verbo'] },
  { lessonKey: 'vocab-verbos', japanese: '買う', romaji: 'kau', portuguese: 'comprar', english: 'to buy', category: 'verbos', level: 'intermediate', tags: ['verbo'] }
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
