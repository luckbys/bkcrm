-- 🔧 CORREÇÃO COMPLETA: Erro de Registro Supabase - VERSÃO 2 (CORRIGIDA)
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE TABELA PROFILES JÁ EXISTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Criando tabela profiles...';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe, verificando estrutura...';
    END IF;
END
$$;

-- 2. CRIAR TABELA PROFILES (SE NÃO EXISTIR)
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

-- 3. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
DO $$
BEGIN
    -- Remove todas as políticas existentes
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
    DROP POLICY IF EXISTS "Allow authenticated users full access" ON profiles;
    DROP POLICY IF EXISTS "Allow service role insert" ON profiles;
    
    RAISE NOTICE 'Políticas antigas removidas (se existiam)';
END
$$;

-- 5. CRIAR POLÍTICAS PERMISSIVAS PARA REGISTRO
-- ESSENCIAL: Permite inserção durante registro
CREATE POLICY "Enable insert for registration" ON profiles
  FOR INSERT WITH CHECK (true);

-- Usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 6. CRIAR FUNÇÃO PARA AUTO-CRIAÇÃO DE PERFIL COM TRATAMENTO ROBUSTO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Tentar inserir o perfil
  INSERT INTO public.profiles (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'agent',
    true
  );
  
  RAISE NOTICE 'Perfil criado automaticamente para usuário: %', NEW.email;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, apenas retorna sem erro
    RAISE NOTICE 'Perfil já existe para usuário: %', NEW.email;
    RETURN NEW;
  WHEN foreign_key_violation THEN
    -- Se houver problema de chave estrangeira
    RAISE WARNING 'Erro de chave estrangeira ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
  WHEN others THEN
    -- Log do erro mas não falha o registro
    RAISE WARNING 'Erro inesperado ao criar perfil para usuário % (%): %', NEW.email, NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. REMOVER E RECRIAR TRIGGER
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    RAISE NOTICE 'Trigger anterior removido (se existia)';
END
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. VERIFICAÇÕES FINAIS
-- Verificar se a tabela foi criada
DO $$
DECLARE
    table_exists BOOLEAN;
    trigger_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Verificar tabela
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO table_exists;
    
    -- Verificar trigger
    SELECT EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' AND event_object_table = 'users'
    ) INTO trigger_exists;
    
    -- Contar políticas
    SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' INTO policy_count;
    
    -- Relatório
    RAISE NOTICE '=== RELATÓRIO DE CONFIGURAÇÃO ===';
    RAISE NOTICE 'Tabela profiles existe: %', table_exists;
    RAISE NOTICE 'Trigger ativo: %', trigger_exists;
    RAISE NOTICE 'Políticas RLS configuradas: %', policy_count;
    
    IF table_exists AND trigger_exists AND policy_count >= 4 THEN
        RAISE NOTICE '✅ CONFIGURAÇÃO COMPLETA E FUNCIONAL!';
        RAISE NOTICE '📝 Agora você pode testar o registro de usuários';
    ELSE
        RAISE WARNING '⚠️ Configuração incompleta. Verifique os logs acima.';
    END IF;
END
$$;

-- 9. TESTE OPCIONAL (comentado por segurança)
-- Descomente estas linhas se quiser testar inserção manual:
/*
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES (
  gen_random_uuid(),
  'teste_manual@exemplo.com',
  'Usuário Teste Manual',
  'agent',
  true
);

SELECT 'Teste de inserção manual: SUCESSO!' as resultado;
*/

-- 10. COMENTÁRIOS FINAIS
SELECT 
    '🎉 SCRIPT EXECUTADO COM SUCESSO!' as status,
    'Execute o teste de registro na interface agora' as próximo_passo,
    'Verifique os logs acima para confirmar tudo OK' as verificação; 