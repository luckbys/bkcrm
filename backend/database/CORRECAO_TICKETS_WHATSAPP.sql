-- Função para encontrar ou criar ticket WhatsApp
CREATE OR REPLACE FUNCTION find_or_create_whatsapp_ticket(
  p_phone TEXT,
  p_client_name TEXT,
  p_department_id UUID DEFAULT NULL
)
RETURNS TABLE (
  ticket_id UUID,
  is_new BOOLEAN,
  sequence_number INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_ticket UUID;
  v_sequence_number INTEGER;
  v_new_ticket_id UUID;
BEGIN
  -- Buscar ticket ativo existente para este número
  SELECT id INTO v_existing_ticket
  FROM tickets
  WHERE 
    (metadata->>'whatsapp_phone' = p_phone OR metadata->>'client_phone' = p_phone)
    AND status IN ('open', 'in_progress', 'atendimento')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se encontrou ticket ativo, retorna ele
  IF v_existing_ticket IS NOT NULL THEN
    -- Atualiza os dados do telefone se necessário
    UPDATE tickets 
    SET 
      metadata = jsonb_set(
        jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{whatsapp_phone}',
          to_jsonb(p_phone)
        ),
        '{client_name}',
        to_jsonb(p_client_name)
      )
    WHERE id = v_existing_ticket;

    RETURN QUERY
    SELECT v_existing_ticket, false, 
      COALESCE((metadata->>'sequence_number')::INTEGER, 1)
    FROM tickets
    WHERE id = v_existing_ticket;
    RETURN;
  END IF;

  -- Calcular próxima sequência para este cliente
  SELECT COALESCE(MAX((metadata->>'sequence_number')::INTEGER), 0) + 1
  INTO v_sequence_number
  FROM tickets
  WHERE metadata->>'whatsapp_phone' = p_phone
    OR metadata->>'client_phone' = p_phone;

  -- Criar novo ticket
  INSERT INTO tickets (
    title,
    status,
    priority,
    channel,
    department_id,
    metadata
  )
  VALUES (
    CASE 
      WHEN v_sequence_number > 1 
      THEN 'Novo Atendimento - ' || p_client_name || ' (#' || v_sequence_number || ')'
      ELSE 'Atendimento - ' || p_client_name
    END,
    'open',
    'normal',
    'whatsapp',
    p_department_id,
    jsonb_build_object(
      'whatsapp_phone', p_phone,
      'client_name', p_client_name,
      'sequence_number', v_sequence_number,
      'is_whatsapp', true,
      'channel', 'whatsapp'
    )
  )
  RETURNING id INTO v_new_ticket_id;

  RETURN QUERY
  SELECT v_new_ticket_id, true, v_sequence_number;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION find_or_create_whatsapp_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION find_or_create_whatsapp_ticket TO service_role;

-- Teste da função
DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- Teste 1: Criar primeiro ticket
  SELECT * INTO v_result FROM find_or_create_whatsapp_ticket('5511999998888', 'Cliente Teste');
  RAISE NOTICE 'Teste 1 - Novo ticket: ID %, Is New: %, Sequence: %', 
    v_result.ticket_id, v_result.is_new, v_result.sequence_number;

  -- Teste 2: Tentar criar ticket duplicado (deve retornar o mesmo)
  SELECT * INTO v_result FROM find_or_create_whatsapp_ticket('5511999998888', 'Cliente Teste');
  RAISE NOTICE 'Teste 2 - Mesmo ticket: ID %, Is New: %, Sequence: %', 
    v_result.ticket_id, v_result.is_new, v_result.sequence_number;

  -- Teste 3: Finalizar ticket e criar novo
  UPDATE tickets SET status = 'finalizado' WHERE id = v_result.ticket_id;
  SELECT * INTO v_result FROM find_or_create_whatsapp_ticket('5511999998888', 'Cliente Teste');
  RAISE NOTICE 'Teste 3 - Novo ticket após finalizar: ID %, Is New: %, Sequence: %', 
    v_result.ticket_id, v_result.is_new, v_result.sequence_number;
END;
$$; 