import { supabase } from '@/lib/supabase';
// Helper para teste rápido de criação de tickets
window.testTicketCreation = async (numero, nome, mensagem) => {
    console.log('🧪 [DEV] Testando criação de ticket...');
    const defaultNumber = numero || '5511999888777';
    const defaultName = nome || 'Teste Dev';
    const defaultMessage = mensagem || `Teste de criação automática: ${new Date().toLocaleString()}`;
    // Criar ticket diretamente no banco
    try {
        const { data: ticket, error } = await supabase
            .from('tickets')
            .insert([{
                title: `Contato de ${defaultName}`,
                description: defaultMessage,
                status: 'open',
                priority: 'medium',
                customer_id: null,
                department: 'suporte',
                client_phone: defaultNumber,
                channel: 'chat',
                metadata: {
                    anonymous_contact: true,
                    contact_name: defaultName,
                    contact_phone: defaultNumber
                }
            }])
            .select()
            .single();
        if (error) {
            console.error('❌ [DEV] Erro ao criar ticket:', error);
            return false;
        }
        console.log('✅ [DEV] Ticket criado com sucesso:', ticket);
        return true;
    }
    catch (error) {
        console.error('❌ [DEV] Erro inesperado:', error);
        return false;
    }
};
// Helper para listar tickets por canal
window.queryTickets = async (canal) => {
    console.log('📋 [DEV] Listando tickets...');
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (canal) {
        query = query.eq('channel', canal);
        console.log(`🔍 [DEV] Filtrando por canal: ${canal}`);
    }
    const { data: tickets, error } = await query.limit(10);
    if (error) {
        console.error('❌ [DEV] Erro ao buscar tickets:', error);
        return [];
    }
    console.log(`📊 [DEV] ${tickets?.length || 0} tickets encontrados:`, tickets);
    return tickets || [];
};
// Helper para limpar tickets de teste
window.cleanTestTickets = async () => {
    console.log('🧹 [DEV] Limpando tickets de teste...');
    const { data, error } = await supabase
        .from('tickets')
        .delete()
        .like('title', '%Teste%')
        .select();
    if (error) {
        console.error('❌ [DEV] Erro ao limpar tickets:', error);
        return 0;
    }
    console.log(`✅ [DEV] ${data?.length || 0} tickets de teste removidos`);
    return data?.length || 0;
};
// Helper para verificar estrutura da tabela tickets
window.checkTicketsTable = async () => {
    console.log('🔍 [DEV] Verificando estrutura da tabela tickets...');
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .limit(1);
    if (error) {
        console.error('❌ [DEV] Erro ao verificar tabela:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('📋 [DEV] Exemplo de ticket (estrutura):', data[0]);
        console.log('🗂️ [DEV] Campos disponíveis:', Object.keys(data[0]));
    }
    else {
        console.log('📭 [DEV] Tabela tickets está vazia');
    }
};
// 📱 Helper para testar Evolution API
window.testEvolutionAPI = async () => {
    console.log('🧪 [DEV] Testando Evolution API...');
    try {
        console.log('📡 [DEV] Testando formatação de telefone...');
        const testPhones = ['11999998888', '(11) 99999-8888', '5511999998888'];
        // Simular formatação (sem importar o serviço para evitar erro)
        testPhones.forEach(phone => {
            const cleanPhone = phone.replace(/\D/g, '');
            let formatted = cleanPhone;
            if (cleanPhone.length === 11) {
                formatted = `55${cleanPhone}`;
            }
            else if (cleanPhone.length === 10) {
                const ddd = cleanPhone.substring(0, 2);
                const number = cleanPhone.substring(2);
                formatted = `55${ddd}9${number}`;
            }
            const isValid = formatted.length >= 12 && formatted.startsWith('55');
            console.log(`📞 [DEV] ${phone} → ${formatted} (válido: ${isValid})`);
        });
        console.log('✅ [DEV] Teste de formatação concluído');
        console.log('💡 [DEV] Para testes completos da Evolution API, use o TicketChat com instância configurada');
        return { success: true };
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao testar Evolution API:', error);
        return { success: false, error };
    }
};
// 🔄 Helper para simular recebimento de mensagem WhatsApp
window.simulateWhatsAppMessage = async (ticketId, content = 'Mensagem de teste via WhatsApp') => {
    console.log('🧪 [DEV] Simulando mensagem WhatsApp...');
    try {
        const testMessage = {
            ticket_id: ticketId,
            content: content,
            sender_name: 'Cliente Teste',
            type: 'text',
            is_internal: false,
            is_read: false,
            metadata: {
                is_from_whatsapp: true,
                evolution_instance: 'teste-instance',
                evolution_message_id: 'msg-' + Date.now(),
                sender_phone: '5511999998888',
                test_message: true
            }
        };
        const { data, error } = await supabase
            .from('messages')
            .insert([testMessage])
            .select()
            .single();
        if (error) {
            console.error('❌ [DEV] Erro ao simular mensagem WhatsApp:', error);
            return { success: false, error };
        }
        console.log('✅ [DEV] Mensagem WhatsApp simulada:', data);
        return { success: true, data };
    }
    catch (error) {
        console.error('❌ [DEV] Erro na simulação:', error);
        return { success: false, error };
    }
};
// 🎫 Helper para criar ticket de teste com WhatsApp
window.createWhatsAppTestTicket = async () => {
    console.log('🧪 [DEV] Criando ticket de teste com WhatsApp...');
    try {
        const testTicket = {
            title: 'Ticket Teste WhatsApp',
            subject: 'Teste de integração Evolution API',
            description: 'Ticket criado automaticamente para teste da integração WhatsApp',
            status: 'pendente',
            priority: 'normal',
            channel: 'chat',
            metadata: {
                evolution_instance_name: 'teste-principal',
                client_phone: '5511999998888',
                client_name: 'Cliente Teste WhatsApp',
                created_from_whatsapp: true,
                auto_created: true,
                test_ticket: true,
                anonymous_contact: 'Cliente Teste WhatsApp'
            },
            unread: true,
            tags: ['whatsapp', 'teste', 'auto-created'],
            is_internal: false,
            last_message_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('tickets')
            .insert([testTicket])
            .select()
            .single();
        if (error) {
            console.error('❌ [DEV] Erro ao criar ticket teste:', error);
            return { success: false, error };
        }
        console.log('✅ [DEV] Ticket WhatsApp teste criado:', data);
        // Criar mensagem inicial
        const initialMessage = await window.simulateWhatsAppMessage(data.id, 'Olá! Esta é uma mensagem de teste do WhatsApp 📱');
        if (initialMessage.success) {
            console.log('✅ [DEV] Mensagem inicial adicionada ao ticket');
        }
        return { success: true, ticket: data, message: initialMessage.data };
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao criar ticket teste:', error);
        return { success: false, error };
    }
};
// 🧹 Helper para limpar dados de teste WhatsApp
window.cleanWhatsAppTestData = async () => {
    console.log('🧹 [DEV] Limpando dados de teste WhatsApp...');
    try {
        // Limpar mensagens de teste
        const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .eq('metadata->>test_message', 'true');
        if (messagesError) {
            console.error('❌ [DEV] Erro ao limpar mensagens de teste:', messagesError);
        }
        else {
            console.log('✅ [DEV] Mensagens de teste removidas');
        }
        // Limpar tickets de teste
        const { error: ticketsError } = await supabase
            .from('tickets')
            .delete()
            .eq('metadata->>test_ticket', 'true');
        if (ticketsError) {
            console.error('❌ [DEV] Erro ao limpar tickets de teste:', ticketsError);
        }
        else {
            console.log('✅ [DEV] Tickets de teste removidos');
        }
        return { success: true };
    }
    catch (error) {
        console.error('❌ [DEV] Erro na limpeza:', error);
        return { success: false, error };
    }
};
// 🔍 Helper para verificar estrutura da tabela profiles
window.checkProfilesStructure = async () => {
    console.log('%c🔍 VERIFICANDO ESTRUTURA DA TABELA PROFILES', 'color: #2563eb; font-weight: bold; font-size: 14px');
    try {
        // Tentar buscar um perfil para ver quais colunas existem
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.log('❌ Erro ao acessar profiles:', error.message);
            return;
        }
        if (profile) {
            console.log('✅ Tabela profiles encontrada');
            console.log('📋 Colunas disponíveis:');
            Object.keys(profile).forEach(key => {
                const value = profile[key];
                const type = typeof value;
                console.log(`   ${key}: ${type} = ${value}`);
            });
            // Verificar especificamente colunas relacionadas a departamento
            const hasDepartmentId = 'department_id' in profile;
            const hasDepartment = 'department' in profile;
            console.log('');
            console.log('%c🏢 CONFIGURAÇÃO DE DEPARTAMENTO:', 'color: #7c3aed; font-weight: bold');
            console.log(`   department_id (UUID): ${hasDepartmentId ? '✅ Existe' : '❌ Não existe'}`);
            console.log(`   department (TEXT): ${hasDepartment ? '✅ Existe' : '❌ Não existe'}`);
            if (hasDepartmentId) {
                console.log('');
                console.log('✅ Estrutura atualizada detectada - usando department_id');
                return 'department_id';
            }
            else if (hasDepartment) {
                console.log('');
                console.log('⚠️ Estrutura legacy detectada - usando department');
                console.log('💡 Considere executar a migração: 20240321000002_add_department_to_profiles.sql');
                return 'department';
            }
            else {
                console.log('');
                console.log('❌ Nenhuma coluna de departamento encontrada');
                console.log('🔧 Execute as migrações de departamento primeiro');
                return null;
            }
        }
        else {
            console.log('❌ Nenhum perfil encontrado na tabela');
            return null;
        }
    }
    catch (error) {
        console.error('❌ Erro na verificação:', error);
        return null;
    }
};
// 📋 Helper para testar migração evolution_instances
window.testEvolutionInstancesMigration = async () => {
    console.log('%c🔄 TESTANDO MIGRAÇÃO EVOLUTION_INSTANCES', 'color: #2563eb; font-weight: bold; font-size: 14px');
    try {
        // Verificar se a tabela existe
        const { data: tableCheck, error: tableError } = await supabase
            .from('evolution_instances')
            .select('count', { count: 'exact', head: true });
        if (tableError) {
            console.log('❌ Tabela evolution_instances não existe ainda');
            console.log('📋 Execute esta migração no Supabase SQL Editor:');
            console.log('');
            console.log('%csupabase/migrations/20240321000005_evolution_instances_simple.sql', 'background: #f3f4f6; padding: 4px; border-radius: 4px; font-family: monospace');
            return { exists: false };
        }
        console.log('✅ Tabela evolution_instances existe');
        // Verificar instâncias existentes
        const { data: instances, error: instancesError } = await supabase
            .from('evolution_instances')
            .select('*');
        if (instancesError) {
            console.log('❌ Erro ao buscar instâncias:', instancesError.message);
            return { exists: true, error: instancesError };
        }
        console.log(`📊 Total de instâncias: ${instances?.length || 0}`);
        if (instances && instances.length > 0) {
            console.log('');
            console.log('%c📋 INSTÂNCIAS ENCONTRADAS:', 'color: #059669; font-weight: bold');
            instances.forEach((instance, index) => {
                console.log(`${index + 1}. ${instance.instance_name}`);
                console.log(`   Departamento: ${instance.department_name}`);
                console.log(`   Status: ${instance.status}`);
                console.log(`   Padrão: ${instance.is_default ? 'Sim' : 'Não'}`);
                console.log('');
            });
        }
        // Verificar departamentos
        const { data: departments, error: deptError } = await supabase
            .from('departments')
            .select('*')
            .eq('is_active', true);
        if (deptError) {
            console.log('⚠️ Erro ao buscar departamentos:', deptError.message);
        }
        else {
            console.log(`🏢 Departamentos ativos: ${departments?.length || 0}`);
            if (departments) {
                departments.forEach((dept) => {
                    const deptInstances = instances?.filter(i => i.department_id === dept.id) || [];
                    console.log(`   ${dept.name}: ${deptInstances.length} instância(s)`);
                });
            }
        }
        console.log('');
        console.log('%c✅ TESTE CONCLUÍDO', 'color: #16a34a; font-weight: bold');
        return { exists: true, instances, departments };
    }
    catch (error) {
        console.error('❌ Erro no teste:', error);
        return { exists: false, error };
    }
};
// Função para verificar se a migração evolution_instances foi executada
export const checkEvolutionInstancesTable = async () => {
    console.log('\n🔍 VERIFICANDO TABELA EVOLUTION_INSTANCES');
    console.log('==========================================');
    try {
        // Verificar se a tabela existe
        const { data, error } = await supabase
            .from('evolution_instances')
            .select('*')
            .limit(1);
        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.log('❌ Tabela evolution_instances não existe');
                console.log('💡 Execute a migração: 20240321000005_evolution_instances_simple.sql');
                return false;
            }
            else {
                console.log('❌ Erro ao acessar tabela:', error.message);
                return false;
            }
        }
        console.log('✅ Tabela evolution_instances existe');
        // Verificar estrutura da tabela
        const { data: allInstances, error: selectError } = await supabase
            .from('evolution_instances')
            .select('id, instance_name, department_id, department_name, status, is_default, created_at')
            .limit(5);
        if (selectError) {
            console.log('❌ Erro ao consultar instâncias:', selectError.message);
            return false;
        }
        console.log(`📊 Total de instâncias encontradas: ${allInstances?.length || 0}`);
        if (allInstances && allInstances.length > 0) {
            console.log('📋 Instâncias existentes:');
            allInstances.forEach((instance, index) => {
                console.log(`   ${index + 1}. ${instance.instance_name} (${instance.department_name}) - ${instance.status}`);
            });
        }
        return true;
    }
    catch (error) {
        console.error('❌ Erro na verificação:', error);
        return false;
    }
};
// Função para verificar se precisa executar migrações
export const checkMigrationStatus = async () => {
    console.log('\n🔍 VERIFICANDO STATUS DAS MIGRAÇÕES');
    console.log('====================================');
    const profilesOk = await window.checkProfilesStructure();
    const evolutionOk = await checkEvolutionInstancesTable();
    console.log('\n📋 RESUMO DO STATUS:');
    console.log('===================');
    console.log(`Tabela profiles: ${profilesOk ? '✅ OK' : '❌ Precisa migração'}`);
    console.log(`Tabela evolution_instances: ${evolutionOk ? '✅ OK' : '❌ Precisa migração'}`);
    if (!profilesOk) {
        console.log('\n🛠️  AÇÃO NECESSÁRIA:');
        console.log('Execute no Supabase SQL Editor:');
        console.log('1. 20240321000002_add_department_to_profiles.sql');
    }
    if (!evolutionOk) {
        console.log('\n🛠️  AÇÃO NECESSÁRIA:');
        console.log('Execute no Supabase SQL Editor:');
        console.log('2. 20240321000005_evolution_instances_simple.sql');
    }
    if (profilesOk && evolutionOk) {
        console.log('\n🎉 Todas as migrações estão aplicadas!');
        console.log('Você pode usar o sistema WhatsApp normalmente.');
    }
    return { profilesOk, evolutionOk };
};
// Registrar funções no console
window.checkEvolutionInstancesTable = checkEvolutionInstancesTable;
window.checkMigrationStatus = checkMigrationStatus;
// Helper para mostrar comandos disponíveis
window.devHelp = () => {
    console.log(`
🛠️ Comandos de Desenvolvimento Disponíveis:

📋 Tickets:
testTicketCreation(numero?, nome?, mensagem?)     - Cria ticket de teste
queryTickets(canal?)                              - Lista tickets (filtro: email, phone, chat, web)
cleanTestTickets()                                - Remove tickets de teste  
checkTicketsTable()                               - Verifica estrutura da tabela

📱 WhatsApp/Evolution API:
testEvolutionAPI()                                - Testa funções da Evolution API
testRealEvolutionAPI()                            - Testa conexão com Evolution API real
testEvolutionStateField()                         - 🔧 Testa correção campo "state" vs "status"
debugInstanceNames()                              - 🆕 Investiga problemas de nomes instâncias
testFinanceiroEncontra()                          - 🧪 Testa instância financeiro-encontra
createWhatsAppTestTicket()                        - Cria ticket de teste com WhatsApp
simulateWhatsAppMessage(ticketId, mensagem?)      - Simula mensagem do WhatsApp
cleanWhatsAppTestData()                           - Remove dados de teste WhatsApp

🎫 ROTEAMENTO AUTOMÁTICO:
testTicketAutoCreation()                          - 🆕 Testa criação automática de tickets  
simulateMessage('phone', 'message', 'name')       - 🆕 Simula mensagem específica
checkTicketsTable()                               - 🆕 Verifica estado da tabela tickets
cleanTestTickets()                                - 🆕 Remove tickets automáticos de teste

🔧 Diagnóstico de Migração:
checkProfilesStructure()                          - Verifica estrutura tabela profiles
testEvolutionInstancesMigration()                 - Testa migração evolution_instances
checkEvolutionInstancesTable()                    - Verifica se tabela evolution_instances existe
checkMigrationStatus()                            - Verifica status de todas as migrações

🔍 Diagnóstico de Tickets:
diagnosticoTickets()                              - 🆕 Diagnóstico completo de por que tickets não chegam
corrigirDepartmentTickets()                       - 🆕 Corrige department_id dos tickets sem departamento

📊 Verificação:
devHelp()                                         - Mostra esta ajuda

💡 Exemplos:
checkProfilesStructure()
testEvolutionInstancesMigration()
testTicketCreation('5511999888777', 'João', 'Preciso de ajuda')
createWhatsAppTestTicket()
testEvolutionAPI()
    `);
};
// Log inicial
console.log('🛠️ [DEV] Dev Helpers carregados! Digite devHelp() para ver comandos disponíveis.');
// Teste da Evolution API real configurada
window.testRealEvolutionAPI = async () => {
    console.log('%c🚀 TESTANDO EVOLUTION API REAL', 'color: #16a34a; font-weight: bold; font-size: 14px');
    console.log('==========================================');
    try {
        const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evochat.devsible.com.br';
        const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
        console.log(`🔗 URL: ${apiUrl}`);
        console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
        // Teste 1: Verificar se API está online
        console.log('\n1️⃣ Testando conectividade...');
        const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const instances = await response.json();
        console.log('✅ API está online!');
        console.log(`📊 Instâncias existentes: ${instances.length || 0}`);
        if (instances.length > 0) {
            console.log('\n📋 Instâncias encontradas:');
            instances.forEach((instance, index) => {
                console.log(`   ${index + 1}. ${instance.instance.instanceName} - Status: ${instance.instance.status}`);
            });
        }
        // Teste 2: Verificar instâncias do banco local
        console.log('\n2️⃣ Verificando instâncias no banco local...');
        const { data: localInstances, error } = await supabase
            .from('evolution_instances')
            .select('instance_name, status, department_name')
            .eq('is_active', true);
        if (error) {
            console.log('❌ Erro ao buscar instâncias locais:', error.message);
        }
        else {
            console.log(`📊 Instâncias locais: ${localInstances?.length || 0}`);
            localInstances?.forEach((instance, index) => {
                console.log(`   ${index + 1}. ${instance.instance_name} (${instance.department_name}) - Status: ${instance.status}`);
            });
        }
        // Teste 3: Sincronização
        console.log('\n3️⃣ Verificando sincronização...');
        const localNames = localInstances?.map(i => i.instance_name) || [];
        const remoteNames = instances.map((i) => i.instance.instanceName) || [];
        const onlyLocal = localNames.filter(name => !remoteNames.includes(name));
        const onlyRemote = remoteNames.filter((name) => !localNames.includes(name));
        if (onlyLocal.length > 0) {
            console.log('⚠️  Instâncias apenas no banco local:', onlyLocal);
        }
        if (onlyRemote.length > 0) {
            console.log('⚠️  Instâncias apenas na Evolution API:', onlyRemote);
        }
        if (onlyLocal.length === 0 && onlyRemote.length === 0) {
            console.log('✅ Instâncias sincronizadas!');
        }
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        return {
            success: true,
            api_online: true,
            remote_instances: instances.length,
            local_instances: localInstances?.length || 0,
            sync_issues: {
                only_local: onlyLocal,
                only_remote: onlyRemote
            }
        };
    }
    catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
            console.log('1. Verificar se Evolution API está rodando');
            console.log('2. Verificar URL na variável VITE_EVOLUTION_API_URL');
            console.log('3. Verificar se há problemas de CORS');
            console.log('4. Verificar conexão de internet');
        }
        else if (error.message.includes('401') || error.message.includes('403')) {
            console.log('\n💡 PROBLEMA DE AUTENTICAÇÃO:');
            console.log('1. Verificar API Key na variável VITE_EVOLUTION_API_KEY');
            console.log('2. Verificar se API Key está correta na Evolution API');
        }
        return {
            success: false,
            error: error.message,
            api_online: false
        };
    }
};
// 🔧 COMANDOS DE DEBUG EVOLUTION API
// Helper para testar conectividade com Evolution API
window.testEvolutionConnection = async () => {
    console.log('🔗 [DEV] Testando conectividade Evolution API...');
    try {
        // Importar dinamicamente o serviço
        const { evolutionApi } = await import('@/services/evolutionApi');
        const result = await evolutionApi.testConnection();
        if (result.success) {
            console.log('✅ [DEV] Evolution API conectada com sucesso!');
            console.log('📊 [DEV] Dados da resposta:', result.data);
        }
        else {
            console.error('❌ [DEV] Falha na conectividade:', result.error);
            console.error('📊 [DEV] Status HTTP:', result.status);
        }
        return result;
    }
    catch (error) {
        console.error('❌ [DEV] Erro inesperado:', error);
        return { success: false, error };
    }
};
// Helper para listar todas as instâncias existentes
window.listEvolutionInstances = async () => {
    console.log('📋 [DEV] Listando instâncias existentes...');
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        const instances = await evolutionApi.listInstances();
        console.log(`✅ [DEV] Encontradas ${instances?.length || 0} instância(s):`);
        instances?.forEach((instance, index) => {
            // Campos corretos baseados na resposta da API
            const instanceName = instance.name || instance.instanceName || instance.instance?.instanceName || 'Nome não disponível';
            const status = instance.connectionStatus || instance.status || instance.instance?.status || 'Status não disponível';
            const id = instance.id || 'ID não disponível';
            console.log(`${index + 1}. Nome: "${instanceName}", Status: ${status}, ID: ${id}`);
        });
        return instances || [];
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao listar instâncias:', error);
        return [];
    }
};
// Helper para criar uma instância de teste
window.createTestInstance = async (instanceName = 'test-' + Date.now()) => {
    console.log(`🆕 [DEV] Criando instância de teste: ${instanceName}`);
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        const result = await evolutionApi.testCreateInstance(instanceName);
        if (result.success) {
            console.log('✅ [DEV] Instância criada com sucesso!');
            console.log('📊 [DEV] Dados da instância:', result.data);
            console.log(`💡 [DEV] Use: testInstanceQRCode('${instanceName}') para obter QR Code`);
        }
        else {
            console.error('❌ [DEV] Falha ao criar instância:', result.error);
        }
        return result;
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao criar instância:', error);
        return { success: false, error };
    }
};
// Helper para testar QR Code de uma instância
window.testInstanceQRCode = async (instanceName = 'test') => {
    console.log(`📱 [DEV] Testando QR Code para instância: ${instanceName}`);
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        // Verificar se existe primeiro
        const exists = await evolutionApi.instanceExists(instanceName);
        console.log(`🔍 [DEV] Instância ${instanceName} existe:`, exists);
        if (!exists) {
            console.log('⚠️ [DEV] Instância não existe. Criando...');
            const createResult = await evolutionApi.testCreateInstance(instanceName);
            if (!createResult.success) {
                throw new Error('Falha ao criar instância: ' + createResult.error);
            }
            console.log('✅ [DEV] Instância criada. Aguardando estabilização...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        // Tentar obter QR Code
        const qrResult = await evolutionApi.getInstanceQRCode(instanceName);
        if (qrResult && qrResult.base64) {
            console.log('✅ [DEV] QR Code obtido com sucesso!');
            console.log('📱 [DEV] QR Code base64 length:', qrResult.base64.length);
            // Mostrar QR Code no console (se for pequeno)
            if (qrResult.base64.length < 1000) {
                console.log('📊 [DEV] QR Code data:', qrResult);
            }
            return { success: true, qrCode: qrResult };
        }
        else {
            throw new Error('QR Code não foi gerado');
        }
    }
    catch (error) {
        console.error('❌ [DEV] Erro no teste de QR Code:', error);
        return { success: false, error };
    }
};
// Helper para verificar status de uma instância
window.checkInstanceStatus = async (instanceName = 'test') => {
    console.log(`📊 [DEV] Verificando status da instância: ${instanceName}`);
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        const status = await evolutionApi.getInstanceStatus(instanceName);
        console.log('✅ [DEV] Status obtido:', status);
        return status;
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao verificar status:', error);
        return { error };
    }
};
// Helper para reiniciar conexão de uma instância
window.restartInstanceConnection = async (instanceName = 'test') => {
    console.log(`🔄 [DEV] Reiniciando conexão da instância: ${instanceName}`);
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        const result = await evolutionApi.restartInstanceConnection(instanceName);
        console.log('✅ [DEV] Conexão reiniciada:', result);
        return result;
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao reiniciar conexão:', error);
        return { error };
    }
};
// Helper para deletar uma instância
window.deleteTestInstance = async (instanceName = 'test') => {
    console.log(`🗑️ [DEV] Deletando instância: ${instanceName}`);
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        await evolutionApi.deleteInstance(instanceName);
        console.log('✅ [DEV] Instância deletada com sucesso!');
        return { success: true };
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao deletar instância:', error);
        return { success: false, error };
    }
};
// Helper para mostrar todos os comandos Evolution disponíveis
window.evolutionCommands = () => {
    console.log(`
🔧 COMANDOS EVOLUTION API E TICKETS DISPONÍVEIS:

📋 DIAGNÓSTICO EVOLUTION:
• testEvolutionConnection() - Testa conectividade básica
• listEvolutionInstances() - Lista todas as instâncias
• checkInstanceStatus('nomeInstancia') - Verifica status específico
• debugInstanceNames() - 🆕 Investiga problemas de nomes de instâncias
• testEvolutionStateField() - 🔧 Testa correção do campo "state" vs "status"

🎫 ROTEAMENTO AUTOMÁTICO DE TICKETS:
• testTicketAutoCreation() - 🆕 Testa criação automática de tickets
• simulateMessage('phone', 'message', 'name') - 🆕 Simula mensagem específica
• checkTicketsTable() - 🆕 Verifica estado da tabela de tickets
• cleanTestTickets() - 🆕 Remove tickets de teste criados

🆕 CRIAÇÃO E GERENCIAMENTO:
• createTestInstance('nome') - Cria nova instância
• deleteTestInstance('nome') - Remove instância

📱 QR CODE E CONEXÃO:
• testInstanceQRCode('nome') - Testa geração de QR Code
• testFinanceiroQRCode() - Testa QR Code da instância financeiro-encontra
• testCorrectInstance() - 🆕 Testa QR Code da instância financeiro correta
• validateQRCodeFormat('qrString') - Valida formato do QR Code
• restartInstanceConnection('nome') - Reinicia conexão
• testEvolutionStateField() - 🔧 Testa correção do campo "state" vs "status"

💡 EXEMPLO DE USO COMPLETO:
1. testEvolutionConnection()
2. debugInstanceNames() (🆕 para ver instâncias existentes)
3. testCorrectInstance() (🆕 testa automaticamente a instância correta)

🧪 TESTE ESPECÍFICO (SUA INSTÂNCIA):
• testFinanceiroQRCode() - Testa a instância financeiro-encontra
• testCorrectInstance() - 🆕 Detecta e testa automaticamente

🔧 SOLUÇÃO ATUAL (RECOMENDADO):
• debugInstanceNames() - Ver qual instância realmente existe
• testCorrectInstance() - Testar QR Code da instância encontrada

⚠️ SOLUÇÃO DE PROBLEMAS:
• Se QR Code não aparecer: restartInstanceConnection('nome')
• Se instância não existir: createTestInstance('nome')
• Se status estiver inconsistente: deleteTestInstance('nome') → createTestInstance('nome')
• Se QR Code com formato inválido: validateQRCodeFormat('string')
• Se erro 404: debugInstanceNames() para ver instâncias existentes
  `);
};
// Mostrar comandos disponíveis no carregamento
console.log('🔧 [DEV] Evolution API Debug Commands carregados!');
console.log('💡 [DEV] Digite evolutionCommands() para ver todos os comandos');
// Helper específico para testar a instância financeiro-encontra
window.testFinanceiroQRCode = async () => {
    console.log('📱 [DEV] Testando QR Code da instância financeiro-encontra...');
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        // Verificar status primeiro
        const status = await evolutionApi.getInstanceStatus('financeiro-encontra');
        console.log('📊 [DEV] Status atual:', status);
        // Tentar obter QR Code
        const qrResult = await evolutionApi.getInstanceQRCode('financeiro-encontra');
        if (qrResult && qrResult.base64) {
            console.log('✅ [DEV] QR Code obtido com sucesso!');
            console.log('📱 [DEV] QR Code length:', qrResult.base64.length);
            console.log('🔍 [DEV] QR Code prefix:', qrResult.base64.substring(0, 50));
            // Verificar se há duplicação
            if (qrResult.base64.includes('data:image/png;base64,data:image/png;base64,')) {
                console.error('❌ [DEV] DUPLICAÇÃO DETECTADA no QR Code!');
            }
            else {
                console.log('✅ [DEV] QR Code formatado corretamente');
            }
            return { success: true, qrCode: qrResult.base64 };
        }
        else {
            throw new Error('QR Code não foi gerado');
        }
    }
    catch (error) {
        console.error('❌ [DEV] Erro no teste de QR Code:', error);
        return { success: false, error };
    }
};
// Helper para verificar formatação de QR Code
window.validateQRCodeFormat = (qrCodeString) => {
    console.log('🔍 [DEV] Validando formato do QR Code...');
    if (!qrCodeString) {
        console.error('❌ [DEV] QR Code vazio');
        return false;
    }
    if (qrCodeString.includes('data:image/png;base64,data:image/png;base64,')) {
        console.error('❌ [DEV] DUPLICAÇÃO DETECTADA!');
        console.log('🔧 [DEV] QR Code duplicado:', qrCodeString.substring(0, 100) + '...');
        return false;
    }
    if (qrCodeString.startsWith('data:image/png;base64,')) {
        console.log('✅ [DEV] Formato correto');
        return true;
    }
    console.warn('⚠️ [DEV] Formato inesperado:', qrCodeString.substring(0, 50));
    return false;
};
// Helper específico para debug do problema atual
window.debugInstanceNames = async () => {
    console.log('🔍 [DEV] Investigando problemas de nomes de instâncias...');
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        // 1. Listar todas as instâncias
        console.log('📋 [DEV] Listando instâncias existentes...');
        const instances = await evolutionApi.listInstances();
        if (instances && instances.length > 0) {
            console.log(`✅ [DEV] Encontradas ${instances.length} instância(s):`);
            instances.forEach((instance, index) => {
                // Usar campos corretos da API
                const instanceName = instance.name || instance.instanceName || 'Nome não disponível';
                const status = instance.connectionStatus || instance.status || 'Status não disponível';
                const id = instance.id || 'ID não disponível';
                console.log(`${index + 1}. Nome: "${instanceName}", Status: ${status}, ID: ${id}`);
                // Verificar se alguma contém "financeiro"
                if (instanceName.includes('financeiro')) {
                    console.log(`   📍 [DEV] Instância do financeiro encontrada: "${instanceName}"`);
                }
            });
        }
        else {
            console.log('❌ [DEV] Nenhuma instância encontrada');
        }
        // 2. Testar instâncias específicas
        const instancesToTest = ['financeiro-encontra', 'financeiro-financeiro'];
        for (const instanceName of instancesToTest) {
            console.log(`\n🧪 [DEV] Testando instância: "${instanceName}"`);
            try {
                const status = await evolutionApi.getInstanceStatus(instanceName);
                console.log(`✅ [DEV] "${instanceName}" existe! Status:`, status);
            }
            catch (error) {
                if (error.message.includes('404')) {
                    console.log(`❌ [DEV] "${instanceName}" NÃO EXISTE (404)`);
                }
                else {
                    console.log(`⚠️ [DEV] "${instanceName}" erro:`, error.message);
                }
            }
        }
        return { success: true, instances };
    }
    catch (error) {
        console.error('❌ [DEV] Erro no debug:', error);
        return { success: false, error };
    }
};
// Helper para testar QR Code com instância correta
window.testCorrectInstance = async () => {
    console.log('🎯 [DEV] Testando com instância correta...');
    try {
        const { evolutionApi } = await import('@/services/evolutionApi');
        // Primeiro descobrir qual instância do financeiro existe
        const instances = await evolutionApi.listInstances();
        const financeiroInstance = instances?.find((inst) => {
            const name = inst.name || inst.instanceName || '';
            return name.includes('financeiro');
        });
        if (!financeiroInstance) {
            console.error('❌ [DEV] Nenhuma instância do financeiro encontrada');
            return { success: false, error: 'Instância não encontrada' };
        }
        const instanceName = financeiroInstance.name || financeiroInstance.instanceName;
        console.log(`📱 [DEV] Testando QR Code da instância encontrada: "${instanceName}"`);
        const qrResult = await evolutionApi.getInstanceQRCode(instanceName);
        if (qrResult) {
            console.log('✅ [DEV] QR Code obtido com sucesso!');
            console.log('📊 [DEV] Estrutura da resposta:', qrResult);
            return { success: true, instanceName, qrCode: qrResult };
        }
        else {
            throw new Error('QR Code não foi gerado');
        }
    }
    catch (error) {
        console.error('❌ [DEV] Erro no teste:', error);
        return { success: false, error };
    }
};
// Helper para simular webhook da Evolution API
window.simulateWebhook = async (senderPhone, content, senderName, instanceName) => {
    console.log('📨 [DEV] Simulando webhook Evolution API...');
    try {
        const { TicketRoutingService } = await import('@/services/ticketRoutingService');
        const result = await TicketRoutingService.simulateIncomingMessage({
            senderPhone: senderPhone,
            senderName: senderName || `Cliente ${senderPhone.slice(-4)}`,
            content: content,
            instanceName: instanceName || 'financeiro-encontra'
        });
        console.log('✅ [DEV] Webhook processado:', result);
        // Mostrar notificação visual
        if (result.action === 'created') {
            console.log(`🎫 [DEV] NOVO TICKET CRIADO: #${result.ticketId}`);
            console.log(`📱 [DEV] Cliente: ${senderName || senderPhone}`);
            console.log(`💬 [DEV] Mensagem: "${content}"`);
        }
        else if (result.action === 'updated') {
            console.log(`💬 [DEV] MENSAGEM ADICIONADA AO TICKET: #${result.ticketId}`);
            console.log(`📱 [DEV] Cliente: ${senderName || senderPhone}`);
            console.log(`💬 [DEV] Nova mensagem: "${content}"`);
        }
        return result;
    }
    catch (error) {
        console.error('❌ [DEV] Erro ao simular webhook:', error);
        return { success: false, error };
    }
};
// Helper para simular uma conversa completa
window.simulateConversation = async (phone, clientName) => {
    console.log(`🎭 [DEV] Simulando conversa completa para ${phone}...`);
    const name = clientName || `Cliente ${phone.slice(-4)}`;
    const messages = [
        'Olá! Preciso de ajuda com meu pedido.',
        'Fiz uma compra ontem mas não recebi confirmação.',
        'O número do pedido é #12345',
        'Vocês podem verificar para mim?',
        'É urgente, por favor!'
    ];
    console.log(`📱 [DEV] Enviando ${messages.length} mensagens em sequência...`);
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        console.log(`\n📨 [DEV] Mensagem ${i + 1}/${messages.length}: "${message}"`);
        const result = await window.simulateWebhook(phone, message, name);
        if (i === 0) {
            console.log(`🎫 [DEV] Ticket principal: #${result.ticketId}`);
        }
        // Aguardar um pouco entre mensagens (exceto a última)
        if (i < messages.length - 1) {
            console.log('⏱️ [DEV] Aguardando 2 segundos...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    console.log('✅ [DEV] Conversa completa simulada!');
    console.log('💡 [DEV] Verifique a sidebar de departamentos para ver as notificações');
};
// Helper para testar cenários diferentes
window.runWebhookScenarios = async () => {
    console.log('🎭 [DEV] Executando cenários de teste de webhook...');
    const scenarios = [
        {
            name: 'João Silva - Cliente Novo',
            phone: '5511999887766',
            messages: ['Olá! Gostaria de conhecer seus serviços.', 'Vocês atendem na Vila Madalena?']
        },
        {
            name: 'Maria Santos - Cliente Retornando',
            phone: '5511999887755',
            messages: ['Oi, sou cliente e preciso de suporte.', 'Meu último pedido teve problema.']
        },
        {
            name: 'Pedro Costa - Dúvida Técnica',
            phone: '5511999887744',
            messages: ['Tenho uma dúvida técnica.', 'Como configuro a integração?']
        }
    ];
    console.log(`🎯 [DEV] Executando ${scenarios.length} cenários...`);
    for (let s = 0; s < scenarios.length; s++) {
        const scenario = scenarios[s];
        console.log(`\n📋 [DEV] Cenário ${s + 1}: ${scenario.name}`);
        for (let m = 0; m < scenario.messages.length; m++) {
            const message = scenario.messages[m];
            console.log(`  📱 Mensagem ${m + 1}: ${message}`);
            await window.simulateWebhook(scenario.phone, message, scenario.name);
            // Aguardar entre mensagens
            if (m < scenario.messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        // Aguardar entre cenários
        if (s < scenarios.length - 1) {
            console.log('⏱️ [DEV] Aguardando próximo cenário...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    console.log('\n✅ [DEV] Todos os cenários executados!');
    console.log('📊 [DEV] Execute checkTicketsTable() para ver os resultados');
};
// Helper para configurar webhook para o próprio CRM (melhor que N8N)
export const configureWebhookToCRM = async (crmDomain = 'localhost:3007') => {
    try {
        console.log('🎯 Configurando webhook para o próprio CRM...');
        // Importar funções específicas do Evolution API Service
        const { listInstances, getInstanceWebhook, removeInstanceWebhook, setInstanceWebhook } = await import('@/services/evolutionApi');
        // Determinar URL baseada no ambiente
        const webhookUrl = crmDomain.includes('localhost')
            ? `http://${crmDomain}/api/webhook/evolution`
            : `https://${crmDomain}/api/webhook/evolution`;
        console.log('🌐 URL do webhook:', webhookUrl);
        // Listar instâncias
        const instances = await listInstances();
        console.log(`📋 ${instances.data.length} instâncias encontradas`);
        let configured = 0;
        let skipped = 0;
        let errors = 0;
        for (const instance of instances.data) {
            try {
                console.log(`🔄 Processando ${instance.name} (${instance.state})...`);
                // Verificar webhook atual
                const currentWebhook = await getInstanceWebhook(instance.name);
                // Se tem webhook incorreto (N8N), remover primeiro
                if (currentWebhook.webhook?.url?.includes('n8n') ||
                    currentWebhook.webhook?.url?.includes('connection-update')) {
                    console.log(`🗑️ Removendo webhook incorreto de ${instance.name}`);
                    await removeInstanceWebhook(instance.name);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
                }
                // Configurar apenas instâncias conectadas
                if (instance.state === 'open') {
                    await setInstanceWebhook(instance.name, {
                        url: webhookUrl,
                        events: [
                            'MESSAGES_UPSERT', // Mensagens recebidas
                            'CONNECTION_UPDATE', // Status de conexão
                            'QRCODE_UPDATED' // QR Code atualizado
                        ],
                        enabled: true
                    });
                    console.log(`✅ Webhook configurado para ${instance.name}`);
                    // Verificar se funcionou
                    const check = await getInstanceWebhook(instance.name);
                    if (check.webhook?.url === webhookUrl) {
                        console.log(`🔍 Verificação OK: ${instance.name}`);
                        configured++;
                    }
                    else {
                        console.warn(`⚠️ Verificação falhou: ${instance.name}`);
                    }
                }
                else {
                    console.log(`⏸️ Pulando ${instance.name} (não conectada: ${instance.state})`);
                    skipped++;
                }
            }
            catch (error) {
                console.error(`❌ Erro ao configurar ${instance.name}:`, error.message);
                errors++;
            }
            // Aguardar entre requisições para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        // Resumo final
        console.log('\n📊 RESUMO DA CONFIGURAÇÃO:');
        console.log(`✅ Configuradas: ${configured}`);
        console.log(`⏸️ Puladas: ${skipped}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`🌐 URL configurada: ${webhookUrl}`);
        if (configured > 0) {
            console.log('\n🎉 Webhook configurado com sucesso!');
            console.log('📱 Agora envie uma mensagem no WhatsApp para testar');
            console.log('🔍 Monitore o console para ver as mensagens chegando');
            // Ativar monitoramento automático
            startWebhookMonitoring();
            return {
                success: true,
                configured,
                skipped,
                errors,
                webhookUrl
            };
        }
        else {
            console.log('\n⚠️ Nenhuma instância foi configurada');
            console.log('💡 Verifique se suas instâncias estão conectadas (status: open)');
            return {
                success: false,
                message: 'Nenhuma instância conectada encontrada',
                configured,
                skipped,
                errors
            };
        }
    }
    catch (error) {
        console.error('❌ Erro geral na configuração:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
/**
 * Monitorar mensagens chegando via webhook
 */
export const startWebhookMonitoring = () => {
    console.log('👀 Iniciando monitoramento de webhooks...');
    // Verificar mensagens novas a cada 10 segundos
    const monitor = setInterval(async () => {
        try {
            const { data: recentMessages } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);
            if (recentMessages && recentMessages.length > 0) {
                const lastMessage = recentMessages[0];
                const timeAgo = Date.now() - new Date(lastMessage.created_at).getTime();
                // Se a mensagem é dos últimos 30 segundos
                if (timeAgo < 30000) {
                    console.log('📨 Nova mensagem detectada:', {
                        content: lastMessage.content.substring(0, 50) + '...',
                        sender: lastMessage.sender_name,
                        timeAgo: Math.round(timeAgo / 1000) + 's atrás'
                    });
                }
            }
        }
        catch (error) {
            // Silenciar erros do monitor para não poluir console
        }
    }, 10000);
    // Parar monitor após 5 minutos
    setTimeout(() => {
        clearInterval(monitor);
        console.log('⏹️ Monitoramento de webhook finalizado');
    }, 300000);
    return monitor;
};
/**
 * Verificar status atual dos webhooks
 */
export const checkWebhookStatus = async () => {
    try {
        console.log('🔍 Verificando status atual dos webhooks...');
        const instances = await evolutionApi.listInstances();
        for (const instance of instances.data) {
            try {
                const webhook = await evolutionApi.getInstanceWebhook(instance.name);
                console.log(`📱 ${instance.name}:`);
                console.log(`   Estado: ${instance.state}`);
                console.log(`   Webhook: ${webhook.webhook?.url || 'Não configurado'}`);
                console.log(`   Eventos: ${webhook.webhook?.events?.join(', ') || 'Nenhum'}`);
                console.log(`   Ativo: ${webhook.webhook?.enabled ? 'Sim' : 'Não'}`);
                console.log('');
            }
            catch (error) {
                console.log(`📱 ${instance.name}: Erro ao verificar (${error.message})`);
            }
        }
    }
    catch (error) {
        console.error('❌ Erro ao verificar status:', error.message);
    }
};
/**
 * Comando rápido para configurar webhook local
 */
export const configureLocalWebhook = () => {
    return configureWebhookToCRM('localhost:3007');
};
// 🧪 TESTE COMPLETO DA INTEGRAÇÃO EVOLUTION API + WEBHOOK
window.testEvolutionIntegration = async () => {
    console.log('🧪 =========== TESTE COMPLETO - EVOLUTION API + WEBHOOK ===========');
    try {
        // 1. Testar conexão com Evolution API
        console.log('1️⃣ Testando conexão com Evolution API...');
        const connectionTest = await window.testEvolutionConnection();
        console.log('   Resultado:', connectionTest ? '✅ Conectado' : '❌ Falhou');
        // 2. Verificar se instância existe
        console.log('2️⃣ Verificando instância atendimento-ao-cliente-suporte-n1...');
        const instanceCheck = await window.checkInstance('atendimento-ao-cliente-suporte-n1');
        console.log('   Resultado:', instanceCheck ? '✅ Existe' : '❌ Não encontrada');
        // 3. Testar webhook configurado
        console.log('3️⃣ Testando webhook configurado...');
        const webhookTest = await window.testWebhookFix();
        console.log('   Resultado:', webhookTest.success ? '✅ Webhook OK' : '❌ Webhook falhou');
        // 4. Simular recebimento de mensagem
        console.log('4️⃣ Simulando recebimento de mensagem via webhook...');
        const messageTest = await window.simulateIncomingWhatsAppMessage();
        console.log('   Resultado:', messageTest.success ? '✅ Mensagem processada' : '❌ Falhou');
        // 5. Verificar criação de ticket
        console.log('5️⃣ Verificando criação automática de ticket...');
        const ticketCheck = await window.checkLatestTickets();
        console.log('   Resultado:', ticketCheck.length > 0 ? `✅ ${ticketCheck.length} ticket(s) encontrado(s)` : '❌ Nenhum ticket');
        console.log('🎉 =========== TESTE COMPLETO FINALIZADO ===========');
        return {
            success: true,
            results: {
                connection: connectionTest,
                instance: instanceCheck,
                webhook: webhookTest.success,
                message: messageTest.success,
                tickets: ticketCheck.length
            }
        };
    }
    catch (error) {
        console.error('❌ Erro no teste completo:', error);
        return { success: false, error };
    }
};
// 🧪 Simular mensagem WhatsApp chegando via webhook
window.simulateIncomingWhatsAppMessage = async () => {
    console.log('📱 Simulando mensagem WhatsApp recebida...');
    try {
        // Usar o TicketRoutingService para simular
        const result = await window.simulateWebhook('5511999887766', 'Olá! Estou com dúvidas sobre o produto. Podem me ajudar?', 'Cliente Teste WhatsApp', 'atendimento-ao-cliente-suporte-n1');
        if (result.success) {
            console.log('✅ Mensagem WhatsApp simulada com sucesso!');
            console.log('📊 Detalhes:', result);
            if (result.action === 'created') {
                console.log('🎫 NOVO TICKET CRIADO:', result.ticketId);
            }
            else if (result.action === 'updated') {
                console.log('💬 MENSAGEM ADICIONADA AO TICKET:', result.ticketId);
            }
        }
        else {
            console.error('❌ Falha na simulação:', result.error);
        }
        return result;
    }
    catch (error) {
        console.error('❌ Erro ao simular mensagem WhatsApp:', error);
        return { success: false, error };
    }
};
// 🧪 Verificar últimos tickets criados
window.checkLatestTickets = async () => {
    console.log('🔍 Verificando últimos tickets criados...');
    try {
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select(`
        id,
        title,
        status,
        metadata,
        created_at,
        last_message_at
      `)
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) {
            console.error('❌ Erro ao buscar tickets:', error);
            return [];
        }
        console.log(`📋 ${tickets.length} tickets encontrados:`);
        tickets.forEach((ticket, index) => {
            const isWhatsApp = ticket.metadata?.created_from_whatsapp;
            const clientName = ticket.metadata?.client_name || 'Cliente';
            const clientPhone = ticket.metadata?.client_phone || 'N/A';
            console.log(`   ${index + 1}. ${ticket.id} - ${ticket.title}`);
            console.log(`      📱 WhatsApp: ${isWhatsApp ? '✅ Sim' : '❌ Não'}`);
            console.log(`      👤 Cliente: ${clientName} (${clientPhone})`);
            console.log(`      📅 Criado: ${new Date(ticket.created_at).toLocaleString()}`);
            console.log(`      🎯 Status: ${ticket.status}`);
            console.log('      ---');
        });
        return tickets;
    }
    catch (error) {
        console.error('❌ Erro ao verificar tickets:', error);
        return [];
    }
};
// 🧪 Testar endpoint de recebimento de webhook
window.testWebhookEndpoint = async () => {
    console.log('🌐 Testando endpoint de webhook...');
    const webhookUrl = 'https://press-n8n.jhkbgs.easypanel.host/webhook/res';
    try {
        // Testar se o endpoint está ativo
        const response = await fetch(webhookUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('📡 Status do endpoint:', response.status);
        console.log('📡 URL testada:', webhookUrl);
        if (response.ok) {
            console.log('✅ Endpoint acessível');
            return { success: true, status: response.status, url: webhookUrl };
        }
        else {
            console.log('⚠️ Endpoint retornou:', response.status, response.statusText);
            return { success: false, status: response.status, url: webhookUrl };
        }
    }
    catch (error) {
        console.error('❌ Erro ao testar endpoint:', error);
        return { success: false, error, url: webhookUrl };
    }
};
// 🧪 Verificar status de todas as instâncias
window.checkAllInstances = async () => {
    console.log('📱 Verificando status de todas as instâncias...');
    try {
        // Buscar instâncias no banco local
        const { data: localInstances, error } = await supabase
            .from('evolution_instances')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('❌ Erro ao buscar instâncias locais:', error);
            return [];
        }
        console.log(`📋 ${localInstances.length} instância(s) encontrada(s) no banco:`);
        for (const instance of localInstances) {
            console.log(`\n🔍 Verificando: ${instance.instance_name}`);
            console.log(`   💼 Departamento: ${instance.department_name || 'N/A'}`);
            console.log(`   📅 Criada: ${new Date(instance.created_at).toLocaleString()}`);
            // Tentar verificar status na Evolution API
            try {
                const status = await window.checkInstance(instance.instance_name);
                console.log(`   📊 Status API: ${status ? '✅ Ativa' : '❌ Inativa'}`);
            }
            catch (error) {
                console.log(`   📊 Status API: ❌ Erro ao verificar`);
            }
        }
        return localInstances;
    }
    catch (error) {
        console.error('❌ Erro ao verificar instâncias:', error);
        return [];
    }
};
// === 🔍 DIAGNÓSTICO DE TICKETS ===
// Diagnóstico rápido para verificar por que tickets não chegam
window.diagnosticoTickets = async () => {
    console.log('🚀 DIAGNÓSTICO: Por que tickets não chegam no CRM?');
    console.log('='.repeat(60));
    try {
        // 1. VERIFICAR TICKETS NO BANCO
        console.log('\n📊 1. VERIFICANDO TICKETS NO BANCO...');
        const { data: todosTickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);
        if (ticketsError) {
            console.log('❌ Erro ao buscar tickets:', ticketsError.message);
            return;
        }
        console.log(`✅ Total de tickets no banco: ${todosTickets.length}`);
        // Verificar tickets WhatsApp
        const whatsappTickets = todosTickets.filter(ticket => ticket.channel === 'whatsapp' ||
            ticket.metadata?.created_from_whatsapp ||
            ticket.metadata?.evolution_instance_name);
        console.log(`📱 Tickets WhatsApp: ${whatsappTickets.length}`);
        if (whatsappTickets.length > 0) {
            console.log('\n📝 Últimos tickets WhatsApp:');
            whatsappTickets.slice(0, 5).forEach((ticket, index) => {
                console.log(`  ${index + 1}. "${ticket.title}" (${ticket.created_at})`);
                console.log(`     Departamento: ${ticket.department_id || 'NULL'}`);
            });
        }
        else {
            console.log('⚠️ NENHUM TICKET WHATSAPP encontrado!');
            console.log('💡 Webhook pode não estar funcionando');
        }
        // 2. VERIFICAR USUÁRIO E FILTROS
        console.log('\n👤 2. VERIFICANDO FILTROS DO USUÁRIO...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('❌ Usuário não autenticado');
            return;
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, department')
            .eq('id', user.id)
            .single();
        if (profile) {
            const hasGlobalAccess = ['diretor', 'ceo', 'administrador'].includes(profile.department?.toLowerCase() || '');
            console.log('✅ Usuário:', {
                role: profile.role,
                department: profile.department,
                accessType: hasGlobalAccess ? 'GLOBAL' : 'FILTRADO'
            });
            if (!hasGlobalAccess && profile.role !== 'customer') {
                const ticketsSemDepartamento = todosTickets.filter(t => !t.department_id);
                console.log(`⚠️ ${ticketsSemDepartamento.length} tickets SEM department_id`);
                if (ticketsSemDepartamento.length > 0) {
                    console.log('🔧 Execute: corrigirDepartmentTickets() para correção');
                }
            }
        }
        // 3. TESTAR WEBHOOK
        console.log('\n📡 3. TESTANDO WEBHOOK...');
        try {
            const response = await fetch('https://websocket.bkcrm.devsible.com.br/webhook/health');
            if (response.ok) {
                console.log('✅ Webhook funcionando');
            }
            else {
                console.log('❌ Webhook com problema');
            }
        }
        catch (error) {
            console.log('❌ Webhook inacessível');
        }
    }
    catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
};
// Corrigir department_id dos tickets
window.corrigirDepartmentTickets = async () => {
    console.log('🔧 Corrigindo department_id dos tickets...');
    try {
        const { data: departments } = await supabase
            .from('departments')
            .select('id, name')
            .limit(1);
        if (!departments || departments.length === 0) {
            console.log('❌ Nenhum departamento encontrado');
            return;
        }
        const departmentId = departments[0].id;
        console.log(`🎯 Usando departamento: ${departments[0].name}`);
        const { data, error } = await supabase
            .from('tickets')
            .update({ department_id: departmentId })
            .is('department_id', null)
            .select('id');
        if (error) {
            console.log('❌ Erro:', error.message);
        }
        else {
            console.log(`✅ ${data.length} tickets atualizados`);
            console.log('💡 Recarregue a página para ver os tickets');
        }
    }
    catch (error) {
        console.error('❌ Erro:', error);
    }
};
