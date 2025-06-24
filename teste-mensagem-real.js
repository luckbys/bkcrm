// 🧪 TESTE MENSAGEM REAL - Simular payload exato da Evolution API

console.log('🎯 === TESTE MENSAGEM REAL EVOLUTION API ===');

async function testarMensagemReal() {
    console.log('\n📨 1. ENVIANDO MENSAGEM REAL...');
    
    const payload = {
        event: "messages.upsert",
        instance: "atendimento-ao-cliente-suporte",
        data: {
            key: {
                id: "3EB0D603A48F1D832046DE193A44BAA41EC22E19",
                remoteJid: "5512981022013@s.whatsapp.net",
                fromMe: false,
                participant: "5512981022013@s.whatsapp.net"
            },
            message: {
                conversation: "🔥 TESTE FRONTEND REAL - Mensagem deve aparecer no chat!"
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
            pushName: "Cliente Real WhatsApp",
            status: "PENDING"
        },
        destination: "https://bkcrm.devsible.com.br/webhook",
        date_time: new Date().toISOString(),
        sender: "5512981022013@s.whatsapp.net",
        server_url: "https://press-evolution-api.jhkbgs.easypanel.host",
        apikey: "5CFA92D7-A434-43E8-8D3F-2482FA7E1B28"
    };
    
    try {
        // Teste no endpoint principal
        console.log('📡 Testando endpoint principal /webhook/evolution...');
        const response1 = await fetch('http://localhost:4000/webhook/evolution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result1 = await response1.json();
        console.log('✅ Endpoint principal:', result1);
        
        // Teste no endpoint específico
        console.log('📡 Testando endpoint específico /webhook/evolution/messages-upsert...');
        const response2 = await fetch('http://localhost:4000/webhook/evolution/messages-upsert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result2 = await response2.json();
        console.log('✅ Endpoint específico:', result2);
        
    } catch (error) {
        console.error('❌ Erro ao testar:', error);
    }
}

async function verificarServidor() {
    console.log('\n📡 2. VERIFICANDO SERVIDOR...');
    
    try {
        const response = await fetch('http://localhost:4000/webhook/health');
        const data = await response.json();
        console.log('✅ Servidor status:', data);
        
        if (data.websocket?.connections > 0) {
            console.log('🔌 Frontend conectado!');
        } else {
            console.log('❌ Frontend não conectado - abra o chat primeiro!');
        }
        
    } catch (error) {
        console.error('❌ Servidor não responde:', error);
    }
}

async function testeCompleto() {
    console.log('🚀 === EXECUTANDO TESTE COMPLETO ===');
    
    await verificarServidor();
    await testarMensagemReal();
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    console.log('📋 Agora verifique se a mensagem apareceu no chat do frontend');
    console.log('💡 Se não apareceu:');
    console.log('   1. Abra o chat do ticket no navegador');
    console.log('   2. Execute: fetch("/teste-websocket-simples.js").then(r=>r.text()).then(eval)');
    console.log('   3. Execute: reconectar()');
    console.log('   4. Execute novamente: testarMensagemReal()');
}

// Executar teste automaticamente
testeCompleto(); 