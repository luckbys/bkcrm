-- 🔧 CORREÇÃO FOREIGN KEY CONSTRAINT - VERSÃO SIMPLIFICADA
-- Resolver erro: Key (sender_id)=(00000000-0000-0000-0000-000000000001) is not present in table "profiles"

-- IMPORTANTE: Execute primeiro VERIFICAR_ESTRUTURA_PROFILES.sql para ver os campos disponíveis

-- 1. Verificar se o usuário sistema já existe
DO $$
BEGIN
  -- Criar usuário sistema se não existir
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    -- Inserção com campos básicos (mais provável de existir)
    INSERT INTO profiles (
      id,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'system@websocket.internal',
      'admin',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Usuário sistema WebSocket criado com sucesso: 00000000-0000-0000-0000-000000000001';
  ELSE
    RAISE NOTICE '✅ Usuário sistema WebSocket já existe: 00000000-0000-0000-0000-000000000001';
  END IF;
END $$;

-- 2. Tentar adicionar campos opcionais se existirem
DO $$
BEGIN
  -- Verificar se coluna 'name' existe e atualizar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
    UPDATE profiles 
    SET name = 'Sistema WebSocket'
    WHERE id = '00000000-0000-0000-0000-000000000001' AND (name IS NULL OR name = '');
    RAISE NOTICE '✅ Campo name atualizado';
  END IF;

  -- Verificar se coluna 'full_name' existe e atualizar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
    UPDATE profiles 
    SET full_name = 'Sistema WebSocket'
    WHERE id = '00000000-0000-0000-0000-000000000001' AND (full_name IS NULL OR full_name = '');
    RAISE NOTICE '✅ Campo full_name atualizado';
  END IF;

  -- Verificar se coluna 'phone' existe e atualizar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
    UPDATE profiles 
    SET phone = '+55 (11) 00000-0000'
    WHERE id = '00000000-0000-0000-0000-000000000001' AND (phone IS NULL OR phone = '');
    RAISE NOTICE '✅ Campo phone atualizado';
  END IF;

  -- Verificar se coluna 'metadata' existe e atualizar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='metadata') THEN
    UPDATE profiles 
    SET metadata = jsonb_build_object(
      'system_user', true,
      'type', 'websocket_system',
      'description', 'Usuário interno para mensagens do sistema WebSocket',
      'created_by', 'auto_migration',
      'permissions', array['send_system_messages', 'internal_operations']
    )
    WHERE id = '00000000-0000-0000-0000-000000000001' AND (metadata IS NULL OR metadata = '{}');
    RAISE NOTICE '✅ Campo metadata atualizado';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao atualizar campos opcionais: %', SQLERRM;
END $$;

-- 3. Validar se agora podemos inserir mensagens do sistema
DO $$
DECLARE
  test_message_id UUID;
  valid_ticket_id UUID;
BEGIN
  -- Buscar um ticket válido para teste
  SELECT id INTO valid_ticket_id FROM tickets LIMIT 1;
  
  IF valid_ticket_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum ticket encontrado para teste, criando ticket de exemplo...';
    
    -- Criar ticket de exemplo se não existir nenhum
    INSERT INTO tickets (
      id,
      title,
      status,
      priority,
      created_at,
      updated_at
    ) VALUES (
      '84d758e1-fa68-450e-9de2-48d9826ea800',
      'Ticket de teste para validação WebSocket',
      'open',
      'medium',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    valid_ticket_id := '84d758e1-fa68-450e-9de2-48d9826ea800';
  END IF;

  -- Teste de inserção de mensagem (será revertido)
  INSERT INTO messages (
    id,
    ticket_id,
    content,
    sender_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    valid_ticket_id,
    'Teste de mensagem do sistema',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
  ) RETURNING id INTO test_message_id;
  
  -- Remover mensagem de teste
  DELETE FROM messages WHERE id = test_message_id;
  
  RAISE NOTICE '✅ Teste de inserção bem-sucedido! Sistema pode agora salvar mensagens.';
  RAISE NOTICE '📝 Ticket usado para teste: %', valid_ticket_id;
  
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE '❌ Ainda há problema com foreign key: %', SQLERRM;
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro inesperado no teste: %', SQLERRM;
END $$;

-- 4. Mostrar informações do usuário sistema criado
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA!';
RAISE NOTICE '📝 O sistema WebSocket agora pode salvar mensagens com sender_id válido.';
RAISE NOTICE '🔧 Se houver erros, execute primeiro VERIFICAR_ESTRUTURA_PROFILES.sql'; 