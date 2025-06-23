-- 🔍 VERIFICAR ESTRUTURA DA TABELA PROFILES
-- Este script verifica quais colunas existem na tabela profiles

-- 1. Mostrar estrutura completa da tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Mostrar dados de exemplo (primeiros 3 registros)
SELECT * FROM profiles LIMIT 3;

-- 3. Verificar se o usuário sistema já existe
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001'
OR email = 'system@websocket.internal';

-- 4. Mostrar total de registros por role
SELECT 
  role,
  COUNT(*) as total
FROM profiles 
GROUP BY role
ORDER BY total DESC; 