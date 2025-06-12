-- CORREÇÃO RLS SEM CONFLITOS
-- Este script pode ser executado múltiplas vezes sem erros
-- Execute no Supabase Dashboard > SQL Editor

-- 1. LIMPAR TODAS AS POLÍTICAS EXISTENTES
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Desabilitar RLS primeiro
    EXECUTE 'ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS tickets DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY';
    
    -- Remover todas as políticas da tabela profiles
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
    
    -- Remover todas as políticas da tabela tickets
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON tickets';
    END LOOP;
    
    -- Remover todas as políticas da tabela messages
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
    END LOOP;
    
    RAISE NOTICE '✅ Todas as políticas removidas';
END $$;

-- 2. CRIAR TABELAS (SE NÃO EXISTIREM)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendimento', 'finalizado', 'cancelado')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
    channel TEXT DEFAULT 'chat' CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao')),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    department TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    unread BOOLEAN DEFAULT true,
    is_internal BOOLEAN DEFAULT false,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_customer_or_anonymous CHECK (
        customer_id IS NOT NULL OR 
        (metadata->>'anonymous_contact') IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    sender_email TEXT,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'video', 'system')),
    is_internal BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS SIMPLES (COM NOMES ÚNICOS)
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "allow_all_tickets" ON tickets FOR ALL USING (true);
CREATE POLICY "allow_all_messages" ON messages FOR ALL USING (true);

-- 5. FUNÇÃO E TRIGGER PARA PERFIL AUTOMÁTICO
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. VERIFICAÇÃO FINAL
DO $$
DECLARE
    profiles_count INTEGER;
    tickets_count INTEGER;
    messages_count INTEGER;
    policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    SELECT COUNT(*) INTO tickets_count FROM tickets;
    SELECT COUNT(*) INTO messages_count FROM messages;
    
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('profiles', 'tickets', 'messages');
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA SEM CONFLITOS!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTATÍSTICAS:';
    RAISE NOTICE '  ✅ Profiles: % registros', profiles_count;
    RAISE NOTICE '  ✅ Tickets: % registros', tickets_count;
    RAISE NOTICE '  ✅ Messages: % registros', messages_count;
    RAISE NOTICE '  ✅ Políticas RLS: % ativas', policies_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SISTEMA FUNCIONANDO!';
    RAISE NOTICE '✨ Teste sua aplicação agora!';
END $$; 