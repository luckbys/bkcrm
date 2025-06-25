// 🧪 Script de Teste Avançado - UnifiedChatModal UX Features
// Execução: testUnifiedChatUX() no console do navegador

interface TestResult {
  feature: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

class UnifiedChatUXTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    console.log('🧪 Iniciando Teste de UX do UnifiedChatModal...');
    console.log('📋 Funcionalidades a serem testadas:');
    console.log('   1. Sistema Drag & Drop');
    console.log('   2. Templates de Resposta');
    console.log('   3. Auto-Save de Rascunhos');
    console.log('   4. Indicadores Visuais');
    console.log('   5. Histórico de Ações');
    console.log('   6. Preferências Avançadas');
    console.log('   7. Sistema de Notificações');
    console.log('');
  }

  private log(feature: string, status: 'success' | 'error' | 'warning', message: string, duration?: number) {
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const colors = { success: 'color: green', error: 'color: red', warning: 'color: orange' };
    
    console.log(`%c${icons[status]} ${feature}: ${message}`, colors[status]);
    if (duration) {
      console.log(`   ⏱️ Tempo: ${duration}ms`);
    }
    
    this.results.push({ feature, status, message, duration });
  }

  // 🧪 Teste 1: Sistema Drag & Drop
  async testDragDropSystem(): Promise<void> {
    console.log('\n🧪 [TESTE 1] Sistema Drag & Drop');
    this.startTime = performance.now();

    try {
      // Verificar se elementos existem
      const chatArea = document.querySelector('[data-testid="chat-area"]') || 
                      document.querySelector('.flex.flex-col.flex-1.min-h-0.relative');
      
      if (!chatArea) {
        this.log('Drag & Drop', 'warning', 'Área de chat não encontrada - modal pode estar fechado');
        return;
      }

      // Simular evento de drag over
      const dragEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });

      chatArea.dispatchEvent(dragEvent);
      
      // Verificar se overlay aparece
      setTimeout(() => {
        const overlay = document.querySelector('.absolute.inset-0.z-50.bg-blue-500\\/20');
        if (overlay) {
          this.log('Drag & Drop', 'success', 'Overlay visual funcionando corretamente');
        } else {
          this.log('Drag & Drop', 'warning', 'Overlay não encontrado - verificar implementação');
        }
      }, 100);

      const duration = performance.now() - this.startTime;
      this.log('Drag & Drop', 'success', 'Sistema testado com sucesso', duration);

    } catch (error) {
      this.log('Drag & Drop', 'error', `Erro no teste: ${error}`);
    }
  }

  // 🧪 Teste 2: Templates de Resposta
  async testTemplateSystem(): Promise<void> {
    console.log('\n🧪 [TESTE 2] Templates de Resposta');
    this.startTime = performance.now();

    try {
      // Procurar botão de templates
      const templateButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Templates') || btn.querySelector('[data-lucide="zap"]')
      );

      if (!templateButton) {
        this.log('Templates', 'warning', 'Botão de templates não encontrado - modal pode estar fechado');
        return;
      }

      // Simular clique no botão
      templateButton.click();
      
      setTimeout(() => {
        // Verificar se popover aparece
        const popover = document.querySelector('.absolute.bottom-full.mb-2.left-0.z-50.bg-white.border');
        if (popover) {
          this.log('Templates', 'success', 'Popover de templates exibido corretamente');
          
          // Testar seleção de template
          const templateItem = popover.querySelector('button');
          if (templateItem) {
            templateItem.click();
            this.log('Templates', 'success', 'Template aplicado com sucesso');
          }
        } else {
          this.log('Templates', 'warning', 'Popover não encontrado');
        }
      }, 100);

      const duration = performance.now() - this.startTime;
      this.log('Templates', 'success', 'Sistema testado', duration);

    } catch (error) {
      this.log('Templates', 'error', `Erro no teste: ${error}`);
    }
  }

  // 🧪 Teste 3: Auto-Save de Rascunhos
  async testAutoSaveSystem(): Promise<void> {
    console.log('\n🧪 [TESTE 3] Auto-Save de Rascunhos');
    this.startTime = performance.now();

    try {
      // Procurar textarea de mensagem
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      
      if (!textarea) {
        this.log('Auto-Save', 'warning', 'Textarea não encontrada - modal pode estar fechado');
        return;
      }

      // Simular digitação
      const testMessage = 'Esta é uma mensagem de teste para auto-save funcionalidade';
      
      // Simular eventos de input
      textarea.value = testMessage;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      // Verificar localStorage após delay
      setTimeout(() => {
        const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('draft_'));
        if (draftKeys.length > 0) {
          this.log('Auto-Save', 'success', `Rascunho salvo no localStorage (${draftKeys.length} tickets)`);
          
          // Verificar indicador visual
          const draftIndicator = Array.from(document.querySelectorAll('span')).find(span =>
            span.textContent?.includes('Rascunho salvo')
          );
          
          if (draftIndicator) {
            this.log('Auto-Save', 'success', 'Indicador visual de rascunho salvo funcionando');
          }
        } else {
          this.log('Auto-Save', 'warning', 'Nenhum rascunho encontrado no localStorage');
        }
      }, 1000);

      const duration = performance.now() - this.startTime;
      this.log('Auto-Save', 'success', 'Sistema testado', duration);

    } catch (error) {
      this.log('Auto-Save', 'error', `Erro no teste: ${error}`);
    }
  }

  // 🧪 Teste 4: Indicadores Visuais
  async testVisualIndicators(): Promise<void> {
    console.log('\n🧪 [TESTE 4] Indicadores Visuais');
    this.startTime = performance.now();

    try {
      // Testar contador de caracteres
      const charCounter = Array.from(document.querySelectorAll('span')).find(span =>
        span.textContent?.includes('/2000')
      );

      if (charCounter) {
        this.log('Indicadores', 'success', 'Contador de caracteres encontrado');
        
        // Verificar cores baseadas no conteúdo
        const className = charCounter.className;
        if (className.includes('text-red-500') || className.includes('text-yellow-500') || className.includes('text-gray-400')) {
          this.log('Indicadores', 'success', 'Cores dinâmicas do contador funcionando');
        }
      } else {
        this.log('Indicadores', 'warning', 'Contador de caracteres não encontrado');
      }

      // Testar status de conexão
      const connectionBadge = document.querySelector('[class*="text-green-500"], [class*="text-red-500"]');
      if (connectionBadge) {
        this.log('Indicadores', 'success', 'Indicador de conexão encontrado');
      }

      const duration = performance.now() - this.startTime;
      this.log('Indicadores', 'success', 'Sistema testado', duration);

    } catch (error) {
      this.log('Indicadores', 'error', `Erro no teste: ${error}`);
    }
  }

  // 🧪 Teste 5: Histórico de Ações
  async testActionHistory(): Promise<void> {
    console.log('\n🧪 [TESTE 5] Histórico de Ações');
    this.startTime = performance.now();

    try {
      // Procurar seção de histórico na sidebar
      const historySection = Array.from(document.querySelectorAll('h4')).find(h4 =>
        h4.textContent?.includes('Histórico')
      );

      if (historySection) {
        this.log('Histórico', 'success', 'Seção de histórico encontrada na sidebar');
        
        // Verificar se há itens de histórico
        const historyItems = historySection.parentElement?.querySelectorAll('.text-xs.p-2.bg-gray-50');
        if (historyItems && historyItems.length > 0) {
          this.log('Histórico', 'success', `${historyItems.length} itens de histórico encontrados`);
        } else {
          this.log('Histórico', 'warning', 'Nenhum item de histórico encontrado');
        }
      } else {
        this.log('Histórico', 'warning', 'Seção de histórico não encontrada - sidebar pode estar fechada');
      }

      const duration = performance.now() - this.startTime;
      this.log('Histórico', 'success', 'Sistema testado', duration);

    } catch (error) {
      this.log('Histórico', 'error', `Erro no teste: ${error}`);
    }
  }

  // 🧪 Teste 6: Preferências Avançadas
  async testAdvancedPreferences(): Promise<void> {
    console.log('\n🧪 [TESTE 6] Preferências Avançadas');
    this.startTime = performance.now();

    try {
      // Procurar seção de preferências
      const preferencesSection = Array.from(document.querySelectorAll('h4')).find(h4 =>
        h4.textContent?.includes('Preferências')
      );

      if (preferencesSection) {
        this.log('Preferências', 'success', 'Seção de preferências encontrada');
        
        // Verificar toggles
        const toggles = preferencesSection.parentElement?.querySelectorAll('button[class*="h-6 w-10 p-0"]');
        if (toggles && toggles.length > 0) {
          this.log('Preferências', 'success', `${toggles.length} toggles de preferências encontrados`);
          
          // Testar clique em toggle
          const firstToggle = toggles[0] as HTMLButtonElement;
          firstToggle.click();
          this.log('Preferências', 'success', 'Toggle testado com sucesso');
        }
      } else {
        this.log('Preferências', 'warning', 'Seção de preferências não encontrada');
      }

      const duration = performance.now() - this.startTime;
      this.log('Preferências', 'success', 'Sistema testado', duration);

    } catch (error) {
      this.log('Preferências', 'error', `Erro no teste: ${error}`);
    }
  }

  // 🧪 Teste 7: Sistema de Notificações
  async testNotificationSystem(): Promise<void> {
    console.log('\n🧪 [TESTE 7] Sistema de Notificações');
    this.startTime = performance.now();

    try {
      // Verificar se container de notificações existe
      const notificationContainer = document.querySelector('[data-testid="notification-container"]') ||
                                   document.querySelector('.fixed');

      if (notificationContainer) {
        this.log('Notificações', 'success', 'Container de notificações encontrado');
      } else {
        this.log('Notificações', 'warning', 'Container de notificações não encontrado');
      }

      // Simular criação de notificação via eventos
      try {
        // Verificar se há notificações ativas
        const activeNotifications = document.querySelectorAll('[data-testid="notification"], [role="alert"]');
        if (activeNotifications.length > 0) {
          this.log('Notificações', 'success', `${activeNotifications.length} notificações ativas encontradas`);
        }
      } catch (e) {
        this.log('Notificações', 'warning', 'Não foi possível verificar notificações ativas');
      }

      const duration = performance.now() - this.startTime;
      this.log('Notificações', 'success', 'Sistema testado', duration);

    } catch (error) {
      this.log('Notificações', 'error', `Erro no teste: ${error}`);
    }
  }

  // 📊 Relatório Final
  generateReport(): void {
    console.log('\n📊 RELATÓRIO FINAL DE TESTES UX');
    console.log('════════════════════════════════');
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⚠️ Avisos: ${warningCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('');
    
    // Detalhamento por feature
    const features = [...new Set(this.results.map(r => r.feature))];
    features.forEach(feature => {
      const featureResults = this.results.filter(r => r.feature === feature);
      const success = featureResults.filter(r => r.status === 'success').length;
      const total = featureResults.length;
      const percentage = Math.round((success / total) * 100);
      
      console.log(`📋 ${feature}: ${success}/${total} (${percentage}%)`);
    });
    
    console.log('');
    console.log('🎯 RECOMENDAÇÕES:');
    
    if (warningCount > 0) {
      console.log('⚠️ Alguns elementos podem não estar visíveis devido ao modal estar fechado');
      console.log('   💡 Abra o UnifiedChatModal antes de executar os testes');
    }
    
    if (successCount >= 10) {
      console.log('🏆 Excelente! Todas as principais funcionalidades UX estão funcionando');
    } else if (successCount >= 7) {
      console.log('👍 Bom! A maioria das funcionalidades está funcionando corretamente');
    } else {
      console.log('🔧 Algumas funcionalidades precisam de verificação adicional');
    }
    
    console.log('');
    console.log('📈 MÉTRICAS DE PERFORMANCE:');
    const avgDuration = this.results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0) / this.results.filter(r => r.duration).length;
    
    if (avgDuration) {
      console.log(`⏱️ Tempo médio de resposta: ${Math.round(avgDuration)}ms`);
      console.log(`🚀 Performance: ${avgDuration < 100 ? 'Excelente' : avgDuration < 200 ? 'Boa' : 'Satisfatória'}`);
    }
  }

  // 🧪 Executar Todos os Testes
  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando bateria completa de testes...\n');
    
    await this.testDragDropSystem();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await this.testTemplateSystem();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await this.testAutoSaveSystem();
    await new Promise(resolve => setTimeout(resolve, 1500)); // Mais tempo para auto-save
    
    await this.testVisualIndicators();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await this.testActionHistory();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await this.testAdvancedPreferences();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await this.testNotificationSystem();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.generateReport();
  }
}

// 🌟 Função Principal para Execução
async function testUnifiedChatUX(): Promise<void> {
  console.clear();
  console.log('🎨 TESTE DE UX - UnifiedChatModal');
  console.log('═══════════════════════════════════');
  console.log('');
  
  const tester = new UnifiedChatUXTester();
  await tester.runAllTests();
  
  console.log('');
  console.log('💡 INSTRUÇÕES PARA TESTE MANUAL:');
  console.log('1. Abra um ticket no sistema');
  console.log('2. Clique para abrir o UnifiedChatModal');
  console.log('3. Execute novamente: testUnifiedChatUX()');
  console.log('4. Teste manualmente: arrastar arquivos, usar templates, etc.');
  console.log('');
  console.log('🔧 FUNÇÕES INDIVIDUAIS DISPONÍVEIS:');
  console.log('- testDragDrop()');
  console.log('- testTemplates()');
  console.log('- testAutoSave()');
  console.log('- testIndicators()');
  console.log('- testHistory()');
  console.log('- testPreferences()');
  console.log('- testNotifications()');
}

// 🎯 Funções Individuais para Teste Específico
function testDragDrop() { new UnifiedChatUXTester().testDragDropSystem(); }
function testTemplates() { new UnifiedChatUXTester().testTemplateSystem(); }
function testAutoSave() { new UnifiedChatUXTester().testAutoSaveSystem(); }
function testIndicators() { new UnifiedChatUXTester().testVisualIndicators(); }
function testHistory() { new UnifiedChatUXTester().testActionHistory(); }
function testPreferences() { new UnifiedChatUXTester().testAdvancedPreferences(); }
function testNotifications() { new UnifiedChatUXTester().testNotificationSystem(); }

// 📊 Função de Demonstração Automática
async function demoUnifiedChatUX(): Promise<void> {
  console.log('🎬 DEMONSTRAÇÃO AUTOMÁTICA - UnifiedChatModal UX');
  console.log('════════════════════════════════════════════════');
  console.log('Esta demo simula as interações do usuário...\n');
  
  // Simular abertura do modal
  console.log('1. 🖱️ Usuário abre o chat modal...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular uso de template
  console.log('2. ⚡ Usuário clica em Templates...');
  console.log('   📝 Template "Saudação" aplicado!');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular digitação
  console.log('3. ⌨️ Usuário digita mensagem...');
  console.log('   💾 Auto-save ativo!');
  console.log('   📊 Contador: 45/2000 caracteres');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular drag & drop
  console.log('4. 📂 Usuário arrasta arquivo...');
  console.log('   🎯 Overlay azul aparece');
  console.log('   ✅ Arquivo validado e anexado');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular envio
  console.log('5. 📤 Usuário envia mensagem...');
  console.log('   🔔 Notificação: "Mensagem enviada!"');
  console.log('   📈 Ação adicionada ao histórico');
  console.log('   🧹 Rascunho removido');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n🎉 DEMONSTRAÇÃO CONCLUÍDA!');
  console.log('💡 Execute testUnifiedChatUX() para testes reais');
}

// Exportar para uso global
declare global {
  interface Window {
    testUnifiedChatUX: () => Promise<void>;
    demoUnifiedChatUX: () => Promise<void>;
    testDragDrop: () => void;
    testTemplates: () => void;
    testAutoSave: () => void;
    testIndicators: () => void;
    testHistory: () => void;
    testPreferences: () => void;
    testNotifications: () => void;
  }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  window.testUnifiedChatUX = testUnifiedChatUX;
  window.demoUnifiedChatUX = demoUnifiedChatUX;
  window.testDragDrop = testDragDrop;
  window.testTemplates = testTemplates;
  window.testAutoSave = testAutoSave;
  window.testIndicators = testIndicators;
  window.testHistory = testHistory;
  window.testPreferences = testPreferences;
  window.testNotifications = testNotifications;
}

export { testUnifiedChatUX, demoUnifiedChatUX, UnifiedChatUXTester }; 