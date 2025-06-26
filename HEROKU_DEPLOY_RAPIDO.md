# 🚀 Heroku Deploy - Guia Rápido (5 minutos)

## 1. Instalar Heroku CLI

### Windows (PowerShell como Administrador):
```powershell
# Instalar via winget
winget install Heroku.CLI

# OU baixar manualmente
# https://devcenter.heroku.com/articles/heroku-cli#download-and-install
```

### Verificar instalação:
```bash
heroku --version
```

## 2. Deploy Rápido

### Comandos sequenciais:
```bash
# 1. Login no Heroku
heroku login

# 2. Criar app
heroku create bkcrm-app

# 3. Configurar para Docker
heroku stack:set container -a bkcrm-app

# 4. Configurar variáveis de ambiente
heroku config:set NODE_ENV=production -a bkcrm-app
heroku config:set VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co -a bkcrm-app
heroku config:set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU -a bkcrm-app

# 5. Deploy
git push heroku main
```

## 3. Resultado Esperado

✅ **Build**: ~2-3 minutos  
✅ **Deploy**: ~1-2 minutos  
✅ **URL**: https://bkcrm-app.herokuapp.com  

## 4. Verificações

```bash
# Ver logs
heroku logs --tail -a bkcrm-app

# Status da aplicação
heroku ps -a bkcrm-app

# Abrir no navegador
heroku open -a bkcrm-app
```

## 5. Se der erro

```bash
# Redeploy
git commit --allow-empty -m "Redeploy"
git push heroku main

# Ver logs de erro
heroku logs --tail -a bkcrm-app
```

---

**⚡ Vantagem do Heroku**: Deploy em 5 minutos vs 2+ horas no EasyPanel! 