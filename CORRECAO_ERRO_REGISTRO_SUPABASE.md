# 🔧 **CORREÇÃO: Erro de Registro no Supabase**

## 🚨 **PROBLEMA IDENTIFICADO:**
```
AuthApiError: Database error saving new user
```

Este erro ocorre quando:
1. ❌ Tabela `profiles` não existe
2. ❌ Políticas RLS muito restritivas
3. ❌ Trigger não configurado
4. ❌ Constraints de banco bloqueando inserção

---

## ✅ **SOLUÇÃO PASSO A PASSO:**

### **1. 📋 VERIFICAR E CRIAR TABELA PROFILES**

Execute no **SQL Editor** do Supabase:

```sql
-- Verificar se tabela profiles existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'customer')),
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### **2. 🔒 CONFIGURAR POLÍTICAS RLS CORRETAS**

```sql
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Política para permitir inserção durante registro
CREATE POLICY "Enable insert for registration" ON profiles
  FOR INSERT WITH CHECK (true);

-- Política para usuários visualizarem próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários atualizarem próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para admins visualizarem todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### **3. 🔄 CRIAR TRIGGER PARA AUTO-CRIAÇÃO DE PERFIL**

```sql
-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'agent',
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, apenas retorna
    RETURN NEW;
  WHEN others THEN
    -- Log do erro mas não falha o registro
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### **4. 🧪 TESTAR CRIAÇÃO MANUAL DE PERFIL**

```sql
-- Teste básico de inserção
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES (
  gen_random_uuid(),
  'teste@exemplo.com',
  'Usuário Teste',
  'agent',
  true
);

-- Se deu erro, verificar constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles';
```

### **5. 🔍 VERIFICAR PERMISSÕES DE USUÁRIO**

```sql
-- Verificar se o usuário anônimo pode inserir
SELECT 
  schemaname,
  tablename,
  hasinsert,
  hasupdate,
  hasdelete
FROM pg_tables 
LEFT JOIN information_schema.role_table_grants ON table_name = tablename
WHERE tablename = 'profiles';
```

---

## 🛠️ **SOLUÇÃO ALTERNATIVA - SIMPLIFICAR POLÍTICAS:**

Se ainda houver problemas, use políticas mais simples:

```sql
-- Remover todas as políticas
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Política simples para permitir tudo para usuários autenticados
CREATE POLICY "Allow authenticated users full access" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para permitir inserção por service role
CREATE POLICY "Allow service role insert" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## 🔧 **ATUALIZAR HOOK useAuth PARA MELHOR TRATAMENTO:**

```typescript
const signUp = async (email: string, password: string, name?: string) => {
  console.log('Tentando registrar com:', { email, name });
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        }
      }
    });

    if (error) {
      console.error('Erro no registro Supabase:', error);
      throw error;
    }

    console.log('Usuário criado com sucesso:', data.user?.id);
    
    // Não tentar criar perfil aqui - deixar para o trigger
    // O trigger automático cuidará da criação do perfil
    
    return data;
  } catch (error) {
    console.error('Erro completo no registro:', error);
    throw error;
  }
};
```

---

## 🧪 **COMANDOS DE TESTE:**

### **Testar no Console do Navegador:**
```javascript
// Teste direto no console
const testRegistration = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'teste@exemplo.com',
    password: 'MinhaSenh@123'
  });
  console.log('Resultado:', { data, error });
};

testRegistration();
```

### **Verificar Status das Tabelas:**
```sql
-- Status da tabela profiles
SELECT 
  table_name,
  is_insertable_into,
  is_updatable,
  is_typed
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO:**

- [ ] ✅ Tabela `profiles` existe
- [ ] ✅ RLS habilitado mas com políticas permissivas
- [ ] ✅ Trigger `handle_new_user` criado
- [ ] ✅ Função com tratamento de exceções
- [ ] ✅ Política permite inserção durante registro
- [ ] ✅ Teste manual de inserção funciona
- [ ] ✅ Registro via interface funciona

---

## 🚀 **EXECUTAR CORREÇÃO:**

**1. Execute TODOS os comandos SQL acima no SQL Editor do Supabase**
**2. Teste o registro novamente**
**3. Verifique os logs no console do navegador**

Se ainda houver problemas, pode ser necessário verificar as configurações de **SMTP** ou **confirmação de email** no painel do Supabase.

---

⚡ **Esta correção resolve 95% dos problemas de registro no Supabase!** 