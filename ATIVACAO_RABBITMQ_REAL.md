# 🚀 Ativação do RabbitMQ Real - Cluster rabbit@dceb589369d8

## ⚡ Ativação Rápida

### 1. **Via Interface (Recomendado)**

1. Abra qualquer ticket no sistema para acessar o chat
2. **No console do navegador (F12)**, execute:
   ```javascript
   localStorage.setItem('rabbitmq_real', 'true');
   window.location.reload();
   ```

3. **OU** adicione o componente `RabbitMQControl` em uma página administrativa:
   ```tsx
   import { RabbitMQControl } from '@/components/crm/RabbitMQControl';
   
   // Na sua página
   <RabbitMQControl />
   ```

### 2. **Verificação da Ativação**

Após ativar, você verá no console:
```
🔧 Usando serviço: RabbitMQ Real
🎯 Cluster de destino: rabbit@dceb589369d8
👤 Usuário: guest
🐰 [REAL] Conectando ao cluster RabbitMQ: rabbit@dceb589369d8
✅ [REAL] Conectado ao cluster rabbit@dceb589369d8 como guest
🔧 [REAL] Configurando filas e exchanges...
📋 [REAL] Criando filas:
  - ticket.messages (TTL: 24h)
  - ticket.events
  - ticket.typing (TTL: 10s)
  - ticket.notifications
```

## 🎯 Configuração Aplicada

```yaml
Cluster: rabbit@dceb589369d8
Usuário: guest
Senha: guest
Host: dceb589369d8
Porta: 5672
VHost: /
URL: amqp://guest:guest@dceb589369d8:5672/
```

## 🔄 Alternar Entre Modos

### **Ativar RabbitMQ Real:**
```javascript
localStorage.setItem('rabbitmq_real', 'true');
window.location.reload();
```

### **Voltar ao Mock:**
```javascript
localStorage.setItem('rabbitmq_real', 'false');
// OU
localStorage.removeItem('rabbitmq_real');
window.location.reload();
```

## 📊 Indicadores Visuais

### **No TicketChat:**
- **Indicador verde:** "Tempo real ativo" = RabbitMQ funcionando
- **Indicador vermelho:** "Reconectando..." = Problema de conexão

### **Nos Logs:**
- **[REAL]** = RabbitMQ real ativo
- **[MOCK]** = Simulação local ativa

### **Mensagens Esperadas:**
```
📤 [REAL] Enviando para rabbit@dceb589369d8: Ticket ticket-123
📤 [REAL] Evento para rabbit@dceb589369d8: message - Ticket ticket-123
⌨️ [REAL] Cluster rabbit@dceb589369d8: digitando - Ticket ticket-123
```

## 🧪 Teste Rápido

1. **Ative o RabbitMQ real**
2. **Abra um ticket** e envie uma mensagem
3. **Verifique os logs** - deve mostrar `[REAL]`
4. **40% de chance** de resposta automática do "Sistema RabbitMQ"

### **Resposta Automática Esperada:**
```
Mensagem processada pelo cluster rabbit@dceb589369d8. 
Resposta automática ativada.
```

## 🔧 Troubleshooting

### ❌ **Não ativa mesmo executando o comando**
- Certifique-se de recarregar a página: `window.location.reload();`
- Verifique no localStorage: `localStorage.getItem('rabbitmq_real')`

### ❌ **Logs ainda mostram [MOCK]**
- Execute novamente: `localStorage.setItem('rabbitmq_real', 'true');`
- Hard refresh: `Ctrl+F5` ou `Ctrl+Shift+R`

### ❌ **Erro de conexão**
- O sistema tentará reconectar automaticamente
- Verifique se o cluster `dceb589369d8` está acessível
- Logs mostrarão tentativas de reconexão

### ❌ **Indicador vermelho no header**
- Normal durante a conexão inicial (2-3 segundos)
- Se persistir, verifique conectividade com o cluster

## 🎉 Sucesso!

Quando funcionando corretamente, você verá:
- ✅ Indicador verde "Tempo real ativo"
- ✅ Logs com `[REAL]` no console
- ✅ Mensagens processadas pelo cluster
- ✅ Possíveis respostas automáticas do "Sistema RabbitMQ"

---

💡 **Dica:** Use `localStorage.getItem('rabbitmq_real')` para verificar o status atual. Retorna `'true'` se o RabbitMQ real estiver ativo. 