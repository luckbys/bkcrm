-- =============================================================================
-- 🚨 CORREÇÃO COMPLETA: Campo nunmsg não está preenchido
-- =============================================================================
-- Execute este script no SQL Editor do Supabase para resolver o problema

-- 1. ADICIONAR CAMPO NUNMSG (se não existir)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS nunmsg VARCHAR NULL;

-- 2. COMENTÁRIO EXPLICATIVO
COMMENT ON COLUMN public.tickets.nunmsg IS 'Número de telefone do cliente que enviou mensagem via WhatsApp';

-- 3. MIGRAR NÚMEROS DOS METADADOS PARA CAMPO NUNMSG
UPDATE tickets SET nunmsg = COALESCE(
  metadata->>'client_phone',
  metadata->>'whatsapp_phone', 
  CASE 
    WHEN metadata->>'anonymous_contact' LIKE '%@s.whatsapp.net' 
    THEN REPLACE(metadata->>'anonymous_contact', '@s.whatsapp.net', '')
    ELSE metadata->>'anonymous_contact'
  END
)
WHERE channel = 'whatsapp' 
  AND nunmsg IS NULL;

-- 4. CRIAR ÍNDICE PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tickets_nunmsg 
ON public.tickets(nunmsg) WHERE nunmsg IS NOT NULL;

-- 5. MOSTRAR RESULTADO
SELECT 
  '🎯 RESULTADO DA CORREÇÃO' as status,
  COUNT(*) as total_tickets_whatsapp,
  COUNT(nunmsg) as tickets_com_nunmsg,
  COUNT(*) - COUNT(nunmsg) as tickets_sem_nunmsg,
  ROUND((COUNT(nunmsg)::float / COUNT(*)) * 100, 1) || '%' as percentual_sucesso
FROM tickets 
WHERE channel = 'whatsapp';

-- 6. MOSTRAR ÚLTIMOS TICKETS CORRIGIDOS
SELECT 
  '📱 ÚLTIMOS TICKETS CORRIGIDOS' as info,
  id,
  title,
  nunmsg,
  created_at
FROM tickets 
WHERE channel = 'whatsapp' 
  AND nunmsg IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5; 