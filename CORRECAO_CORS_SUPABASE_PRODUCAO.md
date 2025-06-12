# 🔧 Correção CORS Supabase - Produção

## ❌ Problema
```
Access to fetch at 'https://ajlgjjjvuglwgfnyqqvb.supabase.co/auth/v1/token?grant_type=password' 
from origin 'https://bkcrm.devsible.com.br' has been blocked by CORS policy
```

## ✅ Soluções

### Solução 1: Configurar CORS no Dashboard Supabase

1. **Acesse o Dashboard:**
   ```
   https://supabase.com/dashboard/project/ajlgjjjvuglwgfnyqqvb
   ```

2. **Navegue para Settings:**
   - Settings → API → CORS Configuration

3. **Adicione o domínio:**
   ```
   https://bkcrm.devsible.com.br
   ```

4. **Salve as configurações**

### Solução 2: Configurar via Variáveis de Ambiente

Se você tem acesso ao servidor Supabase, adicione:

```env
# No arquivo .env do Supabase
CORS_ALLOWED_ORIGINS=https://bkcrm.devsible.com.br,http://localhost:3000,http://localhost:5173
```

### Solução 3: Configurar via Docker (se aplicável)

Se o Supabase está rodando via Docker:

```yaml
# docker-compose.yml
services:
  kong:
    environment:
      KONG_CORS_ORIGINS: "https://bkcrm.devsible.com.br,http://localhost:3000"
```

### Solução 4: Proxy Reverso (Nginx)

Configure um proxy no seu servidor para contornar o CORS:

```nginx
# Adicionar ao nginx-webhook.conf
location /supabase/ {
    proxy_pass https://ajlgjjjvuglwgfnyqqvb.supabase.co/;
    proxy_set_header Host ajlgjjjvuglwgfnyqqvb.supabase.co;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "https://bkcrm.devsible.com.br" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials true always;
    
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://bkcrm.devsible.com.br";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type 'text/plain charset=UTF-8';
        add_header Content-Length 0;
        return 204;
    }
}
```

Depois atualize a URL do Supabase no seu frontend:
```js
// De:
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co'

// Para:
const supabaseUrl = 'https://bkcrm.devsible.com.br/supabase'
```

## 🧪 Teste da Correção

### Teste 1: Verificar CORS
```bash
curl -H "Origin: https://bkcrm.devsible.com.br" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://press-supabase.jhkbgs.easypanel.host/auth/v1/token
```

### Teste 2: Teste de Login
```bash
curl -X POST https://press-supabase.jhkbgs.easypanel.host/auth/v1/token \
  -H "Origin: https://bkcrm.devsible.com.br" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha",
    "grant_type": "password"
  }'
```

## 🔄 Reiniciar Serviços

Após fazer as configurações:

```bash
# Se usando Docker
docker-compose restart

# Se usando systemd
sudo systemctl restart supabase

# Se usando PM2
pm2 restart supabase
```

## 📝 Verificação Final

1. **Limpe o cache do navegador**
2. **Teste o login novamente**
3. **Verifique o console do navegador**
4. **Confirme se não há mais erros de CORS**

## 🚨 Troubleshooting

### Se ainda não funcionar:

1. **Verifique se o domínio está correto:**
   - `https://bkcrm.devsible.com.br` (com https)
   - Sem barra no final

2. **Verifique se o Supabase está acessível:**
   ```bash
   curl https://press-supabase.jhkbgs.easypanel.host/health
   ```

3. **Verifique logs do Supabase:**
   ```bash
   # Docker
   docker logs supabase-kong
   
   # PM2
   pm2 logs supabase
   ```

4. **Contate o administrador do Supabase** se você não tem acesso às configurações.

## 📞 Contato

Se precisar de ajuda adicional, forneça:
- URL exata do erro
- Logs do console do navegador
- Configuração atual do CORS
- Acesso ao servidor Supabase (se disponível) 