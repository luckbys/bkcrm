-- 🔧 CORREÇÃO FOREIGN KEY CONSTRAINT: messages_sender_id_fkey
-- Resolver erro: Key (sender_id)=(00000000-0000-0000-0000-000000000001) is not present in table "profiles"

-- 1. Verificar se o usuário sistema já existe
DO $$
BEGIN
  -- Criar usuário sistema se não existir
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO profiles (
      id,
      full_name,
      email,
      role,
      phone,
      company,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Sistema WebSocket',
      'system@websocket.internal',
      'admin',
      '+55 (11) 00000-0000',
      'Sistema Interno',
      jsonb_build_object(
        'system_user', true,
        'type', 'websocket_system',
        'description', 'Usuário interno para mensagens do sistema WebSocket',
        'created_by', 'auto_migration',
        'permissions', array['send_system_messages', 'internal_operations']
      ),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Usuário sistema WebSocket criado com sucesso: 00000000-0000-0000-0000-000000000001';
  ELSE
    RAISE NOTICE '✅ Usuário sistema WebSocket já existe: 00000000-0000-0000-0000-000000000001';
  END IF;
END $$;

-- 2. Verificar constraint da tabela messages
DO $$
BEGIN
  -- Verificar se a constraint existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    RAISE NOTICE '✅ Foreign key constraint messages_sender_id_fkey existe';
  ELSE
    RAISE NOTICE '⚠️ Foreign key constraint messages_sender_id_fkey NÃO existe';
  END IF;
END $$;

-- 3. Validar se agora podemos inserir mensagens do sistema
DO $$
DECLARE
  test_message_id UUID;
BEGIN
  -- Teste de inserção (será revertido)
  INSERT INTO messages (
    id,
    ticket_id,
    content,
    sender_id,
    sender_name,
    sender_type,
    type,
    is_internal,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '84d758e1-fa68-450e-9de2-48d9826ea800', -- Ticket do erro
    'Teste de mensagem do sistema',
    '00000000-0000-0000-0000-000000000001',
    'Sistema WebSocket',
    'agent',
    'text',
    true,
    jsonb_build_object(
      'test', true,
      'created_by', 'system_validation'
    ),
    NOW(),
    NOW()
  ) RETURNING id INTO test_message_id;
  
  -- Remover mensagem de teste
  DELETE FROM messages WHERE id = test_message_id;
  
  RAISE NOTICE '✅ Teste de inserção bem-sucedido! Sistema pode agora salvar mensagens.';
  
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE '❌ Ainda há problema com foreign key: %', SQLERRM;
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro inesperado no teste: %', SQLERRM;
END $$;

-- 4. Mostrar informações do usuário sistema criado
SELECT 
  id,
  full_name,
  email,
  role,
  metadata,
  created_at
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Verificar total de profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  COUNT(*) FILTER (WHERE role = 'agent') as agents,
  COUNT(*) FILTER (WHERE role = 'customer') as customers
FROM profiles;

RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA: Foreign key constraint resolvida!';
RAISE NOTICE '📝 O sistema WebSocket agora pode salvar mensagens com sender_id válido.';
RAISE NOTICE '🔧 Execute este script no SQL Editor do Supabase Dashboard.'; 