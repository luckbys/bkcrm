-- 📞 SCRIPT PARA ADICIONAR CAMPOS DE TELEFONE NA TABELA TICKETS
-- Facilita acesso direto do frontend ao telefone do cliente sem precisar buscar nos metadados
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar coluna client_phone (telefone direto do cliente)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'client_phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tickets ADD COLUMN client_phone VARCHAR(20);
        RAISE NOTICE '✅ Coluna client_phone adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna client_phone já existe na tabela tickets';
    END IF;
END $$;

-- 2. Adicionar coluna customerPhone (compatibilidade com frontend)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'customerPhone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tickets ADD COLUMN "customerPhone" VARCHAR(20);
        RAISE NOTICE '✅ Coluna customerPhone adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna customerPhone já existe na tabela tickets';
    END IF;
END $$;

-- 3. Adicionar coluna isWhatsApp (flag para identificar tickets WhatsApp)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'isWhatsApp'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tickets ADD COLUMN "isWhatsApp" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Coluna isWhatsApp adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna isWhatsApp já existe na tabela tickets';
    END IF;
END $$;

-- 4. Atualizar tickets existentes do WhatsApp que já têm telefone nos metadados
UPDATE public.tickets 
SET 
    client_phone = metadata->>'whatsapp_phone',
    "customerPhone" = metadata->>'whatsapp_phone',
    "isWhatsApp" = TRUE
WHERE 
    channel = 'whatsapp' 
    AND metadata->>'whatsapp_phone' IS NOT NULL
    AND (client_phone IS NULL OR client_phone = '');

-- 5. Verificar resultados
SELECT 
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN channel = 'whatsapp' THEN 1 END) as whatsapp_tickets,
    COUNT(CASE WHEN client_phone IS NOT NULL AND client_phone != '' THEN 1 END) as tickets_com_telefone,
    COUNT(CASE WHEN "isWhatsApp" = TRUE THEN 1 END) as tickets_whatsapp_marcados
FROM public.tickets;

-- 6. Amostra de tickets WhatsApp com telefones
SELECT 
    id,
    title,
    channel,
    client_phone,
    "customerPhone",
    "isWhatsApp",
    metadata->>'whatsapp_phone' as metadata_phone,
    created_at
FROM public.tickets 
WHERE channel = 'whatsapp' 
ORDER BY created_at DESC 
LIMIT 5;

RAISE NOTICE '📞 Script de adição de campos de telefone concluído!';
RAISE NOTICE '✅ Webhooks agora vinculam telefone automaticamente aos tickets';
RAISE NOTICE '✅ Frontend pode acessar telefone via ticket.client_phone ou ticket.customerPhone';
RAISE NOTICE '✅ Tickets WhatsApp marcados com isWhatsApp = true'; 