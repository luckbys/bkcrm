// Script final para corrigir webhook Evolution API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';

// URL CORRETA para produção
const CORRECT_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';

async function corrigirWebhookFinal() {
    console.log('🔧 CORREÇÃO FINAL - Webhook Evolution API\n');
    
    try {
        // 1. Configurar webhook corrigido
        console.log('1️⃣ Configurando webhook com URL CORRETA...');
        const webhookPayload = {
            url: CORRECT_URL,
            events: [
                'MESSAGES_UPSERT',
                'MESSAGE_UPDATE', 
                'SEND_MESSAGE'
            ],
            webhook_by_events: false,
            webhook_base64: false
        };
        
        const setResponse = await fetch(`${API_URL}/webhook/set/${INSTANCE_NAME}`, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });
        
        if (setResponse.ok) {
            console.log('   ✅ Webhook configurado com sucesso!');
            console.log(`   📍 URL: ${CORRECT_URL}`);
        } else {
            const error = await setResponse.text();
            console.log('   ❌ Erro ao configurar webhook:', error);
        }
        
        // 2. Verificar configuração final
        console.log('\n2️⃣ Verificando configuração final...');
        const finalResponse = await fetch(`${API_URL}/webhook/find/${INSTANCE_NAME}`, {
            headers: { 'apikey': API_KEY }
        });
        const final = await finalResponse.json();
        
        console.log(`   📍 URL configurada: ${final.url}`);
        console.log(`   ✅ Habilitado: ${final.enabled}`);
        console.log(`   📊 Eventos: ${final.events?.length || 0} eventos configurados`);
        
        // 3. Verificar se URL está correta
        const isCorrect = final.url === CORRECT_URL;
        console.log(`   ${isCorrect ? '✅' : '❌'} URL ${isCorrect ? 'CORRETA' : 'INCORRETA'}`);
        
        if (isCorrect) {
            console.log('\n🎉 SUCESSO! Webhook configurado corretamente.');
            console.log('\n📱 AGORA FUNCIONA:');
            console.log('   • Cliente envia mensagem WhatsApp');
            console.log('   • Evolution API → https://bkcrm.devsible.com.br/webhook/evolution');
            console.log('   • Servidor processa e envia via WebSocket');
            console.log('   • Mensagem aparece no CRM em tempo real');
            
            console.log('\n🧪 Para testar:');
            console.log('   1. Envie uma mensagem WhatsApp real para o número da instância');
            console.log('   2. Verifique se aparece no CRM');
            console.log('   3. Responda pelo CRM e veja se chega no WhatsApp');
        } else {
            console.log('\n❌ FALHA: URL ainda está incorreta. Tente configurar manualmente.');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Executar
corrigirWebhookFinal(); 