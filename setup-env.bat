@echo off
echo 🚀 Configurando ambiente do projeto Nihongo...

REM Criar pasta de logs se não existir
if not exist "logs" (
    mkdir logs
    echo ✅ Pasta 'logs' criada
)

REM Criar pasta de uploads se não existir
if not exist "uploads" (
    mkdir uploads
    echo ✅ Pasta 'uploads' criada
)

REM Renomear env.local para .env se não existir
if exist "env.local" (
    if not exist ".env" (
        ren env.local .env
        echo ✅ Arquivo '.env' criado a partir de 'env.local'
    ) else (
        echo ⚠️  Arquivo '.env' já existe. Mantendo ambos.
    )
) else (
    echo ❌ Arquivo 'env.local' não encontrado!
)

echo 🎯 Ambiente configurado com sucesso!
echo 📝 Verifique o arquivo '.env' e ajuste as configurações conforme necessário
echo 🔗 Para conectar ao MongoDB, certifique-se de que está rodando em: mongodb://localhost:27017
pause

