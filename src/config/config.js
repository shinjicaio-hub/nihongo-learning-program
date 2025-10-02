module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },
  
  // Configurações do banco de dados
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nihongo_learning',
    name: 'nihongo_learning'
  },
  
  // Configurações de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
    expiresIn: '7d'
  },
  
  // Configurações de senha
  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
  },
  
  // Configurações de validação
  validation: {
    username: {
      minLength: 3,
      maxLength: 20
    },
    password: {
      minLength: 6
    }
  },
  
  // Configurações de níveis de dificuldade
  levels: {
    beginner: 'iniciante',
    intermediate: 'intermediário',
    advanced: 'avançado'
  },
  
  // Configurações de categorias de lições
  categories: {
    hiragana: 'hiragana',
    katakana: 'katakana',
    kanji: 'kanji',
    grammar: 'gramática',
    vocabulary: 'vocabulário',
    conversation: 'conversação'
  }
};
