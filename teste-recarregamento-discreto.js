// 🧪 Script de Teste - Recarregamento Discreto
// Execute este script no console do navegador para testar as melhorias

console.log('🎯 Testando melhorias de recarregamento discreto...');

// Função para simular polling discreto
function testarPollingDiscreto() {
  console.log('🔄 Testando polling discreto...');
  
  // Verificar se o modal está aberto
  const modal = document.querySelector('[data-testid="unified-chat-modal"]') || 
                document.querySelector('.chat-modal');
  
  if (!modal) {
    console.log('❌ Modal de chat não encontrado. Abra um chat primeiro.');
    return;
  }
  
  console.log('✅ Modal encontrado, verificando indicadores...');
  
  // Verificar indicadores de atualização
  const indicadorAtualizacao = modal.querySelector('.bg-blue-500.animate-pulse');
  const indicadorTexto = modal.querySelector('.text-xs.text-gray-600');
  
  if (indicadorAtualizacao) {
    console.log('✅ Indicador de atualização encontrado');
  } else {
    console.log('ℹ️ Indicador de atualização não está visível (normal durante polling)');
  }
  
  if (indicadorTexto && indicadorTexto.textContent?.includes('Atualizando')) {
    console.log('✅ Texto "Atualizando..." encontrado');
  }
  
  console.log('📊 Aguarde 3-5 segundos para ver o polling em ação...');
}

// Função para testar transições suaves
function testarTransicoesSuaves() {
  console.log('🎨 Testando transições suaves...');
  
  const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]') ||
                    document.querySelector('.scroll-area');
  
  if (scrollArea) {
    console.log('✅ Área de scroll encontrada');
    
    // Verificar se tem transições CSS
    const computedStyle = window.getComputedStyle(scrollArea);
    const transition = computedStyle.transition;
    
    if (transition && transition.includes('opacity')) {
      console.log('✅ Transições de opacity configuradas:', transition);
    } else {
      console.log('⚠️ Transições não encontradas');
    }
  } else {
    console.log('❌ Área de scroll não encontrada');
  }
}

// Função para testar animações de novas mensagens
function testarAnimacoesMensagens() {
  console.log('✨ Testando animações de mensagens...');
  
  const mensagens = document.querySelectorAll('[data-message-bubble]') ||
                   document.querySelectorAll('.message-bubble');
  
  if (mensagens.length > 0) {
    console.log(`✅ ${mensagens.length} mensagens encontradas`);
    
    // Verificar se mensagens têm classes de animação
    const mensagensComAnimacao = Array.from(mensagens).filter(msg => 
      msg.classList.contains('animate-in') || 
      msg.classList.contains('slide-in-from-bottom-2') ||
      msg.classList.contains('fade-in-0')
    );
    
    if (mensagensComAnimacao.length > 0) {
      console.log(`✅ ${mensagensComAnimacao.length} mensagens com animações`);
    } else {
      console.log('ℹ️ Mensagens sem animações (normal se não são novas)');
    }
  } else {
    console.log('ℹ️ Nenhuma mensagem encontrada (normal se chat vazio)');
  }
}

// Função para testar scroll inteligente
function testarScrollInteligente() {
  console.log('📜 Testando scroll inteligente...');
  
  const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]') ||
                    document.querySelector('.scroll-area');
  
  if (scrollArea) {
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    console.log(`📊 Posição do scroll: ${scrollTop}/${scrollHeight} (${clientHeight}px visível)`);
    console.log(`📍 Próximo do final: ${isNearBottom ? 'Sim' : 'Não'}`);
    
    // Verificar botão de scroll para baixo
    const botaoScroll = document.querySelector('[data-scroll-to-bottom]') ||
                       document.querySelector('.scroll-to-bottom-button');
    
    if (botaoScroll) {
      console.log('✅ Botão de scroll para baixo encontrado');
    } else if (!isNearBottom) {
      console.log('ℹ️ Botão de scroll não visível (normal se próximo do final)');
    }
  }
}

// Função para testar indicadores de última atualização
function testarIndicadoresAtualizacao() {
  console.log('🕒 Testando indicadores de última atualização...');
  
  const indicadorTempo = document.querySelector('.text-xs.text-gray-400');
  
  if (indicadorTempo && indicadorTempo.textContent?.includes('Última atualização')) {
    console.log('✅ Indicador de última atualização encontrado');
    console.log('📝 Texto:', indicadorTempo.textContent);
  } else {
    console.log('ℹ️ Indicador de última atualização não visível (normal se não houve atualizações)');
  }
}

// Função para simular nova mensagem
function simularNovaMensagem() {
  console.log('📨 Simulando nova mensagem...');
  
  // Tentar encontrar área de mensagens
  const areaMensagens = document.querySelector('.space-y-3.py-4') ||
                       document.querySelector('[data-messages-area]');
  
  if (areaMensagens) {
    console.log('✅ Área de mensagens encontrada');
    console.log('💡 Para testar animações, aguarde uma nova mensagem real ou simule via WebSocket');
  } else {
    console.log('❌ Área de mensagens não encontrada');
  }
}

// Função principal de teste
function executarTesteCompleto() {
  console.log('🚀 Iniciando teste completo de recarregamento discreto...\n');
  
  testarPollingDiscreto();
  console.log('');
  
  testarTransicoesSuaves();
  console.log('');
  
  testarAnimacoesMensagens();
  console.log('');
  
  testarScrollInteligente();
  console.log('');
  
  testarIndicadoresAtualizacao();
  console.log('');
  
  simularNovaMensagem();
  console.log('');
  
  console.log('✅ Teste completo finalizado!');
  console.log('💡 Dicas:');
  console.log('   - Aguarde 3-5s para ver o polling discreto');
  console.log('   - Scroll para cima para ver o botão de scroll para baixo');
  console.log('   - Envie uma mensagem para testar animações');
  console.log('   - Observe os indicadores sutis durante atualizações');
}

// Função para monitorar mudanças em tempo real
function monitorarMudancas() {
  console.log('👀 Iniciando monitoramento de mudanças...');
  
  let contadorMudancas = 0;
  
  // Observer para mudanças no DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        contadorMudancas++;
        console.log(`🔄 Mudança #${contadorMudancas} detectada:`, {
          tipo: 'DOM',
          timestamp: new Date().toLocaleTimeString(),
          nodes: mutation.addedNodes.length + ' adicionados, ' + mutation.removedNodes.length + ' removidos'
        });
      }
    });
  });
  
  const modal = document.querySelector('[data-testid="unified-chat-modal"]') || 
                document.querySelector('.chat-modal');
  
  if (modal) {
    observer.observe(modal, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    console.log('✅ Monitoramento ativo. Pressione Ctrl+C para parar.');
    
    // Parar após 30 segundos
    setTimeout(() => {
      observer.disconnect();
      console.log('⏰ Monitoramento finalizado após 30 segundos');
    }, 30000);
  } else {
    console.log('❌ Modal não encontrado para monitoramento');
  }
}

// Expor funções globalmente
window.testarRecarregamentoDiscreto = {
  executarTesteCompleto,
  testarPollingDiscreto,
  testarTransicoesSuaves,
  testarAnimacoesMensagens,
  testarScrollInteligente,
  testarIndicadoresAtualizacao,
  simularNovaMensagem,
  monitorarMudancas
};

console.log('🎯 Funções de teste disponíveis:');
console.log('   window.testarRecarregamentoDiscreto.executarTesteCompleto()');
console.log('   window.testarRecarregamentoDiscreto.monitorarMudancas()');
console.log('   window.testarRecarregamentoDiscreto.testarPollingDiscreto()');
console.log('   // ... e outras funções individuais');

// Executar teste automático se modal estiver aberto
setTimeout(() => {
  const modal = document.querySelector('[data-testid="unified-chat-modal"]') || 
                document.querySelector('.chat-modal');
  
  if (modal) {
    console.log('🎯 Modal detectado! Executando teste automático...');
    executarTesteCompleto();
  } else {
    console.log('💡 Abra um chat para executar o teste automático');
  }
}, 1000); 