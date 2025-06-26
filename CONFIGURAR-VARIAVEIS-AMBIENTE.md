# 🔧 Configurar Variáveis de Ambiente - Frontend BKCRM

## ❌ Erro Atual
```
Supabase URL and Anon Key são necessários.
{url: undefined, hasAnonKey: false}
```

## ✅ Solução: Adicionar Variáveis no EasyPanel

### 1️⃣ Acesse o EasyPanel
1. **Dashboard > Services > bkcrm-frontend**
2. **Clique na aba "Environment"**

### 2️⃣ Adicione as Variáveis Obrigatórias

```bash
# Variável 1
VITE_SUPABASE_URL=https://sua-instancia.supabase.co

# Variável 2  
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 3️⃣ Como Encontrar os Valores

**VITE_SUPABASE_URL:**
1. Acesse **Supabase Dashboard**
2. **Settings > API**
3. Copie **Project URL**

**VITE_SUPABASE_ANON_KEY:**
1. Acesse **Supabase Dashboard**  
2. **Settings > API**
3. Copie **anon public** (não service_role!)

### 4️⃣ Configurar no EasyPanel

**Opção A: Via Interface**
1. **Environment tab**
2. **Add Variable**
3. **Name:** `VITE_SUPABASE_URL`
4. **Value:** `https://sua-instancia.supabase.co`
5. **Repeat para VITE_SUPABASE_ANON_KEY**

**Opção B: Via Bulk Edit**
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5️⃣ Redeploy
1. **Clique em "Deploy"**
2. **Aguarde rebuild**
3. **Teste o site**

## 🔍 Verificação

Após redeploy, o console deve mostrar:
```
✅ Supabase conectado com sucesso
✅ URL: https://sua-instancia.supabase.co
✅ hasAnonKey: true
```

## ⚠️ Importante

- ✅ **Use `anon public`** (para frontend)
- ❌ **NÃO use `service_role`** (só para backend/webhook)
- ✅ **Prefixo `VITE_`** é obrigatório para Vite
- ✅ **Variáveis ficam expostas** no bundle (comportamento normal)

## 🚀 Resultado Final

```
✅ Frontend: https://bkcrm.devsible.com.br (funcionando)
✅ Supabase: Conectado e autenticando
✅ Login/Cadastro: Funcionando
✅ Sistema: 100% operacional
```

---

**🎉 Após configurar as variáveis, seu sistema estará completamente funcional!** 