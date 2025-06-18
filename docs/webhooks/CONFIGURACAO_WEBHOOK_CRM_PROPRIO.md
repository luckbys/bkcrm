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

## 🛠️ **STEP 3: VERIFICAR SE O ENDPOINT EXISTE**

O sistema **já tem o processamento implementado** em:
- `src/services/evolution-webhook-processor.ts`
- `src/services/webhook-evolution-handler.ts`

### **Mas precisa de um endpoint HTTP. Vamos verificar:**

```javascript
// 3. TESTAR SE O ENDPOINT RESPONDE
(async () => {
    const testUrl = 'https://seu-dominio.com/api/webhook/evolution';
    
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'TEST',
                instance: 'test',
                data: { test: true }
            })
        });
        
        console.log('🧪 Teste do endpoint:', response.status);
        
        if (response.status === 404) {
            console.log('❌ Endpoint não existe! Precisa criar no backend');
        } else {
            console.log('✅ Endpoint respondeu:', await response.text());
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
})();
```

---

## 🚀 **STEP 4: SE ENDPOINT NÃO EXISTIR, CRIAR**

### **Opção A: Usar Processamento Client-Side (Mais Fácil)**

```javascript
// 4A. CONFIGURAR PROCESSAMENTO VIA WINDOW GLOBAL
// Adicione no main.tsx ou index.html

// Função global para receber webhooks
window.processEvolutionWebhook = async (payload) => {
    try {
        console.log('📨 Webhook recebido:', payload);
        
        // Usar o processador existente
        const { EvolutionWebhookProcessor } = await import('./src/services/evolution-webhook-processor');
        await EvolutionWebhookProcessor.processWebhook(payload);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        return { success: false, error: error.message };
    }
};

console.log('✅ Processador de webhook global configurado');
```

### **Opção B: Criar Endpoint Real (Recomendado para Produção)**

```javascript
// 4B. ENDPOINT PARA ADICIONAR NO SEU BACKEND
/*
POST /api/webhook/evolution

const express = require('express');
const app = express();

app.post('/api/webhook/evolution', async (req, res) => {
    try {
        const payload = req.body;
        console.log('📨 Webhook Evolution recebido:', payload.event, payload.instance);
        
        // Processar usando o código do CRM
        // (importar EvolutionWebhookProcessor do frontend)
        
        // Filtrar apenas mensagens relevantes
        if (payload.event === 'MESSAGES_UPSERT' && !payload.data.key.fromMe) {
            // Criar ticket automaticamente
            await processIncomingMessage(payload);
        }
        
        res.status(200).json({ success: true, received: payload.event });
        
    } catch (error) {
        console.error('❌ Erro webhook:', error);
        res.status(500).json({ error: error.message });
    }
});
*/
```

---

## 🧪 **STEP 5: TESTAR FUNCIONAMENTO**

```javascript
// 5. TESTE COMPLETO
(async () => {
    console.log('🧪 Iniciando teste completo...');
    
    // Verificar instâncias
    const instances = await evolutionApiService.listInstances();
    console.log(`📱 ${instances.data.length} instâncias encontradas`);
    
    for (const instance of instances.data) {
        if (instance.state === 'open') {
            console.log(`✅ ${instance.name}: Conectada`);
            
            // Verificar webhook
            const webhook = await evolutionApiService.getInstanceWebhook(instance.name);
            if (webhook.webhook?.url?.includes('seu-dominio.com')) {
                console.log(`🎯 ${instance.name}: Webhook configurado para CRM`);
            } else {
                console.log(`⚠️ ${instance.name}: Webhook não configurado`);
            }
        } else {
            console.log(`❌ ${instance.name}: Desconectada (${instance.state})`);
        }
    }
    
    console.log('🎉 Teste concluído!');
})();
```

---

## 📊 **STEP 6: MONITORAR FUNCIONAMENTO**

```javascript
// 6. MONITOR EM TEMPO REAL
setInterval(async () => {
    try {
        // Verificar mensagens recentes
        const recentMessages = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (recentMessages.data.length > 0) {
            const lastMessage = recentMessages.data[0];
            const timeAgo = Date.now() - new Date(lastMessage.created_at).getTime();
            
            if (timeAgo < 60000) { // Menos de 1 minuto
                console.log('📨 Nova mensagem recebida:', lastMessage.content);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no monitor:', error);
    }
}, 10000); // Verificar a cada 10 segundos
```

---

## 🎯 **URLS DE EXEMPLO PARA SEU CASO:**

### **Se o CRM estiver em:**
- **Localhost**: `http://localhost:3007/api/webhook/evolution`
- **Vercel**: `https://seu-app.vercel.app/api/webhook/evolution`
- **Netlify**: `https://seu-app.netlify.app/api/webhook/evolution`
- **Domínio próprio**: `https://seu-dominio.com/api/webhook/evolution`

---

## ✅ **RESULTADO ESPERADO:**

1. **🚫 Sem mais erros 404** nos logs da Evolution API
2. **📨 Mensagens chegando** direto no CRM
3. **🎫 Tickets criados automaticamente** 
4. **⚡ Tempo real** sem intermediários
5. **💾 Dados persistidos** no banco Supabase

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