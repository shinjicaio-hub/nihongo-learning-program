# 🔧 Guia de Resolução de Problemas

## 🚨 Problemas Comuns e Soluções

### 1. **Arquivo .env não encontrado**

**Problema:** A aplicação não consegue carregar as variáveis de ambiente.

**Solução:**
```bash
# Execute um dos scripts de configuração:
# PowerShell:
.\setup-env.ps1

# Ou CMD:
setup-env.bat

# Ou manualmente:
copy env.example .env
```

### 2. **Erro de Conexão com MongoDB**

**Problema:** `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Soluções:**

#### A) MongoDB não está rodando
```bash
# Windows - verificar serviço:
net start MongoDB

# Ou iniciar manualmente:
mongod --dbpath C:\data\db

# Linux/Mac:
sudo systemctl start mongod
# ou
brew services start mongodb-community
```

#### B) MongoDB em porta diferente
```bash
# Edite o .env:
MONGODB_URI=mongodb://localhost:27018/nihongo_learning
```

#### C) MongoDB com autenticação
```bash
# Edite o .env:
MONGODB_URI=mongodb://usuario:senha@localhost:27017/nihongo_learning
```

### 3. **Erro de Porta Ocupada**

**Problema:** `EADDRINUSE: address already in use :::3000`

**Solução:**
```bash
# Encontrar processo usando a porta:
netstat -ano | findstr :3000

# Matar o processo:
taskkill /PID [PID_NUMBER] /F

# Ou mudar a porta no .env:
PORT=3001
```

### 4. **Erro de Permissão**

**Problema:** `EACCES: permission denied`

**Solução:**
```bash
# Executar como administrador (Windows)
# Ou verificar permissões da pasta:
icacls . /grant Users:F /T
```

### 5. **Dependências não instaladas**

**Problema:** `Cannot find module 'express'`

**Solução:**
```bash
npm install
# ou
npm ci
```

### 6. **Erro de JWT Secret**

**Problema:** `JsonWebTokenError: jwt malformed`

**Solução:**
```bash
# Verifique se JWT_SECRET está definido no .env
# E se não tem espaços extras:
JWT_SECRET=sua_chave_secreta_aqui_sem_espacos
```

### 7. **Erro de CORS**

**Problema:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solução:**
```bash
# Edite o .env para incluir seu domínio:
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### 8. **Erro de Rate Limiting**

**Problema:** `Too many requests`

**Solução:**
```bash
# Ajuste no .env:
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=900000
```

## 🛠️ Comandos de Diagnóstico

### Verificar Status do MongoDB
```bash
# Conectar ao MongoDB:
mongosh
# ou
mongo

# Verificar bancos:
show dbs

# Verificar coleções:
use nihongo_learning
show collections
```

### Verificar Logs da Aplicação
```bash
# Iniciar com logs detalhados:
DEBUG=true npm run dev

# Ver logs em tempo real:
Get-Content logs/app.log -Wait
```

### Testar Conexão
```bash
# Testar se a API está respondendo:
curl http://localhost:3000/health

# Testar se o MongoDB está acessível:
telnet localhost 27017
```

## 🔍 Verificação de Ambiente

### Checklist de Configuração
- [ ] Arquivo `.env` existe e está configurado
- [ ] MongoDB está rodando na porta 27017
- [ ] Porta 3000 (ou configurada) está livre
- [ ] Todas as dependências estão instaladas
- [ ] Pastas `logs/` e `uploads/` existem
- [ ] JWT_SECRET está definido e é único

### Variáveis de Ambiente Obrigatórias
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nihongo_learning
JWT_SECRET=sua_chave_secreta_aqui
NODE_ENV=development
```

## 📞 Suporte

Se ainda tiver problemas:

1. **Verifique os logs:** `logs/app.log`
2. **Execute o diagnóstico:** `npm run dev`
3. **Verifique a versão do Node:** `node --version` (deve ser >=16)
4. **Verifique a versão do MongoDB:** `mongod --version`

## 🚀 Comandos Rápidos de Recuperação

```bash
# Reset completo do ambiente:
npm run db:reset
npm run lint:fix
npm run dev

# Verificar status:
curl http://localhost:3000/health
```

