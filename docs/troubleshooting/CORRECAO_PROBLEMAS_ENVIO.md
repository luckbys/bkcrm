# 🚨 CORREÇÃO DE PROBLEMAS - ENVIO DE MENSAGENS EVOLUTION API

## 📋 PROBLEMAS IDENTIFICADOS

### 1. **Problema Principal: Formato do Payload Incorreto**
- **O que está acontecendo**: O payload atual usa `textMessage: { text }` mas a Evolution API espera apenas `text`
- **Evidência nos logs**: Mensagens não estão sendo enviadas apesar de não haver erros explícitos
- **Causa**: Duas versões diferentes da documentação Evolution API

### 2. **Problema Secundário: Formatação de Telefone**
- **O que está acontecendo**: Função `formatPhoneNumber` remove `@s.whatsapp.net` mas Evolution API pode precisar
- **Evidência**: Configuração inconsistente entre webhook e frontend

### 3. **Problema de Configuração: URLs e Keys**
- **O que está acontecendo**: Pode haver divergência entre URLs configuradas e as reais
- **Evidência**: Logs mostram URLs diferentes

## ✅ SOLUÇÕES IMPLEMENTADAS

### **SOLUÇÃO 1: Corrigir Payload Evolution API**

**Arquivo: `webhook-evolution-complete.js`**

O payload correto deve seguir este formato:
```javascript
// ❌ FORMATO INCORRETO (atual)
const payload = {
  number: formattedPhone,
  textMessage: {
    text: text
  },
  options: { ... }
};

// ✅ FORMATO CORRETO (corrigido)
const payload = {
  number: formattedPhone,
  text: text,
  options: { ... }
};
```

### **SOLUÇÃO 2: Corrigir Formatação de Telefone**

```javascript
function formatPhoneNumber(phone) {
  // Remover caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com código do país, adicionar +55 (Brasil)
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }
  
  // ✅ CORREÇÃO: NÃO remover @s.whatsapp.net - Evolution API decide internamente
  return cleaned;
}
```

### **SOLUÇÃO 3: Verificar e Corrigir Configurações**

**Arquivo: `webhook.env`**
```env
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
EVOLUTION_DEFAULT_INSTANCE=atendimento-ao-cliente-suporte
```

## 🔧 IMPLEMENTAÇÃO DAS CORREÇÕES

### **1. Executar Script de Diagnóstico**
```javascript
// No console do navegador:
// 1. Vá para http://localhost:3000
// 2. Abra o console (F12)
// 3. Cole e execute:
fetch('/DIAGNOSTICO_ENVIO_MENSAGENS.js')
  .then(response => response.text())
  .then(script => eval(script));
```

### **2. Aplicar Correções no Webhook**

O payload já foi corrigido na versão atual do `webhook-evolution-complete.js`:

```javascript
// Payload correto já implementado
const payload = {
  number: formattedPhone,
  text: text,  // ✅ Correto: usar 'text' diretamente
  options: {
    delay: options.delay || 1000,
    presence: options.presence || 'composing',
    linkPreview: options.linkPreview !== false,
    ...options
  }
};
```

### **3. Verificar Instância Evolution API**

**Status da Instância:**
- Nome: `atendimento-ao-cliente-suporte`
- Status: Deve estar `CONNECTED`
- URL: `https://press-evolution-api.jhkbgs.easypanel.host`

## 🧪 TESTES DE VALIDAÇÃO

### **Teste 1: Webhook Health Check**
```bash
curl -X GET http://localhost:4000/webhook/health
```

### **Teste 2: Envio de Mensagem**
```bash
curl -X POST http://localhost:4000/webhook/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "text": "Teste de envio via API",
    "instance": "atendimento-ao-cliente-suporte"
  }'
```

### **Teste 3: Frontend Integration**
```javascript
// No console do navegador:
diagnosticoEnvioMensagens();
```

## 📊 PRÓXIMOS PASSOS

1. **✅ IMEDIATO**: Execute o script de diagnóstico
2. **✅ CORREÇÃO**: Verifique se payload está correto no webhook
3. **✅ TESTE**: Teste envio manual via curl ou console
4. **✅ VALIDAÇÃO**: Confirme recebimento da mensagem no WhatsApp
5. **✅ MONITORAMENTO**: Acompanhe logs do webhook e Evolution API

## 🚨 TROUBLESHOOTING

### **Se o diagnóstico falhar:**

1. **Webhook Offline** (❌ Health Check)
   ```bash
   cd /path/to/projeto
   node webhook-evolution-complete.js
   ```

2. **Evolution API Inacessível** (❌ Endpoint Envio)
   - Verificar se URL está correta
   - Verificar se API Key é válida
   - Verificar se instância existe e está conectada

3. **Payload Incorreto** (❌ Resposta de Erro)
   - Verificar se payload segue formato correto
   - Verificar logs detalhados no webhook

4. **Instância Desconectada** (❌ WhatsApp)
   - Verificar QR Code na Evolution API
   - Reconectar instância se necessário
   - Verificar se número WhatsApp não foi banido

## 📱 COMANDOS ÚTEIS PARA DEBUG

```javascript
// Verificar health do webhook
verificarSaude()

// Testar envio manual
testarEnvioManual()

// Diagnóstico completo
diagnosticoEnvioMensagens()

// Verificar configurações Evolution
console.log('Configurações:', {
  URL: 'https://press-evolution-api.jhkbgs.easypanel.host',
  Instance: 'atendimento-ao-cliente-suporte',
  Key: '429683C4C977415CAAFCCE10F7D57E11'
});
```

## ✅ STATUS ESPERADO APÓS CORREÇÕES

- **Webhook Health**: ✅ Funcionando
- **Endpoint Envio**: ✅ Respondendo corretamente
- **Evolution API**: ✅ Recebendo mensagens
- **WhatsApp**: ✅ Entregando mensagens
- **Frontend**: ✅ Notificações de sucesso

---

⚡ **RESULTADO ESPERADO**: Mensagens enviadas do CRM devem chegar no WhatsApp do cliente em até 5 segundos. 