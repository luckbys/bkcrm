# 🚨 CORREÇÃO ERRO 404 - WEBHOOK EVOLUTION API

## ❌ **PROBLEMA IDENTIFICADO:**

A Evolution API está tentando enviar webhooks para endpoints do n8n que **NÃO EXISTEM**:

```
❌ ERRO: Request failed with status code 404
🔗 URL: https://press-n8n.jhkbgs.easypanel.host/webhook/res/connection-update
🔗 URL: https://press-n8n.jhkbgs.easypanel.host/webhook/res/messages-upsert
🔗 URL: https://press-n8n.jhkbgs.easypanel.host/webhook/res/messages-update
```

**Tentativas:** 2/10, 5/10, 7/10, 8/10 → Evolution API está falhando e tentando novamente

---

## ⚡ **SOLUÇÕES IMEDIATAS**

### **🎯 OPÇÃO 1: REMOVER WEBHOOKS INCORRETOS (RECOMENDADO)**

Execute no **Console do CRM** (F12 → Console):

```javascript
// SCRIPT PARA REMOVER WEBHOOKS INCORRETOS
(async () => {
    console.log('🧹 INICIANDO LIMPEZA DE WEBHOOKS INCORRETOS...\n');
    
    try {
        // Importar serviço
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Listar todas as instâncias
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log(`📋 ${instances.length} instâncias encontradas\n`);
        
        let removedCount = 0;
        let errorCount = 0;
        
        // Verificar e remover webhooks incorretos
        for (const instance of instances) {
            const instanceName = instance.instanceName || instance.name || instance.instance?.instanceName;
            
            if (!instanceName) {
                console.log('⚠️ Instância sem nome, pulando...');
                continue;
            }
            
            try {
                console.log(`🔍 Verificando: ${instanceName}`);
                
                // Verificar webhook atual
                const currentWebhook = await evolutionApiService.getInstanceWebhook(instanceName);
                const webhookUrl = currentWebhook?.webhook?.url;
                
                if (webhookUrl) {
                    console.log(`   📡 URL atual: ${webhookUrl}`);
                    
                    // Verificar se é webhook incorreto (n8n com /res/)
                    if (webhookUrl.includes('n8n') && webhookUrl.includes('/webhook/res/')) {
                        console.log(`   ❌ WEBHOOK INCORRETO DETECTADO! Removendo...`);
                        
                        await evolutionApiService.removeInstanceWebhook(instanceName);
                        removedCount++;
                        
                        console.log(`   ✅ Webhook removido com sucesso!\n`);
                    } else if (webhookUrl.includes('connection-update') || 
                               webhookUrl.includes('messages-upsert') || 
                               webhookUrl.includes('messages-update')) {
                        console.log(`   ❌ WEBHOOK COM ENDPOINT INCORRETO! Removendo...`);
                        
                        await evolutionApiService.removeInstanceWebhook(instanceName);
                        removedCount++;
                        
                        console.log(`   ✅ Webhook removido com sucesso!\n`);
                    } else {
                        console.log(`   ✅ Webhook OK (não é problemático)\n`);
                    }
                } else {
                    console.log(`   ℹ️ Sem webhook configurado\n`);
                }
                
            } catch (error) {
                console.error(`   ❌ Erro ao verificar ${instanceName}:`, error.message);
                errorCount++;
            }
        }
        
        // Resultado final
        console.log('🎯 RESULTADO DA LIMPEZA:');
        console.log(`✅ Webhooks incorretos removidos: ${removedCount}`);
        console.log(`❌ Erros encontrados: ${errorCount}`);
        console.log(`📋 Total de instâncias verificadas: ${instances.length}`);
        
        if (removedCount > 0) {
            console.log('\n🎉 SUCESSO! Os erros 404 devem parar de aparecer nos logs da Evolution API.');
        } else {
            console.log('\n🤔 Nenhum webhook incorreto encontrado. O problema pode estar em outro lugar.');
        }
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
        console.log('\n🔧 SOLUÇÃO ALTERNATIVA: Execute os passos manuais abaixo.');
    }
})();
```

### **🎯 OPÇÃO 2: CONFIGURAR WEBHOOK CORRETO PARA O CRM**

Após remover os incorretos, configure para receber no próprio CRM:

```javascript
// SCRIPT PARA CONFIGURAR WEBHOOK CORRETO
(async () => {
    console.log('🔧 CONFIGURANDO WEBHOOK PARA O CRM...\n');
    
    try {
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Determinar URL do CRM baseado no ambiente atual
        const currentDomain = window.location.hostname;
        const currentPort = window.location.port;
        const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
        
        let crmWebhookUrl;
        
        if (isLocalhost) {
            crmWebhookUrl = `http://localhost:${currentPort || '3000'}/api/webhook/evolution`;
        } else {
            crmWebhookUrl = `https://${currentDomain}/api/webhook/evolution`;
        }
        
        console.log(`🌐 URL do CRM detectada: ${crmWebhookUrl}\n`);
        
        // Listar instâncias
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log(`📋 ${instances.length} instâncias encontradas\n`);
        
        let configuredCount = 0;
        
        // Configurar webhook correto para cada instância
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
                
                console.log(`   ✅ Webhook configurado com sucesso!\n`);
                
            } catch (error) {
                console.error(`   ❌ Erro ao configurar ${instanceName}:`, error.message);
            }
        }
        
        console.log('🎯 RESULTADO:');
        console.log(`✅ Instâncias configuradas: ${configuredCount}`);
        console.log(`🔗 URL configurada: ${crmWebhookUrl}`);
        
    } catch (error) {
        console.error('❌ ERRO:', error);
    }
})();
```

---

## 🔍 **DIAGNÓSTICO AVANÇADO**

Execute para investigar o estado atual:

```javascript
// SCRIPT DE DIAGNÓSTICO COMPLETO
(async () => {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE WEBHOOKS\n');
    
    try {
        const { evolutionApiService } = await import('@/services/evolutionApiService');
        
        // Verificar conexão com Evolution API
        console.log('1️⃣ TESTANDO CONEXÃO COM EVOLUTION API...');
        try {
            const connectionTest = await evolutionApiService.testConnection();
            console.log('   ✅ Conexão OK:', connectionTest);
        } catch (error) {
            console.error('   ❌ Falha na conexão:', error.message);
            return;
        }
        
        // Listar instâncias e seus webhooks
        console.log('\n2️⃣ ANALISANDO INSTÂNCIAS E WEBHOOKS...');
        const instancesResult = await evolutionApiService.listInstances();
        const instances = instancesResult?.data || instancesResult || [];
        
        console.log(`📋 Total de instâncias: ${instances.length}\n`);
        
        const problemInstances = [];
        
        for (const instance of instances) {
            const instanceName = instance.instanceName || instance.name || instance.instance?.instanceName;
            
            if (!instanceName) continue;
            
            console.log(`🔍 INSTÂNCIA: ${instanceName}`);
            console.log(`   📊 Status: ${instance.state || instance.status || 'unknown'}`);
            
            try {
                const webhook = await evolutionApiService.getInstanceWebhook(instanceName);
                const webhookUrl = webhook?.webhook?.url;
                
                if (webhookUrl) {
                    console.log(`   📡 Webhook: ${webhookUrl}`);
                    
                    // Verificar se é problemático
                    if (webhookUrl.includes('/webhook/res/') || 
                        webhookUrl.includes('connection-update') ||
                        webhookUrl.includes('messages-upsert')) {
                        console.log('   🚨 PROBLEMÁTICO! (Causa dos erros 404)');
                        problemInstances.push({
                            name: instanceName,
                            url: webhookUrl
                        });
                    } else {
                        console.log('   ✅ OK');
                    }
                } else {
                    console.log('   ℹ️ Sem webhook configurado');
                }
                
            } catch (error) {
                console.log(`   ❌ Erro ao verificar webhook: ${error.message}`);
            }
            
            console.log('');
        }
        
        // Resumo dos problemas
        console.log('🎯 RESUMO:');
        console.log(`❌ Instâncias com webhook problemático: ${problemInstances.length}`);
        
        if (problemInstances.length > 0) {
            console.log('\n🚨 INSTÂNCIAS PROBLEMÁTICAS:');
            problemInstances.forEach(item => {
                console.log(`   • ${item.name}: ${item.url}`);
            });
            
            console.log('\n💡 RECOMENDAÇÃO: Execute o script de limpeza (Opção 1) para resolver.');
        } else {
            console.log('\n✅ Nenhum webhook problemático encontrado!');
        }
        
    } catch (error) {
        console.error('❌ ERRO NO DIAGNÓSTICO:', error);
    }
})();
```

---

## 🛠️ **CORREÇÃO MANUAL (Se os scripts não funcionarem)**

### **1. Via API REST Diretamente:**

```bash
# 1. Listar instâncias
curl -X GET "https://press-evolution-api.jhkbgs.easypanel.host/instance/fetchInstances" \
  -H "apikey: SUA_API_KEY_AQUI"

# 2. Remover webhook de instância específica
curl -X DELETE "https://press-evolution-api.jhkbgs.easypanel.host/webhook/set/NOME_DA_INSTANCIA" \
  -H "apikey: SUA_API_KEY_AQUI"

# 3. Configurar webhook correto
curl -X POST "https://press-evolution-api.jhkbgs.easypanel.host/webhook/set/NOME_DA_INSTANCIA" \
  -H "apikey: SUA_API_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-crm.com/api/webhook/evolution",
    "enabled": true,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }'
```

### **2. Via Evolution API Dashboard:**

1. Acesse: `https://press-evolution-api.jhkbgs.easypanel.host/manager`
2. Vá em **Webhooks** 
3. **Delete** webhooks com URLs incorretas
4. **Configure** URL correta do seu CRM

---

## ✅ **VERIFICAÇÃO DE SUCESSO**

Após aplicar as correções:

1. **Logs da Evolution API** devem parar os erros 404
2. **Console do navegador** não deve mostrar erros de webhook
3. **Mensagens do WhatsApp** devem funcionar normalmente

### **Comando de verificação:**

```javascript
// Verificar se a correção funcionou
(async () => {
    const { evolutionApiService } = await import('@/services/evolutionApiService');
    const instances = await evolutionApiService.listInstances();
    
    console.log('🔍 VERIFICAÇÃO FINAL:');
    
    for (const instance of instances.data || instances) {
        const name = instance.instanceName || instance.name;
        if (!name) continue;
        
        try {
            const webhook = await evolutionApiService.getInstanceWebhook(name);
            const url = webhook?.webhook?.url;
            
            if (url) {
                const isCorrect = !url.includes('/webhook/res/') && 
                                 !url.includes('connection-update') &&
                                 !url.includes('messages-upsert');
                
                console.log(`${isCorrect ? '✅' : '❌'} ${name}: ${url}`);
            } else {
                console.log(`ℹ️ ${name}: Sem webhook`);
            }
        } catch (error) {
            console.log(`❌ ${name}: Erro - ${error.message}`);
        }
    }
})();
```

---

## 🚀 **PRÓXIMOS PASSOS**

Após corrigir os webhooks:

1. **Monitor de logs** da Evolution API para confirmar que os erros 404 pararam
2. **Teste envio/recebimento** de mensagens WhatsApp
3. **Configure monitoramento** para evitar problemas futuros
4. **Documente URLs corretas** para referência da equipe

---

> **💡 IMPORTANTE:** Os erros 404 são causados por URLs de webhook incorretas configuradas nas instâncias. A Evolution API tenta enviar para endpoints que não existem no n8n, causando falhas e retries constantes. 