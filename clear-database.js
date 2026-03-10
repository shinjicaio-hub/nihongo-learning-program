/**
 * Limpa o banco de dados MongoDB: remove todos os registros das coleções
 * e cria um único usuário admin para permitir login.
 *
 * Uso: node clear-database.js
 * Ou:  npm run db:clear
 *
 * Após executar:
 * - Coleções: users, lessons, vocabulary, user_progress ficam vazias
 * - Um usuário admin é criado para login
 * - Login: admin@nihongo.com / admin123
 */

require('dotenv').config();
const { connectDB, getDB } = require('./src/config/database');
const User = require('./src/models/User');

const COLLECTIONS = ['users', 'lessons', 'vocabulary', 'user_progress'];

const ADMIN_USER = {
  username: 'admin',
  email: 'admin@nihongo.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'Sistema',
  level: 'advanced',
  role: 'admin'
};

async function clearDatabase() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await connectDB();
    const db = getDB();

    console.log('🗑️ Limpando banco de dados (removendo todos os registros)...');
    for (const name of COLLECTIONS) {
      const result = await db.collection(name).deleteMany({});
      console.log(`   ${name}: ${result.deletedCount} documento(s) removido(s)`);
    }

    console.log('👤 Criando usuário admin para login...');
    await User.create(ADMIN_USER);
    console.log('   Admin criado: admin@nihongo.com');

    console.log('\n✅ Banco de dados limpo e pronto para uso.');
    console.log('\n🔑 Login com MongoDB:');
    console.log('   Email:    admin@nihongo.com');
    console.log('   Senha:    admin123');
    console.log('\n   Use POST /api/auth/login com { "email": "...", "password": "..." }');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
