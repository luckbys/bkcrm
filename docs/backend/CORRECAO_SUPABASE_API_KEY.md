# 🚨 CORREÇÃO: "No API key found in request"

## ⚠️ **Problema**
```json
{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}
```

## ✅ **Solução Completa**

### **PASSO 1: Verificar arquivo .env**

1. **Verifique se existe o arquivo `.env`** na raiz do projeto
2. **Se não existe, crie um** com as seguintes variáveis:

```env
# Configurações Supabase
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI
VITE_ENABLE_REALTIME=true
```

### **PASSO 2: Obter as chaves corretas**

1. **Acesse o Supabase Dashboard**
2. **Vá para Settings** → **API**
3. **Copie as chaves:**
   - **URL**: `https://ajlgjjjvuglwgfnyqqvb.supabase.co`
   - **anon public**: Use esta no `VITE_SUPABASE_ANON_KEY`

### **PASSO 3: Configuração correta do .env**

```env
# ⚠️ SUBSTITUA pelos valores reais do seu projeto
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SEU_TOKEN_AQUI
VITE_ENABLE_REALTIME=true
```

### **PASSO 4: Reiniciar o servidor**

```bash
# Parar o servidor (Ctrl+C)
# Depois executar:
npm run dev
```

## 🔧 **Se ainda não funcionar:**

### **Verificação 1: Testar no console**

Abra o **DevTools** (F12) e execute:
```javascript
console.log('Variáveis:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY
});
```

### **Verificação 2: Limpar cache**

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules
npm install
npm run dev
```

### **Verificação 3: Arquivo .env alternativo**

Se estiver usando PowerShell, crie o arquivo com:
```powershell
New-Item -Path ".env" -ItemType File -Force
notepad .env
```

## 📝 **Template .env completo**

```env
# CONFIGURAÇÕES SUPABASE
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqaWp2dWdsd2dmbXlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjE2NjIsImV4cCI6MjA1MjUzNzY2Mn0.SEU_TOKEN_REAL_AQUI

# CONFIGURAÇÕES OPCIONAIS
VITE_ENABLE_REALTIME=true
VITE_ENVIRONMENT=development
```

## 🎯 **Resultado esperado**

Após configurar corretamente:
- ✅ Erro "No API key found" desaparece
- ✅ Login funciona normalmente
- ✅ Dados do Supabase carregam
- ✅ Sistema totalmente funcional

---

💡 **Dica importante:** O arquivo `.env` deve estar na **raiz do projeto** (mesmo nível que `package.json`) 