# 🚀 Deploy BKCRM na VPS

## 🎯 Configurações Criadas

✅ **Procfile** - Para Heroku buildpack  
✅ **static.json** - Configuração para build estático  
✅ **.buildpacks** - Buildpacks Node.js + Static  
✅ **app.json** - Configuração automática do app  
✅ **Scripts atualizados** - Para produção com porta dinâmica  

## 🔧 Deploy com Heroku Buildpack

### **1. Configurar variáveis de ambiente:**

```bash
# No painel da VPS ou via CLI
export NODE_ENV=production
export VITE_SUPABASE_URL=https://seu-projeto.supabase.co
export VITE_SUPABASE_ANON_KEY=sua-chave-anonima
export VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
export VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
export PORT=8080
```

### **2. Deploy:**

```bash
# Build
npm install
npm run build

# Iniciar
npm run start
```

### **3. Nginx (opcional):**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐳 Deploy com Docker

### **Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY static.json /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **docker-compose.yml:**

```yaml
version: '3.8'
services:
  bkcrm:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 📝 Verificação

1. **Build local:** `npm run build`
2. **Teste local:** `npm run preview`
3. **Verificar dist/:** Pasta deve conter arquivos do build
4. **Testar Evolution API:** Console `testRealEvolutionAPI()`

## 🚀 Pronto para Deploy!

Os arquivos estão configurados para deploy automático com Heroku buildpack na VPS. 