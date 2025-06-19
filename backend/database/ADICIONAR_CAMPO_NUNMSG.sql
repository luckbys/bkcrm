-- =============================================================================
-- 📱 ADICIONAR CAMPO NUNMSG NA TABELA TICKETS
-- =============================================================================
-- Script para garantir que o campo nunmsg existe e pode ser usado pelo webhook

BEGIN;

-- 1. VERIFICAR SE CAMPO NUNMSG JÁ EXISTE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'nunmsg'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Campo nunmsg já existe na tabela tickets';
    ELSE
        RAISE NOTICE '⚙️ Campo nunmsg não existe, criando...';
        
        -- ADICIONAR CAMPO NUNMSG
        ALTER TABLE public.tickets 
        ADD COLUMN nunmsg VARCHAR NULL;
        
        RAISE NOTICE '✅ Campo nunmsg adicionado com sucesso!';
    END IF;
END $$;

-- 2. COMENTÁRIO EXPLICATIVO NO CAMPO
COMMENT ON COLUMN public.tickets.nunmsg IS 'Número de telefone do cliente que enviou mensagem via WhatsApp';

-- 3. CRIAR ÍNDICE PARA PERFORMANCE (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tickets' 
        AND indexname = 'idx_tickets_nunmsg'
    ) THEN
        CREATE INDEX idx_tickets_nunmsg ON public.tickets(nunmsg) 
        WHERE nunmsg IS NOT NULL;
        
        RAISE NOTICE '✅ Índice idx_tickets_nunmsg criado para performance';
    ELSE
        RAISE NOTICE '✅ Índice idx_tickets_nunmsg já existe';
    END IF;
END $$;

-- 4. VERIFICAR ESTRUTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'nunmsg'
AND table_schema = 'public';

-- 5. ESTATÍSTICAS DOS TICKETS WHATSAPP
SELECT 
    'Estatísticas Tickets WhatsApp' AS info,
    COUNT(*) AS total_whatsapp_tickets,
    COUNT(nunmsg) AS tickets_com_nunmsg,
    COUNT(*) - COUNT(nunmsg) AS tickets_sem_nunmsg,
    ROUND(
        (COUNT(nunmsg)::float / COUNT(*)) * 100, 2
    ) AS percentual_com_nunmsg
FROM tickets 
WHERE channel = 'whatsapp';

-- 6. MOSTRAR TICKETS WHATSAPP RECENTES
SELECT 
    id,
    title,
    nunmsg,
    metadata->>'client_phone' AS metadata_phone,
    metadata->>'whatsapp_phone' AS whatsapp_phone,
    created_at
FROM tickets 
WHERE channel = 'whatsapp'
ORDER BY created_at DESC
LIMIT 5;

COMMIT;

-- =============================================================================
-- 📋 INSTRUÇÕES DE USO:
-- =============================================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se campo nunmsg foi criado com sucesso
-- 3. Reinicie o webhook para usar o campo atualizado
-- 4. Teste enviando uma mensagem WhatsApp
-- 
-- ✅ RESULTADO ESPERADO:
-- - Campo nunmsg criado na tabela tickets
-- - Índice para performance criado
-- - Estatísticas mostram quantos tickets têm nunmsg
-- ============================================================================= 