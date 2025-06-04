# Configuração Evolution API - CRM

Esta documentação explica como configurar e usar a integração da Evolution API para gerenciar instâncias do WhatsApp por departamento no sistema CRM.

## 📋 Pré-requisitos

1. **Servidor Evolution API configurado e rodando**
2. **API Key global configurada no servidor**
3. **Acesso às portas necessárias (HTTP/HTTPS)**

## 🚀 Configuração Inicial

### 1. Configurar Servidor Evolution API

Primeiro, você precisa ter um servidor Evolution API rodando. Você pode:

- Usar a [documentação oficial](https://doc.evolution-api.com) para instalação
- Usar Docker: `docker run -d --name evolution-api evolutionapi/evolution-api`
- Usar serviços de hospedagem como Railway, Heroku, etc.

### 2. Obter API Key

No seu servidor Evolution API, configure uma API Key global que será usada para autenticação:

```bash
# Variável de ambiente no servidor
GLOBAL_APIKEY=sua-chave-muito-segura-aqui
```

### 3. Configurar no CRM

1. Acesse a página **Configurações Evolution API** no CRM
2. Preencha os campos:
   - **URL do Servidor**: `https://seu-servidor.com`
   - **API Key Global**: `sua-chave-muito-segura-aqui`
3. Clique em **Testar Conexão**
4. Se a conexão for bem-sucedida, o gerenciador de instâncias será exibido

## 🏢 Gerenciamento por Departamento

### Departamentos Disponíveis

O sistema vem pré-configurado com os seguintes departamentos:

- **Vendas** 🔵 - Prospecção e vendas
- **Suporte Técnico** 🟢 - Atendimento técnico
- **Atendimento ao Cliente** 🟣 - Atendimento geral
- **Financeiro** 🟡 - Cobrança e pagamentos
- **Marketing** 🟠 - Campanhas e relacionamento
- **Recursos Humanos** 🩷 - Gestão de pessoas (inativo por padrão)

### Criar Nova Instância

1. Clique em **Nova Instância**
2. Selecione o **Departamento**
3. Configure:
   - **Número de Telefone** (opcional)
   - **Webhook URL** (opcional)
   - **Configurações avançadas**
4. Clique em **Criar Instância**
5. O sistema automaticamente tentará conectar

### Conectar WhatsApp

Após criar a instância:

1. Um QR Code será exibido automaticamente
2. Abra o WhatsApp no celular
3. Vá em **Mais opções > Dispositivos conectados**
4. Toque em **Conectar um dispositivo**
5. Escaneie o QR Code
6. A instância ficará com status **Conectado**

## ⚙️ Configurações Avançadas

### Configurações de Instância

- **Sempre Online**: Mantém o WhatsApp sempre online
- **Marcar como Lido**: Marca mensagens como lidas automaticamente
- **Rejeitar Chamadas**: Rejeita chamadas automaticamente
- **Mensagem para Chamadas**: Mensagem enviada quando chamadas são rejeitadas
- **Ignorar Grupos**: Não processa mensagens de grupos
- **Sincronizar Histórico**: Sincroniza histórico completo do WhatsApp

### Webhooks

Configure webhooks para receber eventos em tempo real:

```bash
# URL do webhook no formato
https://seu-crm.com/webhook/whatsapp/{departmentId}
```

Eventos disponíveis:
- `MESSAGES_UPSERT` - Novas mensagens
- `MESSAGES_UPDATE` - Mensagens atualizadas  
- `CONNECTION_UPDATE` - Status de conexão
- `QRCODE_UPDATED` - QR Code atualizado

## 🔧 Status das Instâncias

### Estados Possíveis

- **Configured** 🕐 - Instância criada, aguardando conexão
- **Connecting** 🔄 - Tentando conectar ao WhatsApp
- **Connected** ✅ - Conectado e funcionando
- **Disconnected** ❌ - Desconectado do WhatsApp
- **Error** ⚠️ - Erro na instância

### Ações Disponíveis

- **Conectar**: Inicia processo de conexão
- **Desconectar**: Desconecta do WhatsApp
- **Reconectar**: Tenta reconectar instância com erro
- **QR Code**: Exibe QR Code para reconexão
- **Configurações**: Edita configurações da instância
- **Remover**: Remove instância permanentemente

## 📡 API Integration

### Usar Instâncias no Código

```typescript
// Importar as classes
import { EvolutionAPIService, DepartmentInstanceManager } from '@/lib/evolution-api';

// Inicializar
const evolutionAPI = new EvolutionAPIService(serverUrl, globalApiKey);
const manager = new DepartmentInstanceManager(evolutionAPI);

// Enviar mensagem por departamento
await manager.sendDepartmentMessage(
  'sales', // ID do departamento
  '5511999999999', // Número do destinatário
  'Olá! Como posso ajudar?' // Mensagem
);

// Verificar status
const instance = manager.getDepartmentInstance('sales');
console.log(instance?.status); // 'connected', 'disconnected', etc.
```

### Integração com Tickets

```typescript
// No sistema de tickets, usar a instância do departamento correspondente
const ticket = {
  departmentId: 'support',
  clientPhone: '5511999999999',
  // ... outros campos
};

// Enviar mensagem automática
if (ticket.departmentId) {
  await manager.sendDepartmentMessage(
    ticket.departmentId,
    ticket.clientPhone,
    'Seu ticket foi criado! Em breve entraremos em contato.'
  );
}
```

## 🔒 Segurança

### Boas Práticas

1. **API Keys Seguras**: Use chaves longas e aleatórias
2. **HTTPS Obrigatório**: Sempre use HTTPS em produção
3. **Firewall**: Configure firewall para permitir apenas IPs necessários
4. **Logs**: Monitore logs para detectar tentativas de acesso não autorizado
5. **Backup**: Faça backup das configurações regularmente

### Variáveis de Ambiente

```bash
# Arquivo .env
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host/
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
WEBHOOK_BASE_URL=https://seu-crm.com/webhook
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Erro de Conexão
- Verifique se o servidor está rodando
- Confirme a URL e API Key
- Teste conectividade de rede

#### QR Code Não Carrega
- Aguarde alguns segundos após conectar
- Clique em "Atualizar QR" se necessário
- Verifique logs do servidor Evolution API

#### Instância Desconecta Sozinha
- Verifique se o WhatsApp está ativo no celular
- Confirme se não há outros dispositivos conectados
- Reinicie a instância se necessário

#### Mensagens Não São Enviadas
- Verifique se a instância está conectada
- Confirme o formato do número de telefone
- Verifique rate limits do WhatsApp

### Logs e Debug

```typescript
// Habilitar logs detalhados
localStorage.setItem('evolution-debug', 'true');

// Ver estado das instâncias
console.log(manager.getAllDepartmentInstances());

// Verificar conexão
const status = await evolutionAPI.getInfo();
console.log(status);
```

## 📞 Suporte

- **Documentação Evolution API**: https://doc.evolution-api.com
- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Discord**: https://discord.gg/evolutionapi

## 🔄 Atualizações

Para atualizar a integração:

1. Faça backup das configurações atuais
2. Atualize o código do CRM
3. Teste a conectividade
4. Sincronize as instâncias existentes

---

**Versão**: 1.0.0  
**Compatibilidade**: Evolution API v1.7.4+  
**Última atualização**: Dezembro 2024 