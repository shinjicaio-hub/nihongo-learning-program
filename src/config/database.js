const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nihongo_learning';

let db = null;

const connectDB = async () => {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Conectado ao MongoDB com sucesso!');
    
    // Criar índices para melhor performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Índices para usuários
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    
    // Índices para lições
    await db.collection('lessons').createIndex({ level: 1, order: 1 });
    await db.collection('lessons').createIndex({ category: 1 });
    
    // Índices para vocabulário
    await db.collection('vocabulary').createIndex({ lesson_id: 1 });
    await db.collection('vocabulary').createIndex({ japanese: 1 });
    await db.collection('vocabulary').createIndex({ romaji: 1 });
    
    // Índices para progresso do usuário
    await db.collection('user_progress').createIndex({ user_id: 1, lesson_id: 1 }, { unique: true });
    
    // Índices para sessões de prática de kana
    await db.collection('kana_practice_sessions').createIndex({ user_id: 1, createdAt: -1 });

    // Índices para sessões de prática de vocabulário (Trilha B)
    await db.collection('vocabulary_practice_sessions').createIndex({ user_id: 1, createdAt: -1 });
    await db.collection('vocabulary_practice_sessions').createIndex({ user_id: 1, mode: 1, createdAt: -1 });

    console.log('Índices criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar índices:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Banco de dados não conectado. Chame connectDB() primeiro.');
  }
  return db;
};

/** Retorna a instância do DB ou null (não lança erro). Útil para health check. */
const getDBSafe = () => db;

/** Verifica se o MongoDB está conectado e responsivo (ping). */
const checkConnection = async () => {
  if (!db) return { connected: false, error: 'Banco não inicializado' };
  try {
    await db.command({ ping: 1 });
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

module.exports = { connectDB, getDB, getDBSafe, checkConnection };
