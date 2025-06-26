# 🚀 Deploy no Heroku - Guia Completo

## 1. Preparação do Projeto

### Arquivos criados para Heroku:
- `Dockerfile.heroku` - Container otimizado
- `package.heroku.json` - Dependências mínimas
- `vite.heroku.config.js` - Build simplificado
- `tailwind.heroku.config.js` - Tailwind básico
- `index.heroku.html` - HTML mínimo
- `heroku.yml` - Configuração do Heroku

## 2. Configuração do Heroku

### Instalar Heroku CLI:
```bash
# Windows
winget install Heroku.CLI

# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Login no Heroku:
```bash
heroku login
```

## 3. Deploy

### Opção A - Via Heroku CLI:
```bash
# Criar aplicação
heroku create bkcrm-app

# Configurar stack para container
heroku stack:set container -a bkcrm-app

# Configurar variáveis de ambiente
heroku config:set NODE_ENV=production -a bkcrm-app
heroku config:set VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co -a bkcrm-app
heroku config:set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... -a bkcrm-app

# Deploy
git add .
git commit -m "Deploy para Heroku"
git push heroku main
```

### Opção B - Via GitHub:
1. Fazer push do código para GitHub
2. Conectar repositório no Heroku Dashboard
3. Ativar deploys automáticos
4. Configurar variáveis de ambiente no Dashboard

## 4. Configurações de Ambiente

### Variáveis necessárias no Heroku:
```
NODE_ENV=production
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```

## 5. Verificação

### Após deploy:
- URL da aplicação: https://bkcrm-app.herokuapp.com
- Logs: `heroku logs --tail -a bkcrm-app`
- Status: `heroku ps -a bkcrm-app`

## 6. Vantagens do Heroku

✅ **Deploy simples** - Apenas git push  
✅ **SSL automático** - HTTPS nativo  
✅ **Domínio gratuito** - herokuapp.com  
✅ **Logs centralizados** - heroku logs  
✅ **Rollback fácil** - heroku releases:rollback  
✅ **Add-ons** - Postgres, Redis, etc  
✅ **Escalabilidade** - Dynos sob demanda  

## 7. Custos

- **Hobby Dyno**: $7/mês
- **Professional**: $25-250/mês
- **Gratuito**: 550-1000 horas/mês (sleeps após 30min)

## 8. Comandos Úteis

```bash
# Ver logs em tempo real
heroku logs --tail -a bkcrm-app

# Executar comandos no container
heroku run bash -a bkcrm-app

# Redeploy
git commit --allow-empty -m "Redeploy"
git push heroku main

# Configurar domínio customizado
heroku domains:add bkcrm.com -a bkcrm-app
```

## 9. Solução de Problemas

### Build falha:
```bash
# Ver logs de build
heroku logs --tail -a bkcrm-app | grep "BUILD"

# Limpar cache
heroku plugins:install heroku-repo
heroku repo:purge_cache -a bkcrm-app
```

### App não carrega:
```bash
# Verificar status
heroku ps -a bkcrm-app

# Reiniciar
heroku restart -a bkcrm-app
```

---

**Status**: ✅ Pronto para deploy no Heroku  
**Estimativa**: 5-10 minutos para deploy completo 