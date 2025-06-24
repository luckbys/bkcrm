// 🔍 DEBUG VISUAL FINAL - Quando dados chegam mas não aparecem
console.log('🎯 Debug Visual Final carregado!');

window.debugVisual = {
  // Verificar se as mensagens estão sendo renderizadas
  checkRendering: () => {
    console.log('🔍 === VERIFICANDO RENDERIZAÇÃO ===');
    
    // 1. Verificar se o modal está aberto
    const modal = document.querySelector('[role="dialog"]');
    console.log('Modal encontrado:', !!modal);
    
    if (!modal) {
      console.log('❌ Modal não está aberto');
      return;
    }
    
    // 2. Verificar área de mensagens
    const messagesArea = document.querySelector('.space-y-3');
    console.log('Área de mensagens encontrada:', !!messagesArea);
    
    if (messagesArea) {
      const messageElements = messagesArea.querySelectorAll('[class*="message"], .transition-all');
      console.log(`📱 Elementos de mensagem na DOM: ${messageElements.length}`);
      
      // Listar primeiros elementos
      messageElements.forEach((el, i) => {
        if (i < 5) { // Mostrar apenas os primeiros 5
          console.log(`Mensagem ${i + 1}:`, {
            textContent: el.textContent?.substring(0, 50),
            classes: el.className,
            children: el.children.length
          });
        }
      });
    }
    
    // 3. Verificar se há loading ou estados vazios
    const loadingElements = modal.querySelectorAll('[class*="loading"], [class*="spinner"]');
    console.log(`⏳ Elementos de loading: ${loadingElements.length}`);
    
    const emptyStates = modal.querySelectorAll('[class*="empty"], .text-center');
    console.log(`📭 Estados vazios: ${emptyStates.length}`);
    
    // 4. Verificar scroll area
    const scrollArea = modal.querySelector('[class*="scroll"]');
    console.log('ScrollArea encontrada:', !!scrollArea);
    
    if (scrollArea) {
      console.log('ScrollArea info:', {
        scrollHeight: scrollArea.scrollHeight,
        clientHeight: scrollArea.clientHeight,
        scrollTop: scrollArea.scrollTop
      });
    }
  },

  // Forçar re-render das mensagens
  forceRerender: () => {
    console.log('🔄 Forçando re-render das mensagens...');
    
    if (window.debugUnifiedChat) {
      console.log('🎯 Usando debugUnifiedChat...');
      return window.debugUnifiedChat();
    }
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      console.log('🔄 Forçando reload via chatStore...');
      state.load('788a5f10-a693-4cfa-8410-ed5cd082e555');
    }
  },

  // Verificar estado React
  checkReactState: () => {
    console.log('⚛️ === VERIFICANDO ESTADO REACT ===');
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      const messages = state.messages['788a5f10-a693-4cfa-8410-ed5cd082e555'] || [];
      
      console.log('Estado do ChatStore:', {
        isConnected: state.isConnected,
        isLoading: state.isLoading,
        totalMessages: messages.length,
        error: state.error,
        firstMessage: messages[0],
        lastMessage: messages[messages.length - 1]
      });
      
      // Verificar se as mensagens têm os campos corretos
      if (messages.length > 0) {
        console.log('🔍 Verificando estrutura das mensagens:');
        messages.slice(0, 3).forEach((msg, i) => {
          console.log(`Mensagem ${i + 1}:`, {
            id: msg.id,
            content: msg.content?.substring(0, 30),
            sender: msg.sender,
            senderName: msg.senderName,
            timestamp: msg.timestamp,
            isInternal: msg.isInternal
          });
        });
      }
    } else {
      console.log('❌ ChatStore não encontrado');
    }
  },

  // Simular clique para expandir mensagens
  expandMessages: () => {
    console.log('📱 Tentando expandir área de mensagens...');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) {
      console.log('❌ Modal não encontrado');
      return;
    }
    
    // Verificar se há botões colapsados
    const expandButtons = modal.querySelectorAll('button[aria-expanded="false"]');
    console.log(`🔍 Botões para expandir: ${expandButtons.length}`);
    
    expandButtons.forEach((btn, i) => {
      console.log(`Clicando botão ${i + 1}...`);
      btn.click();
    });
    
    // Verificar se há scroll para baixo
    const scrollArea = modal.querySelector('[class*="scroll"]');
    if (scrollArea) {
      console.log('📜 Fazendo scroll para baixo...');
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  },

  // Debug completo
  fullDebug: () => {
    console.log('🚀 === DEBUG VISUAL COMPLETO ===');
    window.debugVisual.checkReactState();
    window.debugVisual.checkRendering();
    window.debugVisual.expandMessages();
    
    // Aguardar e verificar novamente
    setTimeout(() => {
      console.log('🔄 === VERIFICAÇÃO APÓS 2 SEGUNDOS ===');
      window.debugVisual.checkRendering();
    }, 2000);
  },

  // Diagnosticar problema específico
  diagnose: () => {
    console.log('🔍 === DIAGNÓSTICO AUTOMÁTICO ===');
    
    const state = window.useChatStore?.getState();
    const modal = document.querySelector('[role="dialog"]');
    
    if (!state) {
      console.log('❌ PROBLEMA: ChatStore não encontrado');
      return 'chatstore-missing';
    }
    
    if (!modal) {
      console.log('❌ PROBLEMA: Modal não está aberto');
      return 'modal-closed';
    }
    
    const messages = state.messages['788a5f10-a693-4cfa-8410-ed5cd082e555'] || [];
    
    if (messages.length === 0) {
      console.log('❌ PROBLEMA: Sem mensagens no estado');
      return 'no-messages';
    }
    
    const messageElements = modal.querySelectorAll('.transition-all');
    
    if (messageElements.length === 0) {
      console.log('❌ PROBLEMA: Mensagens não estão sendo renderizadas na DOM');
      console.log('💡 SOLUÇÃO: Problema de renderização React');
      return 'render-issue';
    }
    
    if (messageElements.length !== messages.length) {
      console.log(`⚠️ PROBLEMA: Descompasso entre estado (${messages.length}) e DOM (${messageElements.length})`);
      return 'state-dom-mismatch';
    }
    
    console.log('✅ DIAGNÓSTICO: Tudo parece estar funcionando');
    console.log('💡 Se não está vendo as mensagens, pode ser problema de CSS/layout');
    return 'css-layout-issue';
  }
};

// Auto-executar diagnóstico
console.log('🎯 Executando diagnóstico automático...');
setTimeout(() => {
  window.debugVisual.fullDebug();
}, 1000); 