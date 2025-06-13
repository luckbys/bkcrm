# 🔧 Correção: Erro de Deploy no EasyPanel

## ❌ Problema Identificado

```
ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref: "/webhook.env": not found
```

O Docker não está encontrando os arquivos `webhook.env` e `webhook-evolution-complete.js` durante o build.

## ✅ Solução Aplicada

### 1. Dockerfile Corrigido ✅
- Removida dependência do arquivo `webhook.env`
- O arquivo agora usa `COPY . ./` para pegar todos os arquivos
- Variáveis de ambiente vêm diretamente do EasyPanel

### 2. Código Atualizado ✅
- `webhook-evolution-complete.js` não depende mais do arquivo `.env`
- Usa variáveis de ambiente diretamente do sistema
- Compatível com as configurações do EasyPanel

### 3. .dockerignore Otimizado ✅
- Ignora arquivos desnecessários
- Mantém apenas os essenciais para o webhook

## 🚀 Como Refazer o Deploy

### Opção 1: Usar o Dockerfile Principal (Recomendado)

1. **No EasyPanel, vá em Build Settings:**
   - **Dockerfile**: `Dockerfile` (não `Dockerfile.webhook`)
   - Manter todas as variáveis de ambiente

2. **Clique em Rebuild/Deploy**

### Opção 2: Upload dos Arquivos Atualizados

1. **Baixe estes arquivos atualizados:**
   - `Dockerfile` ✅ (corrigido)
   - `webhook-evolution-complete.js` ✅ (sem dependência .env)
   - `.dockerignore` ✅ (otimizado)
   - `package.json` ✅ (já existe)

2. **Remova arquivos desnecessários:**
   - `webhook.env` (não precisa mais)
   - `Dockerfile.webhook` (substitua pelo `Dockerfile`)

3. **Faça upload no EasyPanel**

## ⚙️ Variáveis de Ambiente do EasyPanel

Certifique-se que estas variáveis estão configuradas:

```
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
```

## 📋 Checklist Rápido

- [ ] ✅ Arquivos corrigidos
- [ ] Dockerfile principal configurado no EasyPanel
- [ ] Variáveis de ambiente definidas
- [ ] Build iniciado
- [ ] Aguardar conclusão do deploy

## 🎯 O que Mudou

### Antes ❌
```dockerfile
COPY webhook.env ./.env
COPY webhook-evolution-complete.js ./
```

### Depois ✅
```dockerfile
COPY . ./
# Usa variáveis de ambiente do EasyPanel diretamente
```

### Código Antes ❌
```javascript
dotenv.config({ path: './webhook.env' });
```

### Código Depois ✅
```javascript
// Configurações via variáveis de ambiente (EasyPanel)
console.log('🔧 Carregando configurações das variáveis de ambiente...');
```

## 🚨 Se o Erro Persistir

1. **Verificar logs completos** no EasyPanel
2. **Confirmar que `webhook-evolution-complete.js` está presente**
3. **Tentar build local primeiro:**
   ```bash
   docker build -f Dockerfile -t test-webhook .
   ```

## ✅ Resultado Esperado

```
✅ Container built successfully
✅ Deployment successful
✅ Health check passing
🔗 https://bkcrm.devsible.com.br/webhook/health
```

---

**🎉 Agora o deploy deve funcionar perfeitamente!** 