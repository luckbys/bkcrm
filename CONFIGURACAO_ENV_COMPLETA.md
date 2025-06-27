# 🔧 Configuração Completa do .env

## 📋 Instruções de Configuração

### 1️⃣ **Criar o arquivo .env**
Crie um arquivo chamado `.env` na **raiz do projeto** (mesmo local do `package.json`)

### 2️⃣ **Copiar as configurações abaixo**
Copie TODO o conteúdo abaixo e cole no arquivo `.env`:

```env
# ====================================================================
# 🔧 CONFIGURAÇÕES DO PROJETO BKCRM
# ====================================================================

# 📊 Supabase - Banco de Dados Principal
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0NDk0MywiZXhwIjoyMDUxNTIwOTQzfQ.6CShPE-LsKHhM-K6mhMlV8CZqMGZhNTHJLZI5C4Lf5k

# 📱 Evolution API - WhatsApp Integration
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# 🌐 URLs do Sistema
VITE_APP_URL=https://bkcrm.devsible.com.br
VITE_WEBHOOK_URL=https://bkcrm.devsible.com.br/webhook/evolution

# ⚙️ Configurações do Frontend
VITE_ENABLE_REALTIME=true
VITE_DEBUG_MODE=true
NODE_ENV=development

# ====================================================================
# 🤖 CONFIGURAÇÕES EVOLUTION API - SERVIDOR
# ====================================================================

# 🖥️ Configurações do Servidor
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://press-evolution-api.jhkbgs.easypanel.host
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

# 📝 Sistema de Logs
LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,WEBHOOKS
LOG_COLOR=true
LOG_BAILEYS=error

# 🗄️ Banco de Dados Evolution
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgres://postgres:d4deb94c3e53644ab932@evolution-api-db:5432/evolution
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true

# 🔌 Webhooks - HABILITADO para integração com BKCRM
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://bkcrm.devsible.com.br/webhook/evolution
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# 📨 Eventos de Webhook - Configurados para BKCRM
WEBHOOK_EVENTS_APPLICATION_STARTUP=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_SET=false
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_EDITED=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_MESSAGES_DELETE=false
WEBHOOK_EVENTS_SEND_MESSAGE=true
WEBHOOK_EVENTS_CONTACTS_SET=false
WEBHOOK_EVENTS_CONTACTS_UPSERT=true
WEBHOOK_EVENTS_CONTACTS_UPDATE=true
WEBHOOK_EVENTS_PRESENCE_UPDATE=false
WEBHOOK_EVENTS_CHATS_SET=false
WEBHOOK_EVENTS_CHATS_UPSERT=true
WEBHOOK_EVENTS_CHATS_UPDATE=true
WEBHOOK_EVENTS_CHATS_DELETE=false
WEBHOOK_EVENTS_GROUPS_UPSERT=false
WEBHOOK_EVENTS_GROUPS_UPDATE=false
WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=false
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_REMOVE_INSTANCE=false
WEBHOOK_EVENTS_LOGOUT_INSTANCE=false
WEBHOOK_EVENTS_CALL=false

# 🔐 Autenticação
AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# 💾 Cache Redis
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://default:69ebae21c38752b810c0@evolution-api-redis:6379
CACHE_REDIS_TTL=604800
CACHE_REDIS_PREFIX_KEY=evolution

# 📱 Configurações WhatsApp
CONFIG_SESSION_PHONE_CLIENT=Evolution API
CONFIG_SESSION_PHONE_NAME=Chrome
CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200
QRCODE_LIMIT=30
QRCODE_COLOR=#175197

# 🚫 Recursos Desabilitados
RABBITMQ_ENABLED=false
SQS_ENABLED=false
WEBSOCKET_ENABLED=false
PUSHER_ENABLED=false
TYPEBOT_ENABLED=false
CHATWOOT_ENABLED=false
OPENAI_ENABLED=false
DIFY_ENABLED=false
S3_ENABLED=false
CACHE_LOCAL_ENABLED=false

# 🌍 Configurações Gerais
LANGUAGE=pt
DEL_INSTANCE=false
EVENT_EMITTER_MAX_LISTENERS=50

# ====================================================================
# 🔧 CONFIGURAÇÕES DO WEBHOOK BKCRM
# ====================================================================

# 🗄️ Supabase para Webhook
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0NDk0MywiZXhwIjoyMDUxNTIwOTQzfQ.6CShPE-LsKHhM-K6mhMlV8CZqMGZhNTHJLZI5C4Lf5k

# 📡 Evolution API para Webhook
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# 🌐 URLs do Webhook
WEBHOOK_PORT=4000
WEBHOOK_BASE_URL=https://bkcrm.devsible.com.br
WEBHOOK_ENDPOINT=/webhook/evolution

# 🎯 Configurações específicas BKCRM
ENABLE_RLS_CORRECTION=true
AUTO_CREATE_CUSTOMERS=true
AUTO_CREATE_TICKETS=true
DEFAULT_DEPARTMENT_ID=1
DEFAULT_TICKET_STATUS=open
DEFAULT_TICKET_PRIORITY=medium
```

### 3️⃣ **Salvar e Reiniciar**
1. Salve o arquivo `.env`
2. Reinicie o servidor de desenvolvimento: `npm run dev`
3. Reinicie o webhook (se estiver rodando)

## 🎯 **Principais Configurações Explicadas**

### 📊 **Frontend (VITE_)**
- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_EVOLUTION_API_URL` - URL da sua Evolution API
- `VITE_EVOLUTION_API_KEY` - Chave de autenticação da Evolution API

### 🔌 **Webhooks Habilitados**
- `WEBHOOK_GLOBAL_ENABLED=true` - Ativa os webhooks globalmente
- `WEBHOOK_EVENTS_MESSAGES_UPSERT=true` - Recebe mensagens novas
- `WEBHOOK_EVENTS_CONNECTION_UPDATE=true` - Status de conexão

### 🚫 **Recursos Desabilitados**
- RabbitMQ, SQS, WebSocket, Pusher - Não são necessários para o BKCRM

## ⚠️ **IMPORTANTE**

1. **Nunca commite o arquivo .env** - Ele contém informações sensíveis
2. **Use EXATAMENTE essas configurações** - Elas são otimizadas para o BKCRM
3. **Se mudar URLs** - Atualize tanto no .env quanto na Evolution API
4. **Para produção** - Use as configurações do arquivo `backend/config/env.production`

## 🔧 **Próximos Passos**

Após configurar o `.env`:

1. **Teste o frontend**: `npm run dev`
2. **Teste o webhook**: Execute o arquivo webhook corrigido
3. **Configure a Evolution API** com a URL do webhook: `https://bkcrm.devsible.com.br/webhook/evolution`
4. **Teste envio de mensagem** WhatsApp para verificar integração

✅ **Sistema pronto para funcionar!** 