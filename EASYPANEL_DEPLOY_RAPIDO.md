# 🚀 Deploy Rápido no EasyPanel

## 1. Arquivos Criados

1. `Dockerfile.easypanel` - Container otimizado para EasyPanel
2. `easypanel.config.json` - Configuração do EasyPanel

## 2. Como Usar

### No EasyPanel Dashboard:

1. Vá para seu projeto
2. Clique em "Settings"
3. Em "Build Configuration":
   - Dockerfile Path: `Dockerfile.easypanel`
   - Port: `80`

### Variáveis de Ambiente:
```bash
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
```

## 3. O que mudou?

### ✅ Simplificações:

1. **Build em 2 estágios** - Mais leve e rápido
2. **Nginx simplificado** - Configuração mínima
3. **Sem complexidades** - Removido código desnecessário
4. **Dependências mínimas** - Só o essencial

### 🔄 Processo de Build:

1. Stage 1: Build do Node.js
   - Instala dependências
   - Compila o código
   - Gera arquivos estáticos

2. Stage 2: Nginx
   - Copia apenas os arquivos compilados
   - Configuração mínima do Nginx
   - Expõe porta 80

## 4. Solução de Problemas

### Se o build falhar:

1. Verifique os logs no EasyPanel
2. Confirme que o Dockerfile.easypanel está sendo usado
3. Verifique se todas as variáveis de ambiente estão configuradas

### Se a aplicação não carregar:

1. Verifique se a porta 80 está exposta
2. Confirme que o Nginx está rodando
3. Verifique os logs do container

## 5. Comandos Úteis

```bash
# Ver logs do container
docker logs -f bkcrm

# Entrar no container
docker exec -it bkcrm sh

# Reiniciar container
docker restart bkcrm
```

---

**⚡ Dica**: Se ainda houver problemas, considere usar o Heroku como alternativa mais simples! 