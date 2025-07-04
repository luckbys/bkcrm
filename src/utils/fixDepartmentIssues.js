import { supabase } from '@/lib/supabase';
/**
 * Verifica problemas relacionados aos departamentos dos usuários
 */
export async function checkDepartmentIssues() {
    try {
        // Buscar todos os usuários com suas informações de departamento
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select(`
        id,
        name,
        email,
        role,
        department_id,
        departments (
          id,
          name,
          is_active
        )
      `);
        if (usersError)
            throw usersError;
        const issues = [];
        for (const user of users || []) {
            // Verificar agentes/admins sem departamento
            if ((user.role === 'agent' || user.role === 'admin') && !user.department_id) {
                issues.push({
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    userRole: user.role,
                    currentDepartmentId: null,
                    issue: `${user.role} sem departamento atribuído`,
                    suggested_fix: 'Atribuir a um departamento ativo'
                });
            }
            // Verificar usuários com departamento inativo
            if (user.department_id && user.departments && !user.departments.is_active) {
                issues.push({
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    userRole: user.role,
                    currentDepartmentId: user.department_id,
                    issue: 'Atribuído a departamento inativo',
                    suggested_fix: 'Transferir para departamento ativo'
                });
            }
        }
        return issues;
    }
    catch (error) {
        console.error('Erro ao verificar problemas de departamento:', error);
        throw error;
    }
}
/**
 * Corrige problemas de departamento atribuindo usuários ao primeiro departamento ativo
 */
export async function fixDepartmentIssues(userIds) {
    try {
        // Buscar o primeiro departamento ativo
        const { data: activeDepartment, error: deptError } = await supabase
            .from('departments')
            .select('id, name')
            .eq('is_active', true)
            .order('created_at')
            .limit(1)
            .single();
        if (deptError || !activeDepartment) {
            throw new Error('Nenhum departamento ativo encontrado');
        }
        // Atualizar usuários para usar o departamento ativo
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ department_id: activeDepartment.id })
            .in('id', userIds);
        if (updateError)
            throw updateError;
        console.log(`✅ ${userIds.length} usuários atribuídos ao departamento: ${activeDepartment.name}`);
    }
    catch (error) {
        console.error('Erro ao corrigir problemas de departamento:', error);
        throw error;
    }
}
/**
 * Verifica se há tickets órfãos (sem departamento) e os atribui ao departamento padrão
 */
export async function fixOrphanTickets() {
    try {
        // Buscar tickets sem departamento
        const { data: orphanTickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('id, title, customer_id')
            .is('department_id', null);
        if (ticketsError)
            throw ticketsError;
        if (!orphanTickets || orphanTickets.length === 0) {
            console.log('✅ Nenhum ticket órfão encontrado');
            return;
        }
        // Buscar o primeiro departamento ativo
        const { data: activeDepartment, error: deptError } = await supabase
            .from('departments')
            .select('id, name')
            .eq('is_active', true)
            .order('created_at')
            .limit(1)
            .single();
        if (deptError || !activeDepartment) {
            throw new Error('Nenhum departamento ativo encontrado');
        }
        // Atribuir tickets órfãos ao departamento padrão
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ department_id: activeDepartment.id })
            .is('department_id', null);
        if (updateError)
            throw updateError;
        console.log(`✅ ${orphanTickets.length} tickets órfãos atribuídos ao departamento: ${activeDepartment.name}`);
    }
    catch (error) {
        console.error('Erro ao corrigir tickets órfãos:', error);
        throw error;
    }
}
/**
 * Executa todas as verificações e correções de departamento
 */
export async function runDepartmentDiagnostic() {
    try {
        console.log('🔍 Iniciando diagnóstico de departamentos...');
        // Verificar problemas
        const issues = await checkDepartmentIssues();
        // Corrigir tickets órfãos
        await fixOrphanTickets();
        // Corrigir usuários com problemas (apenas os sem departamento)
        const usersToFix = issues
            .filter(issue => !issue.currentDepartmentId)
            .map(issue => issue.userId);
        if (usersToFix.length > 0) {
            await fixDepartmentIssues(usersToFix);
        }
        console.log('✅ Diagnóstico concluído');
        return {
            issues,
            ticketsFixed: true,
            usersFixed: usersToFix.length > 0
        };
    }
    catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
        throw error;
    }
}
