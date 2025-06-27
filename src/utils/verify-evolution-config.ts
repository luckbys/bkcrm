// Verificação de Configuração da Evolution API
// Este arquivo verifica se a Evolution API está configurada corretamente

export interface EvolutionConfigStatus {
  hasUrl: boolean;
  hasApiKey: boolean;
  isValidUrl: boolean;
  isOnline: boolean;
  canConnect: boolean;
  instances: string[];
  error?: string;
}

export class EvolutionConfigChecker {
  
  static async checkConfiguration(): Promise<EvolutionConfigStatus> {
    const status: EvolutionConfigStatus = {
      hasUrl: false,
      hasApiKey: false,
      isValidUrl: false,
      isOnline: false,
      canConnect: false,
      instances: []
    };
    
    try {
      // 1. Verificar variáveis de ambiente
      const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
      
      status.hasUrl = !!evolutionUrl && evolutionUrl !== 'http://localhost:8080';
      status.hasApiKey = !!apiKey;
      
      if (!status.hasUrl) {
        status.error = 'Evolution API URL não configurada';
        return status;
      }
      
      if (!status.hasApiKey) {
        status.error = 'Evolution API Key não configurada';
        return status;
      }
      
      // 2. Validar URL
      try {
        new URL(evolutionUrl);
        status.isValidUrl = true;
      } catch {
        status.error = 'Evolution API URL inválida';
        return status;
      }
      
      // 3. Testar conectividade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(evolutionUrl, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        status.isOnline = response.status < 500; // 200, 400, 401 são considerados "online"
        
        if (response.ok) {
          status.canConnect = true;
          
          // 4. Listar instâncias se conectou
          try {
            const instancesResponse = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
              headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
              }
            });
            
            if (instancesResponse.ok) {
              const instancesData = await instancesResponse.json();
              status.instances = Array.isArray(instancesData) ? 
                instancesData.map((inst: any) => inst.instance?.instanceName || 'unknown') : 
                [];
            }
          } catch (error) {
            console.warn('⚠️ Não foi possível listar instâncias:', error);
          }
          
        } else {
          status.error = `HTTP ${response.status}: ${response.statusText}`;
        }
        
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          status.error = 'Timeout na conexão (10s)';
        } else {
          status.error = `Erro de conexão: ${error.message}`;
        }
      }
      
    } catch (error: any) {
      status.error = `Erro inesperado: ${error.message}`;
    }
    
    return status;
  }
  
  static async fixCommonIssues(): Promise<{
    fixed: string[];
    stillBroken: string[];
    suggestions: string[];
  }> {
    const result = {
      fixed: [] as string[],
      stillBroken: [] as string[],
      suggestions: [] as string[]
    };
    
    const status = await this.checkConfiguration();
    
    // Verificar problemas comuns
    if (!status.hasUrl) {
      result.stillBroken.push('Evolution API URL não configurada');
      result.suggestions.push('Configure VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host');
    }
    
    if (!status.hasApiKey) {
      result.stillBroken.push('Evolution API Key não configurada');
      result.suggestions.push('Configure VITE_EVOLUTION_API_KEY com a chave correta');
    }
    
    if (status.hasUrl && !status.isValidUrl) {
      result.stillBroken.push('URL da Evolution API inválida');
      result.suggestions.push('Verifique se a URL está no formato correto (https://...)');
    }
    
    if (status.isValidUrl && !status.isOnline) {
      result.stillBroken.push('Evolution API offline ou inacessível');
      result.suggestions.push('Verifique se o servidor está online e acessível');
    }
    
    if (status.isOnline && !status.canConnect) {
      result.stillBroken.push('Credenciais de autenticação inválidas');
      result.suggestions.push('Verifique se a API Key está correta');
    }
    
    if (status.canConnect && status.instances.length === 0) {
      result.suggestions.push('Nenhuma instância encontrada. Crie uma instância WhatsApp');
    }
    
    // Tentar correções automáticas
    if (status.canConnect) {
      result.fixed.push('Conexão com Evolution API estabelecida');
    }
    
    return result;
  }
  
  static printDiagnostic(status: EvolutionConfigStatus): void {
    console.group('🔍 DIAGNÓSTICO EVOLUTION API');
    
    const icons = {
      ok: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    console.log(`${status.hasUrl ? icons.ok : icons.error} URL configurada: ${status.hasUrl}`);
    console.log(`${status.hasApiKey ? icons.ok : icons.error} API Key configurada: ${status.hasApiKey}`);
    console.log(`${status.isValidUrl ? icons.ok : icons.error} URL válida: ${status.isValidUrl}`);
    console.log(`${status.isOnline ? icons.ok : icons.error} Servidor online: ${status.isOnline}`);
    console.log(`${status.canConnect ? icons.ok : icons.error} Pode conectar: ${status.canConnect}`);
    
    if (status.instances.length > 0) {
      console.log(`${icons.ok} Instâncias encontradas: ${status.instances.length}`);
      status.instances.forEach(instance => {
        console.log(`  📱 ${instance}`);
      });
    } else {
      console.log(`${icons.warning} Nenhuma instância encontrada`);
    }
    
    if (status.error) {
      console.log(`${icons.error} Erro: ${status.error}`);
    }
    
    // Informações técnicas
    console.group('📊 Detalhes Técnicos');
    console.log('URL:', import.meta.env.VITE_EVOLUTION_API_URL);
    console.log('API Key configurada:', !!import.meta.env.VITE_EVOLUTION_API_KEY);
    console.log('Ambiente:', import.meta.env.MODE);
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Função global para diagnóstico rápido
(window as any).checkEvolutionAPI = async () => {
  const status = await EvolutionConfigChecker.checkConfiguration();
  EvolutionConfigChecker.printDiagnostic(status);
  return status;
};

// Função global para corrigir problemas
(window as any).fixEvolutionAPI = async () => {
  const result = await EvolutionConfigChecker.fixCommonIssues();
  
  console.group('🔧 CORREÇÃO EVOLUTION API');
  
  if (result.fixed.length > 0) {
    console.log('✅ Problemas corrigidos:');
    result.fixed.forEach(fix => console.log(`  - ${fix}`));
  }
  
  if (result.stillBroken.length > 0) {
    console.log('❌ Problemas não resolvidos:');
    result.stillBroken.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (result.suggestions.length > 0) {
    console.log('💡 Sugestões:');
    result.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }
  
  console.groupEnd();
  
  return result;
};

// Função para testar QR Code específicamente
(window as any).testQRCodeAPI = async (instanceName = 'atendimento-ao-cliente-suporte') => {
  const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
  
  console.log(`🧪 Testando QR Code para instância: ${instanceName}`);
  
  try {
    const response = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.group('📊 Resultado do Teste QR Code');
    console.log('Status HTTP:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Tem base64:', !!data?.base64);
    console.log('Tem code:', !!data?.code);
    console.log('Dados:', data);
    console.groupEnd();
    
    if (data?.base64) {
      console.log('✅ QR Code obtido com sucesso!');
      return { success: true, qrCode: data.base64 };
    } else {
      console.log('❌ QR Code não disponível');
      return { success: false, error: 'QR Code não retornado' };
    }
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error: error.message };
  }
};

export default EvolutionConfigChecker; 