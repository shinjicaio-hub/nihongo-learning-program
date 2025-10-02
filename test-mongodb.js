const { MongoClient } = require('mongodb');
require('dotenv').config();

const testConnection = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nihongo_learning';
  
  console.log('🔍 Testando conexão com MongoDB...');
  console.log('🔗 URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Mascarar credenciais
  
  try {
    const client = new MongoClient(uri);
    
    // Testar conexão
    console.log('⏳ Conectando...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar ping
    console.log('⏳ Testando ping...');
    await client.db().admin().ping();
    console.log('✅ Ping realizado com sucesso!');
    
    // Listar databases
    console.log('⏳ Listando databases...');
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('📊 Databases disponíveis:', dbs.databases.map(db => db.name));
    
    // Testar operação básica
    console.log('⏳ Testando operações básicas...');
    const testDb = client.db();
    const collections = await testDb.listCollections().toArray();
    console.log('📁 Collections no database atual:', collections.map(col => col.name));
    
    // Testar inserção simples
    console.log('⏳ Testando inserção...');
    const testCollection = testDb.collection('test_connection');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Teste de conexão realizado com sucesso!'
    });
    console.log('✅ Inserção realizada com sucesso! ID:', result.insertedId);
    
    // Limpar teste
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Dados de teste removidos');
    
    await client.close();
    console.log('✅ Conexão fechada com sucesso!');
    console.log('🎉 Teste de conexão MongoDB concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Dica: Verifique usuário e senha no .env');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Dica: Verifique o host/URL do cluster no .env');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Dica: Verifique sua conexão com a internet');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Dica: MongoDB não está rodando. Inicie o MongoDB local ou verifique a URI');
    }
    
    process.exit(1);
  }
};

// Executar teste
testConnection();

