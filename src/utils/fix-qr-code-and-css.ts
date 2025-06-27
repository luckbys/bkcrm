// Diagnóstico e Correção de Problemas: QR Code e CSS
// Este arquivo contém funções para diagnosticar e corrigir os problemas identificados

export interface DiagnosticResult {
  component: string;
  issue: string;
  status: 'ok' | 'warning' | 'error';
  fix?: string;
}

export class QRCodeAndCSSFixer {
  
  // Diagnóstico completo dos problemas
  static async runDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // 1. Verificar configuração da Evolution API
    results.push(await this.checkEvolutionAPIConfig());
    
    // 2. Verificar layout do modal
    results.push(this.checkModalLayout());
    
    // 3. Verificar CSS do QR Code
    results.push(this.checkQRCodeCSS());
    
    // 4. Verificar problemas no console
    results.push(this.checkConsoleErrors());
    
    console.group('🔍 DIAGNÓSTICO COMPLETO - QR Code e CSS');
    results.forEach(result => {
      const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.issue}`);
      if (result.fix) {
        console.log(`🔧 Correção: ${result.fix}`);
      }
    });
    console.groupEnd();
    
    return results;
  }
  
  // Verificar configuração da Evolution API
  static async checkEvolutionAPIConfig(): Promise<DiagnosticResult> {
    try {
      const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
      
      if (!evolutionUrl || evolutionUrl === 'http://localhost:8080') {
        return {
          component: 'Evolution API - Config',
          issue: 'URL não configurada ou apontando para localhost',
          status: 'error',
          fix: 'Configure VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host'
        };
      }
      
      if (!apiKey) {
        return {
          component: 'Evolution API - Auth',
          issue: 'API Key não configurada',
          status: 'error',
          fix: 'Configure VITE_EVOLUTION_API_KEY com a chave correta'
        };
      }
      
      // Testar conexão
      const response = await fetch(evolutionUrl, {
        headers: { 'apikey': apiKey }
      });
      
      if (!response.ok) {
        return {
          component: 'Evolution API - Conexão',
          issue: `Falha na conexão: ${response.status}`,
          status: 'error',
          fix: 'Verificar se a Evolution API está online e as credenciais estão corretas'
        };
      }
      
      return {
        component: 'Evolution API',
        issue: 'Configuração OK',
        status: 'ok'
      };
      
    } catch (error: any) {
      return {
        component: 'Evolution API - Teste',
        issue: `Erro na conexão: ${error.message}`,
        status: 'error',
        fix: 'Verificar configuração de rede e CORS'
      };
    }
  }
  
  // Verificar layout do modal
  static checkModalLayout(): DiagnosticResult {
    const modal = document.querySelector('[data-state="open"]');
    
    if (!modal) {
      return {
        component: 'Modal Layout',
        issue: 'Modal não está aberto para diagnóstico',
        status: 'warning',
        fix: 'Abra o modal do WhatsApp para verificar o layout'
      };
    }
    
    const dialogContent = modal.querySelector('.max-w-lg');
    const qrContainer = modal.querySelector('.py-6');
    
    if (!dialogContent) {
      return {
        component: 'Modal - Container',
        issue: 'Container do modal não encontrado',
        status: 'error',
        fix: 'Verificar se DialogContent tem classe max-w-lg'
      };
    }
    
    if (!qrContainer) {
      return {
        component: 'Modal - QR Container',
        issue: 'Container do QR Code não encontrado',
        status: 'error',
        fix: 'Verificar se existe div com classe py-6'
      };
    }
    
    const computedStyle = window.getComputedStyle(dialogContent);
    if (computedStyle.maxWidth === 'none') {
      return {
        component: 'Modal - Responsividade',
        issue: 'Modal sem largura máxima definida',
        status: 'warning',
        fix: 'Aplicar classe max-w-lg ou similar'
      };
    }
    
    return {
      component: 'Modal Layout',
      issue: 'Layout OK',
      status: 'ok'
    };
  }
  
  // Verificar CSS do QR Code
  static checkQRCodeCSS(): DiagnosticResult {
    const qrImage = document.querySelector('img[alt="QR Code WhatsApp"]');
    
    if (!qrImage) {
      return {
        component: 'QR Code - Imagem',
        issue: 'Imagem do QR Code não encontrada',
        status: 'error',
        fix: 'Verificar se a imagem está sendo renderizada'
      };
    }
    
    const computedStyle = window.getComputedStyle(qrImage);
    const issues: string[] = [];
    
    if (computedStyle.width !== '256px') {
      issues.push('Largura incorreta');
    }
    
    if (computedStyle.height !== '256px') {
      issues.push('Altura incorreta');
    }
    
    if (computedStyle.objectFit !== 'contain') {
      issues.push('object-fit não definido');
    }
    
    if (issues.length > 0) {
      return {
        component: 'QR Code - CSS',
        issue: issues.join(', '),
        status: 'warning',
        fix: 'Aplicar classes w-64 h-64 object-contain'
      };
    }
    
    return {
      component: 'QR Code CSS',
      issue: 'Estilos OK',
      status: 'ok'
    };
  }
  
  // Verificar erros no console
  static checkConsoleErrors(): DiagnosticResult {
    const consoleLogs: string[] = [];
    
    // Interceptar console.error temporariamente
    const originalError = console.error;
    console.error = (...args) => {
      consoleLogs.push(args.join(' '));
      originalError(...args);
    };
    
    // Restaurar após 1 segundo
    setTimeout(() => {
      console.error = originalError;
    }, 1000);
    
    if (consoleLogs.length > 0) {
      return {
        component: 'Console - Erros',
        issue: `${consoleLogs.length} erros detectados`,
        status: 'error',
        fix: 'Verificar erros no console do navegador'
      };
    }
    
    return {
      component: 'Console',
      issue: 'Sem erros detectados',
      status: 'ok'
    };
  }
  
  // Aplicar correções automáticas
  static async applyFixes(): Promise<void> {
    console.log('🔧 Aplicando correções automáticas...');
    
    // 1. Corrigir CSS do modal
    this.fixModalCSS();
    
    // 2. Corrigir CSS do QR Code
    this.fixQRCodeCSS();
    
    // 3. Adicionar estilos de fallback
    this.addFallbackStyles();
    
    console.log('✅ Correções aplicadas!');
  }
  
  // Corrigir CSS do modal
  static fixModalCSS(): void {
    const style = document.createElement('style');
    style.id = 'qr-modal-fix';
    style.textContent = `
      /* Correção do Modal WhatsApp */
      [data-radix-dialog-content] {
        max-width: min(90vw, 512px) !important;
        max-height: 90vh !important;
        overflow-y: auto !important;
      }
      
      /* Container do QR Code */
      .qr-code-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 1.5rem !important;
        min-height: 300px !important;
      }
      
      /* Loading state */
      .qr-loading-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        height: 256px !important;
      }
    `;
    
    // Remover estilo anterior se existir
    const existingStyle = document.getElementById('qr-modal-fix');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }
  
  // Corrigir CSS do QR Code
  static fixQRCodeCSS(): void {
    const style = document.createElement('style');
    style.id = 'qr-code-fix';
    style.textContent = `
      /* Correção da Imagem QR Code */
      img[alt="QR Code WhatsApp"] {
        width: 256px !important;
        height: 256px !important;
        object-fit: contain !important;
        object-position: center !important;
        border-radius: 8px !important;
        background: white !important;
        padding: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Container da imagem */
      .qr-image-container {
        background: white !important;
        padding: 1rem !important;
        border-radius: 0.5rem !important;
        border: 2px solid #e5e7eb !important;
        display: inline-block !important;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Estado de erro */
      .qr-error-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        height: 256px !important;
        color: #ef4444 !important;
      }
    `;
    
    // Remover estilo anterior se existir
    const existingStyle = document.getElementById('qr-code-fix');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }
  
  // Adicionar estilos de fallback
  static addFallbackStyles(): void {
    const style = document.createElement('style');
    style.id = 'qr-fallback-styles';
    style.textContent = `
      /* Fallback para Tailwind classes */
      .qr-modal-fallback {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        max-width: 512px !important;
        width: 90vw !important;
        max-height: 90vh !important;
        overflow-y: auto !important;
        z-index: 50 !important;
      }
      
      /* Overlay */
      .qr-overlay-fallback {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 40 !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Função para testar QR Code específico
  static async testQRCodeGeneration(): Promise<{ success: boolean; error?: string }> {
    try {
      const instanceName = 'atendimento-ao-cliente-suporte';
      
      // Testar via Evolution API
      const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
      
      const response = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data?.base64) {
        console.log('✅ QR Code gerado com sucesso via API');
        return { success: true };
      }
      
      throw new Error('QR Code não retornado pela API');
      
    } catch (error: any) {
      console.error('❌ Erro no teste de QR Code:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

// Função global para diagnóstico rápido
(window as any).debugQRCodeAndCSS = async () => {
  console.log('🔍 Iniciando diagnóstico QR Code e CSS...');
  const results = await QRCodeAndCSSFixer.runDiagnostic();
  
  console.group('📊 RESULTADOS DO DIAGNÓSTICO');
  results.forEach(result => {
    const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component}: ${result.issue}`);
    if (result.fix) {
      console.log(`   💡 ${result.fix}`);
    }
  });
  console.groupEnd();
  
  return results;
};

// Função global para aplicar correções
(window as any).fixQRCodeAndCSS = async () => {
  console.log('🔧 Aplicando correções QR Code e CSS...');
  await QRCodeAndCSSFixer.applyFixes();
  console.log('✅ Correções aplicadas! Recarregue a página se necessário.');
};

// Função global para testar QR Code
(window as any).testQRCodeGeneration = async () => {
  console.log('🧪 Testando geração de QR Code...');
  const result = await QRCodeAndCSSFixer.testQRCodeGeneration();
  
  if (result.success) {
    console.log('✅ Teste de QR Code: SUCESSO');
  } else {
    console.error('❌ Teste de QR Code: FALHOU', result.error);
  }
  
  return result;
};

// Função global combinada - diagnóstico + correção
(window as any).fixAllQRCodeIssues = async () => {
  console.log('🚀 Executando diagnóstico completo e aplicando correções...');
  
  // 1. Diagnóstico
  const diagnosticResults = await QRCodeAndCSSFixer.runDiagnostic();
  
  // 2. Aplicar correções
  await QRCodeAndCSSFixer.applyFixes();
  
  // 3. Testar QR Code
  const testResult = await QRCodeAndCSSFixer.testQRCodeGeneration();
  
  console.group('🎯 RESUMO FINAL');
  console.log('📊 Diagnósticos executados:', diagnosticResults.length);
  console.log('🔧 Correções aplicadas: CSS Modal + QR Code + Fallbacks');
  console.log('🧪 Teste QR Code:', testResult.success ? '✅ PASSOU' : '❌ FALHOU');
  
  if (!testResult.success) {
    console.error('⚠️  Problema persistente:', testResult.error);
    console.log('💡 Sugestões:');
    console.log('   - Verifique configurações da Evolution API');
    console.log('   - Execute: checkEvolutionAPI()');
    console.log('   - Execute: fixEvolutionAPI()');
  }
  
  console.groupEnd();
  
  return {
    diagnostic: diagnosticResults,
    qrTest: testResult,
    overallSuccess: testResult.success
  };
};

// Aplicar correções automáticas quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  const applyAutomaticFixes = () => {
    // Aguardar um pouco para garantir que elementos estejam carregados
    setTimeout(() => {
      QRCodeAndCSSFixer.applyFixes();
    }, 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAutomaticFixes);
  } else {
    applyAutomaticFixes();
  }
}

export default QRCodeAndCSSFixer; 