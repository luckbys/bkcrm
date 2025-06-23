// Script para corrigir webhook Evolution API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

// URLs para teste
const LOCAL_URL = 'http://localhost:4000/webhook/evolution';
const PRODUCTION_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';

async function corrigirWebhook() {
    console.log('🔧 Corrigindo webhook Evolution API...\n');
    
    try {
        // 1. Verificar configuração atual
        console.log('1️⃣ Verificando configuração atual...');
        const currentResponse = await fetch(`${API_URL}/webhook/find/${INSTANCE_NAME}`, {
            headers: { 'apikey': API_KEY }
        });
        const current = await currentResponse.json();
        console.log(`   URL atual: ${current.url}`);
        console.log(`   Eventos: ${current.events?.length || 0} eventos\n`);
        
        // 2. Configurar webhook correto para PRODUÇÃO
        console.log('2️⃣ Configurando webhook para PRODUÇÃO...');
        const productionPayload = {
            url: PRODUCTION_URL,
            events: [
                'MESSAGES_UPSERT',
                'MESSAGE_UPDATE', 
                'SEND_MESSAGE'
            ],
            webhook_by_events: false,
            webhook_base64: false
        };
        
        const productionResponse = await fetch(`${API_URL}/webhook/set/${INSTANCE_NAME}`, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productionPayload)
        });
        
        const productionResult = await productionResponse.json();
        console.log('   ✅ Webhook configurado para produção');
        console.log(`   URL: ${PRODUCTION_URL}`);
        console.log(`   Eventos: ${productionPayload.events.join(', ')}\n`);
        
        // 3. Testar webhook
        console.log('3️⃣ Testando webhook...');
        const testPayload = {
            event: 'MESSAGES_UPSERT',
            instance: INSTANCE_NAME,
            data: {
                key: {
                    remoteJid: '5511999999999@s.whatsapp.net',
                    fromMe: false,
                    id: 'test_' + Date.now()
                },
                message: {
                    conversation: 'Teste do webhook corrigido - ' + new Date().toLocaleString()
                },
                messageTimestamp: Math.floor(Date.now() / 1000),
                pushName: 'Cliente Teste'
            }
        };
        
        // Teste local primeiro
        try {
            const localResponse = await fetch(LOCAL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload)
            });
            const localResult = await localResponse.json();
            console.log('   📱 Teste LOCAL:', localResult.processed ? '✅ Sucesso' : '❌ Falhou');
        } catch (err) {
            console.log('   📱 Teste LOCAL: ❌ Servidor local não rodando');
        }
        
        // Teste produção
        try {
            const prodResponse = await fetch(PRODUCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload)
            });
            const prodResult = await prodResponse.json();
            console.log('   🌐 Teste PRODUÇÃO:', prodResult.processed ? '✅ Sucesso' : '❌ Falhou');
        } catch (err) {
            console.log('   🌐 Teste PRODUÇÃO: ❌ Servidor produção indisponível');
        }
        
        // 4. Verificar configuração final
        console.log('\n4️⃣ Verificando configuração final...');
        const finalResponse = await fetch(`${API_URL}/webhook/find/${INSTANCE_NAME}`, {
            headers: { 'apikey': API_KEY }
        });
        const final = await finalResponse.json();
        console.log(`   ✅ URL final: ${final.url}`);
        console.log(`   ✅ Habilitado: ${final.enabled}`);
        console.log(`   ✅ Eventos: ${final.events?.length || 0} eventos`);
        
        console.log('\n🎉 Webhook corrigido com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Envie uma mensagem WhatsApp para testar');
        console.log('   2. Verifique os logs do servidor local na porta 4000');
        console.log('   3. Se funcionar local, teste em produção');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir webhook:', error.message);
    }
}

// Executar
corrigirWebhook(); 