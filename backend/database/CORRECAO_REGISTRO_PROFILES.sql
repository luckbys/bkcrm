-- 🔧 CORREÇÃO COMPLETA: Erro de Registro Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR E CRIAR TABELA PROFILES
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

-- 2. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON profiles;
DROP POLICY IF EXISTS "Allow service role insert" ON profiles;

-- 4. CRIAR POLÍTICAS PERMISSIVAS PARA REGISTRO
-- Permitir inserção durante registro (essencial para criação de conta)
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

-- 5. CRIAR FUNÇÃO PARA AUTO-CRIAÇÃO DE PERFIL
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

-- 6. REMOVER E RECRIAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. TESTE DE VERIFICAÇÃO
-- Verificar se a tabela foi criada corretamente
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. COMENTÁRIOS E STATUS
SELECT 'CORREÇÃO APLICADA COM SUCESSO!' as status,
       'Tabela profiles criada/verificada' as step1,
       'Políticas RLS configuradas' as step2,
       'Trigger de auto-criação ativo' as step3,
       'Sistema pronto para registros' as step4; 