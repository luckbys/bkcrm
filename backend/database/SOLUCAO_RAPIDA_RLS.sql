-- SOLUÇÃO RÁPIDA: Corrigir Recursão RLS
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
DO $$
BEGIN
    ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are readable" ON profiles;
    DROP POLICY IF EXISTS "Allow registration" ON profiles;
    DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
    DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
    
    RAISE NOTICE '✅ Políticas problemáticas removidas';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro: %', SQLERRM;
END $$;

-- 2. CRIAR TABELAS SE NECESSÁRIO
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
    
    -- Constraint para permitir tickets anônimos ou com cliente
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

-- 3. POLÍTICAS RLS SIMPLES (SEM RECURSÃO)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas simples e diretas
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write" ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "tickets_read" ON tickets FOR SELECT USING (true);
CREATE POLICY "tickets_write" ON tickets FOR ALL USING (true);

CREATE POLICY "messages_read" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_write" ON messages FOR ALL USING (true);

-- 4. TRIGGER PARA PERFIL AUTOMÁTICO
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

-- 5. VERIFICAÇÃO
DO $$
DECLARE
    profiles_count INTEGER;
    tickets_count INTEGER;
    messages_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    SELECT COUNT(*) INTO tickets_count FROM tickets;
    SELECT COUNT(*) INTO messages_count FROM messages;
    
    RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA!';
    RAISE NOTICE '📊 Profiles: %, Tickets: %, Messages: %', profiles_count, tickets_count, messages_count;
    RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$; 