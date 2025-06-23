-- 🔧 CORREÇÃO FOREIGN KEY CONSTRAINT - VERSÃO ULTRA BÁSICA
-- Usar apenas campos essenciais: id, email, role

-- 1. Criar usuário sistema com campos mínimos
INSERT INTO profiles (
  id,
  email,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system@websocket.internal',
  'admin'
) ON CONFLICT (id) DO NOTHING;

-- 2. Verificar se foi criado
SELECT 
  id,
  email,
  role
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Resultado esperado:
-- ✅ Se mostrar o registro, foreign key constraint está resolvida
-- ❌ Se não mostrar, há problema com o schema da tabela 