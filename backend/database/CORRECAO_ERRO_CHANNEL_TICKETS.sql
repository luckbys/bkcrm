-- ========================================
-- CORREÇÃO URGENTE: Coluna 'channel' faltante na tabela tickets
-- ========================================
-- Este script corrige o erro PGRST204: "Could not find the 'channel' column of 'tickets' in the schema cache"

-- EXECUTE ESTE SCRIPT NO SUPABASE DASHBOARD → SQL EDITOR

-- 1. VERIFICAR SE A TABELA TICKETS EXISTE
-- ========================================
DO $$
BEGIN
    -- Verificar se a tabela tickets existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets'
    ) THEN
        RAISE EXCEPTION 'ERRO: Tabela tickets não existe. Execute primeiro SOLUCAO_TICKETS_400_COMPLETA.sql';
    ELSE
        RAISE NOTICE '✅ Tabela tickets existe';
    END IF;
END $$;

-- 2. VERIFICAR E ADICIONAR COLUNA CHANNEL
-- ========================================
DO $$
BEGIN
    -- Verificar se a coluna channel existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'channel'
    ) THEN
        -- Adicionar coluna channel com constraint
        ALTER TABLE tickets ADD COLUMN channel TEXT DEFAULT 'chat' 
        CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web'));
        
        RAISE NOTICE '✅ Coluna channel adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna channel já existe na tabela tickets';
    END IF;
END $$;

-- 3. VERIFICAR E ADICIONAR OUTRAS COLUNAS ESSENCIAIS
-- ========================================
DO $$
BEGIN
    -- Verificar e adicionar subject se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'subject'
    ) THEN
        ALTER TABLE tickets ADD COLUMN subject TEXT;
        RAISE NOTICE '✅ Coluna subject adicionada';
    END IF;

    -- Verificar e adicionar description se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE tickets ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Coluna description adicionada';
    END IF;

    -- Verificar e adicionar status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'pendente' 
        CHECK (status IN ('pendente', 'atendimento', 'finalizado', 'cancelado', 'open', 'in_progress', 'resolved', 'closed'));
        RAISE NOTICE '✅ Coluna status adicionada';
    END IF;

    -- Verificar e adicionar priority se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'normal' 
        CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent'));
        RAISE NOTICE '✅ Coluna priority adicionada';
    END IF;

    -- Verificar e adicionar department_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN department_id UUID;
        RAISE NOTICE '✅ Coluna department_id adicionada';
    END IF;

    -- Verificar e adicionar metadata se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE tickets ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
        RAISE NOTICE '✅ Coluna metadata adicionada';
    END IF;

    -- Verificar e adicionar customer_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN customer_id UUID;
        RAISE NOTICE '✅ Coluna customer_id adicionada';
    END IF;
END $$;

-- 4. ATUALIZAR DADOS EXISTENTES
-- ========================================
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Definir canal padrão para tickets sem canal
    UPDATE tickets 
    SET channel = 'chat' 
    WHERE channel IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RAISE NOTICE '✅ % tickets foram atualizados com canal padrão "chat"', updated_count;
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum ticket precisou ser atualizado';
    END IF;
END $$;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- 6. FORÇAR ATUALIZAÇÃO DO SCHEMA CACHE
-- ========================================
-- Recarregar o schema cache do PostgREST/Supabase
NOTIFY pgrst, 'reload schema';

-- Comando adicional para forçar refresh do schema
SELECT pg_notify('pgrst', 'reload schema');

-- 7. VERIFICAÇÃO FINAL
-- ========================================
DO $$
DECLARE
    channel_exists BOOLEAN;
    ticket_count INTEGER;
    channels_used TEXT[];
BEGIN
    -- Verificar se a coluna channel existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'channel'
    ) INTO channel_exists;
    
    -- Contar tickets
    SELECT COUNT(*) INTO ticket_count FROM tickets;
    
    -- Buscar canais em uso
    SELECT array_agg(DISTINCT channel) INTO channels_used 
    FROM tickets 
    WHERE channel IS NOT NULL;
    
    RAISE NOTICE '📊 RESUMO DA CORREÇÃO:';
    RAISE NOTICE '   - Coluna channel existe: %', CASE WHEN channel_exists THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '   - Total de tickets: %', ticket_count;
    RAISE NOTICE '   - Canais em uso: %', COALESCE(array_to_string(channels_used, ', '), 'Nenhum');
    
    IF channel_exists THEN
        RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA COM SUCESSO!';
        RAISE NOTICE '   A coluna channel está disponível e o schema cache foi recarregado';
        RAISE NOTICE '   Teste no frontend: tente criar um ticket agora';
    ELSE
        RAISE NOTICE '❌ PROBLEMA AINDA EXISTE - execute novamente o script';
    END IF;
END $$;

-- 8. TESTE DE INSERÇÃO
-- ========================================
DO $$
DECLARE
    test_ticket_id UUID;
BEGIN
    -- Tentar inserir um ticket de teste
    INSERT INTO tickets (title, description, status, priority, channel, metadata)
    VALUES (
        'Teste de Correção Channel',
        'Ticket de teste para verificar se a coluna channel funciona',
        'pendente',
        'normal',
        'chat',
        '{"test": true, "created_by": "CORRECAO_ERRO_CHANNEL_TICKETS.sql"}'::JSONB
    )
    RETURNING id INTO test_ticket_id;
    
    RAISE NOTICE '✅ TESTE DE INSERÇÃO: OK';
    RAISE NOTICE '   Ticket de teste criado com ID: %', test_ticket_id;
    
    -- Limpar o ticket de teste
    DELETE FROM tickets WHERE id = test_ticket_id;
    RAISE NOTICE '🗑️ Ticket de teste removido';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TESTE DE INSERÇÃO: FALHOU - %', SQLERRM;
        RAISE NOTICE '   Execute este script novamente ou verifique as configurações do Supabase';
END $$;

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================
/*
🎯 PRÓXIMOS PASSOS:

1. ✅ Execute este script no Supabase Dashboard → SQL Editor
2. 🔄 Aguarde a mensagem "CORREÇÃO CONCLUÍDA COM SUCESSO"
3. 🌐 Volte ao frontend e tente criar um ticket
4. 📱 Teste também o webhook Evolution API

Se ainda houver erros:
- Verifique se o Supabase URL e API Key estão corretos
- Execute também SOLUCAO_TICKETS_400_COMPLETA.sql
- Entre em contato com suporte técnico

🏆 PROBLEMA RESOLVIDO: A coluna 'channel' agora está disponível!
*/ 