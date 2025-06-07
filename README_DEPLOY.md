# 🚀 BKCRM - Deploy VPS

## ✅ PRONTO PARA DEPLOY

### Arquivos Configurados:
- Procfile (Heroku buildpack)
- static.json (SPA routing)  
- .buildpacks (Node.js + Static)
- app.json (Auto deploy)
- Dockerfile + docker-compose.yml
- nginx.conf (Web server)
- Scripts de produção

### Deploy Heroku Buildpack:
```bash
export NODE_ENV=production
export PORT=8080
export VITE_SUPABASE_URL=https://seu-projeto.supabase.co
export VITE_SUPABASE_ANON_KEY=sua-chave-anonima
export VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
export VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

npm install
npm run build  
npm run start
```

### Deploy Docker:
```bash
docker-compose up -d --build
```

### Build Testado:
✅ 2742 módulos transformados
✅ 616KB (163KB gzipped)
✅ Chunks otimizados
✅ Arquivos em ./dist/

## 🚀 PRONTO PARA PRODUÇÃO! 