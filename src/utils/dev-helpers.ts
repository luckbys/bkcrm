import { supabase } from '@/lib/supabase';

// Helper para teste rápido de criação de tickets
(window as any).testTicketCreation = async (numero?: string, nome?: string, mensagem?: string) => {
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
  } catch (error) {
    console.error('❌ [DEV] Erro inesperado:', error);
    return false;
  }
};

// Helper para listar tickets por canal
(window as any).queryTickets = async (canal?: string) => {
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
(window as any).cleanTestTickets = async () => {
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
(window as any).checkTicketsTable = async () => {
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
  } else {
    console.log('📭 [DEV] Tabela tickets está vazia');
  }
};

// 📱 Helper para testar Evolution API
(window as any).testEvolutionAPI = async () => {
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
      } else if (cleanPhone.length === 10) {
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
    
  } catch (error) {
    console.error('❌ [DEV] Erro ao testar Evolution API:', error);
    return { success: false, error };
  }
};

// 🔄 Helper para simular recebimento de mensagem WhatsApp
(window as any).simulateWhatsAppMessage = async (ticketId: string, content = 'Mensagem de teste via WhatsApp') => {
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
  } catch (error) {
    console.error('❌ [DEV] Erro na simulação:', error);
    return { success: false, error };
  }
};

// 🎫 Helper para criar ticket de teste com WhatsApp
(window as any).createWhatsAppTestTicket = async () => {
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
    const initialMessage = await (window as any).simulateWhatsAppMessage(
      data.id, 
      'Olá! Esta é uma mensagem de teste do WhatsApp 📱'
    );
    
    if (initialMessage.success) {
      console.log('✅ [DEV] Mensagem inicial adicionada ao ticket');
    }
    
    return { success: true, ticket: data, message: initialMessage.data };
  } catch (error) {
    console.error('❌ [DEV] Erro ao criar ticket teste:', error);
    return { success: false, error };
  }
};

// 🧹 Helper para limpar dados de teste WhatsApp
(window as any).cleanWhatsAppTestData = async () => {
  console.log('🧹 [DEV] Limpando dados de teste WhatsApp...');
  
  try {
    // Limpar mensagens de teste
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('metadata->>test_message', 'true');

    if (messagesError) {
      console.error('❌ [DEV] Erro ao limpar mensagens de teste:', messagesError);
    } else {
      console.log('✅ [DEV] Mensagens de teste removidas');
    }

    // Limpar tickets de teste
    const { error: ticketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('metadata->>test_ticket', 'true');

    if (ticketsError) {
      console.error('❌ [DEV] Erro ao limpar tickets de teste:', ticketsError);
    } else {
      console.log('✅ [DEV] Tickets de teste removidos');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [DEV] Erro na limpeza:', error);
    return { success: false, error };
  }
};

// 🔍 Helper para verificar estrutura da tabela profiles
(window as any).checkProfilesStructure = async () => {
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
      } else if (hasDepartment) {
        console.log('');
        console.log('⚠️ Estrutura legacy detectada - usando department');
        console.log('💡 Considere executar a migração: 20240321000002_add_department_to_profiles.sql');
        return 'department';
      } else {
        console.log('');
        console.log('❌ Nenhuma coluna de departamento encontrada');
        console.log('🔧 Execute as migrações de departamento primeiro');
        return null;
      }
    } else {
      console.log('❌ Nenhum perfil encontrado na tabela');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
};

// 📋 Helper para testar migração evolution_instances
(window as any).testEvolutionInstancesMigration = async () => {
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
    } else {
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
    
  } catch (error) {
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
      } else {
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
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
};

// Função para verificar se precisa executar migrações
export const checkMigrationStatus = async () => {
  console.log('\n🔍 VERIFICANDO STATUS DAS MIGRAÇÕES');
  console.log('====================================');
  
  const profilesOk = await (window as any).checkProfilesStructure();
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
(window as any).checkEvolutionInstancesTable = checkEvolutionInstancesTable;
(window as any).checkMigrationStatus = checkMigrationStatus;

// Helper para mostrar comandos disponíveis
(window as any).devHelp = () => {
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
createWhatsAppTestTicket()                        - Cria ticket de teste com WhatsApp
simulateWhatsAppMessage(ticketId, mensagem?)      - Simula mensagem do WhatsApp
cleanWhatsAppTestData()                           - Remove dados de teste WhatsApp

🔧 Diagnóstico de Migração:
checkProfilesStructure()                          - Verifica estrutura tabela profiles
testEvolutionInstancesMigration()                 - Testa migração evolution_instances
checkEvolutionInstancesTable()                    - Verifica se tabela evolution_instances existe
checkMigrationStatus()                            - Verifica status de todas as migrações

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
(window as any).testRealEvolutionAPI = async () => {
  console.log('%c🚀 TESTANDO EVOLUTION API REAL', 'color: #16a34a; font-weight: bold; font-size: 14px');
  console.log('==========================================');
  
  try {
    const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
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
      instances.forEach((instance: any, index: number) => {
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
    } else {
      console.log(`📊 Instâncias locais: ${localInstances?.length || 0}`);
      localInstances?.forEach((instance, index) => {
        console.log(`   ${index + 1}. ${instance.instance_name} (${instance.department_name}) - Status: ${instance.status}`);
      });
    }
    
    // Teste 3: Sincronização
    console.log('\n3️⃣ Verificando sincronização...');
    const localNames = localInstances?.map(i => i.instance_name) || [];
    const remoteNames = instances.map((i: any) => i.instance.instanceName) || [];
    
    const onlyLocal = localNames.filter(name => !remoteNames.includes(name));
    const onlyRemote = remoteNames.filter((name: string) => !localNames.includes(name));
    
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
    
  } catch (error: any) {
    console.error('❌ ERRO NO TESTE:', error.message);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
      console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
      console.log('1. Verificar se Evolution API está rodando');
      console.log('2. Verificar URL na variável VITE_EVOLUTION_API_URL');
      console.log('3. Verificar se há problemas de CORS');
      console.log('4. Verificar conexão de internet');
    } else if (error.message.includes('401') || error.message.includes('403')) {
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
(window as any).testEvolutionConnection = async () => {
  console.log('🔗 [DEV] Testando conectividade Evolution API...');
  
  try {
    // Importar dinamicamente o serviço
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    const result = await evolutionApiService.testConnection();
    
    if (result.success) {
      console.log('✅ [DEV] Evolution API conectada com sucesso!');
      console.log('📊 [DEV] Dados da resposta:', result.data);
    } else {
      console.error('❌ [DEV] Falha na conectividade:', result.error);
      console.error('📊 [DEV] Status HTTP:', result.status);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [DEV] Erro inesperado:', error);
    return { success: false, error };
  }
};

// Helper para listar todas as instâncias existentes
(window as any).listEvolutionInstances = async () => {
  console.log('📋 [DEV] Listando instâncias existentes...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    const instances = await evolutionApiService.listInstances();
    
    console.log(`✅ [DEV] Encontradas ${instances?.length || 0} instância(s):`);
    instances?.forEach((instance: any, index: number) => {
      // Campos corretos baseados na resposta da API
      const instanceName = instance.name || instance.instanceName || instance.instance?.instanceName || 'Nome não disponível';
      const status = instance.connectionStatus || instance.status || instance.instance?.status || 'Status não disponível';
      const id = instance.id || 'ID não disponível';
      
      console.log(`${index + 1}. Nome: "${instanceName}", Status: ${status}, ID: ${id}`);
    });
    
    return instances || [];
  } catch (error) {
    console.error('❌ [DEV] Erro ao listar instâncias:', error);
    return [];
  }
};

// Helper para criar uma instância de teste
(window as any).createTestInstance = async (instanceName = 'test-' + Date.now()) => {
  console.log(`🆕 [DEV] Criando instância de teste: ${instanceName}`);
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    const result = await evolutionApiService.testCreateInstance(instanceName);
    
    if (result.success) {
      console.log('✅ [DEV] Instância criada com sucesso!');
      console.log('📊 [DEV] Dados da instância:', result.data);
      console.log(`💡 [DEV] Use: testInstanceQRCode('${instanceName}') para obter QR Code`);
    } else {
      console.error('❌ [DEV] Falha ao criar instância:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [DEV] Erro ao criar instância:', error);
    return { success: false, error };
  }
};

// Helper para testar QR Code de uma instância
(window as any).testInstanceQRCode = async (instanceName = 'test') => {
  console.log(`📱 [DEV] Testando QR Code para instância: ${instanceName}`);
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // Verificar se existe primeiro
    const exists = await evolutionApiService.instanceExists(instanceName);
    console.log(`🔍 [DEV] Instância ${instanceName} existe:`, exists);
    
    if (!exists) {
      console.log('⚠️ [DEV] Instância não existe. Criando...');
      const createResult = await evolutionApiService.testCreateInstance(instanceName);
      
      if (!createResult.success) {
        throw new Error('Falha ao criar instância: ' + createResult.error);
      }
      
      console.log('✅ [DEV] Instância criada. Aguardando estabilização...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Tentar obter QR Code
    const qrResult = await evolutionApiService.getInstanceQRCode(instanceName);
    
    if (qrResult && qrResult.base64) {
      console.log('✅ [DEV] QR Code obtido com sucesso!');
      console.log('📱 [DEV] QR Code base64 length:', qrResult.base64.length);
      
      // Mostrar QR Code no console (se for pequeno)
      if (qrResult.base64.length < 1000) {
        console.log('📊 [DEV] QR Code data:', qrResult);
      }
      
      return { success: true, qrCode: qrResult };
    } else {
      throw new Error('QR Code não foi gerado');
    }
    
  } catch (error) {
    console.error('❌ [DEV] Erro no teste de QR Code:', error);
    return { success: false, error };
  }
};

// Helper para verificar status de uma instância
(window as any).checkInstanceStatus = async (instanceName = 'test') => {
  console.log(`📊 [DEV] Verificando status da instância: ${instanceName}`);
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    const status = await evolutionApiService.getInstanceStatus(instanceName);
    
    console.log('✅ [DEV] Status obtido:', status);
    return status;
  } catch (error) {
    console.error('❌ [DEV] Erro ao verificar status:', error);
    return { error };
  }
};

// Helper para reiniciar conexão de uma instância
(window as any).restartInstanceConnection = async (instanceName = 'test') => {
  console.log(`🔄 [DEV] Reiniciando conexão da instância: ${instanceName}`);
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    const result = await evolutionApiService.restartInstanceConnection(instanceName);
    
    console.log('✅ [DEV] Conexão reiniciada:', result);
    return result;
  } catch (error) {
    console.error('❌ [DEV] Erro ao reiniciar conexão:', error);
    return { error };
  }
};

// Helper para deletar uma instância
(window as any).deleteTestInstance = async (instanceName = 'test') => {
  console.log(`🗑️ [DEV] Deletando instância: ${instanceName}`);
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    await evolutionApiService.deleteInstance(instanceName);
    
    console.log('✅ [DEV] Instância deletada com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('❌ [DEV] Erro ao deletar instância:', error);
    return { success: false, error };
  }
};

// Helper para mostrar todos os comandos Evolution disponíveis
(window as any).evolutionCommands = () => {
  console.log(`
🔧 COMANDOS EVOLUTION API DISPONÍVEIS:

📋 DIAGNÓSTICO:
• testEvolutionConnection() - Testa conectividade básica
• listEvolutionInstances() - Lista todas as instâncias
• checkInstanceStatus('nomeInstancia') - Verifica status específico
• debugInstanceNames() - 🆕 Investiga problemas de nomes de instâncias

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
(window as any).testFinanceiroQRCode = async () => {
  console.log('📱 [DEV] Testando QR Code da instância financeiro-encontra...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // Verificar status primeiro
    const status = await evolutionApiService.getInstanceStatus('financeiro-encontra');
    console.log('📊 [DEV] Status atual:', status);
    
    // Tentar obter QR Code
    const qrResult = await evolutionApiService.getInstanceQRCode('financeiro-encontra');
    
    if (qrResult && qrResult.base64) {
      console.log('✅ [DEV] QR Code obtido com sucesso!');
      console.log('📱 [DEV] QR Code length:', qrResult.base64.length);
      console.log('🔍 [DEV] QR Code prefix:', qrResult.base64.substring(0, 50));
      
      // Verificar se há duplicação
      if (qrResult.base64.includes('data:image/png;base64,data:image/png;base64,')) {
        console.error('❌ [DEV] DUPLICAÇÃO DETECTADA no QR Code!');
      } else {
        console.log('✅ [DEV] QR Code formatado corretamente');
      }
      
      return { success: true, qrCode: qrResult.base64 };
    } else {
      throw new Error('QR Code não foi gerado');
    }
    
  } catch (error) {
    console.error('❌ [DEV] Erro no teste de QR Code:', error);
    return { success: false, error };
  }
};

// Helper para verificar formatação de QR Code
(window as any).validateQRCodeFormat = (qrCodeString: string) => {
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
(window as any).debugInstanceNames = async () => {
  console.log('🔍 [DEV] Investigando problemas de nomes de instâncias...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // 1. Listar todas as instâncias
    console.log('📋 [DEV] Listando instâncias existentes...');
    const instances = await evolutionApiService.listInstances();
    
    if (instances && instances.length > 0) {
      console.log(`✅ [DEV] Encontradas ${instances.length} instância(s):`);
      instances.forEach((instance: any, index: number) => {
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
    } else {
      console.log('❌ [DEV] Nenhuma instância encontrada');
    }
    
    // 2. Testar instâncias específicas
    const instancesToTest = ['financeiro-encontra', 'financeiro-financeiro'];
    
    for (const instanceName of instancesToTest) {
      console.log(`\n🧪 [DEV] Testando instância: "${instanceName}"`);
      
      try {
        const status = await evolutionApiService.getInstanceStatus(instanceName);
        console.log(`✅ [DEV] "${instanceName}" existe! Status:`, status);
      } catch (error: any) {
        if (error.message.includes('404')) {
          console.log(`❌ [DEV] "${instanceName}" NÃO EXISTE (404)`);
        } else {
          console.log(`⚠️ [DEV] "${instanceName}" erro:`, error.message);
        }
      }
    }
    
    return { success: true, instances };
  } catch (error) {
    console.error('❌ [DEV] Erro no debug:', error);
    return { success: false, error };
  }
};

// Helper para testar QR Code com instância correta
(window as any).testCorrectInstance = async () => {
  console.log('🎯 [DEV] Testando com instância correta...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // Primeiro descobrir qual instância do financeiro existe
    const instances = await evolutionApiService.listInstances();
    const financeiroInstance = instances?.find((inst: any) => {
      const name = inst.name || inst.instanceName || '';
      return name.includes('financeiro');
    });
    
    if (!financeiroInstance) {
      console.error('❌ [DEV] Nenhuma instância do financeiro encontrada');
      return { success: false, error: 'Instância não encontrada' };
    }
    
    const instanceName = financeiroInstance.name || financeiroInstance.instanceName;
    console.log(`📱 [DEV] Testando QR Code da instância encontrada: "${instanceName}"`);
    
    const qrResult = await evolutionApiService.getInstanceQRCode(instanceName);
    
    if (qrResult) {
      console.log('✅ [DEV] QR Code obtido com sucesso!');
      console.log('📊 [DEV] Estrutura da resposta:', qrResult);
      return { success: true, instanceName, qrCode: qrResult };
    } else {
      throw new Error('QR Code não foi gerado');
    }
    
  } catch (error) {
    console.error('❌ [DEV] Erro no teste:', error);
    return { success: false, error };
  }
};

// Helper específico para testar a instância financeiro-encontra (que sabemos que existe)
(window as any).testFinanceiroEncontra = async () => {
  console.log('📱 [DEV] Testando QR Code da instância financeiro-encontra...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // Testar diretamente a instância que sabemos que existe
    const instanceName = 'financeiro-encontra';
    
    // Verificar status primeiro
    console.log(`🔍 [DEV] Verificando status de: ${instanceName}`);
    const status = await evolutionApiService.getInstanceStatus(instanceName);
    console.log('📊 [DEV] Status atual:', status);
    
    // Se status é "connecting", é perfeito para QR Code
    const statusData = status as any;
    if (statusData.instance?.state === 'connecting') {
      console.log('✅ [DEV] Status "connecting" - ideal para QR Code');
    }
    
    // Tentar obter QR Code
    console.log(`📱 [DEV] Obtendo QR Code...`);
    const qrResult = await evolutionApiService.getInstanceQRCode(instanceName);
    
    if (qrResult) {
      console.log('✅ [DEV] QR Code obtido com sucesso!');
      console.log('📊 [DEV] Estrutura completa da resposta:', qrResult);
      
      // Verificar campos específicos
      const qrData = qrResult as any;
      
      if (qrData.code) {
        console.log('📱 [DEV] Campo "code" encontrado:', qrData.code.substring(0, 50) + '...');
      }
      
      if (qrData.base64) {
        console.log('🖼️ [DEV] Campo "base64" encontrado:', qrData.base64.substring(0, 50) + '...');
        
        // Verificar se é válido
        if (qrData.base64.startsWith('data:image/')) {
          console.log('✅ [DEV] Base64 formatado corretamente para exibição');
        } else {
          console.log('⚠️ [DEV] Base64 pode precisar de formatação adicional');
        }
      }
      
      if (qrData.pairingCode) {
        console.log('📲 [DEV] Pairing Code encontrado:', qrData.pairingCode);
      }
      
      return { success: true, instanceName, qrCode: qrResult };
    } else {
      throw new Error('QR Code não foi gerado');
    }
    
  } catch (error) {
    console.error('❌ [DEV] Erro no teste:', error);
    return { success: false, error };
  }
};

// Helper para debug de QR Code com display visual
(window as any).debugQRCodeGeneration = async () => {
  console.log('🔍 [DEV] Debug completo de geração de QR Code...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // Testar a instância que sabemos que existe
    const instanceName = 'financeiro-encontra';
    
    console.log(`📱 [DEV] Testando QR Code para: ${instanceName}`);
    
    // Obter QR Code
    const qrResult = await evolutionApiService.getInstanceQRCode(instanceName);
    
    if (qrResult) {
      console.log('✅ [DEV] QR Code obtido:', qrResult);
      
      // Se temos o código textual, criar uma imagem simples
      if (qrResult.code && !qrResult.base64) {
        console.log('🎨 [DEV] Gerando imagem QR Code com API externa...');
        
        try {
          // Usar API simples para gerar QR Code
          const qrText = encodeURIComponent(qrResult.code);
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrText}`;
          
          console.log('🖼️ [DEV] URL da imagem QR Code:', qrImageUrl);
          
          // Criar elemento de imagem para testar
          const img = document.createElement('img');
          img.src = qrImageUrl;
          img.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
          `;
          
          // Adicionar botão de fechar
          const closeBtn = document.createElement('button');
          closeBtn.innerHTML = '❌ Fechar';
          closeBtn.style.cssText = `
            position: fixed;
            top: calc(50% - 200px);
            left: calc(50% + 100px);
            z-index: 10000;
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
          `;
          closeBtn.onclick = () => {
            document.body.removeChild(img);
            document.body.removeChild(closeBtn);
          };
          
          document.body.appendChild(img);
          document.body.appendChild(closeBtn);
          
          console.log('📱 [DEV] QR Code exibido na tela! Clique no botão vermelho para fechar.');
          
          return { success: true, qrCode: qrResult, imageUrl: qrImageUrl };
        } catch (imgError) {
          console.error('❌ [DEV] Erro ao gerar imagem:', imgError);
        }
      }
      
      // Se já temos base64, exibir
      if (qrResult.base64) {
        console.log('📱 [DEV] Base64 encontrado, exibindo...');
        
        const img = document.createElement('img');
        img.src = qrResult.base64;
        img.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '❌ Fechar';
        closeBtn.style.cssText = `
          position: fixed;
          top: calc(50% - 200px);
          left: calc(50% + 100px);
          z-index: 10000;
          background: #ff4444;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
        `;
        closeBtn.onclick = () => {
          document.body.removeChild(img);
          document.body.removeChild(closeBtn);
        };
        
        document.body.appendChild(img);
        document.body.appendChild(closeBtn);
        
        console.log('📱 [DEV] QR Code Base64 exibido na tela!');
      }
      
      return { success: true, qrCode: qrResult };
    } else {
      console.error('❌ [DEV] Nenhum QR Code obtido');
      return { success: false, error: 'QR Code não obtido' };
    }
    
  } catch (error) {
    console.error('❌ [DEV] Erro no debug:', error);
    return { success: false, error };
  }
};

// Helper para testar a correção do campo 'state' da Evolution API
(window as any).testEvolutionStateField = async () => {
  console.log('🔍 [DEV] Testando correção do campo "state" da Evolution API...');
  
  try {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    
    // Testar com instâncias conhecidas
    const instancesToTest = ['financeiro-encontra', 'marcas', 'vendas-bd1'];
    
    for (const instanceName of instancesToTest) {
      console.log(`\n📱 [DEV] Testando: ${instanceName}`);
      
      try {
        const response = await evolutionApiService.getInstanceStatus(instanceName);
        console.log('✅ [DEV] Resposta da API:', response);
        
        // Verificar se tem o campo state
        if (response.instance?.state) {
          console.log(`✅ [DEV] Campo "state" encontrado: ${response.instance.state}`);
          
          // Verificar se o mapeamento está correto
          const isConnected = response.instance.state === 'open';
          const status = response.instance.state === 'open' ? 'open' : 'close';
          
          console.log(`📊 [DEV] Status mapeado: ${status}, Conectado: ${isConnected}`);
          
          // Simular o que acontece no DepartmentEvolutionManager
          const evolutionStatus = response.instance.state === 'open' ? 'open' : 'close';
          const connected = response.instance.state === 'open';
          
          console.log(`🎯 [DEV] Para interface: status="${evolutionStatus}", connected=${connected}`);
          
        } else {
          console.error(`❌ [DEV] Campo "state" não encontrado em ${instanceName}`);
          console.log('📋 [DEV] Campos disponíveis:', Object.keys(response.instance || {}));
        }
        
      } catch (error: any) {
        if (error.message.includes('404')) {
          console.log(`⚠️ [DEV] Instância ${instanceName} não existe`);
        } else {
          console.error(`❌ [DEV] Erro ao testar ${instanceName}:`, error.message);
        }
      }
    }
    
    return { success: true, message: 'Teste do campo state concluído' };
    
  } catch (error) {
    console.error('❌ [DEV] Erro no teste:', error);
    return { success: false, error };
  }
}; 