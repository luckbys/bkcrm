# 🚀 Guia de Deploy - Frontend BKCRM (Serviço Separado)

## 📋 Visão Geral

Este guia explica como fazer **redeploy** ou **atualizar** o **frontend do BKCRM** como um **serviço independente** no EasyPanel, sem afetar o webhook.

## 🏗️ Arquitetura Atual

```
🌐 Frontend: https://bkcrm.devsible.com.br (React/Vite + Nginx)
🔗 Webhook:  https://webhook.bkcrm.devsible.com.br (Node.js + Express)
```

## 📁 Arquivos para Frontend

✅ **Criados automaticamente:**
- `frontend.dockerfile` - Dockerfile otimizado para React/Vite
- `frontend-easypanel.json` - Configuração específica do EasyPanel
- `nginx.conf` - Configuração do Nginx (já existe)

## 🔧 Opções de Deploy

### 🔄 Opção 1: Atualizar Serviço Existente (Recomendado)

Se você já tem o frontend deployado, pode apenas **atualizar**:

1. **Acesse EasyPanel Dashboard**
2. **Encontre seu serviço atual** (provavelmente "bkcrm" ou similar)
3. **Clique em "Settings"**
4. **Na seção "Build"**, altere:
   ```
   Dockerfile Path: frontend.dockerfile
   ```
5. **Clique em "Deploy"**

### 🆕 Opção 2: Criar Novo Serviço (Se necessário)

Se preferir criar um serviço totalmente novo:

#### 1️⃣ Criar Novo Serviço
1. Acesse **EasyPanel Dashboard**
2. Clique em **"+ New Service"**
3. Selecione **"Git Repository"**

#### 2️⃣ Configurar Repositório
```
Repository URL: https://github.com/luckbys/bkcrm.git
Branch: main
```

#### 3️⃣ Configurar Build
```
Build Type: Dockerfile
Dockerfile Path: frontend.dockerfile
Build Context: . (root)
```

#### 4️⃣ Configurar Rede
```
Internal Port: 80
Service Name: bkcrm-frontend
```

#### 5️⃣ Configurar Domínio
```
Domain: bkcrm.devsible.com.br
Enable SSL: ✅ Sim
Force HTTPS: ✅ Sim
```

#### 6️⃣ Configurar Recursos
```
Memory: 256Mi
CPU: 0.25 cores
Replicas: 1
Auto-scaling: Habilitado (1-3 replicas)
```

## 🔍 Verificação de Deploy

### ✅ Testes Básicos

1. **Acesso direto:**
```bash
curl https://bkcrm.devsible.com.br/health
# Resposta esperada: "healthy"
```

2. **Interface funcionando:**
```bash
curl -I https://bkcrm.devsible.com.br/
# Resposta esperada: HTTP/1.1 200 OK
```

3. **Assets carregando:**
```bash
curl -I https://bkcrm.devsible.com.br/assets/index-[hash].js
# Resposta esperada: HTTP/1.1 200 OK
```

### 🔗 Conexão com Webhook

O frontend deve conectar automaticamente com o webhook:

```
Frontend (bkcrm.devsible.com.br) 
    ↓
Webhook (webhook.bkcrm.devsible.com.br)
    ↓  
Evolution API
    ↓
WhatsApp
```

## 📊 Logs e Monitoramento

### Verificar Logs no EasyPanel

1. **Acesse Services > bkcrm-frontend**
2. **Clique na aba "Logs"**
3. **Procure por estas mensagens:**

```
✅ Building frontend...
✅ npm run build completed
✅ Copying assets to nginx
✅ Starting nginx
✅ Frontend ready on port 80
```

### Build Logs Esperados

```
Step 1/12 : FROM node:18-alpine as builder
Step 2/12 : WORKDIR /app
Step 3/12 : COPY package.json package-lock.json ./
Step 4/12 : RUN npm ci --only=production
Step 5/12 : COPY . .
Step 6/12 : RUN npm run build
 ---> Building with Vite
 ---> ✓ 2861 modules transformed
 ---> dist/assets/index-[hash].js   751.52 kB
 ---> Build completed successfully
Step 7/12 : FROM nginx:alpine
Step 8/12 : COPY --from=builder /app/dist /usr/share/nginx/html
✅ Frontend build successful!
```

## ⚠️ Troubleshooting

### Problema: "Build Failed"

**Possíveis causas:**
1. **Dependências desatualizadas**
2. **Erro de sintaxe TypeScript** 
3. **Problemas de memória**

**Soluções:**
```bash
# Local: testar build
npm run build

# Verificar erros no log do EasyPanel
# Aumentar memória para 512Mi se necessário
```

### Problema: "Assets 404"

**Solução:**
1. Verificar se `nginx.conf` está correto
2. Confirmar se `/dist` foi copiado corretamente
3. Verificar path dos assets no build

### Problema: "Can't connect to webhook"

**Verificar:**
1. Webhook está rodando em `webhook.bkcrm.devsible.com.br`
2. CORS configurado corretamente no webhook
3. URLs de produção corretas no frontend

## 🎯 Vantagens do Deploy Separado

✅ **Zero Downtime** - Webhook continua funcionando
✅ **Deploy Independente** - Frontend pode ser atualizado sem afetar mensagens
✅ **Escalabilidade** - Frontend pode ter recursos próprios
✅ **Cache Otimizado** - Assets estáticos com cache de 1 ano
✅ **Performance** - Nginx otimizado para servir SPA

## 🚀 Comandos Úteis

### Build Local (Teste)
```bash
npm run build
npm run preview
```

### Verificar Frontend Produção
```bash
curl -I https://bkcrm.devsible.com.br/
curl https://bkcrm.devsible.com.br/health
```

### Verificar Webhook Funcionando
```bash
curl https://webhook.bkcrm.devsible.com.br/webhook/health
```

## 📝 Resultado Final

Após deploy bem-sucedido:

✅ **Frontend Atualizado:** `https://bkcrm.devsible.com.br`
✅ **Webhook Inalterado:** `https://webhook.bkcrm.devsible.com.br` 
✅ **Zero Downtime:** Sistema continuou funcionando
✅ **Performance:** Assets otimizados com cache
✅ **Segurança:** Headers de segurança configurados

---

**🎉 Sucesso!** Seu frontend foi atualizado sem afetar o webhook! Agora você pode fazer deploys independentes de cada serviço. 