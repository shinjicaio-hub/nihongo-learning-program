# 🗾 Nihongo Learning

> Sistema completo de aprendizado de língua japonesa com interface moderna e API robusta

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org/)

## 🚀 Demo

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## ✨ Características

### 🎯 Funcionalidades Principais
- **Quiz Interativo** - Sistema de perguntas e respostas em japonês
- **Tabelas de Caracteres** - Visualização completa de Hiragana e Katakana
- **Visualizador de Banco** - Interface para explorar dados do sistema
- **Sistema de Progresso** - Acompanhamento do aprendizado
- **Interface Responsiva** - Design moderno com Tailwind CSS

### 🛠️ Tecnologias

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- CORS + Security Headers
- Rate Limiting

**Frontend:**
- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Lucide React Icons

## 🚀 Início Rápido

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd _nihongo-project

# 2. Configure o ambiente
node create-env.js

# 3. Instale dependências
npm install
cd frontend/my-appexitcf && npm install && cd ../..

# 4. Popule o banco de dados
node populate-database.js

# 5. Execute o sistema
node start-dev.js
```

**Acesse:** http://localhost:3000

## 📱 Screenshots

### Interface Principal
- Quiz interativo com perguntas em japonês
- Tabelas de Hiragana e Katakana
- Visualizador de banco de dados
- Design responsivo e moderno

### Funcionalidades
- Sistema de navegação por abas
- Componentes reutilizáveis
- Tema escuro/claro
- Performance otimizada

## 🏗️ Arquitetura

```
_nihongo-project/
├── src/                    # Backend (Node.js/Express)
│   ├── config/            # Configurações
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rotas da API
│   └── middleware/        # Middlewares
├── frontend/
│   └── my-appexitcf/      # Frontend (Next.js/React)
│       ├── app/           # Páginas
│       ├── components/    # Componentes
│       └── lib/           # Utilitários
└── docs/                  # Documentação
```

## 📊 API Endpoints

### Principais Rotas
- `GET /api/admin/collections` - Listar collections
- `GET /api/admin/stats` - Estatísticas do sistema
- `GET /api/lessons` - Lições disponíveis
- `GET /api/vocabulary` - Vocabulário japonês
- `POST /api/auth/login` - Autenticação

## 🎨 Componentes Frontend

- **Navigation** - Sistema de navegação
- **JapaneseQuiz** - Quiz interativo
- **CharacterTables** - Tabelas de caracteres
- **DatabaseViewer** - Visualizador de dados
- **Progress** - Indicadores de progresso

## 🔧 Configuração

### Variáveis de Ambiente
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/nihongo_learning
JWT_SECRET=sua_chave_secreta
CORS_ORIGIN=http://localhost:3000
```

### Banco de Dados
- **Collections**: users, lessons, vocabulary, user_progress
- **Dados de Exemplo**: Incluídos no script `populate-database.js`

## 🚀 Deploy

### Desenvolvimento
```bash
node start-dev.js  # Executa backend + frontend
```

### Produção
```bash
# Backend
node src/app.js

# Frontend
cd frontend/my-appexitcf
npm run build
npm start
```

## 📈 Performance

- **Backend**: Rate limiting, CORS, compression
- **Frontend**: React 19, Next.js 15, otimizações
- **Banco**: Índices MongoDB, paginação
- **UI**: Componentes otimizados, lazy loading

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## 🔮 Roadmap

- [ ] Sistema de notificações
- [ ] Integração com áudio
- [ ] API para mobile
- [ ] Gamificação avançada
- [ ] Análise de dados
- [ ] IA para personalização

## 📞 Suporte

- Abra uma [issue](../../issues) no repositório
- Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para o aprendizado da língua japonesa**

[![GitHub stars](https://img.shields.io/github/stars/usuario/nihongo-learning.svg?style=social&label=Star)](https://github.com/usuario/nihongo-learning)
[![GitHub forks](https://img.shields.io/github/forks/usuario/nihongo-learning.svg?style=social&label=Fork)](https://github.com/usuario/nihongo-learning/fork)

