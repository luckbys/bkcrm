-- 🛠️ CORREÇÃO URGENTE - ENUM USER_ROLE
-- Problema: invalid input value for enum user_role: "super_admin"

-- ===== SOLUÇÃO RÁPIDA =====
-- Adicionar "super_admin" ao enum existente
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ===== VERIFICAÇÕES =====
-- Ver todos os valores aceitos pelo enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;

-- Ver quantos registros usam cada role
SELECT role, COUNT(*) as count 
FROM profiles 
GROUP BY role;

-- ===== INSTRUÇÕES =====
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Reinicie a aplicação (Ctrl+C e npm run dev)
-- 3. O erro "invalid input value" deve ser resolvido

-- ===== LOG =====
DO $$
BEGIN
    RAISE NOTICE '✅ Enum user_role atualizado com sucesso';
    RAISE NOTICE '🔄 Reinicie a aplicação para aplicar as mudanças';
END $$; 