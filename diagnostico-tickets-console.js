/**
 * 🔍 DIAGNÓSTICO RÁPIDO: TICKETS NÃO CHEGAM NO CRM
 * 
 * Cole este script no console do navegador (F12 → Console) e execute:
 * diagnosticoRapido()
 */

async function diagnosticoRapido() {
  console.log('🚀 DIAGNÓSTICO RÁPIDO: Por que tickets não chegam no CRM?');
  console.log('=' * 60);
  
  // 1. VERIFICAR SE SUPABASE ESTÁ DISPONÍVEL
  if (typeof window.supabase === 'undefined') {
    console.log('❌ Supabase não está disponível');
    console.log('💡 Tente recarregar a página e executar novamente');
    return;
  }
  
  try {
    // 2. BUSCAR TODOS OS TICKETS SEM FILTROS
    console.log('\n📊 2. VERIFICANDO TICKETS NO BANCO...');
    
    const { data: todosTickets, error: ticketsError } = await window.supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError.message);
      if (ticketsError.code === 'PGRST116') {
        console.log('💡 Tabela tickets não existe - execute migração no Supabase');
      }
      return;
    }

    console.log(`✅ Total de tickets no banco: ${todosTickets.length}`);
    
    // 3. SEPARAR TICKETS POR CANAL
    const ticketsPorCanal = todosTickets.reduce((acc, ticket) => {
      const canal = ticket.channel || 'sem_canal';
      if (!acc[canal]) acc[canal] = [];
      acc[canal].push(ticket);
      return acc;
    }, {});
    
    console.log('\n📋 Tickets por canal:');
    Object.entries(ticketsPorCanal).forEach(([canal, tickets]) => {
      console.log(`  ${canal}: ${tickets.length} tickets`);
    });
    
    // 4. VERIFICAR TICKETS WHATSAPP ESPECIFICAMENTE
    const whatsappTickets = todosTickets.filter(ticket => 
      ticket.channel === 'whatsapp' || 
      ticket.metadata?.created_from_whatsapp ||
      ticket.metadata?.evolution_instance_name
    );
    
    console.log(`\n📱 Tickets WhatsApp: ${whatsappTickets.length}`);
    
    if (whatsappTickets.length > 0) {
      console.log('\n📝 Últimos tickets WhatsApp:');
      whatsappTickets.slice(0, 5).forEach((ticket, index) => {
        console.log(`  ${index + 1}. "${ticket.title}" (${ticket.created_at})`);
        console.log(`     ID: ${ticket.id.substring(0,8)}...`);
        console.log(`     Departamento: ${ticket.department_id || 'NULL'}`);
        console.log(`     Cliente: ${ticket.customer_id ? ticket.customer_id.substring(0,8) + '...' : 'NULL'}`);
      });
    } else {
      console.log('⚠️ NENHUM TICKET WHATSAPP encontrado no banco!');
      console.log('💡 Possíveis causas:');
      console.log('   - Webhook não está funcionando');
      console.log('   - Evolution API não está configurada');
      console.log('   - Instâncias WhatsApp desconectadas');
    }
    
    // 5. VERIFICAR USUÁRIO ATUAL E FILTROS
    console.log('\n👤 5. VERIFICANDO USUÁRIO E FILTROS...');
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }
    
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('id, role, department')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      console.log('✅ Usuário logado:', {
        role: profile.role,
        department: profile.department
      });
      
      // Verificar se tem acesso global
      const hasGlobalAccess = ['diretor', 'ceo', 'administrador'].includes(
        profile.department?.toLowerCase() || ''
      );
      
      console.log(`🎯 Tipo de acesso: ${hasGlobalAccess ? 'GLOBAL' : 'FILTRADO POR DEPARTAMENTO'}`);
      
      if (!hasGlobalAccess && profile.role !== 'customer') {
        console.log('⚠️ POSSÍVEL PROBLEMA: Usuário com acesso restrito por departamento');
        console.log('💡 Tickets só aparecem se tiverem department_id correspondente');
        
        // Verificar quantos tickets têm department_id
        const ticketsComDepartamento = todosTickets.filter(t => t.department_id);
        const ticketsSemDepartamento = todosTickets.filter(t => !t.department_id);
        
        console.log(`   📊 Tickets COM department_id: ${ticketsComDepartamento.length}`);
        console.log(`   📊 Tickets SEM department_id: ${ticketsSemDepartamento.length}`);
        
        if (ticketsSemDepartamento.length > 0) {
          console.log('🔧 SOLUÇÃO: Corrigir department_id dos tickets sem departamento');
        }
      }
    }
    
    // 6. TESTE DO WEBHOOK
    console.log('\n📡 6. TESTANDO WEBHOOK...');
    
    try {
      const webhookResponse = await fetch('https://websocket.bkcrm.devsible.com.br/webhook/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (webhookResponse.ok) {
        const health = await webhookResponse.json();
        console.log('✅ Webhook FUNCIONANDO:', health);
      } else {
        console.log('❌ Webhook respondeu com erro:', webhookResponse.status);
      }
    } catch (error) {
      console.log('❌ Webhook INACESSÍVEL:', error.message);
      console.log('💡 Verificar se webhook está rodando no EasyPanel');
    }
    
    // 7. RESUMO E SOLUÇÕES
    console.log('\n🎯 RESUMO E SOLUÇÕES');
    console.log('==================');
    
    if (whatsappTickets.length === 0) {
      console.log('❌ PROBLEMA: Nenhum ticket WhatsApp no banco');
      console.log('🔧 SOLUÇÕES:');
      console.log('   1. Verificar se webhook está funcionando');
      console.log('   2. Verificar instâncias Evolution API');
      console.log('   3. Testar envio de mensagem WhatsApp real');
    } else {
      console.log('✅ Tickets WhatsApp existem no banco');
      
      if (profile && !hasGlobalAccess) {
        console.log('⚠️ POSSÍVEL FILTRO BLOQUEANDO VISUALIZAÇÃO');
        console.log('🔧 SOLUÇÕES:');
        console.log('   1. Corrigir department_id dos tickets');
        console.log('   2. Alterar departamento do usuário para "administrador"');
        console.log('   3. Execute: corrigirDepartmentIdTickets() para correção automática');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

// Função para corrigir department_id dos tickets
async function corrigirDepartmentIdTickets() {
  console.log('🔧 Corrigindo department_id dos tickets...');
  
  try {
    // Buscar primeiro departamento disponível
    const { data: departments } = await window.supabase
      .from('departments')
      .select('id, name')
      .limit(1);
    
    if (!departments || departments.length === 0) {
      console.log('❌ Nenhum departamento encontrado');
      console.log('💡 Crie um departamento primeiro no sistema');
      return;
    }
    
    const departmentId = departments[0].id;
    console.log(`🎯 Usando departamento: ${departments[0].name} (${departmentId})`);
    
    // Atualizar tickets sem department_id
    const { data, error } = await window.supabase
      .from('tickets')
      .update({ department_id: departmentId })
      .is('department_id', null)
      .select('id');
    
    if (error) {
      console.log('❌ Erro ao atualizar:', error.message);
    } else {
      console.log(`✅ ${data.length} tickets atualizados com department_id`);
      console.log('💡 Recarregue a página para ver os tickets');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Função para teste direto do webhook
async function testarWebhookDireto() {
  console.log('🧪 Testando webhook diretamente...');
  
  const payload = {
    event: 'MESSAGES_UPSERT',
    instance: 'teste-console',
    data: {
      key: {
        remoteJid: '5511999887766@s.whatsapp.net',
        fromMe: false,
        id: `TESTE_CONSOLE_${Date.now()}`
      },
      message: {
        conversation: `[TESTE CONSOLE] ${new Date().toLocaleString()} - Verificando se webhook funciona`
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste Console'
    }
  };
  
  try {
    const response = await fetch('https://websocket.bkcrm.devsible.com.br/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook processou:', result);
      
      if (result.ticketId) {
        console.log(`🎫 Ticket criado: ${result.ticketId}`);
        console.log('💡 Aguarde 2 segundos e recarregue a página para ver o ticket');
      }
    } else {
      console.log('❌ Webhook falhou:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error);
  }
}

// Expor funções globalmente
window.diagnosticoRapido = diagnosticoRapido;
window.corrigirDepartmentIdTickets = corrigirDepartmentIdTickets;
window.testarWebhookDireto = testarWebhookDireto;

console.log('🔧 FUNÇÕES DISPONÍVEIS:');
console.log('• diagnosticoRapido() - Diagnóstico completo');
console.log('• corrigirDepartmentIdTickets() - Corrigir filtros');
console.log('• testarWebhookDireto() - Testar webhook');
console.log('');
console.log('▶️ Execute: diagnosticoRapido()'); 