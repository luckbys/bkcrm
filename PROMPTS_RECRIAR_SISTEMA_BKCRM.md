# 🚀 PROMPTS PARA RECRIAR SISTEMA BKCRM

## 📋 Índice de Prompts
1. [Setup Inicial](#1-setup-inicial)
2. [Banco de Dados](#2-banco-de-dados) 
3. [Autenticação](#3-autenticação)
4. [Sistema de Tickets](#4-sistema-de-tickets)
5. [Chat WhatsApp](#5-chat-whatsapp)
6. [Evolution API](#6-evolution-api)
7. [Componentes UI](#7-componentes-ui)
8. [Deploy](#8-deploy)

---

## 1. 🏗️ Setup Inicial

### Frontend React + TypeScript

```prompt
Crie um projeto React com Vite e TypeScript para um sistema CRM com as seguintes especificações:

- Framework: React 18+ com TypeScript
- Build: Vite
- UI: shadcn/ui + Tailwind CSS
- Estado: Zustand
- HTTP: Axios
- WebSocket: Socket.IO Client
- Formulários: React Hook Form + Zod

Estrutura de pastas:
src/
├── components/
│   ├── ui/              # shadcn/ui
│   ├── chat/            # Chat components
│   ├── crm/             # CRM components
│   └── layouts/         # Layouts
├── hooks/               # Custom hooks
├── services/            # APIs
├── stores/              # Zustand stores
├── types/               # TypeScript types
└── utils/               # Utilities

Configure Tailwind com design system:
- Primary: #3B82F6
- Secondary: #6366F1
- Success: #22C55E
- Glassmorphism effects
```

### Backend Node.js

```prompt
Crie um servidor Node.js para webhook Evolution API:

- Framework: Express.js + Socket.IO
- Database: Supabase client
- Logs: Winston
- Validação: Zod

Funcionalidades:
1. Webhook receiver Evolution API
2. WebSocket server para tempo real
3. Processamento mensagens WhatsApp
4. Health checks

Estrutura:
backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   └── types/
└── webhooks/

Configure CORS, rate limiting e logging estruturado.
```

---

## 2. 🗄️ Banco de Dados

### Schema Supabase

```prompt
Crie schema completo Supabase para CRM:

Tabelas principais:
1. **profiles** (usuários/clientes):
   - id (UUID), email, full_name, phone
   - role (enum: admin, agent, customer)
   - department_id, metadata (JSONB)

2. **tickets** (chamados):
   - id (UUID), title, description
   - status (enum: pendente, atendimento, finalizado)
   - priority, channel, customer_id
   - metadata (JSONB), timestamps

3. **messages** (mensagens):
   - id (BIGSERIAL), ticket_id, sender_id
   - content, type, is_internal
   - file_url, metadata, timestamps

4. **evolution_instances** (WhatsApp):
   - id (UUID), instance_name, api_key
   - webhook_url, status, department_id

Inclua:
- RLS (Row Level Security)
- Triggers para timestamps
- Índices para performance
- Funções RPC necessárias
```

### Funções RPC

```prompt
Crie funções RPC Supabase:

1. **get_tickets_with_relations(department_id, user_role)**
   - Buscar tickets com filtros de acesso
   - Incluir dados relacionados

2. **create_ticket_webhook(customer_data, ticket_data)**
   - Criar ticket via webhook
   - Validações e tratamento de erros

3. **find_existing_ticket_webhook(phone, department)**
   - Buscar ticket existente por telefone
   - Múltiplos critérios de busca

4. **assign_customer_to_ticket(ticket_id, customer_id)**
   - Atribuir cliente ao ticket
   - Validações de negócio

Inclua tratamento de erros e logs em todas as funções.
```

---

## 3. 🔐 Autenticação

### Sistema Auth Supabase

```prompt
Implemente autenticação completa com Supabase:

1. **useAuth.ts hook**:
   - Login/logout com email/senha
   - Recuperação de senha
   - Gerenciamento de sessão
   - Estados loading/erro

2. **AuthContext**:
   - Estado global usuário
   - Permissões por role
   - Dados do perfil

3. **Páginas**:
   - LoginPage.tsx
   - ForgotPasswordPage.tsx
   - EmailConfirmationPage.tsx

4. **Componentes**:
   - ProtectedRoute
   - RoleGuard
   - SessionManager

Design moderno com:
- Validação Zod
- Estados loading elegantes
- Tratamento de erros
- Redirecionamentos
```

---

## 4. 🎫 Sistema de Tickets

### Gerenciamento Principal

```prompt
Crie sistema completo de tickets:

1. **TicketManagement.tsx**:
   - Header "Conversas" com indicadores
   - Filtros colapsáveis
   - Barra de busca destacada
   - Tabs de status com contadores
   - Lista principal
   - Paginação
   - Ações em massa

2. **useTicketsDB.ts**:
   - CRUD completo
   - Filtros avançados
   - Busca em tempo real
   - Paginação inteligente
   - Cache com revalidação

3. **TicketList.tsx**:
   - Cards responsivos
   - Estados visuais por status
   - Badges para canais
   - Hover effects

Funcionalidades:
- Seleção múltipla
- Export CSV/Excel
- Filtros salvos
- Ordenação customizável
```

### Formulário de Tickets

```prompt
Implemente criação/edição de tickets:

1. **TicketForm.tsx**:
   - Formulário multi-step
   - Validação Zod em tempo real
   - Seleção de cliente
   - Upload de anexos
   - Templates

2. **CustomerSelector.tsx**:
   - Busca clientes
   - Criação rápida
   - Autocompletar

Funcionalidades:
- Auto-save rascunho
- Validação duplicatas
- Drag-and-drop anexos
- Previsualização
```

---

## 5. 💬 Chat WhatsApp

### Interface de Chat

```prompt
Implemente chat moderno para tickets:

1. **TicketChatModal.tsx** (container):
   - Modal Dialog shadcn/ui
   - Layout responsivo
   - Estados loading/erro
   - Controles minimização

2. **TicketChatRefactored.tsx** (principal):
   - Header com info cliente
   - Área mensagens
   - Input avançado
   - Sidebar
   - Busca integrada

3. **Componentes modulares**:
   - TicketChatHeader.tsx
   - TicketChatMessages.tsx
   - TicketChatInput.tsx
   - TicketChatSidebar.tsx

Funcionalidades:
- Indicador digitação
- Status entrega/leitura
- Busca tempo real
- Favoritar mensagens
- Templates resposta
- Emoji picker
```

### Mensagens Avançadas

```prompt
Crie sistema avançado de mensagens:

1. **MessageBubble.tsx**:
   - Cliente: esquerda, verde, balão branco
   - Agente: direita, azul, balão gradiente
   - Notas internas: centro, âmbar

2. **AudioPlayer.tsx**:
   - Player robusto
   - Controles completos
   - Tratamento erros
   - Estados loading

3. **MediaViewer.tsx**:
   - Visualização imagens/vídeos
   - Zoom e navegação
   - Download arquivos

Funcionalidades:
- Mensagens thread
- Citação mensagens
- Reações emoji
- Highlight busca
```

---

## 6. 📱 Evolution API

### Serviço Principal

```prompt
Implemente integração Evolution API:

1. **evolutionApiService.ts**:
   - Cliente HTTP configurado
   - Rate limiting
   - Retry automático
   - Health checks
   - Cache status

2. **Métodos principais**:
   - checkHealth()
   - getInstances()
   - sendMessage(instance, number, text)
   - getInstanceStatus()
   - generateQRCode()

3. **Tratamento erros**:
   - Retry automático
   - Fallback instâncias
   - Logs estruturados
   - Notificações falhas

Configure para dev/prod com URLs diferentes.
```

### Webhook Processor

```prompt
Crie processador robusto de webhooks:

1. **webhook-response-service.ts**:
   - Processamento batches
   - Queue system
   - UUID fixo sistema
   - Tratamento duplicatas

2. **Funcionalidades**:
   - processWebhookPayload()
   - handleMessageUpsert()
   - findOrCreateTicket()
   - extractMessageInfo()

3. **Suporte mídias**:
   - Imagens, vídeos, áudios
   - Documentos, stickers
   - Localização, contatos

4. **Servidor webhook**:
   - Express + Socket.IO
   - Endpoints: /webhook/evolution, /health
   - CORS configurado
   - Rate limiting

Inclua logs detalhados e monitoramento.
```

---

## 7. 🎨 Componentes UI

### Design System

```prompt
Implemente design system completo:

1. **Cores (CSS variables)**:
   ```css
   :root {
     --primary: #3B82F6;
     --secondary: #6366F1;
     --success: #22C55E;
     --warning: #F59E0B;
     --error: #EF4444;
   }
   ```

2. **Glassmorphism**:
   ```css
   .glass {
     background: rgba(255, 255, 255, 0.1);
     backdrop-filter: blur(10px);
     border: 1px solid rgba(255, 255, 255, 0.2);
     box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
   }
   ```

3. **Componentes base**:
   - Button variants
   - Card com efeitos
   - Modal estilizado
   - Form inputs

4. **Animações**:
   - Duration: 300ms
   - Timing: cubic-bezier(0.4, 0, 0.2, 1)
   - Hover effects
   - Loading states
```

### Componentes Avançados

```prompt
Implemente componentes UI avançados:

1. **DataTable.tsx**:
   - Sortable/filterable
   - Paginação
   - Seleção múltipla
   - Export dados
   - Responsive

2. **SearchBar.tsx**:
   - Debounce
   - Filtros avançados
   - Autocompletar
   - Keyboard shortcuts

3. **NotificationSystem.tsx**:
   - Toast moderno
   - Tipos múltiplos
   - Auto-dismiss
   - Stacking

4. **FileUploader.tsx**:
   - Drag and drop
   - Multiple files
   - Progress indicators
   - Error handling

Todos com acessibilidade WCAG 2.1 AA.
```

---

## 8. 🚀 Deploy

### Configuração Docker

```prompt
Configure deploy completo:

1. **Dockerfile.frontend**:
   ```dockerfile
   FROM node:18-alpine as builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   ```

2. **Dockerfile.backend**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 4000
   CMD ["node", "webhook-evolution-complete.js"]
   ```

3. **docker-compose.yml**:
   - Frontend service
   - Backend service
   - Nginx proxy
   - Environment variables

4. **Nginx config**:
   - Proxy reverso
   - SSL termination
   - CORS headers
   - Gzip compression
```

### CI/CD Pipeline

```prompt
Configure pipeline GitHub Actions:

1. **Build workflow**:
   ```yaml
   name: Build and Deploy
   on:
     push:
       branches: [main]
   
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm run build
         - run: npm test
   ```

2. **Deploy steps**:
   - Build Docker images
   - Push to registry
   - Deploy to production
   - Health checks
   - Rollback on failure

3. **Environment management**:
   - Secrets GitHub
   - Environment variables
   - Config validation

4. **Monitoring**:
   - Health checks
   - Error tracking
   - Performance metrics
   - Alerts automáticos
```

---

## 📝 Checklist Rápido

### ✅ Essenciais
- [ ] Setup React + TypeScript + Vite
- [ ] Configuração Supabase
- [ ] Sistema autenticação
- [ ] CRUD tickets básico
- [ ] Chat interface
- [ ] Evolution API integration
- [ ] Webhook processor
- [ ] Deploy Docker

### 🔧 Avançados
- [ ] WebSocket tempo real
- [ ] Sistema notificações
- [ ] Dashboard analytics
- [ ] Testes automatizados
- [ ] Monitoramento produção
- [ ] Documentation completa

---

## 🎯 Próximos Passos

1. **Comece com o setup inicial** - Configure o ambiente base
2. **Implemente autenticação** - Base para todo sistema
3. **Crie CRUD tickets** - Funcionalidade core
4. **Adicione chat básico** - Interface principal
5. **Integre Evolution API** - WhatsApp integration
6. **Teste e refine** - Qualidade e performance
7. **Deploy produção** - Ambiente final

> 💡 **Dica**: Implemente incrementalmente, teste cada módulo antes de avançar

> ⚠️ **Importante**: Use variáveis de ambiente para credenciais, configure logs detalhados 