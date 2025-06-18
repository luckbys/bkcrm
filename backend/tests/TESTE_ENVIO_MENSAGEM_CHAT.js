// ========================================
// TESTE: Envio de Mensagem do Chat para WhatsApp
// ========================================

console.log('🧪 TESTE: Simulando envio de mensagem do chat...');

// Simular dados como se viessem do chat do ticket
const testarEnvioMensagem = async () => {
  try {
    console.log('📤 1. Testando endpoint /webhook/send-message...');
    
    const dadosTeste = {
      phone: '5511999887766',
      text: 'Olá! Esta é uma mensagem de teste enviada do CRM para WhatsApp.',
      instance: 'atendimento-ao-cliente-suporte',
      options: {
        delay: 1000,
        presence: 'composing',
        linkPreview: true
      }
    };
    
    console.log('📋 Dados do teste:', {
      phone: dadosTeste.phone,
      text: dadosTeste.text.substring(0, 50) + '...',
      instance: dadosTeste.instance
    });
    
    const response = await fetch('http://localhost:4000/webhook/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosTeste)
    });
    
    const resultado = await response.json();
    
    console.log('📊 Resultado do teste:', {
      status: response.status,
      success: resultado.success,
      messageId: resultado.messageId,
      error: resultado.error
    });
    
    if (resultado.success) {
      console.log('✅ TESTE PASSOU: Mensagem enviada com sucesso!');
      return true;
    } else {
      console.log('❌ TESTE FALHOU: Erro ao enviar mensagem');
      console.log('🔍 Detalhes do erro:', resultado);
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    return false;
  }
};

// Testar configurações da Evolution API
const testarConfiguracoes = async () => {
  try {
    console.log('\\n🔧 2. Testando configurações da Evolution API...');
    
    const response = await fetch('http://localhost:4000/webhook/check-instance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instance: 'atendimento-ao-cliente-suporte'
      })
    });
    
    const resultado = await response.json();
    
    console.log('📊 Status da instância:', {
      connected: resultado.connected,
      success: resultado.success,
      error: resultado.error
    });
    
    return resultado.success && resultado.connected;
    
  } catch (error) {
    console.error('❌ Erro ao verificar instância:', error.message);
    return false;
  }
};

// Executar todos os testes
const executarTestes = async () => {
  console.log('🎯 INICIANDO TESTES DE ENVIO DE MENSAGEM\\n');
  
  const testeConfiguracoes = await testarConfiguracoes();
  const testeEnvio = await testarEnvioMensagem();
  
  console.log('\\n📋 RESUMO DOS TESTES:');
  console.log(`  ✅ Configurações Evolution API: ${testeConfiguracoes ? 'OK' : 'FALHOU'}`);
  console.log(`  ✅ Envio de mensagem: ${testeEnvio ? 'OK' : 'FALHOU'}`);
  
  if (testeConfiguracoes && testeEnvio) {
    console.log('\\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O sistema está funcionando corretamente.');
    console.log('\\n💡 Se ainda não está funcionando no frontend, verifique:');
    console.log('   1. Se o hook useEvolutionSender está sendo chamado');
    console.log('   2. Se o ticket tem telefone válido do cliente');
    console.log('   3. Se o ticket é marcado como WhatsApp (isWhatsApp: true)');
    console.log('   4. Se a mensagem não é marcada como interna (isInternal: false)');
  } else {
    console.log('\\n❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique as configurações da Evolution API');
  }
};

// Executar
executarTestes(); 