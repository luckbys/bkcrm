// DIAGNÓSTICO DE ENVIO WHATSAPP - FRONTEND
// Execute no console: await diagnosticoEnvioWhatsApp("SEU_NUMERO_REAL")

export async function diagnosticoEnvioWhatsApp(telefone?: string) {
  console.log('🔍 === DIAGNÓSTICO ENVIO WHATSAPP - FRONTEND ===\n');
  
  // Detectar ambiente
  const WEBHOOK_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000'
    : 'https://bkcrm.devsible.com.br';
    
  console.log(`🌐 Ambiente detectado: ${WEBHOOK_BASE_URL}`);
  
  // Usar número padrão se não fornecido
  const numeroTeste = telefone || prompt('Digite um número de WhatsApp REAL para teste (ex: 5511999998888):');
  
  if (!numeroTeste) {
    console.log('❌ Número não fornecido. Cancelando diagnóstico.');
    return;
  }
  
  console.log(`📱 Testando com número: ${numeroTeste}\n`);
  
  try {
    // 1. Verificar servidor webhook
    console.log('1️⃣ Testando conexão com webhook server...');
    const healthResponse = await fetch(`${WEBHOOK_BASE_URL}/webhook/health`);
    
    if (!healthResponse.ok) {
      console.log('❌ Webhook server não está respondendo');
      console.log('💡 Verifique se o servidor está rodando na porta 4000');
      return;
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Webhook server OK:', healthData.status, healthData.version);
    
    // 2. Verificar instância Evolution
    console.log('\n2️⃣ Verificando instância Evolution API...');
    const instanceResponse = await fetch(`${WEBHOOK_BASE_URL}/webhook/check-instance/atendimento-ao-cliente-suporte`);
    
    if (instanceResponse.ok) {
      const instanceData = await instanceResponse.json();
      console.log(`✅ Instância: ${instanceData.instance}, Status: ${instanceData.state}`);
      
      if (instanceData.state !== 'open') {
        console.log('⚠️ Instância não está conectada! Verifique o QR Code.');
      }
    } else {
      console.log('❌ Erro ao verificar instância');
    }
    
    // 3. Testar envio
    console.log('\n3️⃣ Testando envio de mensagem...');
    
    const payload = {
      phone: numeroTeste,
      text: `🧪 Teste de diagnóstico - ${new Date().toLocaleString()}`,
      instance: 'atendimento-ao-cliente-suporte',
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: false
      }
    };
    
    console.log('📤 Payload enviado:', payload);
    
    const sendResponse = await fetch(`${WEBHOOK_BASE_URL}/webhook/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await sendResponse.json();
    
    console.log(`📊 Resposta (${sendResponse.status}):`, result);
    
    if (result.success) {
      console.log('🎉 SUCESSO! Mensagem enviada para o WhatsApp!');
      console.log(`📱 Message ID: ${result.messageId || result.result?.key?.id}`);
      
      // Mostrar notificação de sucesso
      if (typeof window !== 'undefined' && 'alert' in window) {
        alert('✅ Mensagem enviada com sucesso para o WhatsApp! Verifique o número testado.');
      }
      
      return { success: true, messageId: result.messageId };
      
    } else {
      console.log('❌ FALHA no envio:');
      console.log(`   Erro: ${result.error}`);
      
      // Verificar se é erro de número inexistente
      if (result.details?.response?.message && Array.isArray(result.details.response.message)) {
        const numberCheck = result.details.response.message.find((m: any) => m.hasOwnProperty('exists'));
        if (numberCheck && !numberCheck.exists) {
          console.log('🚨 PROBLEMA: Número não tem WhatsApp ativo!');
          console.log(`   O número ${numberCheck.number} não existe no WhatsApp.`);
          console.log('💡 Teste com um número que realmente usa WhatsApp.');
          
          if (typeof window !== 'undefined' && 'alert' in window) {
            alert(`❌ O número ${numeroTeste} não tem WhatsApp ativo. Teste com um número real.`);
          }
        }
      }
      
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
    
    if (typeof window !== 'undefined' && 'alert' in window) {
      alert(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
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

// Tornar funções globais para uso no console
if (typeof window !== 'undefined') {
  (window as any).diagnosticoEnvioWhatsApp = diagnosticoEnvioWhatsApp;
  (window as any).testarEnvioComTicket = testarEnvioComTicket;
  (window as any).isTicketWhatsApp = isTicketWhatsApp;
  
  console.log('🔧 Funções de diagnóstico disponíveis no console:');
  console.log('- diagnosticoEnvioWhatsApp("5511999998888")');
  console.log('- testarEnvioComTicket(ticket)');
  console.log('- isTicketWhatsApp(ticket)');
} 