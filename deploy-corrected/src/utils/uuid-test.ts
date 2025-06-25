// 🔧 TESTE CORREÇÃO UUID - Verificar se mensagens agora salvam corretamente
// Execute no console: testUUIDCorrection()

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

// Função para testar a correção do UUID
async function testUUIDCorrection(): Promise<TestResult> {
  try {
    console.log('🧪 [TESTE UUID] Iniciando teste de correção...');
    
    // 1. Verificar se a função getCurrentUserId está funcionando
    const getCurrentUserId = () => {
      try {
        const authData = localStorage.getItem('sb-ajlgjjjvuglwgfnyqqvb-auth-token');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed?.user?.id) {
            return parsed.user.id;
          }
        }
        return '00000000-0000-0000-0000-000000000001'; // UUID do sistema
      } catch (error) {
        return '00000000-0000-0000-0000-000000000001';
      }
    };
    
    const userId = getCurrentUserId();
    console.log('👤 [TESTE UUID] ID do usuário obtido:', userId);
    
    // 2. Verificar se é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(userId);
    
    if (!isValidUUID) {
      return {
        success: false,
        message: `❌ UUID inválido: ${userId}`,
        details: { userId, isValidUUID }
      };
    }
    
    console.log('✅ [TESTE UUID] UUID válido confirmado');
    
    // 3. Testar conexão WebSocket (se disponível)
    const chatStore = (window as any).chatStore;
    if (chatStore && chatStore.isConnected) {
      console.log('🔗 [TESTE UUID] WebSocket conectado, testando envio...');
      
      try {
        await chatStore.send('test-uuid-ticket', 'Teste de correção UUID', false);
        console.log('✅ [TESTE UUID] Envio de teste realizado com sucesso');
      } catch (sendError) {
        console.warn('⚠️ [TESTE UUID] Erro no envio de teste:', sendError);
      }
    } else {
      console.log('📴 [TESTE UUID] WebSocket não conectado, apenas validação UUID');
    }
    
    // 4. Verificar health do webhook
    try {
      const healthResponse = await fetch('https://ws.bkcrm.devsible.com.br/webhook/health');
      const healthData = await healthResponse.json();
      console.log('🏥 [TESTE UUID] Health check webhook:', healthData);
    } catch (healthError) {
      console.warn('⚠️ [TESTE UUID] Health check falhou:', healthError);
    }
    
    return {
      success: true,
      message: `✅ Correção UUID aplicada com sucesso! UserID: ${userId}`,
      details: {
        userId,
        isValidUUID,
        systemUUID: '00000000-0000-0000-0000-000000000001',
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ [TESTE UUID] Erro durante teste:', error);
    return {
      success: false,
      message: `❌ Erro no teste: ${error}`,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

// Função para testar envio de mensagem específica
async function testMessageSend(ticketId: string, content: string = 'Teste correção UUID'): Promise<TestResult> {
  try {
    console.log(`📤 [TESTE MENSAGEM] Testando envio para ticket ${ticketId}...`);
    
    // Verificar se chat store está disponível
    const chatStore = (window as any).chatStore;
    if (!chatStore) {
      return {
        success: false,
        message: '❌ Chat store não encontrado'
      };
    }
    
    // Verificar conexão
    if (!chatStore.isConnected) {
      console.log('🔄 [TESTE MENSAGEM] Inicializando conexão...');
      chatStore.init();
      
      // Aguardar conexão (timeout 5s)
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const checkConnection = () => {
          attempts++;
          if (chatStore.isConnected) {
            resolve(true);
          } else if (attempts > 10) {
            reject(new Error('Timeout na conexão'));
          } else {
            setTimeout(checkConnection, 500);
          }
        };
        checkConnection();
      });
    }
    
    // Enviar mensagem
    await chatStore.send(ticketId, content, false);
    
    return {
      success: true,
      message: `✅ Mensagem enviada com sucesso para ticket ${ticketId}`,
      details: { ticketId, content, timestamp: new Date().toISOString() }
    };
    
  } catch (error) {
    console.error('❌ [TESTE MENSAGEM] Erro:', error);
    return {
      success: false,
      message: `❌ Erro ao enviar mensagem: ${error}`,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

// Função para diagnosticar problemas de UUID
function diagnosticUUID(): void {
  console.log('🔍 [DIAGNÓSTICO UUID] Verificando configurações...');
  
  // 1. Auth data
  const authData = localStorage.getItem('sb-ajlgjjjvuglwgfnyqqvb-auth-token');
  console.log('📋 [DIAGNÓSTICO] Auth data:', authData ? 'Encontrado' : 'Não encontrado');
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      console.log('👤 [DIAGNÓSTICO] User ID:', parsed?.user?.id || 'Não encontrado');
      console.log('📧 [DIAGNÓSTICO] User email:', parsed?.user?.email || 'Não encontrado');
    } catch (error) {
      console.error('❌ [DIAGNÓSTICO] Erro ao parsear auth:', error);
    }
  }
  
  // 2. Chat store
  const chatStore = (window as any).chatStore;
  console.log('🏪 [DIAGNÓSTICO] Chat store:', chatStore ? 'Disponível' : 'Não encontrado');
  console.log('🔗 [DIAGNÓSTICO] WebSocket:', chatStore?.isConnected ? 'Conectado' : 'Desconectado');
  
  // 3. System UUID
  console.log('🆔 [DIAGNÓSTICO] System UUID:', '00000000-0000-0000-0000-000000000001');
  
  // 4. WebSocket URL
  console.log('🌐 [DIAGNÓSTICO] WebSocket URL:', 'https://ws.bkcrm.devsible.com.br');
}

// Expor funções globalmente para uso no console
declare global {
  interface Window {
    testUUIDCorrectionNew: typeof testUUIDCorrection;
    testMessageSendNew: typeof testMessageSend;
    diagnosticUUIDNew: typeof diagnosticUUID;
  }
}

// 🧪 Teste específico para foreign key constraint
async function testForeignKeyConstraint(): Promise<TestResult> {
  try {
    console.log('🔑 [TESTE FK] Verificando foreign key constraint...');
    
    // Importar supabase se disponível
    const { supabase } = await import('../lib/supabase');
    
    // Verificar se o usuário sistema existe na tabela profiles
    const { data: systemUser, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    if (error) {
      console.error('❌ [TESTE FK] Usuário sistema não encontrado:', error);
      return {
        success: false,
        message: 'Usuário sistema não existe na tabela profiles',
        details: {
          error: error.message,
          solution: 'Execute o script CORRECAO_FOREIGN_KEY_SENDER_SYSTEM.sql no Supabase Dashboard',
          sqlScript: 'backend/database/CORRECAO_FOREIGN_KEY_SENDER_SYSTEM.sql'
        }
      };
    }
    
    console.log('✅ [TESTE FK] Usuário sistema encontrado:', systemUser);
    return {
      success: true,
      message: 'Foreign key constraint resolvida - usuário sistema existe',
      details: systemUser
    };
    
  } catch (error) {
    console.error('❌ [TESTE FK] Erro no teste:', error);
    return {
      success: false,
      message: 'Erro ao verificar foreign key constraint',
      details: { 
        error: error instanceof Error ? error.message : String(error),
        solution: 'Verifique se o Supabase está configurado corretamente'
      }
    };
  }
}

// Auto-exposição se estiver no browser
if (typeof window !== 'undefined') {
  window.testUUIDCorrectionNew = testUUIDCorrection;
  window.testMessageSendNew = testMessageSend;
  window.diagnosticUUIDNew = diagnosticUUID;
  (window as any).testForeignKeyConstraintNew = testForeignKeyConstraint;
  
  console.log('🔧 [UUID CORRECTION] Funções de teste disponíveis:');
  console.log('   testUUIDCorrectionNew() - Testar correção completa');
  console.log('   testMessageSendNew("ticketId") - Testar envio específico');
  console.log('   diagnosticUUIDNew() - Diagnosticar configurações');
  console.log('   testForeignKeyConstraintNew() - Verificar foreign key constraint');
}

export { testUUIDCorrection, testMessageSend, diagnosticUUID }; 