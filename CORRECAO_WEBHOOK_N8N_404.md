# 🚨 CORREÇÃO ERRO 404 - WEBHOOK N8N EVOLUTION API

## ❌ **ERRO ATUAL:**
```
Request failed with status code 404
URL: https://press-n8n.jhkbgs.easypanel.host/webhook/res/
Tentativa 5/10 falhou
```

## 🔍 **CAUSA DO PROBLEMA:**
A Evolution API está tentando enviar webhooks para uma URL que **não existe** no N8N.

---

## ⚡ **SOLUÇÕES IMEDIATAS:**

### **OPÇÃO 1: 🗑️ REMOVER WEBHOOK INCORRETO (RECOMENDADO)**

Execute no console do BKCRM (F12):
```javascript
// Listar todas as instâncias e seus webhooks
const instances = await evolutionApiService.listInstances();
console.log('Instâncias:', instances);

// Para cada instância, verificar webhook
for (const instance of instances.data) {
    const webhook = await evolutionApiService.getInstanceWebhook(instance.name);
    console.log(`Webhook ${instance.name}:`, webhook);
    
    // Se encontrar webhook com URL incorreta, remover
    if (webhook.webhook?.url?.includes('webhook/res/connection-update')) {
        console.log(`❌ Removendo webhook incorreto de ${instance.name}`);
        await evolutionApiService.removeInstanceWebhook(instance.name);
    }
}
```

### **OPÇÃO 2: 🔧 CORRIGIR URL DO WEBHOOK**

**2.1. URL Correta para BKCRM:**
```
https://seu-dominio-crm.com/api/webhook/evolution
```

**2.2. Atualizar webhook com URL correta:**
```javascript
// Configurar webhook correto para sua instância
const instanceName = 'sua-instancia'; // substitua pelo nome real

await evolutionApiService.setInstanceWebhook(instanceName, {
    url: 'https://seu-dominio-crm.com/api/webhook/evolution',
    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
    enabled: true
});
```

---

## 🛠️ **CONFIGURAÇÃO CORRETA DO WEBHOOK:**

### **1. 📋 Listar Instâncias Existentes:**
```javascript
// No console do BKCRM
const instances = await evolutionApiService.listInstances();
instances.data.forEach(instance => {
    console.log(`Instância: ${instance.name} - Status: ${instance.state}`);
});
```

### **2. ✅ Configurar Webhook Correto:**
```javascript
const instanceName = 'SUA_INSTANCIA'; // substitua

// Configurar webhook para receber no CRM
await evolutionApiService.setInstanceWebhook(instanceName, {
    url: 'https://seu-crm.com/api/webhook/evolution',
    events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
    ],
    enabled: true
});

console.log('✅ Webhook configurado para o CRM');
```

### **3. 🔍 Verificar Configuração:**
```javascript
const webhook = await evolutionApiService.getInstanceWebhook(instanceName);
console.log('Webhook atual:', webhook);
```

---

## 🚫 **REMOVER WEBHOOKS INCORRETOS:**

### **Método 1: Via Console CRM**
```javascript
// Remover webhook de instância específica
await evolutionApiService.removeInstanceWebhook('nome-da-instancia');

// Ou remover de todas as instâncias
const instances = await evolutionApiService.listInstances();
for (const instance of instances.data) {
    await evolutionApiService.removeInstanceWebhook(instance.name);
    console.log(`✅ Webhook removido de ${instance.name}`);
}
```

### **Método 2: Via API diretamente**
```bash
# Listar instâncias
curl -X GET "https://press-evolution-api.jhkbgs.easypanel.host/instance/fetchInstances" \
  -H "apikey: SUA_API_KEY"

# Remover webhook de instância específica
curl -X DELETE "https://press-evolution-api.jhkbgs.easypanel.host/webhook/set/NOME_INSTANCIA" \
  -H "apikey: SUA_API_KEY"
```

---

## 🎯 **CONFIGURAÇÃO IDEAL:**

### **Para Sistema CRM (Recomendado):**
```javascript
// Webhook apontando para seu CRM
const webhookConfig = {
    url: 'https://seu-crm.com/api/webhook/evolution',
    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
    enabled: true
};
```

### **Para N8N (Se necessário):**
```javascript
// Se realmente quiser usar N8N, crie webhook correto no N8N primeiro
const webhookConfig = {
    url: 'https://press-n8n.jhkbgs.easypanel.host/webhook/evolution-webhook',
    events: ['MESSAGES_UPSERT'],
    enabled: true
};
```

---

## 🧪 **TESTAR FUNCIONAMENTO:**

```javascript
// Após configurar, teste enviando mensagem
testWebhookTicketCreation();

// Verificar logs no console
console.log('Testando webhook...');
```

---

## ⚠️ **OBSERVAÇÕES IMPORTANTES:**

1. **URL N8N estava incorreta**: `/webhook/res/connection-update` não é um endpoint válido
2. **CRM já processa webhooks**: O sistema já tem processamento completo de webhooks
3. **N8N pode ser opcional**: Para WhatsApp básico, o CRM sozinho já funciona
4. **Sempre teste**: Após configurar, sempre teste com mensagem real

---

## 🚀 **SOLUÇÃO MAIS RÁPIDA:**

Execute este comando para **remover todos os webhooks incorretos**:

```javascript
// Cole no console do CRM (F12)
(async () => {
    try {
        const instances = await evolutionApiService.listInstances();
        for (const instance of instances.data) {
            await evolutionApiService.removeInstanceWebhook(instance.name);
            console.log(`✅ Webhook removido de ${instance.name}`);
        }
        console.log('🎉 Todos os webhooks incorretos foram removidos!');
    } catch (error) {
        console.error('❌ Erro:', error);
    }
})();
```

**Resultado**: Sem mais erros 404! 🚀 