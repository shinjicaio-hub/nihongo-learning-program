# 🗾 Nihongo Learning

Sistema simples de aprendizado de língua japonesa com backend em Node.js/Express/MongoDB e frontend em Next.js/React/TypeScript.

## 🚀 Características

### Backend (Node.js/Express/MongoDB)
- **Sistema de Autenticação**: Registro, login e gerenciamento de usuários com JWT
- **Gestão de Lições**: Organização hierárquica por níveis e categorias
- **Sistema de Vocabulário**: Palavras e frases japonesas com traduções (prática, teste, sessões)

### Site principal (`public/`)
- **Classes (品詞)**: Mapa visual das partes da fala e grupos de verbos (`classes-guide.js`)
- **Vocabulário**: Prática livre, revisão, teste e modo prova (tradução ou romaji)
- **Kana, Lições, Histórico**: Prática de sílabas, progresso e favoritos
- **Rastreamento de Progresso**: Acompanhamento do aprendizado do usuário
- **API RESTful**: Endpoints bem estruturados e documentados
- **Segurança**: Validação, autenticação e autorização robustas
- **Escalabilidade**: Arquitetura modular e extensível

### Frontend (Next.js/React/TypeScript)
- **Interface Moderna**: Design responsivo com Tailwind CSS e shadcn/ui
- **Quiz Interativo**: Sistema de perguntas e respostas em japonês
- **Tabelas de Caracteres**: Visualização de Hiragana e Katakana
- **Visualizador de Banco**: Interface para explorar dados do sistema
- **Navegação Intuitiva**: Sistema de abas e componentes reutilizáveis
- **Performance Otimizada**: React 19 com hooks otimizados

## 🏗️ Arquitetura

### Estrutura do Projeto
```
_nihongo-project/
├── src/                    # Backend (Node.js/Express)
│   ├── config/            # Configurações da aplicação
│   ├── models/            # Modelos de dados (MongoDB)
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares personalizados
│   ├── utils/             # Utilitários e funções auxiliares
│   └── app.js             # Arquivo principal da aplicação
├── frontend/
│   └── my-appexitcf/      # Frontend (Next.js/React)
│       ├── app/           # Páginas da aplicação
│       ├── components/    # Componentes React
│       ├── lib/           # Utilitários e configurações
│       └── public/        # Arquivos estáticos
├── logs/                  # Logs da aplicação
├── uploads/               # Arquivos enviados
└── docs/                  # Documentação
```

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB (versão 4.4 ou superior)
- npm ou yarn

## 🛠️ Instalação e Execução

### Início Rápido

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd _nihongo-project
   ```

2. **Configure o ambiente**
   ```bash
   # Criar arquivo .env
   node create-env.js
   ```

3. **Instale dependências do backend**
   ```bash
   npm install
   ```

4. **Instale dependências do frontend**
   ```bash
   cd frontend/my-appexitcf
   npm install
   cd ../..
   ```

5. **Configure o banco de dados**
   - Certifique-se de que o MongoDB está rodando
   - **Banco limpo (sem registros) + login:** deixe o banco vazio e crie só um usuário admin para login:
   ```bash
   npm run db:clear
   ```
   Depois use **Login** com: `admin@nihongo.com` / `admin123` (POST `/api/auth/login`).
   - **Banco com dados de exemplo:** lições, vocabulário e usuários de teste:
   ```bash
   node populate-database.js
   ```

6. **Execute o sistema completo**
   ```bash
   # Opção 1: Executar ambos simultaneamente
   node start-dev.js
   
   # Opção 2: Executar separadamente
   # Terminal 1 - Backend
   node src/app.js
   
   # Terminal 2 - Frontend
   cd frontend/my-appexitcf
   npm run dev
   ```

### Acesso ao Sistema
- **Site (front-end + back-end junto):** abra **http://localhost:3001/** no navegador (`npm start`). Interface em `public/` (HTML/CSS/JS).
  - **Abas:** Início (ofensiva/heatmap), Kana, Lições, **Classes** (gramática 品詞), Vocabulário, Histórico, Banco de Dados (admin).
  - **Back-end:** API na mesma origem (`/api/*`).
  - **Vocabulário no banco:** `npm run seed` (idempotente) ou `node populate-database.js` (recria exemplos).
- **Health Check:** http://localhost:3001/health

### Reset e testes do zero
Para parar servidores, limpar o banco e subir tudo de novo para teste, siga o passo a passo em **[RESET_AND_TEST.md](RESET_AND_TEST.md)**.

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `env.example`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/nihongo_learning

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Banco de Dados

O sistema usa MongoDB com as seguintes coleções:

- `users` - Usuários do sistema
- `lessons` - Lições de aprendizado
- `vocabulary` - Vocabulário japonês
- `user_progress` - Progresso dos usuários

## 📚 Estrutura da API

### Autenticação (`/api/auth`)

- `POST /register` - Registro de usuário
- `POST /login` - Login de usuário
- `GET /verify` - Verificar token
- `POST /refresh` - Renovar token

### Usuários (`/api/users`)

- `GET /profile` - Perfil do usuário atual
- `PUT /profile` - Atualizar perfil
- `GET /:id` - Obter usuário por ID
- `PUT /:id` - Atualizar usuário
- `DELETE /profile` - Desativar conta

### Lições (`/api/lessons`)

- `GET /` - Listar todas as lições
- `GET /:id` - Obter lição por ID
- `GET /:id/vocabulary` - Vocabulário da lição
- `GET /:id/next` - Próxima lição
- `GET /:id/previous` - Lição anterior
- `GET /search/:term` - Buscar lições
- `GET /level/:level` - Lições por nível
- `GET /category/:category` - Lições por categoria

### Vocabulário (`/api/vocabulary`)

- `GET /lesson/:lessonId` - Vocabulário por lição
- `GET /category/:category` - Vocabulário por categoria
- `GET /level/:level` - Vocabulário por nível
- `GET /search/:term` - Buscar vocabulário
- `GET /random/practice` - Vocabulário aleatório para prática
- `GET /review/session` - Sessão de revisão
- `GET /test/session` - Sessão de teste

### Progresso (`/api/progress`)

- `GET /my-progress` - Progresso do usuário
- `GET /lesson/:lessonId` - Progresso de uma lição
- `POST /lesson/:lessonId` - Iniciar/atualizar progresso
- `PUT /lesson/:lessonId/complete` - Marcar como concluída
- `PUT /lesson/:lessonId/score` - Atualizar pontuação
- `PUT /lesson/:lessonId/favorite` - Marcar como favorita
- `GET /completed` - Lições concluídas
- `GET /in-progress` - Lições em progresso
- `GET /favorites` - Lições favoritas
- `GET /stats` - Estatísticas do usuário
- `GET /leaderboard` - Ranking geral

### Administração (`/api/admin`)

- `GET /collections` - Listar todas as collections do banco
- `GET /collections/:name` - Obter documentos de uma collection
- `GET /stats` - Estatísticas gerais do sistema
- `GET /users` - Listar usuários
- `GET /users/:id` - Obter usuário
- `PUT /users/:id` - Atualizar usuário
- `PUT /users/:id/status` - Alterar status do usuário
- `POST /lessons` - Criar lição
- `PUT /lessons/:id` - Atualizar lição
- `DELETE /lessons/:id` - Desativar lição
- `POST /vocabulary` - Criar vocabulário
- `PUT /vocabulary/:id` - Atualizar vocabulário
- `DELETE /vocabulary/:id` - Desativar vocabulário
- `GET /stats/system` - Estatísticas do sistema
- `GET /stats/usage` - Estatísticas de uso

## 🎨 Interface do Frontend

### Componentes Principais

- **Navigation**: Sistema de navegação por abas
- **JapaneseQuiz**: Quiz interativo com perguntas em japonês
- **CharacterTables**: Tabelas de Hiragana e Katakana
- **DatabaseViewer**: Interface para visualizar dados do banco
- **Progress**: Componente de progresso visual

### Funcionalidades da Interface

- **Quiz Interativo**: Sistema de perguntas e respostas
- **Tabelas de Caracteres**: Visualização completa de Hiragana e Katakana
- **Visualizador de Banco**: Interface para explorar collections e documentos
- **Design Responsivo**: Adaptável a diferentes tamanhos de tela
- **Tema Escuro/Claro**: Suporte a temas (via Tailwind CSS)
- **Componentes Reutilizáveis**: UI components com shadcn/ui

## 🔐 Autenticação e Autorização

### JWT (JSON Web Tokens)

O sistema usa JWT para autenticação:

1. **Login**: Usuário recebe um token JWT
2. **Autenticação**: Token é enviado no header `Authorization: Bearer <token>`
3. **Autorização**: Middleware verifica permissões baseadas no role do usuário

### Níveis de Acesso

- **Usuário comum**: Acesso às próprias rotas e conteúdo público
- **Administrador**: Acesso completo ao sistema

### Middleware de Segurança

- `authenticateToken`: Verifica se o usuário está autenticado
- `requireAdmin`: Verifica se o usuário é administrador
- `authorizeResource`: Verifica se o usuário pode acessar um recurso específico
- `requireLevel`: Verifica se o usuário tem nível suficiente para acessar conteúdo

## 📊 Modelos de Dados

### Usuário (User)

```javascript
{
  username: String,
  email: String,
  password: String (hasheada),
  firstName: String,
  lastName: String,
  level: String (beginner/intermediate/advanced),
  createdAt: Date,
  lastLogin: Date,
  isActive: Boolean,
  preferences: Object,
  role: String (user/admin)
}
```

### Lição (Lesson)

```javascript
{
  title: String,
  description: String,
  level: String,
  category: String,
  order: Number,
  content: Array,
  exercises: Array,
  duration: Number,
  isActive: Boolean,
  prerequisites: Array,
  tags: Array
}
```

### Vocabulário (Vocabulary)

```javascript
{
  japanese: String,
  romaji: String,
  portuguese: String,
  english: String,
  lesson_id: ObjectId,
  category: String,
  level: String,
  audio_url: String,
  example_sentence: String,
  example_translation: String,
  notes: String,
  tags: Array
}
```

### Progresso do Usuário (UserProgress)

```javascript
{
  user_id: ObjectId,
  lesson_id: ObjectId,
  status: String (not_started/in_progress/completed),
  score: Number,
  attempts: Number,
  time_spent: Number,
  completed_at: Date,
  started_at: Date,
  last_accessed: Date,
  notes: String,
  favorite: Boolean
}
```

## 🚀 Funcionalidades Principais

### Sistema de Aprendizado

- **Lições Progressivas**: Organizadas por níveis de dificuldade
- **Categorias**: Hiragana, Katakana, Kanji, Gramática, Vocabulário, Conversação
- **Exercícios Interativos**: Testes e práticas para reforçar o aprendizado
- **Sistema de Pontuação**: Acompanhamento do desempenho

### Gestão de Usuários

- **Perfis Personalizados**: Preferências de estudo e configurações
- **Progresso Individual**: Rastreamento detalhado do aprendizado
- **Sistema de Conquistas**: Motivação através de metas e reconhecimento

### Administração

- **Dashboard Completo**: Visão geral do sistema
- **Gestão de Conteúdo**: Criação e edição de lições e vocabulário
- **Monitoramento**: Estatísticas de uso e performance
- **Manutenção**: Ferramentas para otimização do sistema

## 🧪 Testes

Para executar os testes:

```bash
npm test
```

## 📝 Logs

O sistema gera logs para:

- Erros e exceções
- Acesso à API
- Operações de banco de dados
- Atividades de usuário

## 🔒 Segurança

- **Validação de Entrada**: Sanitização e validação de dados
- **Criptografia**: Senhas hasheadas com bcrypt
- **Rate Limiting**: Proteção contra ataques de força bruta
- **CORS**: Configuração segura para requisições cross-origin
- **Headers de Segurança**: Proteção contra ataques comuns

## 📈 Performance

- **Índices de Banco**: Otimização de consultas MongoDB
- **Paginação**: Resultados paginados para grandes conjuntos de dados
- **Cache**: Estrutura preparada para implementação de cache
- **Compressão**: Respostas comprimidas para melhor performance

## 🚀 Deploy

### Produção

1. Configure as variáveis de ambiente para produção
2. Use um processo manager como PM2
3. Configure um proxy reverso (Nginx/Apache)
4. Configure SSL/TLS
5. Monitore logs e performance

### Docker (Opcional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:

- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

## 🔮 Roadmap

- [ ] Sistema de notificações
- [ ] Integração com serviços de áudio
- [ ] API para aplicativos móveis
- [ ] Sistema de gamificação avançado
- [ ] Análise de dados de aprendizado
- [ ] Integração com IA para personalização
- [ ] Sistema de certificação
- [ ] Comunidade e fórum de discussão

---

**Desenvolvido com ❤️ para o aprendizado da língua japonesa**

