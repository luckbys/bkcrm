-- 🔍 Verificar Schema Real da Tabela Tickets
-- Execute este script primeiro para ver a estrutura atual

-- 1. Verificar estrutura da tabela tickets
SELECT 
    'Estrutura da tabela tickets' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela messages
SELECT 
    'Estrutura da tabela messages' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela departments
SELECT 
    'Estrutura da tabela departments' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'departments' 
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
SELECT 
    'Departamentos existentes' as info,
    id,
    name,
    description
FROM departments 
ORDER BY name;

-- 5. Verificar tickets existentes (últimos 5)
SELECT 
    'Tickets existentes (últimos 5)' as info,
    id,
    status,
    department_id,
    created_at
FROM tickets 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Verificar mensagens existentes (últimas 5)
SELECT 
    'Mensagens existentes (últimas 5)' as info,
    id,
    ticket_id,
    content,
    created_at
FROM messages 
ORDER BY created_at DESC 
LIMIT 5; 