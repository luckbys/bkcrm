// 🔧 CORREÇÃO DE SCROLL E VISUALIZAÇÃO
console.log('🔧 Script de correção de scroll carregado!');

window.fixChatVisibility = {
  // Forçar scroll para baixo
  scrollToBottom: () => {
    console.log('📜 Forçando scroll para baixo...');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) {
      console.log('❌ Modal não encontrado');
      return;
    }
    
    // Encontrar todos os containers scrolláveis
    const scrollContainers = modal.querySelectorAll('[class*="scroll"], [class*="overflow"], .space-y-3');
    console.log(`📦 Containers scrolláveis encontrados: ${scrollContainers.length}`);
    
    scrollContainers.forEach((container, i) => {
      console.log(`📜 Scrolling container ${i + 1}...`);
      container.scrollTop = container.scrollHeight;
    });
    
    // Scroll no próprio modal
    modal.scrollTop = modal.scrollHeight;
    
    // Scroll na janela também
    window.scrollTo(0, document.body.scrollHeight);
  },

  // Verificar altura dos containers
  checkHeights: () => {
    console.log('📏 === VERIFICANDO ALTURAS ===');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;
    
    const messagesArea = modal.querySelector('.space-y-3');
    if (messagesArea) {
      console.log('📦 Área de mensagens:', {
        scrollHeight: messagesArea.scrollHeight,
        clientHeight: messagesArea.clientHeight,
        offsetHeight: messagesArea.offsetHeight,
        scrollTop: messagesArea.scrollTop,
        style: messagesArea.style.cssText
      });
    }
    
    console.log('🖼️ Modal:', {
      scrollHeight: modal.scrollHeight,
      clientHeight: modal.clientHeight,
      offsetHeight: modal.offsetHeight,
      scrollTop: modal.scrollTop
    });
  },

  // Forçar altura mínima
  forceMinHeight: () => {
    console.log('📐 Forçando altura mínima...');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;
    
    const messagesArea = modal.querySelector('.space-y-3');
    if (messagesArea) {
      messagesArea.style.minHeight = '500px';
      messagesArea.style.height = 'auto';
      messagesArea.style.overflow = 'visible';
      console.log('✅ Altura forçada aplicada');
    }
  },

  // Remover estilos que podem esconder
  removeHiddenStyles: () => {
    console.log('👁️ Removendo estilos que podem esconder mensagens...');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;
    
    // Encontrar elementos com visibility hidden ou display none
    const hiddenElements = modal.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], [style*="opacity: 0"]');
    console.log(`🙈 Elementos escondidos encontrados: ${hiddenElements.length}`);
    
    hiddenElements.forEach((el, i) => {
      console.log(`Revelando elemento ${i + 1}:`, el.className);
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
  },

  // Destacar mensagens com borda
  highlightMessages: () => {
    console.log('🎨 Destacando mensagens com bordas...');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;
    
    const messageElements = modal.querySelectorAll('.transition-all');
    console.log(`🎯 Destacando ${messageElements.length} mensagens...`);
    
    messageElements.forEach((el, i) => {
      el.style.border = '2px solid red';
      el.style.margin = '5px';
      el.style.backgroundColor = 'yellow';
      console.log(`Mensagem ${i + 1} destacada`);
    });
  },

  // Correção completa
  fixAll: () => {
    console.log('🚀 === APLICANDO TODAS AS CORREÇÕES ===');
    
    window.fixChatVisibility.checkHeights();
    window.fixChatVisibility.removeHiddenStyles();
    window.fixChatVisibility.forceMinHeight();
    window.fixChatVisibility.scrollToBottom();
    
    // Aguardar e destacar
    setTimeout(() => {
      window.fixChatVisibility.highlightMessages();
      console.log('✅ Todas as correções aplicadas!');
    }, 1000);
  },

  // Mostrar todas as mensagens como lista simples
  listAllMessages: () => {
    console.log('📋 === LISTA DE TODAS AS MENSAGENS ===');
    
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;
    
    const messageElements = modal.querySelectorAll('.transition-all');
    
    messageElements.forEach((el, i) => {
      const content = el.textContent?.replace(/\s+/g, ' ').trim();
      console.log(`${i + 1}. ${content?.substring(0, 100)}...`);
    });
    
    console.log(`📊 Total: ${messageElements.length} mensagens listadas`);
  }
};

// Auto-executar correções
console.log('🎯 Executando correções automáticas em 2 segundos...');
setTimeout(() => {
  window.fixChatVisibility.fixAll();
}, 2000); 