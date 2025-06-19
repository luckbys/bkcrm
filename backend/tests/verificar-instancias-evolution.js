const axios = require('axios');

const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

async function verificarInstancias() {
  try {
    console.log('🔍 Verificando instâncias disponíveis na Evolution API...\n');
    
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      timeout: 10000
    });
    
    console.log('📋 Instâncias encontradas:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar status das instâncias específicas
    const instancias = ['atendimento-ao-cliente-sac1', 'atendimento-ao-cliente-suporte'];
    
    for (const instancia of instancias) {
      try {
        console.log(`\n🔍 Verificando instância: ${instancia}`);
        
        const statusResponse = await axios.get(`${EVOLUTION_API_URL}/instance/connectionState/${instancia}`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY
          },
          timeout: 10000
        });
        
        console.log(`✅ Status da ${instancia}:`, statusResponse.data);
        
      } catch (error) {
        console.log(`❌ Erro ao verificar ${instancia}:`, error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar instâncias:', error.response?.status, error.response?.data || error.message);
  }
}

verificarInstancias(); 