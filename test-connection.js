const http = require('http');

async function testConnection() {
  console.log('🔍 Testando conexão entre frontend e backend...\n');
  
  // Testar backend
  console.log('1. Testando backend (http://localhost:3001)...');
  try {
    const backendResponse = await fetch('http://localhost:3001/health');
    const backendData = await backendResponse.json();
    console.log('✅ Backend OK:', backendData.message);
  } catch (error) {
    console.log('❌ Backend ERRO:', error.message);
    return;
  }
  
  // Testar API admin
  console.log('\n2. Testando API admin (http://localhost:3001/api/admin/collections)...');
  try {
    const apiResponse = await fetch('http://localhost:3001/api/admin/collections');
    const apiData = await apiResponse.json();
    console.log('✅ API Admin OK:', `Encontradas ${apiData.collections.length} collections`);
    apiData.collections.forEach(col => {
      console.log(`   - ${col.name}: ${col.count} documentos`);
    });
  } catch (error) {
    console.log('❌ API Admin ERRO:', error.message);
    return;
  }
  
  // Testar frontend
  console.log('\n3. Testando frontend (http://localhost:3000)...');
  try {
    const frontendResponse = await fetch('http://localhost:3000');
    if (frontendResponse.ok) {
      console.log('✅ Frontend OK: Página carregada com sucesso');
    } else {
      console.log('❌ Frontend ERRO: Status', frontendResponse.status);
    }
  } catch (error) {
    console.log('❌ Frontend ERRO:', error.message);
    return;
  }
  
  console.log('\n🎉 Todos os testes passaram! A conexão está funcionando.');
  console.log('\n📋 Próximos passos:');
  console.log('1. Acesse http://localhost:3000');
  console.log('2. Clique na aba "Banco de Dados"');
  console.log('3. Verifique se as collections aparecem');
  console.log('4. Teste clicar em uma collection para ver os dados');
}

// Executar teste
testConnection().catch(console.error);
