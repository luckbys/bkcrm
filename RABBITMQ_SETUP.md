# 🐰 Configuração do RabbitMQ para BKCRM

## 📋 Pré-requisitos

### 1. Instalar RabbitMQ

#### Windows:
```bash
# Usando Chocolatey
choco install rabbitmq

# Ou baixar do site oficial
# https://www.rabbitmq.com/install-windows.html
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

#### macOS:
```bash
# Usando Homebrew
brew install rabbitmq
brew services start rabbitmq
```

#### Docker:
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3-management
```

### 2. Habilitar Management Plugin

```bash
# Habilitar plugin de gerenciamento
rabbitmq-plugins enable rabbitmq_management

# Acessar painel web: http://localhost:15672
# Usuário padrão: guest / guest
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_EXCHANGE_PREFIX=bkcrm

# Application
NODE_ENV=development
PORT=3000
```

### 2. Estrutura das Filas

O sistema cria automaticamente:

#### **Exchanges:**
- `ticket.exchange` (tipo: topic) - Mensagens e eventos de tickets
- `notification.exchange` (tipo: direct) - Notificações

#### **Filas:**
- `ticket.messages` - Mensagens do chat (TTL: 24h)
- `ticket.events` - Eventos de mudança de status, atribuição, etc.
- `ticket.typing` - Indicadores de digitação (TTL: 10s)
- `ticket.notifications` - Notificações gerais

#### **Routing Keys:**
- `ticket.message.{ticketId}` - Mensagens específicas do ticket
- `ticket.event.{eventType}` - Eventos por tipo
- `notification` - Notificações gerais

## 🚀 Como Usar

### 1. Conectar ao RabbitMQ

```typescript
import { useRabbitMQ } from '@/hooks/useRabbitMQ';

const { 
  isConnected, 
  publishMessage, 
  onMessage 
} = useRabbitMQ('ticket-123');
```

### 2. Enviar Mensagem

```typescript
await publishMessage({
  ticketId: 'ticket-123',
  messageId: 'msg_123',
  content: 'Olá, como posso ajudar?',
  sender: 'agent',
  senderName: 'João Silva',
  timestamp: new Date(),
  type: 'text',
  isInternal: false,
  attachments: []
});
```

### 3. Receber Mensagens

```typescript
useEffect(() => {
  const unsubscribe = onMessage((message) => {
    console.log('Nova mensagem:', message);
    // Atualizar estado local
  });

  return unsubscribe;
}, [onMessage]);
```

### 4. Indicador de Digitação

```typescript
// Começar a digitar
await publishTyping({
  ticketId: 'ticket-123',
  userId: 'user-123',
  userType: 'agent',
  isTyping: true,
  timestamp: new Date()
});

// Parar de digitar
await publishTyping({
  ticketId: 'ticket-123',
  userId: 'user-123',
  userType: 'agent',
  isTyping: false,
  timestamp: new Date()
});
```

## 📊 Monitoramento

### 1. Painel Web
Acesse `http://localhost:15672` para monitorar:
- Filas e mensagens
- Conexões ativas
- Taxa de mensagens
- Estatísticas de performance

### 2. Estatísticas no App

```typescript
const { getStats } = useRabbitMQ();

const stats = await getStats();
console.log(stats);
// {
//   TICKET_MESSAGES: { messageCount: 5, consumerCount: 2 },
//   TICKET_EVENTS: { messageCount: 1, consumerCount: 1 }
// }
```

## 🛠️ Troubleshooting

### 1. Erro de Conexão
```
❌ Erro ao conectar com RabbitMQ: connect ECONNREFUSED
```

**Solução:**
- Verificar se RabbitMQ está rodando: `rabbitmq-diagnostics status`
- Verificar porta 5672 está aberta
- Verificar credenciais no `.env`

### 2. Permissões Negadas
```
❌ ACCESS_REFUSED - Login was refused using authentication mechanism PLAIN
```

**Solução:**
- Criar usuário específico:
```bash
rabbitmqctl add_user bkcrm_user password123
rabbitmqctl set_permissions -p / bkcrm_user ".*" ".*" ".*"
rabbitmqctl set_user_tags bkcrm_user administrator
```

### 3. Mensagens não chegam
- Verificar routing keys
- Verificar bindings das filas
- Verificar se consumer está ativo

## 🔒 Produção

### 1. Configurações de Segurança

```env
RABBITMQ_URL=amqps://user:pass@production-server:5671
RABBITMQ_USER=production_user
RABBITMQ_PASSWORD=secure_password_here
RABBITMQ_VHOST=/bkcrm
```

### 2. Configurações de Performance

```typescript
// Configurar TTL para mensagens antigas
await channel.assertQueue('ticket.messages', {
  durable: true,
  arguments: {
    'x-message-ttl': 86400000, // 24 horas
    'x-max-length': 10000,     // Máximo 10k mensagens
    'x-overflow': 'drop-head'  // Remover mensagens antigas
  }
});
```

### 3. Monitoramento Avançado

- Configurar alertas para filas com muitas mensagens
- Monitorar conexões ativas
- Logs de auditoria para mensagens importantes

## 📝 Logs de Debug

Para habilitar logs detalhados:

```typescript
// No console do navegador
localStorage.setItem('debug', 'rabbitmq:*');

// Ou no código
console.log('🐰 [DEBUG] Estado RabbitMQ:', {
  connected: isConnected,
  error: connectionError,
  typingUsers: Array.from(typingUsers),
  queueStats
});
```

## 🎯 Próximos Passos

1. **Persistência**: Integrar com banco de dados para salvar mensagens
2. **Autenticação**: Adicionar JWT para autenticar usuários
3. **Notificações Push**: Integrar com service workers
4. **Escalabilidade**: Cluster RabbitMQ para alta disponibilidade
5. **Analytics**: Métricas de tempo de resposta e satisfação

---

💡 **Dica**: Para desenvolvimento, o mock RabbitMQ funciona automaticamente. Para produção, configure um servidor RabbitMQ real. 