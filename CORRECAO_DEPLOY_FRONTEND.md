# 🚨 CORREÇÃO DEPLOY FRONTEND - EASYPANEL

## ❌ PROBLEMA IDENTIFICADO
EasyPanel está tentando executar **WebSocket** ao invés do **Frontend**:
```
webhook-evolution-websocket.js ← ERRADO (é para WebSocket)
```

## ✅ SOLUÇÃO - DEPLOY FRONTEND CORRETO

### 1. **CONFIGURAÇÃO CORRETA NO EASYPANEL**

#### Tipo de App:
```
❌ App (Node.js) - ERRADO
✅ Static Site - CORRETO para Frontend
```

#### Build Settings:
```
Build Command: npm run build
Output Directory: dist/
Install Command: npm install
```

#### Não configurar:
```
❌ Start Command (não precisa para static site)
❌ Port (não precisa para static site)  
❌ Dockerfile (não precisa para static site)
```

### 2. **VARIÁVEIS DE AMBIENTE CORRETAS**
```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.5VqVHCHYmFu1Df3NbdaC7MJJjE9Mv_vgx7pfO-VgTQs
```

### 3. **DOMÍNIO**
```
Domain: bkcrm.devsible.com.br
HTTPS: ✅ Ativado
```

### 4. **ARQUIVOS PARA IGNORAR**
O frontend NÃO deve incluir:
```
❌ webhook-evolution-websocket.js
❌ webhook-evolution-websocket.cjs  
❌ deploy-webhook/
❌ backend/
```

## 🎯 **PASSOS DE CORREÇÃO**

### Se app já foi criado:
1. **Ir para Settings da app criada**
2. **Mudar tipo**: App → Static Site
3. **Remover Start Command**
4. **Configurar Build Command**: `npm run build`
5. **Configurar Output**: `dist/`

### Se for criar novo:
1. **Create → Static Site**
2. **Source**: Upload projeto OU Git
3. **Build**: `npm run build`  
4. **Output**: `dist/`
5. **Domain**: `bkcrm.devsible.com.br`

## 🔍 **VERIFICAR NO EASYPANEL**

### ✅ Configurações Corretas:
```
Type: Static Site
Build Command: npm run build
Output Directory: dist/
Domain: bkcrm.devsible.com.br
```

### ❌ Configurações Incorretas:
```
Type: App (Node.js)
Start Command: node webhook-evolution-websocket.js
Port: 4000
```

## 🚀 **DEPLOY SEPARADO**

### Frontend (Static Site):
```
Nome: bkcrm-frontend
Tipo: Static Site  
Build: npm run build → dist/
Domain: bkcrm.devsible.com.br
```

### WebSocket (App separada):
```
Nome: bkcrm-websocket
Tipo: App (Node.js)
Start: node webhook-evolution-websocket.cjs
Domain: websocket.bkcrm.devsible.com.br
```

## 🎉 **RESULTADO ESPERADO**

Após correção:
```
✅ Frontend: https://bkcrm.devsible.com.br (Static Site)
✅ WebSocket: https://websocket.bkcrm.devsible.com.br (App)
```

**🎯 São dois deploys diferentes, não um só!** 