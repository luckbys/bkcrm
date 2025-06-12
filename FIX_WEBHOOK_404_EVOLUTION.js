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
        let checkedCount = 0;
        
        // Verificar e remover webhooks incorretos
        for (const instance of instances) {
            const instanceName = instance.instanceName || instance.name || instance.instance?.instanceName;
            
            if (!instanceName) {
                console.log('⚠️ Instância sem nome, pulando...');
                continue;
            }
            
            checkedCount++;
            
            try {
                console.log(`🔍 [${checkedCount}/${instances.length}] Verificando: ${instanceName}`);
                
                // Verificar webhook atual
                const currentWebhook = await evolutionApiService.getInstanceWebhook(instanceName);
                const webhookUrl = currentWebhook?.webhook?.url;
                
                if (webhookUrl) {
                    console.log(`   📡 URL atual: ${webhookUrl}`);
                    
                    // Verificar se é webhook incorreto que causa erro 404
                    const isProblematic = 
                        webhookUrl.includes('/webhook/res/') ||
                        webhookUrl.includes('connection-update') || 
                        webhookUrl.includes('messages-upsert') || 
                        webhookUrl.includes('messages-update') ||
                        (webhookUrl.includes('n8n') && (
                            webhookUrl.includes('/res/') ||
                            webhookUrl.endsWith('/webhook/res')
                        ));
                    
                    if (isProblematic) {
                        console.log(`   🚨 WEBHOOK PROBLEMÁTICO DETECTADO! Removendo...`);
                        
                        await evolutionApiService.removeInstanceWebhook(instanceName);
                        removedCount++;
                        
                        console.log(`   ✅ Webhook removido com sucesso!`);
                        
                        // Pequena pausa para evitar sobrecarga
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                    } else {
                        console.log(`   ✅ Webhook OK (não é problemático)`);
                    }
                } else {
                    console.log(`   ℹ️ Sem webhook configurado`);
                }
                
                console.log(''); // Linha em branco para separar
                
            } catch (error) {
                console.error(`   ❌ Erro ao verificar ${instanceName}:`, error.message);
                errorCount++;
                console.log(''); // Linha em branco para separar
            }
        }
        
        // Resultado final detalhado
        console.log('🎯 RESULTADO DA LIMPEZA:');
        console.log(`📊 Instâncias verificadas: ${checkedCount}`);
        console.log(`❌ Webhooks problemáticos removidos: ${removedCount}`);
        console.log(`⚠️ Erros encontrados: ${errorCount}`);
        
        if (removedCount > 0) {
            console.log('\n🎉 SUCESSO! Os erros 404 devem parar de aparecer nos logs da Evolution API.');
            console.log('📝 Recomendação: Configure webhooks corretos para o seu CRM se necessário.');
        } else if (checkedCount > 0) {
            console.log('\n🤔 Nenhum webhook problemático encontrado.');
            console.log('💡 Os erros 404 podem ter outra causa. Verifique a configuração do n8n.');
        } else {
            console.log('\n⚠️ Nenhuma instância foi verificada. Pode haver problema de conexão.');
        }
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
        console.log('\n🔧 SOLUÇÃO ALTERNATIVA:');
        console.log('1. Verifique se o Evolution API está rodando');
        console.log('2. Confirme a API Key');
        console.log('3. Execute o diagnóstico manual via API REST');
    }
})();

// Aguardar 2 segundos e oferecer opções adicionais
setTimeout(() => {
    console.log('\n💡 OPÇÕES ADICIONAIS DISPONÍVEIS:');
    console.log('- Execute: diagnosticarWebhooks() para análise detalhada');
    console.log('- Execute: configurarWebhookCRM() para configurar webhook para o CRM');
    console.log('- Execute: verificarCorrecao() para confirmar se os erros pararam');
}, 2000);

// Função para diagnóstico detalhado
window.diagnosticarWebhooks = async () => {
    console.log('\n🔍 DIAGNÓSTICO DETALHADO DE WEBHOOKS\n');
    
    try {
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Testar conexão primeiro
        console.log('1️⃣ TESTANDO CONEXÃO COM EVOLUTION API...');
        try {
            const instances = await evolutionApiService.listInstances();
            console.log(`   ✅ Conexão OK - ${instances?.data?.length || instances?.length || 0} instâncias encontradas`);
        } catch (error) {
            console.error('   ❌ Falha na conexão:', error.message);
            return;
        }
        
        // Análise detalhada
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log('\n2️⃣ ANÁLISE DETALHADA POR INSTÂNCIA:');
        
        const summary = {
            total: instances.length,
            withWebhook: 0,
            problematic: 0,
            healthy: 0,
            noWebhook: 0,
            errors: 0
        };
        
        for (const instance of instances) {
            const instanceName = instance.instanceName || instance.name || instance.instance?.instanceName;
            
            if (!instanceName) continue;
            
            console.log(`\n🔍 INSTÂNCIA: ${instanceName}`);
            console.log(`   📊 Status: ${instance.state || instance.status || 'unknown'}`);
            
            try {
                const webhook = await evolutionApiService.getInstanceWebhook(instanceName);
                const webhookUrl = webhook?.webhook?.url;
                
                if (webhookUrl) {
                    summary.withWebhook++;
                    console.log(`   📡 Webhook: ${webhookUrl}`);
                    
                    // Analisar se é problemático
                    const isProblematic = 
                        webhookUrl.includes('/webhook/res/') ||
                        webhookUrl.includes('connection-update') ||
                        webhookUrl.includes('messages-upsert') ||
                        webhookUrl.includes('messages-update');
                    
                    if (isProblematic) {
                        summary.problematic++;
                        console.log('   🚨 PROBLEMÁTICO! (Causa dos erros 404)');
                    } else {
                        summary.healthy++;
                        console.log('   ✅ Webhook saudável');
                    }
                } else {
                    summary.noWebhook++;
                    console.log('   ℹ️ Sem webhook configurado');
                }
                
            } catch (error) {
                summary.errors++;
                console.log(`   ❌ Erro ao verificar webhook: ${error.message}`);
            }
        }
        
        // Resumo final
        console.log('\n📊 RESUMO GERAL:');
        console.log(`📋 Total de instâncias: ${summary.total}`);
        console.log(`📡 Com webhook: ${summary.withWebhook}`);
        console.log(`🚨 Problemáticos: ${summary.problematic}`);
        console.log(`✅ Saudáveis: ${summary.healthy}`);
        console.log(`ℹ️ Sem webhook: ${summary.noWebhook}`);
        console.log(`❌ Erros: ${summary.errors}`);
        
        if (summary.problematic > 0) {
            console.log('\n💡 RECOMENDAÇÃO: Execute o script de limpeza principal para corrigir os webhooks problemáticos.');
        } else {
            console.log('\n🎉 ÓTIMO! Nenhum webhook problemático encontrado.');
        }
        
    } catch (error) {
        console.error('❌ ERRO NO DIAGNÓSTICO:', error);
    }
};

// Função para configurar webhook correto para o CRM
window.configurarWebhookCRM = async () => {
    console.log('\n🔧 CONFIGURANDO WEBHOOK PARA O CRM...\n');
    
    try {
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Detectar URL do CRM automaticamente
        const currentDomain = window.location.hostname;
        const currentPort = window.location.port;
        const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
        
        let crmWebhookUrl;
        
        if (isLocalhost) {
            crmWebhookUrl = `http://localhost:${currentPort || '3000'}/api/webhook/evolution`;
        } else {
            crmWebhookUrl = `https://${currentDomain}/api/webhook/evolution`;
        }
        
        console.log(`🌐 URL do CRM detectada: ${crmWebhookUrl}`);
        
        // Confirmar com o usuário
        const confirm = window.confirm(`Configurar webhook para: ${crmWebhookUrl}?\n\nClique OK para continuar ou Cancelar para abortar.`);
        
        if (!confirm) {
            console.log('❌ Configuração cancelada pelo usuário.');
            return;
        }
        
        // Listar instâncias
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log(`\n📋 ${instances.length} instâncias encontradas\n`);
        
        let configuredCount = 0;
        let errorCount = 0;
        
        // Configurar webhook para cada instância
        for (const instance of instances) {
            const instanceName = instance.instanceName || instance.name || instance.instance?.instanceName;
            
            if (!instanceName) continue;
            
            try {
                console.log(`🔧 Configurando: ${instanceName}`);
                
                const webhookConfig = {
                    url: crmWebhookUrl,
                    enabled: true,
                    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
                };
                
                await evolutionApiService.setInstanceWebhook(instanceName, webhookConfig);
                configuredCount++;
                
                console.log(`   ✅ Webhook configurado com sucesso!`);
                
                // Pausa para evitar sobrecarga
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                errorCount++;
                console.error(`   ❌ Erro ao configurar ${instanceName}:`, error.message);
            }
        }
        
        console.log('\n🎯 RESULTADO:');
        console.log(`✅ Instâncias configuradas: ${configuredCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`🔗 URL configurada: ${crmWebhookUrl}`);
        
        if (configuredCount > 0) {
            console.log('\n🎉 Webhooks configurados! Agora as mensagens devem chegar no CRM.');
        }
        
    } catch (error) {
        console.error('❌ ERRO:', error);
    }
};

// Função para verificar se a correção funcionou
window.verificarCorrecao = async () => {
    console.log('\n✅ VERIFICANDO SE A CORREÇÃO FUNCIONOU...\n');
    
    try {
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log('🔍 ESTADO ATUAL DOS WEBHOOKS:\n');
        
        let problematicCount = 0;
        let healthyCount = 0;
        let noWebhookCount = 0;
        
        for (const instance of instances) {
            const name = instance.instanceName || instance.name || instance.instance?.instanceName;
            if (!name) continue;
            
            try {
                const webhook = await evolutionApiService.getInstanceWebhook(name);
                const url = webhook?.webhook?.url;
                
                if (url) {
                    const isProblematic = 
                        url.includes('/webhook/res/') ||
                        url.includes('connection-update') ||
                        url.includes('messages-upsert') ||
                        url.includes('messages-update');
                    
                    if (isProblematic) {
                        problematicCount++;
                        console.log(`❌ ${name}: ${url} (AINDA PROBLEMÁTICO)`);
                    } else {
                        healthyCount++;
                        console.log(`✅ ${name}: ${url}`);
                    }
                } else {
                    noWebhookCount++;
                    console.log(`ℹ️ ${name}: Sem webhook configurado`);
                }
            } catch (error) {
                console.log(`❌ ${name}: Erro - ${error.message}`);
            }
        }
        
        console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
        console.log(`❌ Ainda problemáticos: ${problematicCount}`);
        console.log(`✅ Saudáveis: ${healthyCount}`);
        console.log(`ℹ️ Sem webhook: ${noWebhookCount}`);
        
        if (problematicCount === 0) {
            console.log('\n🎉 PERFEITO! Nenhum webhook problemático encontrado.');
            console.log('Os erros 404 devem ter parado de aparecer nos logs da Evolution API.');
        } else {
            console.log('\n⚠️ AINDA HÁ PROBLEMAS! Execute novamente o script de limpeza.');
        }
        
    } catch (error) {
        console.error('❌ ERRO NA VERIFICAÇÃO:', error);
    }
}; 