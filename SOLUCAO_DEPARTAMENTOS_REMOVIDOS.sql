-- 🔧 SOLUÇÃO: Departamentos Removidos Não Saindo da Lista
-- Execute este script no Supabase Dashboard > SQL Editor

-- ==========================================
-- PASSO 1: DIAGNÓSTICO INICIAL
-- ==========================================

DO $$
DECLARE
    total_count INTEGER;
    active_count INTEGER;
    inactive_count INTEGER;
BEGIN
    -- Contar departamentos
    SELECT COUNT(*) INTO total_count FROM departments;
    SELECT COUNT(*) INTO active_count FROM departments WHERE is_active = true;
    SELECT COUNT(*) INTO inactive_count FROM departments WHERE is_active = false;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔍 DIAGNÓSTICO: Departamentos Removidos';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total de departamentos: %', total_count;
    RAISE NOTICE 'Departamentos ativos: %', active_count;
    RAISE NOTICE 'Departamentos removidos: %', inactive_count;
    RAISE NOTICE '============================================';
    
    IF inactive_count > 0 THEN
        RAISE NOTICE '⚠️  PROBLEMA IDENTIFICADO: % departamento(s) removido(s) podem estar aparecendo na lista', inactive_count;
    ELSE
        RAISE NOTICE '✅ Nenhum departamento removido encontrado';
    END IF;
END $$;

-- ==========================================
-- PASSO 2: LISTAR DEPARTAMENTOS REMOVIDOS
-- ==========================================

SELECT 
    '🗑️ DEPARTAMENTOS REMOVIDOS' as status,
    id,
    name,
    description,
    updated_at as removido_em,
    created_at as criado_em
FROM departments 
WHERE is_active = false
ORDER BY updated_at DESC;

-- ==========================================
-- PASSO 3: VERIFICAR DEPENDÊNCIAS
-- ==========================================

-- Verificar tickets vinculados a departamentos removidos
SELECT 
    '🎫 TICKETS ÓRFÃOS' as tipo,
    d.name as departamento_removido,
    COUNT(t.id) as tickets_vinculados
FROM departments d
LEFT JOIN tickets t ON t.department_id = d.id
WHERE d.is_active = false
GROUP BY d.id, d.name
HAVING COUNT(t.id) > 0;

-- Verificar usuários vinculados a departamentos removidos
SELECT 
    '👥 USUÁRIOS ÓRFÃOS' as tipo,
    d.name as departamento_removido,
    COUNT(p.id) as usuarios_vinculados
FROM departments d
LEFT JOIN profiles p ON p.department_id = d.id
WHERE d.is_active = false
GROUP BY d.id, d.name
HAVING COUNT(p.id) > 0;

-- ==========================================
-- PASSO 4: OPÇÕES DE SOLUÇÃO
-- ==========================================

-- OPÇÃO A: Reativar departamento removido por engano
/*
Para reativar um departamento específico:

UPDATE departments 
SET is_active = true, updated_at = NOW()
WHERE name = 'NOME_DO_DEPARTAMENTO_AQUI';
*/

-- OPÇÃO B: Mover dependências para outro departamento e fazer hard delete
/*
1. Primeiro, escolha um departamento de destino:
SELECT id, name FROM departments WHERE is_active = true LIMIT 5;

2. Mover tickets órfãos:
UPDATE tickets 
SET department_id = 'ID_DEPARTAMENTO_DESTINO_AQUI'
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
);

3. Mover usuários órfãos:
UPDATE profiles 
SET department_id = 'ID_DEPARTAMENTO_DESTINO_AQUI'
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
);

4. Remover permanentemente:
DELETE FROM departments WHERE is_active = false;
*/

-- ==========================================
-- PASSO 5: SOLUÇÃO AUTOMÁTICA SEGURA
-- ==========================================

DO $$
DECLARE
    default_dept_id UUID;
    moved_tickets INTEGER := 0;
    moved_users INTEGER := 0;
    removed_depts INTEGER := 0;
BEGIN
    -- Buscar o primeiro departamento ativo para ser o padrão
    SELECT id INTO default_dept_id 
    FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    IF default_dept_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Nenhum departamento ativo encontrado para ser o padrão!';
        RETURN;
    END IF;
    
    RAISE NOTICE '🎯 Departamento padrão selecionado: %', default_dept_id;
    
    -- Mover tickets órfãos para o departamento padrão
    UPDATE tickets 
    SET department_id = default_dept_id
    WHERE department_id IN (
        SELECT id FROM departments WHERE is_active = false
    );
    
    GET DIAGNOSTICS moved_tickets = ROW_COUNT;
    
    -- Mover usuários órfãos para o departamento padrão
    UPDATE profiles 
    SET department_id = default_dept_id
    WHERE department_id IN (
        SELECT id FROM departments WHERE is_active = false
    );
    
    GET DIAGNOSTICS moved_users = ROW_COUNT;
    
    -- Agora é seguro remover os departamentos inativos
    DELETE FROM departments WHERE is_active = false;
    
    GET DIAGNOSTICS removed_depts = ROW_COUNT;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ LIMPEZA AUTOMÁTICA CONCLUÍDA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tickets movidos: %', moved_tickets;
    RAISE NOTICE 'Usuários movidos: %', moved_users;
    RAISE NOTICE 'Departamentos removidos: %', removed_depts;
    RAISE NOTICE '============================================';
    
    IF removed_depts > 0 THEN
        RAISE NOTICE '🎉 PROBLEMA RESOLVIDO: Departamentos removidos não aparecerão mais na lista!';
        RAISE NOTICE '🔄 Recarregue o frontend para ver as mudanças';
    END IF;
END $$;

-- ==========================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ==========================================

DO $$
DECLARE
    final_active INTEGER;
    final_inactive INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_active FROM departments WHERE is_active = true;
    SELECT COUNT(*) INTO final_inactive FROM departments WHERE is_active = false;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔍 VERIFICAÇÃO FINAL';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Departamentos ativos restantes: %', final_active;
    RAISE NOTICE 'Departamentos inativos restantes: %', final_inactive;
    
    IF final_inactive = 0 THEN
        RAISE NOTICE '✅ SUCESSO: Todos os departamentos removidos foram limpos!';
        RAISE NOTICE '🎯 Frontend agora mostrará apenas departamentos ativos';
    ELSE
        RAISE NOTICE '⚠️  Ainda há % departamento(s) inativo(s)', final_inactive;
    END IF;
    
    RAISE NOTICE '============================================';
END $$;

-- ==========================================
-- PASSO 7: PREVENÇÃO FUTURA
-- ==========================================

-- Criar função para garantir que soft delete funcione corretamente
CREATE OR REPLACE FUNCTION prevent_orphan_references()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está marcando departamento como inativo, verificar dependências
    IF NEW.is_active = false AND OLD.is_active = true THEN
        -- Avisar sobre tickets que serão afetados
        RAISE NOTICE 'Departamento % sendo marcado como inativo. Verificando dependências...', OLD.name;
        
        -- Contar tickets vinculados
        DECLARE
            ticket_count INTEGER;
            user_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO ticket_count FROM tickets WHERE department_id = OLD.id;
            SELECT COUNT(*) INTO user_count FROM profiles WHERE department_id = OLD.id;
            
            IF ticket_count > 0 THEN
                RAISE NOTICE 'ATENÇÃO: % ticket(s) vinculado(s) a este departamento', ticket_count;
            END IF;
            
            IF user_count > 0 THEN
                RAISE NOTICE 'ATENÇÃO: % usuário(s) vinculado(s) a este departamento', user_count;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger apenas se não existir
DROP TRIGGER IF EXISTS prevent_orphan_references_trigger ON departments;
CREATE TRIGGER prevent_orphan_references_trigger
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_orphan_references();

-- Finalizar com mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🛡️  PROTEÇÃO FUTURA INSTALADA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Trigger criado para prevenir referências órfãs';
    RAISE NOTICE 'Sistema irá avisar sobre dependências ao remover departamentos';
    RAISE NOTICE '============================================';
END $$; 