const { connectDB, getDB } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function populateDatabase() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await connectDB();
    const db = getDB();
    
    console.log('🗑️ Limpando dados existentes...');
    await db.collection('users').deleteMany({});
    await db.collection('lessons').deleteMany({});
    await db.collection('vocabulary').deleteMany({});
    await db.collection('user_progress').deleteMany({});
    
    console.log('👥 Criando usuários de exemplo...');
    
    // Usuários de exemplo
    const users = [
      {
        username: 'admin',
        email: 'admin@nihongo.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'Sistema',
        level: 'advanced',
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        preferences: {
          studyTime: 60,
          notifications: true,
          language: 'pt-BR'
        }
      },
      {
        username: 'joao_silva',
        email: 'joao@email.com',
        password: await bcrypt.hash('senha123', 10),
        firstName: 'João',
        lastName: 'Silva',
        level: 'beginner',
        createdAt: new Date(),
        lastLogin: null,
        isActive: true,
        preferences: {
          studyTime: 30,
          notifications: true,
          language: 'pt-BR'
        }
      },
      {
        username: 'maria_santos',
        email: 'maria@email.com',
        password: await bcrypt.hash('senha123', 10),
        firstName: 'Maria',
        lastName: 'Santos',
        level: 'intermediate',
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        preferences: {
          studyTime: 45,
          notifications: true,
          language: 'pt-BR'
        }
      }
    ];
    
    const userResult = await db.collection('users').insertMany(users);
    console.log(`✅ ${userResult.insertedCount} usuários criados`);
    
    console.log('📚 Criando lições de exemplo...');
    
    // Lições de exemplo
    const lessons = [
      {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: [],
        tags: ['hiragana', 'básico', 'vogais']
      },
      {
        title: 'Hiragana - Linha K',
        description: 'Aprenda os caracteres hiragana da linha K',
        level: 'beginner',
        category: 'hiragana',
        order: 2,
        content: [
          'A linha K: か, き, く, け, こ',
          'Estes caracteres são formados adicionando traços ao hiragana base',
          'Pratique a escrita de cada caractere'
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
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: ['hiragana_vowels'],
        tags: ['hiragana', 'consoantes', 'linha_k']
      },
      {
        title: 'Introdução ao Katakana',
        description: 'Aprenda os caracteres katakana básicos',
        level: 'beginner',
        category: 'katakana',
        order: 1,
        content: [
          'Os katakanas são usados para palavras estrangeiras',
          'Começaremos com as vogais: ア, イ, ウ, エ, オ',
          'Têm formas mais angulares que o hiragana'
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
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: ['hiragana_basic'],
        tags: ['katakana', 'básico', 'vogais']
      },
      {
        title: 'Vocabulário Básico - Cumprimentos',
        description: 'Aprenda cumprimentos essenciais em japonês',
        level: 'beginner',
        category: 'vocabulary',
        order: 1,
        content: [
          'こんにちは (konnichiwa) - Olá',
          'おはよう (ohayou) - Bom dia',
          'こんばんは (konbanwa) - Boa noite',
          'ありがとう (arigatou) - Obrigado'
        ],
        exercises: [
          {
            type: 'translation',
            question: 'Como se diz "obrigado" em japonês?',
            answer: 'ありがとう'
          }
        ],
        duration: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: ['hiragana_basic'],
        tags: ['vocabulário', 'cumprimentos', 'básico']
      }
    ];
    
    const lessonResult = await db.collection('lessons').insertMany(lessons);
    console.log(`✅ ${lessonResult.insertedCount} lições criadas`);
    
    console.log('📖 Criando vocabulário de exemplo...');
    
    // Vocabulário de exemplo
    const vocabulary = [
      {
        japanese: 'こんにちは',
        romaji: 'konnichiwa',
        portuguese: 'Olá',
        category: 'cumprimentos',
        level: 'beginner',
        examples: [
          'こんにちは、田中さん (Konnichiwa, Tanaka-san) - Olá, Sr. Tanaka'
        ],
        notes: 'Usado durante o dia',
        createdAt: new Date(),
        isActive: true
      },
      {
        japanese: 'ありがとう',
        romaji: 'arigatou',
        portuguese: 'Obrigado',
        category: 'cumprimentos',
        level: 'beginner',
        examples: [
          'ありがとうございます (Arigatou gozaimasu) - Obrigado (formal)'
        ],
        notes: 'Forma casual. Use ありがとうございます para ser mais formal',
        createdAt: new Date(),
        isActive: true
      },
      {
        japanese: '水',
        romaji: 'mizu',
        portuguese: 'Água',
        category: 'substantivos',
        level: 'beginner',
        examples: [
          '水をください (Mizu o kudasai) - Água, por favor'
        ],
        notes: 'Substantivo básico e muito útil',
        createdAt: new Date(),
        isActive: true
      },
      {
        japanese: '食べる',
        romaji: 'taberu',
        portuguese: 'Comer',
        category: 'verbos',
        level: 'beginner',
        examples: [
          'ご飯を食べる (Gohan o taberu) - Comer arroz'
        ],
        notes: 'Verbo do grupo 2 (ichidan)',
        createdAt: new Date(),
        isActive: true
      },
      {
        japanese: '学校',
        romaji: 'gakkou',
        portuguese: 'Escola',
        category: 'substantivos',
        level: 'intermediate',
        examples: [
          '学校に行く (Gakkou ni iku) - Ir para a escola'
        ],
        notes: 'Palavra composta: 学 (gaku) + 校 (kou)',
        createdAt: new Date(),
        isActive: true
      }
    ];
    
    const vocabularyResult = await db.collection('vocabulary').insertMany(vocabulary);
    console.log(`✅ ${vocabularyResult.insertedCount} palavras de vocabulário criadas`);
    
    console.log('📈 Criando progresso de usuários...');
    
    // Progresso de usuários
    const userProgress = [
      {
        userId: userResult.insertedIds[0], // admin
        lessonId: lessonResult.insertedIds[0],
        status: 'completed',
        score: 95,
        completedAt: new Date(),
        timeSpent: 25, // minutos
        attempts: 1
      },
      {
        userId: userResult.insertedIds[1], // joao
        lessonId: lessonResult.insertedIds[0],
        status: 'in_progress',
        score: 0,
        completedAt: null,
        timeSpent: 15,
        attempts: 1
      },
      {
        userId: userResult.insertedIds[1], // joao
        lessonId: lessonResult.insertedIds[1],
        status: 'not_started',
        score: 0,
        completedAt: null,
        timeSpent: 0,
        attempts: 0
      },
      {
        userId: userResult.insertedIds[2], // maria
        lessonId: lessonResult.insertedIds[0],
        status: 'completed',
        score: 88,
        completedAt: new Date(),
        timeSpent: 30,
        attempts: 2
      },
      {
        userId: userResult.insertedIds[2], // maria
        lessonId: lessonResult.insertedIds[1],
        status: 'completed',
        score: 92,
        completedAt: new Date(),
        timeSpent: 40,
        attempts: 1
      }
    ];
    
    // Inserir progresso um por vez para evitar conflitos
    let progressCount = 0;
    for (const progress of userProgress) {
      try {
        await db.collection('user_progress').insertOne(progress);
        progressCount++;
      } catch (error) {
        console.log(`⚠️ Erro ao inserir progresso: ${error.message}`);
      }
    }
    console.log(`✅ ${progressCount} registros de progresso criados`);
    
    console.log('\n🎉 Banco de dados populado com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`👥 Usuários: ${userResult.insertedCount}`);
    console.log(`📚 Lições: ${lessonResult.insertedCount}`);
    console.log(`📖 Vocabulário: ${vocabularyResult.insertedCount}`);
    console.log(`📈 Progresso: ${progressCount}`);
    
    console.log('\n🔑 Credenciais de teste:');
    console.log('Admin: admin@nihongo.com / admin123');
    console.log('Usuário: joao@email.com / senha123');
    console.log('Usuário: maria@email.com / senha123');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
  } finally {
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateDatabase();
}

module.exports = populateDatabase;
