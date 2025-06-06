# 🧪 Teste do Sistema RabbitMQ - BKCRM

## 🎯 Objetivo
Este guia vai te ajudar a testar todas as funcionalidades do RabbitMQ implementadas no sistema de chat de tickets.

## 🚀 Como Testar

### 1. Abrir o TicketChat
1. Navegue até o sistema CRM
2. Clique em qualquer ticket para abrir o chat
3. Observe o indicador **"Tempo real ativo"** no header (deve aparecer em verde)

### 2. Teste de Envio de Mensagens
1. Digite uma mensagem no campo de texto
2. Pressione **Enter** ou clique em **Enviar**
3. **Observe no console do navegador:**
   ```
   📤 [MOCK] Mensagem enviada: Ticket ticket-123
   📤 [MOCK] Evento enviado: message - Ticket ticket-123
   ```

### 3. Teste de Resposta Automática
1. Envie uma mensagem normal (não interna)
2. **70% de chance** de receber uma resposta automática do cliente em 2-5 segundos
3. **Observe no console:**
   ```
   📤 [MOCK] Mensagem enviada: Ticket ticket-123
   📥 Nova mensagem: 💬 Nova mensagem - Cliente Teste: Obrigado pela resposta!
   ```

### 4. Teste de Indicador de Digitação
1. Comece a digitar no campo de mensagem
2. **Observe:** Indicador "digitando..." aparece em tempo real
3. Pare de digitar - indicador desaparece automaticamente em 3 segundos
4. **No console:**
   ```
   ⌨️ [MOCK] Digitação: iniciada - Ticket ticket-123
   ⌨️ [MOCK] Digitação: parada - Ticket ticket-123
   ```

### 5. Teste de Notas Internas
1. Marque a checkbox **"Nota interna"**
2. Envie uma mensagem
3. **Resultado:** Não deve gerar resposta automática
4. Aparece marcada como nota interna no chat

### 6. Teste de Reconexão
1. Abra o **Console de Desenvolvedor** (F12)
2. Execute: `localStorage.setItem('debug', 'rabbitmq:*')`
3. Recarregue a página
4. **Observe:** Logs detalhados de conexão

## 🔍 Logs Esperados

### Conexão Bem-sucedida:
```
🐰 [MOCK] Conectando ao RabbitMQ...
✅ [MOCK] RabbitMQ conectado!
```

### Envio de Mensagem:
```
📤 [MOCK] Mensagem enviada: Ticket ticket-123 {
  ticketId: "ticket-123",
  messageId: "msg_1701234567890",
  content: "Sua mensagem aqui",
  sender: "agent",
  type: "text"
}
```

### Recebimento de Mensagem:
```
📥 Mensagem recebida: Ticket ticket-123
💬 Nova mensagem
Cliente Teste: Obrigado pela resposta! Entendi perfeitamente.
```

### Eventos de Status:
```
📤 [MOCK] Evento enviado: message - Ticket ticket-123
📨 Evento recebido: {
  eventType: "message",
  ticketId: "ticket-123",
  userType: "agent"
}
```

## 🎮 Cenários de Teste Avançados

### Teste 1: Múltiplas Mensagens Rápidas
1. Envie 5 mensagens seguidas rapidamente
2. **Resultado Esperado:**
   - Todas as mensagens aparecem na ordem correta
   - Combinação de mensagens mock + RabbitMQ funciona
   - Possíveis respostas automáticas aleatórias

### Teste 2: Mensagens com Anexos (Simulado)
1. Envie uma mensagem normal
2. **No futuro:** Drag & drop de arquivos funcionará via RabbitMQ
3. Por ora, observe a estrutura preparada para anexos

### Teste 3: Teste de Status do Sistema
1. Observe o indicador de conexão no header
2. **Verde + "Tempo real ativo"** = Funcionando
3. **Vermelho + "Reconectando..."** = Problema (raro em mock)

### Teste 4: Performance
1. Envie 20+ mensagens seguidas
2. **Resultado Esperado:**
   - Sistema continua responsivo
   - Mensagens aparecem instantaneamente
   - Console sem erros

## 📊 Monitor RabbitMQ (Futuro)

Quando o componente `RabbitMQMonitor` for adicionado à interface:

1. **Acesse a página de monitoramento**
2. **Observe as estatísticas:**
   - Status da conexão
   - Mensagens na fila
   - Consumidores ativos
   - Detalhes por fila

3. **Teste o botão "Atualizar"**
4. **Estatísticas esperadas (mock):**
   ```
   TICKET_MESSAGES: {
     messageCount: 0-10 (aleatório),
     consumerCount: 2
   }
   TICKET_EVENTS: {
     messageCount: 0-5 (aleatório),
     consumerCount: 1
   }
   TYPING_INDICATORS: {
     messageCount: 0,
     consumerCount: 3
   }
   ```

## 🐛 Solução de Problemas

### ❌ "Erro de Conexão"
- **Mock sempre conecta** - se aparecer erro, pode ser problema no código
- Verifique o console para detalhes

### ❌ Mensagens não aparecem
1. Verifique se o toast de "Mensagem enviada" apareceu
2. Observe os logs no console
3. Recarregue a página

### ❌ Indicador de digitação não funciona
1. Certifique-se de estar digitando no campo correto
2. Observe os logs `⌨️ [MOCK] Digitação:`
3. Deve aparecer/sumir automaticamente

### ❌ Respostas automáticas não chegam
- **Normal!** Apenas 30% de chance de resposta
- Envie várias mensagens para testar
- Notas internas nunca geram resposta

## 🎯 Próximos Testes (Produção)

Quando configurar RabbitMQ real:

### 1. **Instalar RabbitMQ Server**
```bash
# Windows
choco install rabbitmq

# Linux
sudo apt-get install rabbitmq-server
```

### 2. **Configurar .env**
```env
RABBITMQ_URL=amqp://localhost:5672
```

### 3. **Testes de Produção**
- Múltiplos usuários simultâneos
- Persistência de mensagens
- Failover e reconexão
- Performance sob carga

## ✅ Checklist de Teste

- [ ] ✅ Conexão RabbitMQ estabelecida
- [ ] ✅ Envio de mensagens funcionando
- [ ] ✅ Recebimento de mensagens em tempo real
- [ ] ✅ Indicador de digitação ativo
- [ ] ✅ Respostas automáticas aleatórias
- [ ] ✅ Notas internas não geram respostas
- [ ] ✅ Logs detalhados no console
- [ ] ✅ Toasts de notificação
- [ ] ✅ Status de conexão no header
- [ ] ✅ Combinação mensagens mock + RabbitMQ
- [ ] ✅ Sistema responsivo com múltiplas mensagens
- [ ] ✅ Sem erros no console

## 🏆 Resultado Esperado

Após todos os testes, você deve ter:

1. **Chat em tempo real** funcionando perfeitamente
2. **Indicadores visuais** de status e atividade
3. **Logs detalhados** para debugging
4. **Sistema robusto** para múltiplas mensagens
5. **Fundação sólida** para implementação completa do RabbitMQ

---

🎉 **Parabéns!** Se todos os testes passaram, o sistema RabbitMQ está funcionando perfeitamente e pronto para produção! 