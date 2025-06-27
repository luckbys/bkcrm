/**
 * 🎭 Fix Modal Transparency
 * Utilitário para corrigir modais transparentes em tempo real
 */

export function fixModalTransparency() {
  console.log('🎭 [Modal Fix] Iniciando correção de modais transparentes...');
  
  // Selecionar todos os elementos de modal possíveis
  const modalSelectors = [
    '[data-radix-dialog-content]',
    '[role="dialog"]',
    '.dialog-content',
    '.modal-content',
    '[data-state="open"][role="dialog"]',
    '.max-w-md[role="dialog"]',
    '.max-w-lg[role="dialog"]',
    '.max-w-2xl[role="dialog"]',
    '.max-w-3xl[role="dialog"]',
    '.bg-white\\/95'
  ];
  
  modalSelectors.forEach(selector => {
    const modals = document.querySelectorAll(selector);
    modals.forEach((modal: Element) => {
      const element = modal as HTMLElement;
      
      // Aplicar estilos forçados
      element.style.setProperty('background', 'white', 'important');
      element.style.setProperty('background-color', 'white', 'important');
      element.style.setProperty('opacity', '1', 'important');
      element.style.setProperty('border', '1px solid #e5e7eb', 'important');
      element.style.setProperty('border-radius', '8px', 'important');
      element.style.setProperty('box-shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 'important');
      element.style.setProperty('z-index', '50', 'important');
      element.style.setProperty('backdrop-filter', 'none', 'important');
      element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      element.style.setProperty('color', '#000', 'important');
      
      console.log(`✅ [Modal Fix] Modal corrigido:`, selector);
    });
  });
  
  // Corrigir overlay
  const overlaySelectors = [
    '[data-radix-dialog-overlay]',
    '[data-radix-overlay]'
  ];
  
  overlaySelectors.forEach(selector => {
    const overlays = document.querySelectorAll(selector);
    overlays.forEach((overlay: Element) => {
      const element = overlay as HTMLElement;
      element.style.setProperty('background', 'rgba(0, 0, 0, 0.8)', 'important');
      element.style.setProperty('background-color', 'rgba(0, 0, 0, 0.8)', 'important');
      element.style.setProperty('z-index', '40', 'important');
      element.style.setProperty('backdrop-filter', 'blur(4px)', 'important');
    });
  });
  
  console.log('✅ [Modal Fix] Correção concluída!');
}

export function watchModalTransparency() {
  console.log('👁️ [Modal Watch] Iniciando monitoramento de modais...');
  
  // Observer para novos modais
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Verificar se é um modal
          if (
            element.matches('[data-radix-dialog-content]') ||
            element.matches('[role="dialog"]') ||
            element.querySelector('[data-radix-dialog-content]') ||
            element.querySelector('[role="dialog"]')
          ) {
            console.log('🆕 [Modal Watch] Novo modal detectado, aplicando correções...');
            setTimeout(() => fixModalTransparency(), 100);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Aplicar correção inicial
  fixModalTransparency();
  
  return observer;
}

export function forceModalVisibility() {
  console.log('💪 [Force Modal] Forçando visibilidade de todos os modais...');
  
  // CSS dinâmico para forçar visibilidade
  const style = document.createElement('style');
  style.id = 'force-modal-visibility';
  style.textContent = `
    /* Força absoluta para modais visíveis */
    [data-radix-dialog-content],
    [role="dialog"],
    .dialog-content,
    .modal-content,
    [data-state="open"][role="dialog"],
    .max-w-md[role="dialog"],
    .max-w-lg[role="dialog"],
    .max-w-2xl[role="dialog"],
    .max-w-3xl[role="dialog"],
    .bg-white\\/95 {
      background: white !important;
      background-color: white !important;
      opacity: 1 !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 8px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      z-index: 50 !important;
      color: #000 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    [data-radix-dialog-overlay],
    [data-radix-overlay] {
      background: rgba(0, 0, 0, 0.8) !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      z-index: 40 !important;
      backdrop-filter: blur(4px) !important;
    }
    
    /* Correções específicas para portais */
    [data-radix-portal] > div > div[role="dialog"] {
      background: white !important;
      background-color: white !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 8px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    }
    
    /* Remover transparências indesejadas */
    [data-radix-dialog-content] * {
      background: transparent !important;
    }
    
    [data-radix-dialog-content] > div {
      background: white !important;
    }
    
    /* Força para casos extremos */
    div[role="dialog"],
    div[data-radix-dialog-content] {
      background: white !important;
      background-color: white !important;
      color: #000 !important;
    }
  `;
  
  // Remover estilo anterior se existir
  const existing = document.getElementById('force-modal-visibility');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(style);
  console.log('✅ [Force Modal] CSS de força aplicado!');
}

// Nova função para aplicação automática contínua
export function enableContinuousModalFix() {
  console.log('🔄 [Continuous Fix] Habilitando correção contínua de modais...');
  
  // Aplicar correção inicial
  forceModalVisibility();
  fixModalTransparency();
  
  // Aplicar correção a cada 2 segundos
  const interval = setInterval(() => {
    const modals = document.querySelectorAll('[role="dialog"], [data-radix-dialog-content]');
    if (modals.length > 0) {
      fixModalTransparency();
    }
  }, 2000);
  
  // Iniciar observador
  const observer = watchModalTransparency();
  
  console.log('✅ [Continuous Fix] Correção contínua ativa!');
  
  return {
    interval,
    observer,
    stop: () => {
      clearInterval(interval);
      observer.disconnect();
      console.log('🛑 [Continuous Fix] Correção contínua parada');
    }
  };
}

// Função para diagnosticar modais problemáticos
export function diagnoseModalIssues() {
  console.log('🔍 [Modal Diagnose] Diagnosticando problemas de modais...');
  
  const modals = document.querySelectorAll('[role="dialog"], [data-radix-dialog-content]');
  const problematicModals: { element: HTMLElement; issues: string[] }[] = [];
  
  modals.forEach((modal) => {
    const element = modal as HTMLElement;
    const issues: string[] = [];
    
    const computedStyle = window.getComputedStyle(element);
    
    // Verificar background
    if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyle.backgroundColor === 'transparent') {
      issues.push('Background transparente');
    }
    
    // Verificar opacity
    if (parseFloat(computedStyle.opacity) < 1) {
      issues.push(`Opacity baixa: ${computedStyle.opacity}`);
    }
    
    // Verificar z-index
    if (parseInt(computedStyle.zIndex) < 40) {
      issues.push(`Z-index baixo: ${computedStyle.zIndex}`);
    }
    
    // Verificar visibility
    if (computedStyle.visibility === 'hidden') {
      issues.push('Visibility hidden');
    }
    
    if (issues.length > 0) {
      problematicModals.push({ element, issues });
    }
  });
  
  if (problematicModals.length > 0) {
    console.log(`❌ [Modal Diagnose] Encontrados ${problematicModals.length} modais problemáticos:`);
    problematicModals.forEach((modal, index) => {
      console.log(`  ${index + 1}. Modal:`, modal.element);
      console.log(`     Problemas: ${modal.issues.join(', ')}`);
    });
    
    // Aplicar correções automáticas
    console.log('🔧 [Modal Diagnose] Aplicando correções automáticas...');
    fixModalTransparency();
    
    return problematicModals;
  } else {
    console.log('✅ [Modal Diagnose] Nenhum problema encontrado nos modais');
    return [];
  }
}

// Expor funções globalmente para debug
declare global {
  interface Window {
    fixModalTransparency: typeof fixModalTransparency;
    watchModalTransparency: typeof watchModalTransparency;
    forceModalVisibility: typeof forceModalVisibility;
    enableContinuousModalFix: typeof enableContinuousModalFix;
    diagnoseModalIssues: typeof diagnoseModalIssues;
  }
}

if (typeof window !== 'undefined') {
  window.fixModalTransparency = fixModalTransparency;
  window.watchModalTransparency = watchModalTransparency;
  window.forceModalVisibility = forceModalVisibility;
  window.enableContinuousModalFix = enableContinuousModalFix;
  window.diagnoseModalIssues = diagnoseModalIssues;
} 