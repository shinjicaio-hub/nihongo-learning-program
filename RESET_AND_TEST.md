# Passo a passo: resetar servidores e sistema para teste

Este guia descreve como deixar o ambiente limpo e pronto para testar do zero (MongoDB, backend e fluxos de login/dados).

---

## Pré-requisitos

- **Node.js** 16+ instalado
- **MongoDB** instalado e acessível (local ou URI no `.env`)
- **Arquivo `.env`** na raiz do projeto (use `node create-env.js` ou copie do `env.example`)

---

## 1. Parar tudo que estiver rodando

1. **Backend (API)**  
   - No terminal onde está rodando `npm run dev` ou `node src/app.js`, pressione **Ctrl+C**.

2. **Frontend** (se estiver usando)  
   - No terminal do frontend, pressione **Ctrl+C**.

3. **Outros processos na porta**  
   - Se algo ainda estiver usando a porta **3001** (backend) ou **3000** (frontend), feche esse processo ou mate o processo pela porta.

---

## 2. Garantir que o MongoDB está rodando

- **Windows (serviço):**  
  `net start MongoDB`

- **Windows (manual):**  
  `mongod --dbpath C:\data\db`  
  (ajuste `C:\data\db` se usar outro diretório de dados)

- **Linux/macOS:**  
  `sudo systemctl start mongod`  
  ou  
  `brew services start mongodb-community`

- **Testar conexão:**  
  `npm run test:db`  
  Deve listar o database e as collections sem erro.

---

## 3. Resetar o banco de dados

Escolha **uma** das opções:

### Opção A – Banco limpo + só login (recomendado para testar login)

Remove todos os registros e cria **apenas um usuário admin** para login:

```bash
npm run db:clear
```

- **Resultado:** coleções `users`, `lessons`, `vocabulary`, `user_progress` vazias, com **1 usuário admin**.
- **Login para teste:**  
  - Email: `admin@nihongo.com`  
  - Senha: `admin123`

### Opção B – Banco com dados de exemplo

Mantém o banco zerado e depois **popula** com lições, vocabulário e usuários de exemplo:

```bash
node populate-database.js
```

- **Resultado:** usuários (admin, joão, maria), lições, vocabulário e progresso de exemplo.
- **Logins de teste:**  
  - Admin: `admin@nihongo.com` / `admin123`  
  - Usuário: `joao@email.com` / `senha123`  
  - Usuário: `maria@email.com` / `senha123`

---

## 4. Subir o backend (API)

Na **raiz do projeto**:

```bash
npm run dev
```

ou, sem nodemon:

```bash
npm start
```

- **Saída esperada:**  
  - “Conectado ao MongoDB com sucesso!”  
  - “Servidor rodando na porta 3001” (ou a porta do seu `.env`).

- **Abrir no navegador:** **http://localhost:3001/** — site com login, Meu histórico e aba Banco de Dados (admin).
- **URLs úteis:**  
  - Site: `http://localhost:3001/` | API: `http://localhost:3001/api` | Health: `http://localhost:3001/health`

---

## 5. Testar rapidamente (sem frontend)

### Health e status do MongoDB

```bash
curl http://localhost:3001/health
```

Ou abra no navegador: `http://localhost:3001/health`  
- Deve retornar `"status": "healthy"` e `"database": { "connected": true }` se o MongoDB estiver OK.

### Login (banco limpo com `db:clear`)

```bash
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@nihongo.com\",\"password\":\"admin123\"}"
```

(No PowerShell use aspas simples e escape interno; no Linux/macOS use aspas duplas e `\` para escape.)

- **Resposta esperada:** `success: true`, `data.user` e `data.token` (JWT).

### Listar lições (após `populate-database.js`)

```bash
curl http://localhost:3001/api/lessons
```

---

## 6. Fluxo completo de teste (resumo)

| Ordem | Ação | Comando / Ação |
|-------|------|----------------|
| 1 | Parar backend/frontend | Ctrl+C nos terminais |
| 2 | MongoDB rodando | `net start MongoDB` ou `mongod` / serviço |
| 3 | Limpar banco + 1 admin | `npm run db:clear` |
| 4 | (Opcional) Dados de exemplo | `node populate-database.js` |
| 5 | Iniciar API | `npm run dev` |
| 6 | Checar health | Abrir `http://localhost:3001/health` |
| 7 | Testar login | POST `/api/auth/login` com email/senha acima |

---

## 7. Problemas comuns

- **“Banco de dados não conectado”**  
  - MongoDB não está rodando ou a `MONGODB_URI` no `.env` está errada. Rode `npm run test:db`.

- **Porta 3001 em uso**  
  - Altere `PORT` no `.env` ou encerre o processo que está usando a 3001.

- **401 no login**  
  - Confirme email/senha (ex.: `admin@nihongo.com` / `admin123` após `db:clear`).  
  - Confirme que rodou `db:clear` ou `populate-database.js` para existir usuário.

- **404 em rotas da API**  
  - Use o prefixo `/api` (ex.: `http://localhost:3001/api/auth/login`, não `/auth/login`).

---

## 8. Scripts npm úteis

| Script | Uso |
|--------|-----|
| `npm run db:clear` | Zera o banco e cria 1 admin para login |
| `npm run test:db` | Testa conexão com o MongoDB |
| `npm run dev` | Sobe a API com nodemon |
| `npm start` | Sobe a API com node |
| `npm run seed` ou `node populate-database.js` | Popula banco com dados de exemplo |
| `node create-env.js` | Gera arquivo `.env` de exemplo |
