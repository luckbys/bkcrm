# 🎯 CONFIGURAR WEBHOOK PARA O PRÓPRIO CRM

## ✅ **VANTAGENS DE USAR O PRÓPRIO CRM:**

1. **🚀 Performance**: Comunicação direta sem intermediários
2. **🔒 Segurança**: Dados ficam no seu próprio sistema  
3. **🛠️ Controle Total**: Processamento customizado
4. **💾 Persistência**: Dados salvos diretamente no banco
5. **⚡ Tempo Real**: Sem latência adicional

---

## 🌐 **STEP 1: IDENTIFICAR URL DO SEU CRM**

### **Desenvolvimento (Local):**
```
URL Local: http://localhost:3007/api/webhook/evolution
```

### **Produção (Substituir pelo seu domínio):**
```
URL Produção: https://seu-dominio.com/api/webhook/evolution
```

---

## 🔧 **STEP 2: CONFIGURAR WEBHOOK VIA CONSOLE**

### **Abra o console do CRM (F12) e execute:**

```javascript
// 1. REMOVER WEBHOOKS INCORRETOS PRIMEIRO
(async () => {
    console.log('🧹 Limpando webhooks incorretos...');
    
    const instances = await evolutionApiService.listInstances();
    console.log(`📋 ${instances.data.length} instâncias encontradas`);
    
    for (const instance of instances.data) {
        try {
            // Verificar webhook atual
            const currentWebhook = await evolutionApiService.getInstanceWebhook(instance.name);
            console.log(`🔍 Webhook atual ${instance.name}:`, currentWebhook.webhook?.url);
            
            // Se tem webhook incorreto, remover
            if (currentWebhook.webhook?.url?.includes('n8n') || 
                currentWebhook.webhook?.url?.includes('connection-update')) {
                await evolutionApiService.removeInstanceWebhook(instance.name);
                console.log(`❌ Webhook incorreto removido de ${instance.name}`);
            }
        } catch (error) {
            console.log(`⚠️ Erro ao verificar ${instance.name}:`, error.message);
        }
    }
    
    console.log('✅ Limpeza concluída!');
})();
```

### **2. CONFIGURAR WEBHOOK PARA O CRM:**

```javascript
// 2. CONFIGURAR WEBHOOK CORRETO
(async () => {
    console.log('🎯 Configurando webhook para o CRM...');
    
    // ALTERE ESTA URL PARA O SEU DOMÍNIO EM PRODUÇÃO
    const WEBHOOK_URL = 'https://seu-dominio.com/api/webhook/evolution';
    // Para desenvolvimento local: 'http://localhost:3007/api/webhook/evolution'
    
    const instances = await evolutionApiService.listInstances();
    
    for (const instance of instances.data) {
        if (instance.state === 'open') { // Apenas instâncias conectadas
            try {
                await evolutionApiService.setInstanceWebhook(instance.name, {
                    url: WEBHOOK_URL,
                    events: [
                        'MESSAGES_UPSERT',      // Mensagens recebidas
                        'CONNECTION_UPDATE',    // Status de conexão
                        'QRCODE_UPDATED'       // QR Code atualizado
                    ],
                    enabled: true
                });
                
                console.log(`✅ Webhook configurado para ${instance.name}`);
                
                // Verificar se funcionou
                const check = await evolutionApiService.getInstanceWebhook(instance.name);
                console.log(`🔍 Verificação ${instance.name}:`, check.webhook?.url);
                
            } catch (error) {
                console.error(`❌ Erro ao configurar ${instance.name}:`, error.message);
            }
        } else {
            console.log(`⚠️ Instância ${instance.name} não está conectada (${instance.state})`);
        }
    }
    
    console.log('🎉 Configuração concluída!');
})();
```

---

## 🚀 **COMANDO RÁPIDO PARA TESTAR:**

```javascript
// COLE NO CONSOLE E SUBSTITUA A URL
(async () => {
    const WEBHOOK_URL = 'https://SEU-DOMINIO.com/api/webhook/evolution';
    
    const instances = await evolutionApiService.listInstances();
    for (const instance of instances.data.filter(i => i.state === 'open')) {
        await evolutionApiService.setInstanceWebhook(instance.name, {
            url: WEBHOOK_URL,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
            enabled: true
        });
        console.log(`✅ ${instance.name} configurado`);
    }
    console.log('🎉 Pronto! Agora teste enviando uma mensagem no WhatsApp');
})();
```

**🎯 Substitua `SEU-DOMINIO.com` pela URL real do seu CRM!**

---

## ✅ **RESULTADO ESPERADO:**

1. **🚫 Sem mais erros 404** nos logs da Evolution API
2. **📨 Mensagens chegando** direto no CRM
3. **🎫 Tickets criados automaticamente** 
4. **⚡ Tempo real** sem intermediários
5. **💾 Dados persistidos** no banco Supabase 