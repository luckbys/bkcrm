# 🎯 DEPLOY FRONTEND - STATIC SITE (EASYPANEL)

## ⚠️ IMPORTANTE: DOIS DEPLOYS SEPARADOS

O sistema BKCRM tem **duas partes**:
1. **Frontend** (React) → Static Site
2. **WebSocket** (Node.js) → App

**📝 Você está fazendo deploy do FRONTEND!**

---

## 🚀 CONFIGURAÇÃO EASYPANEL - FRONTEND

### 1. **CRIAR NOVA APP**
```
Type: Static Site ← CRUCIAL!
Name: bkcrm-frontend
```

### 2. **SOURCE**
```
Type: Git Repository OU Upload
Branch: main
Root Directory: / (raiz do projeto)
```

### 3. **BUILD SETTINGS**
```
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

### 4. **DOMAIN**
```
Domain: bkcrm.devsible.com.br
HTTPS: ✅ Enable
```

### 5. **ENVIRONMENT VARIABLES**
```
NODE_ENV=production
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.5VqVHCHYmFu1Df3NbdaC7MJJjE9Mv_vgx7pfO-VgTQs
```

---

## ❌ **NÃO CONFIGURAR (é para Static Site)**

```
❌ Start Command
❌ Port  
❌ Dockerfile
❌ Health Check
❌ Scaling
```

---

## 🔍 **VERIFICAR SE ESTÁ CORRETO**

### ✅ Configuração Correta:
```
Type: Static Site
Build: npm run build
Output: dist/
Domain: bkcrm.devsible.com.br
```

### ❌ Se aparecer este erro: 
```
webhook-evolution-websocket.js
ReferenceError: require is not defined
```
**Significa que configurou como "App" ao invés de "Static Site"!**

---

## 🎯 **FLUXO DE BUILD ESPERADO**

```
1. npm install          ← Instalar dependências
2. npm run build         ← Gerar arquivos estáticos  
3. Output: dist/         ← Servir arquivos gerados
4. ✅ Site funcionando   ← Frontend React rodando
```

---

## 🛟 **SE DEU ERRO**

### Erro: "webhook-evolution-websocket.js"
```
Problema: Configurou como "App" ao invés de "Static Site"
Solução: Deletar app e criar como "Static Site"
```

### Erro: "build failed"  
```
Problema: Dependências ou build
Solução: Verificar logs do build, testar npm run build local
```

### Erro: "domain already exists"
```
Problema: Domínio em uso por outro serviço
Solução: Usar domínio diferente ou remover serviço antigo
```

---

## 🎉 **RESULTADO FINAL**

Após deploy correto:
```
✅ Frontend: https://bkcrm.devsible.com.br
📱 Interface React funcionando
🌐 Arquivos estáticos servidos
```

**🎯 WebSocket será deploy separado depois!** 