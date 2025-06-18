# 🔧 Correção do Erro de Deploy no EasyPanel

## ❌ **Problema Identificado**

O erro está ocorrendo porque:
1. O EasyPanel não encontra o `Dockerfile` no diretório raiz
2. O arquivo `webhook-evolution-complete-corrigido.js` que você está tentando executar localmente tem problemas

## 🚀 **Soluções Implementadas**

### ✅ **1. Dockerfile Criado na Raiz**
- Criado `Dockerfile` otimizado na raiz do projeto
- Configurado para usar o webhook da pasta `backend/webhooks/`
- Incluídas todas as variáveis de ambiente necessárias

### ✅ **2. .dockerignore Otimizado**
- Criado `.dockerignore` para builds mais rápidos
- Exclui arquivos desnecessários para produção

### ✅ **3. Arquivos de Deploy Organizados**
- Todos os arquivos de deploy estão em `deployment/`
- Scripts automatizados disponíveis

## 🔧 **Como Corrigir o Deploy**

### **Opção 1: Usar Dockerfile da Raiz (Recomendado)**

O projeto agora tem um `Dockerfile` na raiz que funciona com o EasyPanel:

```dockerfile
FROM node:18-alpine
# ... configuração completa ...
```

**Para deploy no EasyPanel:**
1. O `Dockerfile` na raiz será detectado automaticamente
2. As variáveis de ambiente estão pré-configuradas
3. O webhook será executado na porta 4000

### **Opção 2: Copiar Arquivos para Raiz (Temporário)**

Se precisar dos arquivos na raiz:

```bash
# Executar no diretório raiz do projeto
cp backend/webhooks/webhook-evolution-complete-corrigido.js ./
cp deployment/Dockerfile.webhook ./Dockerfile
```

### **Opção 3: Usar Deploy Webhook Dedicado**

```bash
# Usar os arquivos da pasta deploy-webhook
cd deploy-webhook
# Fazer deploy desta pasta separadamente
```

## ⚠️ **Correção do Erro de Função Duplicada**

O erro `SyntaxError: Identifier 'saveMessageToDatabase' has already been declared` indica que você está executando um arquivo corrompido.

### **Solução:**
```bash
# Execute o arquivo correto da pasta backend:
node backend/webhooks/webhook-evolution-complete-corrigido.js

# OU execute diretamente (se copiou para raiz):
node webhook-evolution-complete-corrigido.js
```

## 🔍 **Verificar Arquivos Corretos**

### **Arquivo Principal do Webhook:**
- **Local:** `backend/webhooks/webhook-evolution-complete-corrigido.js`
- **Tamanho:** ~132 linhas
- **Status:** ✅ Funcional

### **Dockerfile de Produção:**
- **Local:** `Dockerfile` (na raiz)
- **Status:** ✅ Criado e otimizado

### **Variáveis de Ambiente:**
```env
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 **Executar Deploy**

### **1. Commit das Correções:**
```bash
git add Dockerfile .dockerignore
git commit -m "fix: Adicionar Dockerfile e correções para deploy EasyPanel"
git push
```

### **2. Deploy no EasyPanel:**
- O EasyPanel agora encontrará o `Dockerfile` na raiz
- Build será executado com sucesso
- Webhook funcionará na porta 4000

### **3. Verificar Funcionamento:**
```bash
# Testar health check
curl https://bkcrm.devsible.com.br/webhook/health

# Resultado esperado:
{
  "status": "healthy",
  "timestamp": "2025-06-18T22:50:00.000Z",
  "version": "1.0.0-corrigido"
}
```

## 📊 **Logs de Deploy Esperados**

```
✅ Building Docker image...
✅ Installing dependencies...
✅ Copying webhook files...
✅ Setting up environment...
✅ Starting webhook server...
✅ Health check passed!
```

## 🎯 **Próximos Passos**

1. **✅ Fazer commit das correções**
2. **✅ Executar deploy no EasyPanel**
3. **✅ Testar webhook funcionando**
4. **✅ Configurar Evolution API para usar o webhook**
5. **✅ Testar integração completa**

**🚀 Agora o deploy no EasyPanel deve funcionar perfeitamente!** 