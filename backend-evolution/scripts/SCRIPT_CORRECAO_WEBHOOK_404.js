// 🚨 CORREÇÃO ERRO 404 - WEBHOOK EVOLUTION API
// Execute este script no Console do CRM (F12 → Console)

console.log('🚨 CORREÇÃO ERRO 404 - WEBHOOK EVOLUTION API\n');

// SCRIPT PRINCIPAL PARA REMOVER WEBHOOKS INCORRETOS
(async () => {
    console.log('🧹 INICIANDO LIMPEZA DE WEBHOOKS INCORRETOS...\n');
    
    try {
        // Importar serviço da Evolution API
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Listar todas as instâncias
        console.log('📋 Buscando instâncias...');
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log(`📋 ${instances.length} instâncias encontradas\n`);
        
        let removedCount = 0;
        let errorCount = 0;
        
        // Verificar e remover webhooks incorretos
        for (const instance of instances) {
            const instanceName = instance.instanceName || instance.name;
            
            if (!instanceName) continue;
            
            try {
                console.log(`🔍 Verificando: ${instanceName}`);
                
                // Verificar webhook atual
                const webhook = await evolutionApiService.getInstanceWebhook(instanceName);
                const webhookUrl = webhook?.webhook?.url;
                
                if (webhookUrl) {
                    console.log(`   📡 URL: ${webhookUrl}`);
                    
                    // Verificar se é webhook problemático (404)
                    const isProblematic = 
                        webhookUrl.includes('/webhook/res/') ||
                        webhookUrl.includes('connection-update') || 
                        webhookUrl.includes('messages-upsert') || 
                        webhookUrl.includes('messages-update');
                    
                    if (isProblematic) {
                        console.log(`   🚨 WEBHOOK PROBLEMÁTICO! Removendo...`);
                        
                        await evolutionApiService.removeInstanceWebhook(instanceName);
                        removedCount++;
                        
                        console.log(`   ✅ Removido com sucesso!`);
                    } else {
                        console.log(`   ✅ Webhook OK`);
                    }
                } else {
                    console.log(`   ℹ️ Sem webhook`);
                }
                
            } catch (error) {
                console.error(`   ❌ Erro: ${error.message}`);
                errorCount++;
            }
        }
        
        // Resultado final
        console.log('\n🎯 RESULTADO:');
        console.log(`✅ Webhooks problemáticos removidos: ${removedCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        
        if (removedCount > 0) {
            console.log('\n🎉 SUCESSO! Erros 404 devem parar de aparecer.');
        }
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
    }
})();

// Função adicional para configurar webhook correto
window.configurarWebhookCRM = async () => {
    console.log('\n🔧 CONFIGURANDO WEBHOOK PARA O CRM...');
    
    try {
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Detectar URL do CRM
        const domain = window.location.hostname;
        const port = window.location.port;
        const isLocal = domain === 'localhost';
        
        const webhookUrl = isLocal 
            ? `http://localhost:${port}/api/webhook/evolution`
            : `https://${domain}/api/webhook/evolution`;
        
        console.log(`🌐 URL: ${webhookUrl}`);
        
        // Listar instâncias
        const instances = await evolutionApiService.listInstances();
        const instanceList = instances?.data || instances || [];
        
        let configured = 0;
        
        for (const instance of instanceList) {
            const name = instance.instanceName || instance.name;
            if (!name) continue;
            
            try {
                await evolutionApiService.setInstanceWebhook(name, {
                    url: webhookUrl,
                    enabled: true,
                    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
                });
                
                configured++;
                console.log(`✅ ${name}: Configurado`);
            } catch (error) {
                console.error(`❌ ${name}: ${error.message}`);
            }
        }
        
        console.log(`\n🎯 ${configured} instâncias configuradas!`);
        
    } catch (error) {
        console.error('❌ ERRO:', error);
    }
}; 