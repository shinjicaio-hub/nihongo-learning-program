# 🗄️ Guia da Interface do Banco de Dados

## 📋 Visão Geral

Criei uma interface web completa para visualizar e explorar o banco de dados do sistema de aprendizado de japonês. A interface permite:

- ✅ Visualizar todas as collections do MongoDB
- ✅ Explorar documentos com paginação
- ✅ Buscar documentos por texto
- ✅ Ver estatísticas gerais do sistema
- ✅ Interface responsiva e intuitiva

## 🚀 Como Usar

### 1. Iniciar o Sistema

```bash
# Terminal 1 - Backend
cd _nihongo-project
npm run dev

# Terminal 2 - Frontend  
cd frontend/my-appexitcf
npm run dev
```

### 2. Acessar a Interface

1. Abra o navegador em: `http://localhost:3000`
2. Clique na aba **"Banco de Dados"** na navegação
3. A interface carregará automaticamente

## 🎯 Funcionalidades

### 📊 **Aba Estatísticas**
- **Total de Usuários**: Quantidade de usuários cadastrados
- **Total de Lições**: Número de lições disponíveis
- **Vocabulário**: Quantidade de palavras no banco
- **Progressos**: Registros de progresso dos usuários

### 📁 **Aba Collections**
- **Lista de Collections**: Visualize todas as collections disponíveis
- **Contadores**: Veja quantos documentos cada collection possui
- **Ícones Coloridos**: Identificação visual por tipo de dados

### 🔍 **Exploração de Dados**
- **Seleção de Collection**: Clique em qualquer collection para explorar
- **Paginação**: Navegue pelos documentos (20 por página)
- **Busca**: Digite termos para filtrar documentos
- **Visualização Detalhada**: Veja todos os campos de cada documento

## 📚 Collections Disponíveis

### 👥 **users**
- Dados dos usuários cadastrados
- Informações pessoais e preferências
- Níveis de aprendizado
- **Campos principais**: username, email, level, preferences

### 📖 **lessons**
- Lições de japonês organizadas
- Conteúdo educacional estruturado
- **Campos principais**: title, description, level, category, content

### 📝 **vocabulary**
- Vocabulário japonês com traduções
- Pronúncia e exemplos
- **Campos principais**: japanese, romaji, portuguese, lesson_id

### 📈 **user_progress**
- Progresso dos usuários nas lições
- Estatísticas de aprendizado
- **Campos principais**: user_id, lesson_id, status, score, time_spent

## 🛠️ Recursos Técnicos

### 🔒 **Segurança**
- Senhas são automaticamente removidas da visualização
- Acesso controlado via middleware (desenvolvimento)
- Validação de dados na API

### ⚡ **Performance**
- Paginação para grandes volumes de dados
- Índices otimizados no MongoDB
- Cache de consultas frequentes

### 🎨 **Interface**
- Design responsivo (mobile/desktop)
- Tema escuro/claro automático
- Componentes shadcn/ui modernos
- Feedback visual de carregamento

## 🔧 Endpoints da API

### **GET** `/api/admin/collections`
Lista todas as collections com contadores

### **GET** `/api/admin/collections/:name`
Busca documentos de uma collection específica
- Query params: `page`, `limit`, `search`

### **GET** `/api/admin/stats`
Retorna estatísticas gerais do sistema

### **GET** `/api/admin/collections/:name/:id`
Busca um documento específico por ID

## 🚨 Solução de Problemas

### ❌ **Erro de Conexão**
```
Verifique se:
1. Backend está rodando na porta 3001
2. MongoDB está conectado
3. Arquivo .env está configurado
```

### ❌ **Dados Não Carregam**
```
Execute no terminal:
npm run test:db
```

### ❌ **Interface Não Abre**
```
Verifique se:
1. Frontend está rodando na porta 3000
2. Navegador suporta JavaScript
3. Não há erros no console (F12)
```

## 📝 Exemplos de Uso

### 🔍 **Buscar Usuário**
1. Selecione collection "users"
2. Digite nome no campo de busca
3. Pressione Enter ou clique em buscar

### 📊 **Ver Estatísticas**
1. Clique na aba "Estatísticas"
2. Visualize os cards com totais
3. Use botão "Atualizar" para dados em tempo real

### 📖 **Explorar Lições**
1. Selecione collection "lessons"
2. Navegue pelas páginas
3. Clique em qualquer documento para ver detalhes

## 🎉 Próximos Passos

A interface está pronta para uso! Você pode:

- ✅ Explorar todos os dados do sistema
- ✅ Monitorar o crescimento do banco
- ✅ Verificar a integridade dos dados
- ✅ Identificar padrões de uso
- ✅ Fazer backup visual dos dados

---

**💡 Dica**: Use a interface regularmente para acompanhar o crescimento do sistema e identificar oportunidades de melhoria!
