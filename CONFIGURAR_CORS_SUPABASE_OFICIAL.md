# 🔧 Configurar CORS no Supabase Oficial

## 📋 Informações do Projeto
- **Projeto ID**: `ajlgjjjvuglwgfnyqqvb`
- **URL do Supabase**: `https://ajlgjjjvuglwgfnyqqvb.supabase.co`
- **Domínio de Produção**: `https://bkcrm.devsible.com.br`

## 🌐 Método 1: Configurar CORS no Dashboard Supabase

### Passo 1: Acessar o Dashboard
1. Acesse: https://supabase.com/dashboard/project/ajlgjjjvuglwgfnyqqvb
2. Faça login na sua conta Supabase

### Passo 2: Configurar CORS
1. Vá para **Settings** → **API**
2. Na seção **CORS Configuration**, adicione:
   ```
   https://bkcrm.devsible.com.br
   ```
3. Se houver outros domínios, separe por vírgula:
   ```
   https://bkcrm.devsible.com.br, http://localhost:3000, http://localhost:5173
   ```
4. Clique em **Save**

## 🔄 Método 2: Usar Proxy Reverso (Recomendado)

### Por que usar proxy?
- Resolve CORS sem depender de configurações externas
- Maior controle sobre as requisições
- Funciona mesmo se o CORS não estiver configurado no Supabase

### Configuração do Nginx
O arquivo `nginx-webhook.conf` já está configurado com:

```nginx
location /supabase/ {
    proxy_pass https://ajlgjjjvuglwgfnyqqvb.supabase.co/;
    proxy_set_header Host ajlgjjjvuglwgfnyqqvb.supabase.co;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "https://bkcrm.devsible.com.br" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With, apikey, x-client-info" always;
    add_header Access-Control-Allow-Credentials true always;
    
    # Preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://bkcrm.devsible.com.br";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With, apikey, x-client-info";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type 'text/plain charset=UTF-8';
        add_header Content-Length 0;
        return 204;
    }
}
```

### Configuração do Frontend
O arquivo `env.production` configura:
```env
VITE_SUPABASE_URL=https://bkcrm.devsible.com.br/supabase
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDQ5NDMsImV4cCI6MjA1MTUyMDk0M30.xbNH2mNzAYJzNOdwjLDBgF_-P8qMa3Fq2YEyHiV_j4U
```

## 🧪 Testes

### Teste 1: Verificar CORS direto
```bash
curl -H "Origin: https://bkcrm.devsible.com.br" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://ajlgjjjvuglwgfnyqqvb.supabase.co/auth/v1/token
```

### Teste 2: Verificar proxy
```bash
curl -H "Origin: https://bkcrm.devsible.com.br" \
     -X OPTIONS \
     https://bkcrm.devsible.com.br/supabase/auth/v1/token
```

### Teste 3: Login via proxy
```bash
curl -X POST https://bkcrm.devsible.com.br/supabase/auth/v1/token \
  -H "Origin: https://bkcrm.devsible.com.br" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDQ5NDMsImV4cCI6MjA1MTUyMDk0M30.xbNH2mNzAYJzNOdwjLDBgF_-P8qMa3Fq2YEyHiV_j4U" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha",
    "grant_type": "password"
  }'
```

## 🚀 Deploy

### Passo 1: Configurar para produção
```bash
# Usar configurações de produção
cp env.production .env

# Fazer build
npm run build

# Ou usar script automatizado
./deploy-production.sh
```

### Passo 2: Configurar servidor
1. Faça upload dos arquivos para o servidor
2. Configure o Nginx usando `nginx-webhook.conf`
3. Reinicie o Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Passo 3: Testar
1. Acesse: `https://bkcrm.devsible.com.br`
2. Tente fazer login
3. Verifique se não há erros de CORS no console

## 🔍 Troubleshooting

### Erro: "CORS policy"
- ✅ Verifique se o Nginx está configurado corretamente
- ✅ Confirme se o domínio está correto no CORS
- ✅ Teste o proxy: `curl https://bkcrm.devsible.com.br/supabase/`

### Erro: "Failed to fetch"
- ✅ Verifique se o Supabase está acessível
- ✅ Confirme se a API key está correta
- ✅ Teste a conexão direta: `curl https://ajlgjjjvuglwgfnyqqvb.supabase.co/`

### Erro: "Invalid API key"
- ✅ Verifique se a `VITE_SUPABASE_ANON_KEY` está correta
- ✅ Confirme se não há espaços ou quebras de linha na key
- ✅ Teste no dashboard do Supabase

## ✅ Checklist Final

- [ ] CORS configurado no dashboard Supabase
- [ ] Nginx configurado com proxy para Supabase
- [ ] Arquivo `env.production` configurado
- [ ] Build da aplicação feito
- [ ] Arquivos enviados para o servidor
- [ ] Nginx reiniciado
- [ ] Testes de login funcionando
- [ ] Console sem erros de CORS

**🎉 Pronto! O CORS está resolvido e o login funcionando!** 