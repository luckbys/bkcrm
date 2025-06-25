# 🚀 Guia de Deploy Frontend + Backend Completo - EasyPanel

## 📋 Visão Geral

Este guia resolve o problema de deploy onde apenas o backend WebSocket era executado, sem servir o frontend React. A nova solução integra **frontend React + backend WebSocket** em um único container.

## 🎯 Arquivos Gerados

- `deploy-completo.zip` - Pacote completo para upload
- `Dockerfile.deploy` - Dockerfile otimizado multi-stage
- `nginx.deploy.conf` - Configuração nginx com proxy
- `start.deploy.sh` - Script de inicialização
- `package.deploy.json` - Dependências otimizadas
- `.env.deploy` - Variáveis de ambiente

## 🔧 Arquitetura da Solução

```
┌─────────────────────────────────────────┐
│                NGINX                    │
│           (Porta 80)                    │
├─────────────────────────────────────────┤
│  Frontend React     │   Proxy Routes    │
│  /usr/share/nginx/  │   /webhook/ →     │
│  html/              │   localhost:4000  │
│                     │   /socket.io/ →   │
│                     │   localhost:4000  │
└─────────────────────┴───────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────┐
│         WebSocket Server                │
│       (localhost:4000)                  │
│                                         │
│  - webhook-evolution-websocket.js       │
│  - Socket.IO + Express                  │
│  - Evolution API Integration            │
└─────────────────────────────────────────┘
```

## 📦 Passos do Deploy no EasyPanel

### 1️⃣ Upload do Arquivo

1. Acesse seu projeto no EasyPanel
2. Vá em **Deploy** → **Upload**
3. Faça upload do arquivo: `deploy-completo.zip`
4. Extraia o arquivo no diretório raiz

### 2️⃣ Configuração do Container

**Build Settings:**
- **Dockerfile:** `Dockerfile`
- **Build Context:** `/`
- **Build Args:** Nenhum necessário

**Runtime Settings:**
- **Port:** `80`
- **Protocol:** HTTP

### 3️⃣ Variáveis de Ambiente

As variáveis já estão no arquivo `.env.deploy`, mas você pode configurar via interface:

```
NODE_ENV=production
PORT=80
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
VITE_WEBSOCKET_URL=wss://bkcrm.devsible.com.br
```

### 4️⃣ Configuração de Domínio

- **Primary Domain:** `bkcrm.devsible.com.br`
- **SSL:** Ativado (Let's Encrypt)
- **Force HTTPS:** Sim

## 🔍 Processo de Build

O Dockerfile executa as seguintes etapas:

### Stage 1: Frontend Build
```dockerfile
FROM node:18-alpine AS frontend-build
# Instala dependências
# Copia código fonte
# Executa: npm run build
# Gera: /app/dist
```

### Stage 2: Production Runtime
```dockerfile
FROM nginx:alpine
# Instala Node.js para o backend
# Copia build do frontend para nginx
# Instala dependências do webhook
# Configura nginx + start script
```

## 🌐 Endpoints Funcionais

Após o deploy, os seguintes endpoints estarão disponíveis:

| Endpoint | Função | Exemplo |
|----------|--------|---------|
| `/` | Frontend React SPA | https://bkcrm.devsible.com.br |
| `/webhook/` | API WebSocket | https://bkcrm.devsible.com.br/webhook/health |
| `/socket.io/` | Socket.IO | wss://bkcrm.devsible.com.br/socket.io/ |
| `/health` | Health Check Nginx | https://bkcrm.devsible.com.br/health |

## ✅ Validação do Deploy

### 1. Verificar Frontend
```bash
curl https://bkcrm.devsible.com.br
# Deve retornar HTML da aplicação React
```

### 2. Verificar Backend WebSocket
```bash
curl https://bkcrm.devsible.com.br/webhook/health
# Deve retornar JSON com status do webhook
```

### 3. Verificar Health Check
```bash
curl https://bkcrm.devsible.com.br/health
# Deve retornar: {"status":"healthy","service":"nginx"}
```

### 4. Testar Socket.IO (via Browser Console)
```javascript
// No frontend, abrir DevTools e executar:
const socket = io();
socket.on('connect', () => console.log('WebSocket conectado!'));
```

## 🐛 Troubleshooting

### Problema: Frontend não carrega
**Sintomas:** Página em branco ou erro 404
**Solução:**
1. Verificar se build foi criado: `ls -la /usr/share/nginx/html/`
2. Verificar logs do nginx: `nginx -t`
3. Verificar configuração SPA: `try_files $uri $uri/ /index.html;`

### Problema: WebSocket não conecta
**Sintomas:** Erro de conexão Socket.IO
**Solução:**
1. Verificar se processo está rodando: `ps aux | grep node`
2. Testar endpoint direto: `curl localhost:4000/webhook/health`
3. Verificar proxy nginx: `location /socket.io/`

### Problema: Variáveis de ambiente não carregam
**Sintomas:** Erro de configuração Supabase/Evolution API
**Solução:**
1. Verificar arquivo `.env.deploy`
2. Rebuild container com environment variables
3. Verificar se variáveis estão disponíveis: `echo $VITE_SUPABASE_URL`

### Problema: Build falha
**Sintomas:** Erro durante docker build
**Solução:**
1. Verificar se `package.deploy.json` está válido
2. Limpar cache: `docker system prune -a`
3. Verificar dependências: `npm install` localmente

## 📊 Logs Importantes

### Logs de Sucesso Esperados:
```
Iniciando BKCRM...
Iniciando WebSocket na porta 4000...
WebSocket OK
Iniciando Nginx na porta 80...
Nginx OK
Frontend: http://localhost/
WebSocket: http://localhost/webhook/
WebSocket PID: 123
Nginx PID: 456
```

### Como Acessar Logs:
```bash
# Via EasyPanel Dashboard
# Ou via SSH:
docker logs <container_id> -f
```

## 🎉 Resultado Final

Após o deploy bem-sucedido:

✅ **Frontend React** servido em `https://bkcrm.devsible.com.br`
✅ **Backend WebSocket** disponível em `https://bkcrm.devsible.com.br/webhook/`
✅ **Socket.IO** funcionando via proxy reverso
✅ **Health checks** configurados e funcionais
✅ **SSL/HTTPS** automático via Let's Encrypt
✅ **Cache** otimizado para assets estáticos
✅ **SPA routing** funcionando corretamente

## 📝 Próximos Passos

1. **Monitoramento:** Configurar alertas de health check
2. **Backup:** Configurar backup automático do container
3. **Scaling:** Configurar auto-scaling se necessário
4. **CI/CD:** Integrar com pipeline de deploy automático

---

**📞 Suporte:** Se houver problemas, verificar logs detalhados e testar cada endpoint individualmente. 