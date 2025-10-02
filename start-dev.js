const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Nihongo Learning System...\n');

// Função para executar comando
const runCommand = (command, args, cwd, name, color) => {
  console.log(`${color}📦 Iniciando ${name}...`);
  
  const process = spawn(command, args, {
    cwd: cwd,
    stdio: 'inherit',
    shell: true
  });

  process.on('error', (error) => {
    console.error(`❌ Erro ao iniciar ${name}:`, error.message);
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`⚠️  ${name} encerrado com código ${code}`);
    }
  });

  return process;
};

// Verificar se estamos na pasta correta
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');

try {
  require(packageJsonPath);
} catch (error) {
  console.error('❌ Execute este script na pasta raiz do projeto (_nihongo-project)');
  process.exit(1);
}

// Iniciar backend
const backendPath = currentDir;
const backendProcess = runCommand('npm', ['run', 'dev'], backendPath, 'Backend', '🔧');

// Aguardar um pouco antes de iniciar o frontend
setTimeout(() => {
  // Iniciar frontend
  const frontendPath = path.join(currentDir, 'frontend', 'my-appexitcf');
  const frontendProcess = runCommand('npm', ['run', 'dev'], frontendPath, 'Frontend', '🎨');
  
  // Tratamento de sinais para encerrar ambos os processos
  const cleanup = () => {
    console.log('\n🛑 Encerrando servidores...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
}, 2000);

console.log('\n✅ Servidores iniciados!');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:3001');
console.log('📚 API: http://localhost:3001/api');
console.log('\n💡 Pressione Ctrl+C para encerrar ambos os servidores\n');

