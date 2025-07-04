import { evolutionApi } from '../services/evolutionApi';

// Função para testar a criação de instâncias
export const testInstanceCreation = async (departmentId = 'test-dept') => {
  console.log('🧪 Iniciando teste de criação de instância...');
  
  try {
    // 1. Verificar saúde da API
    console.log('1. 🔍 Verificando saúde da Evolution API...');
    const health = await evolutionApi.checkHealth();
    console.log('✅ Health check:', health);

    // 2. Verificar instâncias existentes
    console.log('2. 📋 Listando instâncias existentes...');
    const instances = await evolutionApi.fetchInstances();
    console.log('📋 Instâncias existentes:', instances);

    // 3. Criar nova instância de teste
    const instanceName = `teste-instancia-${departmentId}-${Date.now()}`;
    console.log(`3. 🚀 Criando instância: ${instanceName}`);
    
    const instanceData = {
      instanceName: instanceName,
      token: '',
      qrcode: true,
      webhook: 'https://webhook.bkcrm.devsible.com.br/webhook/evolution'
    };

    const result = await evolutionApi.createInstance(instanceData);
    console.log('✅ Instância criada com sucesso:', result);

    // 4. Verificar status da instância criada
    console.log('4. 📊 Verificando status da instância...');
    const status = await evolutionApi.getInstanceStatus(instanceName);
    console.log('📊 Status da instância:', status);

    // 5. Buscar QR Code se disponível
    if (status.instance?.state === 'connecting') {
      console.log('5. 📱 Buscando QR Code...');
      try {
        const qrCode = await evolutionApi.getInstanceQRCode(instanceName);
        console.log('📱 QR Code encontrado:', qrCode ? 'Sim' : 'Não');
      } catch (qrError) {
        console.log('⚠️ QR Code ainda não disponível:', qrError.message);
      }
    }

    return {
      success: true,
      instanceName,
      result,
      status
    };

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

// Função para testar conectividade
export const testEvolutionApiConnectivity = async () => {
  console.log('🧪 Testando conectividade da Evolution API...');
  
  try {
    const diagnostics = await evolutionApi.runDiagnostics();
    console.log('📊 Diagnósticos completos:', diagnostics);
    
    return {
      success: true,
      diagnostics
    };
  } catch (error) {
    console.error('❌ Erro na conectividade:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Função para limpar instâncias de teste
export const cleanupTestInstances = async () => {
  console.log('🧹 Limpando instâncias de teste...');
  
  try {
    const instances = await evolutionApi.fetchInstances();
    const testInstances = instances.filter(inst => 
      inst.instanceName.includes('teste-instancia-')
    );

    console.log(`🔍 Encontradas ${testInstances.length} instâncias de teste`);

    for (const instance of testInstances) {
      try {
        console.log(`🗑️ Removendo: ${instance.instanceName}`);
        await evolutionApi.deleteInstance(instance.instanceName);
        console.log(`✅ Removida: ${instance.instanceName}`);
      } catch (deleteError) {
        console.log(`⚠️ Erro ao remover ${instance.instanceName}:`, deleteError.message);
      }
    }

    return {
      success: true,
      removedCount: testInstances.length
    };
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Exportar para uso global no console
if (typeof window !== 'undefined') {
  window.testInstanceCreation = testInstanceCreation;
  window.testEvolutionApiConnectivity = testEvolutionApiConnectivity;
  window.cleanupTestInstances = cleanupTestInstances;
} 