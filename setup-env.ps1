# Script PowerShell para configurar o ambiente
Write-Host "🚀 Configurando ambiente do projeto Nihongo..." -ForegroundColor Green

# Criar pasta de logs se não existir
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "✅ Pasta 'logs' criada" -ForegroundColor Green
}

# Criar pasta de uploads se não existir
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "✅ Pasta 'uploads' criada" -ForegroundColor Green
}

# Renomear env.local para .env se não existir
if (Test-Path "env.local") {
    if (!(Test-Path ".env")) {
        Rename-Item "env.local" ".env"
        Write-Host "✅ Arquivo '.env' criado a partir de 'env.local'" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Arquivo '.env' já existe. Mantendo ambos." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Arquivo 'env.local' não encontrado!" -ForegroundColor Red
}

Write-Host "🎯 Ambiente configurado com sucesso!" -ForegroundColor Green
Write-Host "📝 Verifique o arquivo '.env' e ajuste as configurações conforme necessário" -ForegroundColor Cyan
Write-Host "🔗 Para conectar ao MongoDB, certifique-se de que está rodando em: mongodb://localhost:27017" -ForegroundColor Cyan

