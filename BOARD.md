# Board do Projeto Nihongo

Etapas realizadas no projeto, organizadas por fases e operações **CRUD** (Create, Read, Update, Delete).

---

## Legenda CRUD

| Sigla | Operação | Método HTTP |
|-------|----------|-------------|
| **C** | Create  | POST   |
| **R** | Read    | GET    |
| **U** | Update  | PUT/PATCH |
| **D** | Delete  | DELETE |

---

## 1. Infraestrutura e Backend

| Etapa | Status | Descrição |
|-------|--------|-----------|
| Criação do backend | ✅ | Aplicação Express (Node.js), `src/app.js` |
| Estrutura de pastas | ✅ | `src/` (routes, models, config, middleware, utils) |
| Variáveis de ambiente | ✅ | `dotenv`, `.env` (PORT, MONGODB_URI, JWT, etc.) |
| Middlewares globais | ✅ | CORS, Helmet, compression, rate limit, morgan, `express.json()` |
| Servir front-end | ✅ | `public/` (HTML, CSS, JS) em `/` e arquivos estáticos |
| Rota de status da API | ✅ | `GET /api/status` (health check) |

---

## 2. Banco de Dados MongoDB

| Etapa | Status | Descrição |
|-------|--------|-----------|
| Conexão com MongoDB | ✅ | `src/config/database.js`, `connectDB()`, `getDB()` |
| URI configurável | ✅ | `MONGODB_URI` (ex.: `mongodb://localhost:27017/nihongo_learning`) |
| Índices | ✅ | users (email, username), lessons, vocabulary, user_progress, kana_practice_sessions, vocabulary_practice_sessions (`user_id+createdAt`, `user_id+mode+createdAt`) |
| Scripts de apoio | ✅ | `populate-database.js`, `clear-database.js`, `test-mongodb.js` |
| Seed idempotente | ✅ | `scripts/seed.js` (`npm run seed`) — upsert de **9 lições** e **76 palavras** de vocabulário (cumprimentos, números, família, comida, hiragana, katakana, cotidiano, verbos), sem apagar dados existentes |

**Coleções principais:** `users`, `lessons`, `vocabulary`, `user_progress`, `kana_practice_sessions`, `vocabulary_practice_sessions`.

---

## 3. Autenticação e Usuários

| Operação | Status | Rota / Ação |
|----------|--------|-------------|
| **C** | ✅ | `POST /api/auth/register` — registro de usuário |
| **C** | ✅ | `POST /api/auth/login` — login (retorna JWT) |
| **R** | ✅ | `GET /api/auth/verify` — validar token |
| **C** | ✅ | `POST /api/auth/refresh` — renovar token |

| Operação | Status | Rota / Ação (usuário autenticado) |
|----------|--------|-------------------------------------|
| **R** | ✅ | `GET /api/users/profile` — perfil do usuário logado |
| **U** | ✅ | `PUT /api/users/profile` — atualizar perfil |
| **R** | ✅ | `GET /api/users/profile/stats` — estatísticas do perfil |
| **R** | ✅ | `GET /api/users/:id` — usuário por ID (autorizado) |
| **U** | ✅ | `PUT /api/users/:id` — atualizar usuário por ID (autorizado) |
| **D** | ✅ | `DELETE /api/users/profile` — excluir própria conta |

---

## 4. Lições (Lessons)

| Operação | Status | Rota / Ação |
|----------|--------|-------------|
| **R** | ✅ | `GET /api/lessons` — listar lições |
| **R** | ✅ | `GET /api/lessons/:id` — lição por ID |
| **R** | ✅ | `GET /api/lessons/:id/vocabulary` — vocabulário da lição |
| **R** | ✅ | `GET /api/lessons/:id/next` — próxima lição |
| **R** | ✅ | `GET /api/lessons/:id/previous` — lição anterior |
| **R** | ✅ | `GET /api/lessons/search/:term` — busca |
| **R** | ✅ | `GET /api/lessons/level/:level` — por nível |
| **R** | ✅ | `GET /api/lessons/category/:category` — por categoria |
| **R** | ✅ | `GET /api/lessons/stats/overview` — visão geral de estatísticas |

*(Lições são lidas do banco; criação/edição/remoção via admin ou scripts.)*

---

## 5. Vocabulário (Vocabulary)

| Operação | Status | Rota / Ação |
|----------|--------|-------------|
| **R** | ✅ | `GET /api/vocabulary/lesson/:lessonId` — por lição |
| **R** | ✅ | `GET /api/vocabulary/category/:category` — por categoria |
| **R** | ✅ | `GET /api/vocabulary/level/:level` — por nível |
| **R** | ✅ | `GET /api/vocabulary/search/:term` — busca |
| **R** | ✅ | `GET /api/vocabulary/random/practice` — aleatório para prática |
| **R** | ✅ | `GET /api/vocabulary/:id` — item por ID |
| **R** | ✅ | `GET /api/vocabulary/review/session` — sessão de revisão (autenticado) |
| **R** | ✅ | `GET /api/vocabulary/test/session` — sessão de teste (autenticado); aceita `?answerType=portuguese\|romaji` para gerar resposta correta + distratores reais (extraídos do mesmo lote/nível/categoria) no campo escolhido |
| **R** | ✅ | `GET /api/vocabulary/my-sessions` — sessões de prática do usuário logado (mais recentes primeiro, `limit` até 100) |
| **C** | ✅ | `POST /api/vocabulary/session` — registrar sessão de prática (autenticado): `{ mode, level, category, answerType, score, total, durationSeconds, examPoints }` |
| **R** | ✅ | `GET /api/vocabulary/stats/overview` — estatísticas |
| **R** | ✅ | `GET /api/vocabulary/tags/:tag` — por tag |

*(Vocabulário gerenciado via `npm run seed` (idempotente) e admin; API expõe leitura, sessões de prática/teste/revisão/prova e histórico do próprio usuário.)*

---

## 6. Progresso do Usuário (Progress)

| Operação | Status | Rota / Ação |
|----------|--------|-------------|
| **R** | ✅ | `GET /api/progress/my-progress` — progresso do usuário logado |
| **R** | ✅ | `GET /api/progress/lesson/:lessonId` — progresso em uma lição |
| **C** | ✅ | `POST /api/progress/lesson/:lessonId` — iniciar/registrar progresso |
| **U** | ✅ | `PUT /api/progress/lesson/:lessonId/complete` — marcar lição concluída |
| **U** | ✅ | `PUT /api/progress/lesson/:lessonId/score` — atualizar pontuação |
| **U** | ✅ | `PUT /api/progress/lesson/:lessonId/favorite` — favoritar/desfavoritar |
| **R** | ✅ | `GET /api/progress/completed` — lições concluídas |
| **R** | ✅ | `GET /api/progress/in-progress` — em andamento |
| **R** | ✅ | `GET /api/progress/favorites` — favoritos |
| **R** | ✅ | `GET /api/progress/stats` — estatísticas |
| **R** | ✅ | `GET /api/progress/leaderboard` — ranking |
| **R** | ✅ | `GET /api/progress/user/:userId` — progresso de usuário (autorizado) |
| **R** | ✅ | `GET /api/progress/user/:userId/stats` — stats do usuário (autorizado) |

---

## 7. Prática de Kana

| Operação | Status | Rota / Ação |
|----------|--------|-------------|
| **R** | ✅ | `GET /api/kana/random` — kana aleatório (query: type) |
| **R** | ✅ | `GET /api/kana/activity` — sessões recentes do usuário (autenticado; query `days`, padrão 30, máx. 365) para suporte à ofensiva na aba Início |
| **C** | ✅ | `POST /api/kana/session` — registrar sessão de prática (autenticado) |

Front-end: prática com hiragana/katakana, baralho (mostrar todos antes de repetir), contagem de acertos/total, delay ao errar, Enter para verificar/próximo.

---

## 8. Admin / Banco de Dados (Interface)

| Operação | Status | Rota / Ação |
|----------|--------|-------------|
| **R** | ✅ | `GET /api/admin/database/status` — status do banco |
| **R** | ✅ | `GET /api/admin/collections` — listar coleções |
| **R** | ✅ | `GET /api/admin/collections/:collectionName` — documentos da coleção (com paginação) |
| **R** | ✅ | `GET /api/admin/collections/:collectionName/:documentId` — documento por ID |
| **R** | ✅ | `GET /api/admin/stats` — estatísticas gerais |

*(Leitura para painel admin; alterações em massa via scripts.)*

---

## 9. Front-end (Telas e Fluxos)

| Etapa | Status | Descrição |
|-------|--------|-----------|
| Login / Registro | ✅ | Tela de login, token no `localStorage` |
| Abas principais | ✅ | Início, Kana, Lições, **Classes**, Vocabulário, Histórico, Banco de Dados |
| Cabeçalho logado | ✅ | Bloco de marca (`brand-block`), subtítulo, abas com `aria-label`, botão Sair |
| Aba Início — ofensiva | ✅ | Contagem em destaque de dias **consecutivos** com atividade nos últimos 30 dias (calendário local); dados de `GET /api/progress/my-progress` (`last_accessed`) + `GET /api/kana/activity?days=30` (`createdAt`) + sessões de vocabulário; estados visuais vazios/erro e faixas por tamanho da ofensiva |
| Aba Início — heatmap | ✅ | Grade de **30 dias** com 4 níveis de intensidade (atividade combinada de kana + vocabulário + progresso de lições), legenda “Menos / Mais”, resumo numérico e `aria-live` |
| Aba Início — retomada | ✅ | Card “Continuar de onde parou”: primeira lição com status `in_progress` em `my-progress`; botão abre a aba Lições e o detalhe da lição |
| Aba Início — teste manual | ✅ | Painel opcional para simular ofensiva 0–30 (demonstração) via `localStorage`; “Voltar ao automático” restaura o cálculo real |
| Prática de Kana | ✅ | Customização (alfabeto/sílabas), atividade, resumo, baralho, contagem, Enter |
| Aba Classes (品詞) | ✅ | Referência de gramática no `public/`: diagrama SVG clicável (名詞, 動詞, い/な形容詞, 副詞, 助詞), gráfico 五段/一段/不规则, cartões com exemplos de `GET /api/vocabulary/random/practice` + fallback fixo, chips de filtro, roteiro de estudo e botão para aba Vocabulário (`public/classes-guide.js`) |
| Aba Vocabulário | ✅ | 4 modos: **Prática livre**, **Revisão** (autenticado), **Teste** (múltipla escolha), **Modo prova** (timer + pontuação acumulada). Filtros por nível/categoria/limite e seletor **Tipo de resposta** (`Tradução` ou `Romaji`) que altera prompt, placeholder, dicas exibidas e o critério de acerto/distratores. Persistência das sessões via `POST /api/vocabulary/session` |
| Listagem de lições | ✅ | Filtros por nível/categoria/status, badges de progresso (`Concluído`/`Em andamento`/`Não iniciado`) e `score`; detalhe da lição com **range** de pontuação, botão **Marcar como concluído** e toggle de **favorito** |
| Histórico | ✅ | Cards estruturados: progresso por lição (status, score, tentativas) e sessões de vocabulário (modo, nível, categoria, acertos, duração) buscadas em `GET /api/vocabulary/my-sessions` |
| Aba Banco de Dados | ✅ | Status da conexão e inspeção de coleções/documentos (`/api/admin/*`, role admin) |

---

## 10. Segurança e Qualidade

| Etapa | Status | Descrição |
|-------|--------|-------------|
| JWT | ✅ | Middleware `authenticateToken`, rotas protegidas |
| Autorização | ✅ | `authorizeResource` para recurso do usuário |
| Validação | ✅ | Middlewares de validação (registro, login, atualização de usuário) |
| Rate limit | ✅ | Limite de requisições por IP em `/api/` |
| Tratamento de erros | ✅ | `errorHandler`, `notFoundHandler` em `utils/errorHandler.js` |

---

## Resumo CRUD por recurso

| Recurso | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Auth (login/register) | ✅ | ✅ (verify/refresh) | — | — |
| Users | (register) | ✅ | ✅ | ✅ (profile) |
| Lessons | (seed/admin) | ✅ | — | — |
| Vocabulary | ✅ (sessões de prática) | ✅ (incl. `my-sessions`, `test/session?answerType=…`) | — | — |
| Progress | ✅ | ✅ | ✅ | — |
| Kana sessions | ✅ | ✅ (random, activity) | — | — |
| Admin (DB) | — | ✅ | — | — |

---

*Última atualização do board: limpeza de código/docs obsoletos; site em `public/` (porta 3001); aba Classes (品詞); seed `npm run seed`; vocabulário tradução/romaji.*
