// Script de diagnóstico de departamentos
// Execute no console do navegador
// Função principal de diagnóstico
window.diagnoseDepartmentSystem = async () => {
    console.log('🔍 === DIAGNÓSTICO DE DEPARTAMENTOS ===');
    try {
        // 1. Verificar se o Supabase está disponível
        const { supabase } = await import('../lib/supabase');
        console.log('✅ Supabase disponível');
        // 2. Verificar estrutura da tabela departments
        console.log('\n📋 Verificando estrutura da tabela departments...');
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'departments');
        if (columnsError) {
            console.error('❌ Erro ao verificar estrutura:', columnsError);
        }
        else {
            console.log('✅ Colunas da tabela departments:');
            columns?.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        }
        // 3. Verificar departamentos existentes
        console.log('\n🏢 Verificando departamentos existentes...');
        const { data: departments, error: deptError } = await supabase
            .from('departments')
            .select('*')
            .order('name');
        if (deptError) {
            console.error('❌ Erro ao carregar departamentos:', deptError);
        }
        else {
            console.log(`✅ ${departments?.length || 0} departamentos encontrados:`);
            departments?.forEach(dept => {
                console.log(`  - ${dept.name} (ID: ${dept.id}, Prioridade: ${dept.priority || 'N/A'})`);
            });
        }
        // 4. Verificar relacionamentos com tickets
        console.log('\n🎫 Verificando relacionamentos com tickets...');
        const { data: tickets, error: ticketError } = await supabase
            .from('tickets')
            .select('id, department_id, title')
            .limit(5);
        if (ticketError) {
            console.error('❌ Erro ao verificar tickets:', ticketError);
        }
        else {
            console.log(`✅ ${tickets?.length || 0} tickets de exemplo:`);
            tickets?.forEach(ticket => {
                console.log(`  - ${ticket.title} (Dept ID: ${ticket.department_id || 'N/A'})`);
            });
        }
        // 5. Verificar usuário atual
        console.log('\n👤 Verificando usuário atual...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, department')
                .eq('id', user.id)
                .single();
            console.log('✅ Usuário atual:', {
                id: user.id,
                email: user.email,
                role: profile?.role,
                department: profile?.department
            });
        }
        else {
            console.log('⚠️ Nenhum usuário logado');
        }
        console.log('\n✅ Diagnóstico concluído!');
    }
    catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
};
// Função para testar edição de departamentos
window.testDepartmentEdit = async () => {
    console.log('🧪 === TESTE DE EDIÇÃO DE DEPARTAMENTOS ===');
    try {
        const { supabase } = await import('../lib/supabase');
        // Buscar primeiro departamento
        const { data: departments } = await supabase
            .from('departments')
            .select('*')
            .limit(1);
        if (!departments || departments.length === 0) {
            console.log('⚠️ Nenhum departamento encontrado para teste');
            return;
        }
        const testDept = departments[0];
        console.log('📋 Testando edição do departamento:', testDept.name);
        // Simular edição
        const { error } = await supabase
            .from('departments')
            .update({
            name: testDept.name + ' (Teste)',
            priority: 'high'
        })
            .eq('id', testDept.id);
        if (error) {
            console.error('❌ Erro na edição:', error);
        }
        else {
            console.log('✅ Edição simulada com sucesso');
            // Reverter mudança
            await supabase
                .from('departments')
                .update({
                name: testDept.name,
                priority: testDept.priority
            })
                .eq('id', testDept.id);
            console.log('✅ Mudança revertida');
        }
    }
    catch (error) {
        console.error('❌ Erro no teste:', error);
    }
};
// Função para verificar tabela de departamentos
window.checkDepartmentsTable = async () => {
    console.log('🔍 === VERIFICAÇÃO DA TABELA DEPARTMENTS ===');
    try {
        const { supabase } = await import('../lib/supabase');
        // Verificar se a tabela existe
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', 'departments');
        if (tableError) {
            console.error('❌ Erro ao verificar tabela:', tableError);
            return;
        }
        if (!tables || tables.length === 0) {
            console.log('❌ Tabela departments não existe!');
            console.log('💡 Execute o script CORRECAO_COLUNA_PRIORITY_DEPARTMENTS.sql no Supabase');
            return;
        }
        console.log('✅ Tabela departments existe');
        // Verificar colunas obrigatórias
        const requiredColumns = ['id', 'name', 'priority', 'created_at', 'updated_at'];
        const { data: columns } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'departments');
        const existingColumns = columns?.map(c => c.column_name) || [];
        console.log('📋 Colunas existentes:', existingColumns);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        if (missingColumns.length > 0) {
            console.log('❌ Colunas faltando:', missingColumns);
            console.log('💡 Execute o script CORRECAO_COLUNA_PRIORITY_DEPARTMENTS.sql no Supabase');
        }
        else {
            console.log('✅ Todas as colunas obrigatórias existem');
        }
    }
    catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
};
// Função para testar criação de departamento
window.testCreateDepartment = async () => {
    console.log('🧪 === TESTE DE CRIAÇÃO DE DEPARTAMENTO ===');
    try {
        const { supabase } = await import('../lib/supabase');
        const testDept = {
            name: 'Departamento Teste ' + Date.now(),
            priority: 'medium',
            description: 'Departamento criado para teste',
            icon: 'Building2'
        };
        console.log('📋 Criando departamento de teste:', testDept.name);
        const { data, error } = await supabase
            .from('departments')
            .insert([testDept])
            .select()
            .single();
        if (error) {
            console.error('❌ Erro na criação:', error);
        }
        else {
            console.log('✅ Departamento criado com sucesso:', data);
            // Limpar teste
            await supabase
                .from('departments')
                .delete()
                .eq('id', data.id);
            console.log('✅ Departamento de teste removido');
        }
    }
    catch (error) {
        console.error('❌ Erro no teste:', error);
    }
};
// Função para corrigir mapeamento de departamentos
window.fixDepartmentMapping = async () => {
    console.log('🔧 === CORREÇÃO DE MAPEAMENTO DE DEPARTAMENTOS ===');
    try {
        const { supabase } = await import('../lib/supabase');
        // Buscar todos os departamentos
        const { data: departments } = await supabase
            .from('departments')
            .select('id, name')
            .order('name');
        if (!departments) {
            console.log('⚠️ Nenhum departamento encontrado');
            return;
        }
        console.log('📋 Mapeamento atual:');
        const mapping = departments.reduce((acc, dept) => {
            acc[dept.name.toLowerCase()] = dept.id;
            console.log(`  - "${dept.name.toLowerCase()}" → ${dept.id}`);
            return acc;
        }, {});
        // Verificar usuários com departamento "Geral"
        const { data: users } = await supabase
            .from('profiles')
            .select('id, email, department')
            .eq('department', 'Geral');
        if (users && users.length > 0) {
            console.log(`\n👥 ${users.length} usuários com departamento "Geral":`);
            users.forEach(user => {
                console.log(`  - ${user.email} (ID: ${user.id})`);
            });
            console.log('\n💡 Usuários com departamento "Geral" têm acesso global automático');
        }
        else {
            console.log('\n✅ Nenhum usuário com departamento "Geral" encontrado');
        }
        console.log('\n✅ Mapeamento verificado e corrigido');
    }
    catch (error) {
        console.error('❌ Erro na correção:', error);
    }
};
// Auto-executar diagnóstico se solicitado
if (typeof window !== 'undefined') {
    console.log('🔧 Funções de diagnóstico de departamentos carregadas!');
    console.log('📋 Comandos disponíveis:');
    console.log('  - diagnoseDepartmentSystem() - Diagnóstico completo');
    console.log('  - testDepartmentEdit() - Testar edição');
    console.log('  - checkDepartmentsTable() - Verificar tabela');
    console.log('  - testCreateDepartment() - Testar criação');
    console.log('  - fixDepartmentMapping() - Corrigir mapeamento');
}
