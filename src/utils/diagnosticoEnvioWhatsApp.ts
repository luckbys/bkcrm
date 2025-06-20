// DIAGNÓSTICO DE ENVIO WHATSAPP - FRONTEND
// Execute no console: await diagnosticoEnvioWhatsApp("SEU_NUMERO_REAL")

/**
 * Diagnóstico completo do sistema de envio WhatsApp
 * Para usar: digite diagnosticoEnvioWhatsApp() no console do navegador
 */

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

// Detectar ambiente automaticamente
const WEBHOOK_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000'  // Local
  : 'https://bkcrm.devsible.com.br'; // Produção

export async function diagnosticoEnvioWhatsApp(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('🔍 Iniciando diagnóstico completo do sistema WhatsApp...');

  // 1. Verificar health do webhook
  try {
    const healthResponse = await fetch(`${WEBHOOK_BASE_URL}/webhook/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      results.push({
        step: '1. Health Check Webhook',
        status: 'success',
        message: 'Webhook está funcionando',
        details: healthData
      });
    } else {
      results.push({
        step: '1. Health Check Webhook',
        status: 'error',
        message: 'Webhook com problemas',
        details: healthData
      });
    }
  } catch (error) {
    results.push({
      step: '1. Health Check Webhook',
      status: 'error',
      message: 'Webhook inacessível',
      details: error
    });
  }

  // 2. Verificar instância Evolution API
  try {
    const instanceResponse = await fetch(`${WEBHOOK_BASE_URL}/webhook/check-instance/atendimento-ao-cliente-suporte`);
    const instanceData = await instanceResponse.json();
    
    if (instanceResponse.ok && instanceData.connectionStatus === 'open') {
      results.push({
        step: '2. Instância Evolution API',
        status: 'success',
        message: 'Instância conectada e ativa',
        details: instanceData
      });
    } else {
      results.push({
        step: '2. Instância Evolution API',
        status: 'error',
        message: 'Instância com problemas',
        details: instanceData
      });
    }
  } catch (error) {
    results.push({
      step: '2. Instância Evolution API',
      status: 'error',
      message: 'Erro ao verificar instância',
      details: error
    });
  }

  // 3. Testar envio com número fictício (deve dar erro esperado)
  try {
    const testResponse = await fetch(`${WEBHOOK_BASE_URL}/webhook/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '5511999999999',
        text: 'Teste de diagnóstico',
        instance: 'atendimento-ao-cliente-suporte'
      })
    });
    
    const testData = await testResponse.json();
    
    if (!testData.success && testData.details?.response?.message?.[0]?.exists === false) {
      results.push({
        step: '3. Teste com Número Fictício',
        status: 'success',
        message: 'Sistema funcionando - corretamente rejeitou número inexistente',
        details: testData
      });
    } else if (testData.success) {
      results.push({
        step: '3. Teste com Número Fictício',
        status: 'warning',
        message: 'Inesperado: envio para número fictício foi aceito',
        details: testData
      });
    } else {
      results.push({
        step: '3. Teste com Número Fictício',
        status: 'error',
        message: 'Erro inesperado no teste',
        details: testData
      });
    }
  } catch (error) {
    results.push({
      step: '3. Teste com Número Fictício',
      status: 'error',
      message: 'Erro na requisição de teste',
      details: error
    });
  }

  // 4. Verificar tickets WhatsApp no sistema
  try {
    // Buscar tickets WhatsApp ativos no localStorage ou estado atual
    const ticketsWhatsApp = Object.keys(localStorage)
      .filter(key => key.includes('ticket') || key.includes('chat'))
      .map(key => {
        try {
          return { key, data: JSON.parse(localStorage.getItem(key) || '{}') };
        } catch {
          return { key, data: null };
        }
      })
      .filter(item => item.data && 
        (item.data.channel === 'whatsapp' || 
         item.data.isWhatsApp || 
         item.data.metadata?.whatsapp_phone ||
         item.data.nunmsg)
      );

    if (ticketsWhatsApp.length > 0) {
      results.push({
        step: '4. Tickets WhatsApp Disponíveis',
        status: 'success',
        message: `Encontrados ${ticketsWhatsApp.length} tickets WhatsApp`,
        details: ticketsWhatsApp.map(t => ({
          key: t.key,
          phone: t.data.nunmsg || t.data.metadata?.whatsapp_phone || t.data.customerPhone,
          client: t.data.client || t.data.metadata?.client_name
        }))
      });
    } else {
      results.push({
        step: '4. Tickets WhatsApp Disponíveis',
        status: 'warning',
        message: 'Nenhum ticket WhatsApp encontrado no cache local',
        details: null
      });
    }
  } catch (error) {
    results.push({
      step: '4. Tickets WhatsApp Disponíveis',
      status: 'error',
      message: 'Erro ao verificar tickets',
      details: error
    });
  }

  // Mostrar resultados
  console.log('\n📊 RESULTADOS DO DIAGNÓSTICO:');
  console.log('================================');
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log('   Detalhes:', result.details);
    }
  });

  console.log('\n💡 RESUMO:');
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`⚠️ Avisos: ${warningCount}`);
  console.log(`❌ Erros: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE!');
    console.log('Para testar envio real, use um número WhatsApp válido.');
  } else {
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    results.filter(r => r.status === 'error').forEach(result => {
      console.log(`- ${result.step}: ${result.message}`);
    });
  }

  return results;
}

// Função para testar envio com número real
export async function testarEnvioWhatsAppReal(telefone: string, mensagem: string = 'Teste do sistema BKCRM'): Promise<any> {
  console.log(`📱 Testando envio para número real: ${telefone}`);
  
  try {
    const response = await fetch(`${WEBHOOK_BASE_URL}/webhook/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: telefone,
        text: mensagem,
        instance: 'atendimento-ao-cliente-suporte'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📤 ID da mensagem:', result.messageId);
    } else {
      console.log('❌ Falha no envio:', result.error);
      console.log('📋 Detalhes:', result.details);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return { success: false, error: error.message };
  }
}

// Função para testar envio com dados de um ticket
export async function testarEnvioComTicket(ticket: any) {
  console.log('🎫 Testando envio com dados do ticket:', ticket.id);
  
  // Extrair telefone do ticket
  let telefone = null;
  
  if (ticket.metadata?.whatsapp_phone) {
    telefone = ticket.metadata.whatsapp_phone;
  } else if (ticket.metadata?.client_phone) {
    telefone = ticket.metadata.client_phone;
  } else if (ticket.client_phone) {
    telefone = ticket.client_phone;
  } else if (ticket.customerPhone) {
    telefone = ticket.customerPhone;
  }
  
  if (!telefone) {
    console.log('❌ Ticket não tem telefone WhatsApp identificado');
    console.log('📋 Metadados do ticket:', ticket.metadata);
    return { success: false, error: 'Telefone não encontrado no ticket' };
  }
  
  console.log(`📱 Telefone extraído do ticket: ${telefone}`);
  
  // Testar envio
  return await diagnosticoEnvioWhatsApp(telefone);
}

// Verificar se ticket é WhatsApp
export function isTicketWhatsApp(ticket: any): boolean {
  const hasWhatsApp = Boolean(
    ticket.channel === 'whatsapp' ||
    ticket.metadata?.is_whatsapp ||
    ticket.metadata?.whatsapp_phone ||
    ticket.metadata?.instance_name ||
    ticket.isWhatsApp
  );
  
  console.log('🔍 Verificação WhatsApp:', {
    ticketId: ticket.id,
    channel: ticket.channel,
    isWhatsApp: hasWhatsApp,
    metadata: ticket.metadata
  });
  
  return hasWhatsApp;
}

// Disponibilizar globalmente para uso no console
declare global {
  interface Window {
    diagnosticoEnvioWhatsApp: typeof diagnosticoEnvioWhatsApp;
    testarEnvioWhatsAppReal: typeof testarEnvioWhatsAppReal;
  }
}

window.diagnosticoEnvioWhatsApp = diagnosticoEnvioWhatsApp;
window.testarEnvioWhatsAppReal = testarEnvioWhatsAppReal;

console.log('🔧 Funções de diagnóstico carregadas:');
console.log('   - diagnosticoEnvioWhatsApp() - Diagnóstico completo');
console.log('   - testarEnvioWhatsAppReal("5511999998888", "Sua mensagem") - Teste com número real');

// Tornar funções globais para uso no console
if (typeof window !== 'undefined') {
  (window as any).diagnosticoEnvioWhatsApp = diagnosticoEnvioWhatsApp;
  (window as any).testarEnvioComTicket = testarEnvioComTicket;
  (window as any).isTicketWhatsApp = isTicketWhatsApp;
  
  console.log('🔧 Funções de diagnóstico disponíveis no console:');
  console.log('- diagnosticoEnvioWhatsApp()');
  console.log('- testarEnvioComTicket(ticket)');
  console.log('- isTicketWhatsApp(ticket)');
} 