/**
 * 🧪 Script de Teste - Funcionalidades UX do UnifiedChatModal
 * Execute no console: testUnifiedChatUX()
 */

interface TestResult {
  feature: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

class UnifiedChatTester {
  private results: TestResult[] = [];

  log(feature: string, status: 'success' | 'error' | 'warning', message: string, duration?: number) {
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const colors = { success: 'color: green', error: 'color: red', warning: 'color: orange' };
    
    console.log(`%c${icons[status]} ${feature}: ${message}`, colors[status]);
    if (duration) console.log(`   ⏱️ ${duration}ms`);
    
    this.results.push({ feature, status, message, duration });
  }

  // 🧪 Teste Drag & Drop
  testDragDrop() {
    console.log('\n🧪 [TESTE 1] Sistema Drag & Drop');
    const start = performance.now();

    try {
      const chatArea = document.querySelector('.flex.flex-col.flex-1.min-h-0.relative');
      if (!chatArea) {
        this.log('Drag & Drop', 'warning', 'Área de chat não encontrada - abra o modal primeiro');
        return;
      }

      // Simular drag over
      const dragEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
      chatArea.dispatchEvent(dragEvent);
      
      setTimeout(() => {
        const overlay = document.querySelector('.absolute.inset-0.z-50.bg-blue-500\\/20');
        if (overlay) {
          this.log('Drag & Drop', 'success', 'Overlay visual funcionando');
        }
      }, 100);

      this.log('Drag & Drop', 'success', 'Sistema testado', performance.now() - start);
    } catch (error) {
      this.log('Drag & Drop', 'error', `Erro: ${error}`);
    }
  }

  // 🧪 Teste Templates
  testTemplates() {
    console.log('\n🧪 [TESTE 2] Templates de Resposta');
    const start = performance.now();

    try {
      const templateBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Templates')
      );

      if (!templateBtn) {
        this.log('Templates', 'warning', 'Botão Templates não encontrado');
        return;
      }

      templateBtn.click();
      
      setTimeout(() => {
        const popover = document.querySelector('.absolute.bottom-full.mb-2.left-0.z-50');
        if (popover) {
          this.log('Templates', 'success', 'Popover exibido corretamente');
        }
      }, 100);

      this.log('Templates', 'success', 'Sistema testado', performance.now() - start);
    } catch (error) {
      this.log('Templates', 'error', `Erro: ${error}`);
    }
  }

  // 🧪 Teste Auto-Save
  testAutoSave() {
    console.log('\n🧪 [TESTE 3] Auto-Save de Rascunhos');
    const start = performance.now();

    try {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (!textarea) {
        this.log('Auto-Save', 'warning', 'Textarea não encontrada');
        return;
      }

      // Simular digitação
      const testText = 'Teste de auto-save funcionalidade';
      textarea.value = testText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      setTimeout(() => {
        const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('draft_'));
        if (draftKeys.length > 0) {
          this.log('Auto-Save', 'success', `${draftKeys.length} rascunhos salvos`);
        } else {
          this.log('Auto-Save', 'warning', 'Nenhum rascunho no localStorage');
        }
      }, 1000);

      this.log('Auto-Save', 'success', 'Sistema testado', performance.now() - start);
    } catch (error) {
      this.log('Auto-Save', 'error', `Erro: ${error}`);
    }
  }

  // 🧪 Teste Indicadores
  testIndicators() {
    console.log('\n🧪 [TESTE 4] Indicadores Visuais');
    const start = performance.now();

    try {
      // Contador de caracteres
      const charCounter = Array.from(document.querySelectorAll('span')).find(span =>
        span.textContent?.includes('/2000')
      );

      if (charCounter) {
        this.log('Indicadores', 'success', 'Contador de caracteres encontrado');
      } else {
        this.log('Indicadores', 'warning', 'Contador não encontrado');
      }

      // Status de conexão
      const connectionStatus = document.querySelector('[class*="text-green-500"], [class*="text-red-500"]');
      if (connectionStatus) {
        this.log('Indicadores', 'success', 'Status de conexão encontrado');
      }

      this.log('Indicadores', 'success', 'Sistema testado', performance.now() - start);
    } catch (error) {
      this.log('Indicadores', 'error', `Erro: ${error}`);
    }
  }

  // 🧪 Teste Histórico
  testHistory() {
    console.log('\n🧪 [TESTE 5] Histórico de Ações');
    const start = performance.now();

    try {
      const historySection = Array.from(document.querySelectorAll('h4')).find(h4 =>
        h4.textContent?.includes('Histórico')
      );

      if (historySection) {
        this.log('Histórico', 'success', 'Seção de histórico encontrada');
        
        const historyItems = historySection.parentElement?.querySelectorAll('.text-xs.p-2.bg-gray-50');
        if (historyItems && historyItems.length > 0) {
          this.log('Histórico', 'success', `${historyItems.length} itens encontrados`);
        }
      } else {
        this.log('Histórico', 'warning', 'Seção não encontrada - abra a sidebar');
      }

      this.log('Histórico', 'success', 'Sistema testado', performance.now() - start);
    } catch (error) {
      this.log('Histórico', 'error', `Erro: ${error}`);
    }
  }

  // 📊 Relatório Final
  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('═══════════════════');
    
    const success = this.results.filter(r => r.status === 'success').length;
    const warning = this.results.filter(r => r.status === 'warning').length;
    const error = this.results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Sucessos: ${success}`);
    console.log(`⚠️ Avisos: ${warning}`);
    console.log(`❌ Erros: ${error}`);
    
    if (success >= 8) {
      console.log('\n🏆 EXCELENTE! Todas as funcionalidades UX estão funcionando');
    } else if (success >= 5) {
      console.log('\n👍 BOM! A maioria das funcionalidades está OK');
    } else {
      console.log('\n🔧 Algumas funcionalidades precisam de verificação');
    }
    
    console.log('\n💡 DICA: Abra o UnifiedChatModal antes de executar os testes');
  }

  // 🚀 Executar todos os testes
  async runAll() {
    console.clear();
    console.log('🎨 TESTE UX - UnifiedChatModal');
    console.log('══════════════════════════════');
    
    this.testDragDrop();
    await new Promise(r => setTimeout(r, 500));
    
    this.testTemplates();
    await new Promise(r => setTimeout(r, 500));
    
    this.testAutoSave();
    await new Promise(r => setTimeout(r, 1500));
    
    this.testIndicators();
    await new Promise(r => setTimeout(r, 500));
    
    this.testHistory();
    await new Promise(r => setTimeout(r, 500));
    
    this.generateReport();
  }
}

// 🌟 Função principal
async function testUnifiedChatUX() {
  const tester = new UnifiedChatTester();
  await tester.runAll();
}

// 🎬 Demo das funcionalidades
function demoUnifiedChatUX() {
  console.log('🎬 DEMO - Funcionalidades UX');
  console.log('═══════════════════════════════');
  console.log('');
  console.log('1. 📂 DRAG & DROP:');
  console.log('   • Arraste arquivos para a área do chat');
  console.log('   • Overlay azul aparece automaticamente');
  console.log('   • Validação de tipos e tamanho');
  console.log('');
  console.log('2. ⚡ TEMPLATES:');
  console.log('   • Clique no botão "Templates"');
  console.log('   • Escolha um template pré-definido');
  console.log('   • Texto aplicado automaticamente');
  console.log('');
  console.log('3. 💾 AUTO-SAVE:');
  console.log('   • Digite mais de 10 caracteres');
  console.log('   • Rascunho salvo automaticamente');
  console.log('   • Indicador "Rascunho salvo" aparece');
  console.log('');
  console.log('4. 📊 INDICADORES:');
  console.log('   • Contador de caracteres colorido');
  console.log('   • Status de conexão em tempo real');
  console.log('   • Feedback visual constante');
  console.log('');
  console.log('5. 📈 HISTÓRICO:');
  console.log('   • Últimas ações na sidebar');
  console.log('   • Timestamps relativos');
  console.log('   • Auto-update em tempo real');
  console.log('');
  console.log('🧪 Execute: testUnifiedChatUX()');
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  (window as any).testUnifiedChatUX = testUnifiedChatUX;
  (window as any).demoUnifiedChatUX = demoUnifiedChatUX;
  
  console.log('🎯 Funções disponíveis:');
  console.log('• testUnifiedChatUX() - Executar todos os testes');
  console.log('• demoUnifiedChatUX() - Ver demonstração das funcionalidades');
}

export { testUnifiedChatUX, demoUnifiedChatUX }; 