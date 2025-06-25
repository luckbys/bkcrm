// =============================================================================
// 📱 TESTE DE INTEGRAÇÃO DO CAMPO NUNMSG
// =============================================================================
// Script para testar se a extração de telefone está funcionando com o campo nunmsg

import { supabase } from '../lib/supabase';

/**
 * Dados de teste para simular diferentes cenários de tickets
 */
const testTickets = [
  {
    id: 'test-1',
    title: 'Ticket com nunmsg',
    channel: 'whatsapp',
    nunmsg: '+5511999998888', // 📱 CAMPO PRINCIPAL
    metadata: {
      client_name: 'João Silva',
      created_from_whatsapp: true
    }
  },
  {
    id: 'test-2',
    title: 'Ticket sem nunmsg mas com metadata',
    channel: 'whatsapp',
    nunmsg: null,
    metadata: {
      client_name: 'Maria Santos',
      whatsapp_phone: '+5511888776655',
      client_phone: '+5511888776655'
    }
  },
  {
    id: 'test-3',
    title: 'Ticket com campos de compatibilidade',
    channel: 'whatsapp',
    nunmsg: null,
    client_phone: '+5511777665544',
    customerPhone: '+5511777665544',
    metadata: {
      client_name: 'Pedro Costa'
    }
  },
  {
    id: 'test-4',
    title: 'Ticket com anonymous_contact objeto',
    channel: 'whatsapp',
    nunmsg: null,
    metadata: {
      anonymous_contact: {
        name: 'Ana Oliveira',
        phone: '+5511666554433'
      }
    }
  },
  {
    id: 'test-5',
    title: 'Ticket sem telefone',
    channel: 'email',
    nunmsg: null,
    metadata: {
      client_name: 'Cliente Sem Telefone'
    }
  }
];

/**
 * Função para extrair telefone (simulação da função do hook)
 */
function extractPhoneFromTicket(ticket: any): string | null {
  console.log('📱 [TESTE] Extraindo telefone do ticket:', ticket.id);
  
  if (!ticket) {
    return null;
  }

  // 🎯 PRIORIDADE 1: Campo nunmsg
  if (ticket.nunmsg) {
    console.log('✅ [TESTE] Telefone encontrado no campo nunmsg:', ticket.nunmsg);
    return ticket.nunmsg;
  }

  // 🎯 PRIORIDADE 2: Metadados WhatsApp
  const metadata = ticket.metadata || {};
  
  if (metadata.whatsapp_phone) {
    console.log('✅ [TESTE] Telefone encontrado em metadata.whatsapp_phone:', metadata.whatsapp_phone);
    return metadata.whatsapp_phone;
  }

  if (metadata.client_phone) {
    console.log('✅ [TESTE] Telefone encontrado em metadata.client_phone:', metadata.client_phone);
    return metadata.client_phone;
  }

  // 🎯 PRIORIDADE 3: Campos de compatibilidade
  if (ticket.client_phone) {
    console.log('✅ [TESTE] Telefone encontrado em ticket.client_phone:', ticket.client_phone);
    return ticket.client_phone;
  }

  if (ticket.customerPhone) {
    console.log('✅ [TESTE] Telefone encontrado em ticket.customerPhone:', ticket.customerPhone);
    return ticket.customerPhone;
  }

  // 🎯 PRIORIDADE 4: Anonymous contact objeto
  if (metadata.anonymous_contact && typeof metadata.anonymous_contact === 'object') {
    const phone = metadata.anonymous_contact.phone;
    if (phone) {
      console.log('✅ [TESTE] Telefone encontrado em metadata.anonymous_contact.phone:', phone);
      return phone;
    }
  }

  console.warn('⚠️ [TESTE] Nenhum telefone encontrado no ticket:', ticket.id);
  return null;
}

/**
 * Executar testes de extração de telefone
 */
export function testPhoneExtraction() {
  console.log('\n🧪 === INICIANDO TESTES DE EXTRAÇÃO DE TELEFONE ===\n');
  
  const results = testTickets.map(ticket => {
    const phone = extractPhoneFromTicket(ticket);
    
    return {
      ticketId: ticket.id,
      title: ticket.title,
      extractedPhone: phone,
      hasNunmsg: !!ticket.nunmsg,
      source: phone === ticket.nunmsg ? 'nunmsg' : 
              phone === ticket.metadata?.whatsapp_phone ? 'metadata.whatsapp_phone' :
              phone === ticket.metadata?.client_phone ? 'metadata.client_phone' :
              phone === ticket.client_phone ? 'client_phone' :
              phone === ticket.customerPhone ? 'customerPhone' :
              phone === ticket.metadata?.anonymous_contact?.phone ? 'anonymous_contact.phone' :
              'não encontrado'
    };
  });

  console.log('\n📊 === RESULTADOS DOS TESTES ===\n');
  console.table(results);

  // Estatísticas
  const totalTests = results.length;
  const successfulExtractions = results.filter(r => r.extractedPhone !== null).length;
  const nunmsgUsed = results.filter(r => r.source === 'nunmsg').length;
  
  console.log('\n📈 === ESTATÍSTICAS ===');
  console.log(`Total de testes: ${totalTests}`);
  console.log(`Extrações bem-sucedidas: ${successfulExtractions}/${totalTests}`);
  console.log(`Utilizou campo nunmsg: ${nunmsgUsed} testes`);
  console.log(`Taxa de sucesso: ${((successfulExtractions / totalTests) * 100).toFixed(1)}%`);
  
  return results;
}

/**
 * Testar criação de ticket com nunmsg no banco real
 */
export async function testCreateTicketWithNunmsg() {
  console.log('\n🧪 === TESTANDO CRIAÇÃO DE TICKET COM NUNMSG ===\n');
  
  try {
    const testTicketData = {
      title: 'Teste Integração nunmsg',
      description: 'Ticket criado para testar integração do campo nunmsg',
      status: 'open',
      priority: 'medium',
      channel: 'whatsapp',
      nunmsg: '+5511999887766', // 📱 CAMPO PRINCIPAL
      metadata: {
        test_integration: true,
        client_name: 'Cliente Teste nunmsg',
        created_via: 'test_script',
        test_timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Criando ticket com dados:', {
      title: testTicketData.title,
      nunmsg: testTicketData.nunmsg,
      channel: testTicketData.channel
    });

    const { data, error } = await supabase
      .from('tickets')
      .insert([testTicketData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket:', error);
      return { success: false, error };
    }

    console.log('✅ Ticket criado com sucesso:', {
      id: data.id,
      nunmsg: data.nunmsg,
      channel: data.channel
    });

    // Testar extração do telefone do ticket criado
    const extractedPhone = extractPhoneFromTicket(data);
    
    console.log('📱 Telefone extraído do ticket criado:', extractedPhone);
    console.log('✅ Campo nunmsg funcionando:', extractedPhone === testTicketData.nunmsg);

    return { 
      success: true, 
      ticket: data, 
      extractedPhone,
      nunmsgWorking: extractedPhone === testTicketData.nunmsg
    };

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error };
  }
}

/**
 * Limpar tickets de teste
 */
export async function cleanupTestTickets() {
  console.log('\n🧹 === LIMPANDO TICKETS DE TESTE ===\n');
  
  try {
    const { data, error } = await supabase
      .from('tickets')
      .delete()
      .eq('metadata->>test_integration', 'true')
      .select();

    if (error) {
      console.error('❌ Erro ao limpar tickets:', error);
      return { success: false, error };
    }

    console.log(`✅ ${data?.length || 0} tickets de teste removidos`);
    return { success: true, removed: data?.length || 0 };

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return { success: false, error };
  }
}

// Adicionar funções ao objeto global para uso no console
if (typeof window !== 'undefined') {
  (window as any).testPhoneExtraction = testPhoneExtraction;
  (window as any).testCreateTicketWithNunmsg = testCreateTicketWithNunmsg;
  (window as any).cleanupTestTickets = cleanupTestTickets;
  
  console.log('\n🔧 === FUNÇÕES DE TESTE DISPONÍVEIS NO CONSOLE ===');
  console.log('- testPhoneExtraction() // Testar extração de telefone');
  console.log('- testCreateTicketWithNunmsg() // Criar ticket com nunmsg');
  console.log('- cleanupTestTickets() // Limpar tickets de teste');
} 