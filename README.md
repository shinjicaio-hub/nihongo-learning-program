# Nihongo Learning

Sistema de aprendizado de japonês com **Express + MongoDB** e interface web em **`public/`** (HTML/CSS/JS), servida na mesma porta da API.

## Stack

| Camada | Tecnologia |
|--------|------------|
| API | Node.js, Express 5, JWT, MongoDB Driver |
| Site | `public/` — abas Início, Kana, Lições, Classes, Vocabulário, Histórico, Banco (admin) |
| Opcional | Submódulo `frontend/my-appexitcf` (Next.js) — legado, não é o site principal |

## Início rápido

```powershell
npm install
node create-env.js          # ou copie env.example → .env
npm run test:db             # MongoDB deve estar rodando
npm run seed                # lições + vocabulário (idempotente)
npm start                   # http://localhost:3001
```

**Login após `npm run db:clear`:** `admin@nihongo.com` / `admin123`

## Abas do site (`public/`)

- **Início** — ofensiva, heatmap (30 dias), retomar lição em andamento
- **Kana** — tabelas, prática de romaji, sessões salvas
- **Lições** — catálogo, detalhe, favoritos, pontuação, conclusão
- **Classes** — gramática 品詞, verbos, exemplos do vocabulário (`classes-guide.js`)
- **Vocabulário** — prática livre, revisão, teste, modo prova (português ou romaji)
- **Histórico** — progresso em lições + sessões de vocabulário
- **Banco de Dados** — inspeção de coleções (somente admin)

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm start` | API + site em `public/` (porta 3001) |
| `npm run dev` | Backend com nodemon |
| `npm run seed` | Seed idempotente (`scripts/seed.js`) |
| `npm run db:clear` | Limpa coleções e cria admin |
| `npm run test:db` | Testa conexão MongoDB |
| `npm run create:env` | Gera `.env` de exemplo |
| `node populate-database.js` | Dados de exemplo completos |
| `node start-dev.js` | Backend + Next.js (opcional) |

Reset completo do ambiente: **[RESET_AND_TEST.md](RESET_AND_TEST.md)**  
Problemas comuns: **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**  
Status do projeto: **[BOARD.md](BOARD.md)**

## Estrutura

```
_nihongo-project/
├── src/
│   ├── app.js           # Entry point
│   ├── config/          # DB, env
│   ├── models/          # User, Lesson, Vocabulary, UserProgress
│   ├── routes/          # auth, users, lessons, vocabulary, progress, kana, admin
│   ├── middleware/      # auth, validation
│   └── utils/           # errorHandler, objectId
├── public/              # Site principal
├── scripts/seed.js
├── populate-database.js
├── clear-database.js
└── test-mongodb.js
```

## Coleções MongoDB

- `users`, `lessons`, `vocabulary`, `user_progress`
- `kana_practice_sessions`, `vocabulary_practice_sessions`

## API (resumo)

Base: `http://localhost:3001/api`

| Grupo | Endpoints principais |
|-------|----------------------|
| `/auth` | `POST /login`, `POST /register`, `GET /verify`, `POST /refresh` |
| `/users` | `GET/PUT /profile`, `DELETE /profile` (autenticado) |
| `/lessons` | `GET /`, `GET /:id`, busca, nível, categoria |
| `/vocabulary` | aleatório, revisão, teste, `POST /session`, `GET /my-sessions` |
| `/progress` | progresso, favoritos, stats, leaderboard (autenticado) |
| `/kana` | `GET /random`, `GET /activity`, `POST /session` |
| `/admin` | collections, stats (admin) |

Health: `GET /health`

## Configuração (`.env`)

Use `env.example` como base. Principais variáveis:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/nihongo_learning
JWT_SECRET=sua_chave_secreta
```

## Licença

ISC
