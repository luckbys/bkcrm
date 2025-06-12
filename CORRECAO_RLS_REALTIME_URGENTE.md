# 🚨 CORREÇÃO URGENTE - RLS REALTIME BLOQUEADO

## ❌ **ERRO ATUAL:**
```
Failed to connect to the channel tickets-realtime: 
This may be due to restrictive RLS policies. 
Check your role and try again.
```

## ⚡ **SOLUÇÃO RÁPIDA (EXECUTE AGORA):**

### **1. 🗄️ Vá para SQL Editor do Supabase**
Dashboard → SQL Editor → **Nova Query**

### **2. 📋 COLE E EXECUTE ESTE SQL CORRIGIDO:**

```sql
-- CORREÇÃO URGENTE RLS PARA REALTIME (VERSÃO CORRIGIDA)
-- Execute linha por linha ou tudo de uma vez

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE "public"."tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS CONFLITANTES
DROP POLICY IF EXISTS "Users can read own tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Users can read department tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Admins can read all tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Users can create tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Users can update own tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "realtime_tickets_read" ON "public"."tickets";
DROP POLICY IF EXISTS "realtime_tickets_create" ON "public"."tickets";
DROP POLICY IF EXISTS "realtime_tickets_update" ON "public"."tickets";
DROP POLICY IF EXISTS "realtime_tickets_all" ON "public"."tickets";

DROP POLICY IF EXISTS "Users can read own messages" ON "public"."messages";
DROP POLICY IF EXISTS "Users can read ticket messages" ON "public"."messages";
DROP POLICY IF EXISTS "Users can create messages" ON "public"."messages";
DROP POLICY IF EXISTS "realtime_messages_read" ON "public"."messages";
DROP POLICY IF EXISTS "realtime_messages_create" ON "public"."messages";
DROP POLICY IF EXISTS "realtime_messages_update" ON "public"."messages";
DROP POLICY IF EXISTS "realtime_messages_all" ON "public"."messages";

DROP POLICY IF EXISTS "Users can read own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "realtime_profiles_read" ON "public"."profiles";
DROP POLICY IF EXISTS "realtime_profiles_update" ON "public"."profiles";
DROP POLICY IF EXISTS "realtime_profiles_all" ON "public"."profiles";

-- 3. REABILITAR RLS COM POLÍTICAS PERMISSIVAS
ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS PERMISSIVAS (TEMPORÁRIAS)
CREATE POLICY "realtime_tickets_all" ON "public"."tickets"
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "realtime_messages_all" ON "public"."messages"
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "realtime_profiles_all" ON "public"."profiles"
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. VERIFICAR E GARANTIR REALTIME (SEM ERROS DE DUPLICAÇÃO)
-- Primeiro verificamos quais tabelas já estão na publicação
-- e só adicionamos se não estiverem

DO $$
BEGIN
    -- Verificar e adicionar tickets se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'tickets'
    ) THEN
        ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
        RAISE NOTICE 'Tabela tickets adicionada ao Realtime';
    ELSE
        RAISE NOTICE 'Tabela tickets já está no Realtime';
    END IF;

    -- Verificar e adicionar messages se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
        RAISE NOTICE 'Tabela messages adicionada ao Realtime';
    ELSE
        RAISE NOTICE 'Tabela messages já está no Realtime';
    END IF;

    -- Verificar e adicionar profiles se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."profiles";
        RAISE NOTICE 'Tabela profiles adicionada ao Realtime';
    ELSE
        RAISE NOTICE 'Tabela profiles já está no Realtime';
    END IF;
END $$;
```

### **3. ✅ VERIFICAR SE FUNCIONOU:**

```sql
-- Verificar políticas criadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('tickets', 'messages', 'profiles')
ORDER BY tablename;

-- Verificar Realtime habilitado
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

---

## 🧪 **TESTAR NO NAVEGADOR:**

1. **Abra DevTools** (F12)
2. **Execute no Console:**
```javascript
// Testar conexão Realtime
testSupabaseConnection()

// Verificar se conectou
console.log('Realtime status:', supabase.realtime.isConnected());

// Testar subscription específica
supabase
  .channel('test-tickets')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tickets'
  }, (payload) => {
    console.log('✅ Realtime funcionando!', payload);
  })
  .subscribe();
```

---

## 🎯 **RESULTADO ESPERADO:**

- ✅ Sem erros RLS no Realtime
- ✅ Channels conectando com sucesso  
- ✅ Mensagens WhatsApp em tempo real
- ✅ Novos tickets aparecendo automaticamente

---

## ⚠️ **OBSERVAÇÕES IMPORTANTES:**

1. **Políticas são PERMISSIVAS** - para desenvolvimento/teste
2. **Depois você pode restringir** conforme necessário
3. **Realtime agora vai funcionar** para todos os usuários autenticados
4. **Execute o SQL** exatamente como está

---

## 🔄 **SE AINDA NÃO FUNCIONAR:**

```sql
-- SOLUÇÃO EXTREMA: Desabilitar RLS completamente (apenas para teste)
ALTER TABLE "public"."tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" DISABLE ROW LEVEL SECURITY;

-- Verificar status das tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tickets', 'messages', 'profiles');
```

**Execute este SQL corrigido e teste novamente. O Realtime deve funcionar imediatamente!** 🚀 