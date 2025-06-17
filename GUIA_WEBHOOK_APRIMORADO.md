# 🚀 WEBHOOK EVOLUTION API - VERSÃO APRIMORADA

## 📋 Funcionalidades Implementadas

### 🎯 1. Extração Avançada de Dados de Contato

**Melhorias implementadas:**
- ✅ **Nome completo do contato**: Busca via Evolution API
- ✅ **Foto de perfil**: URL da imagem de perfil do WhatsApp
- ✅ **Status online**: Se o contato está online/offline
- ✅ **Último visto**: Timestamp da última atividade
- ✅ **Detecção de grupos**: Identifica mensagens de grupos
- ✅ **PushName**: Nome como aparece no WhatsApp

**Função principal:**
```javascript
async function extractContactData(messageData, instanceName)
```

### 🤖 2. Sistema de Resposta Automática Inteligente

**Funcionalidades:**
- ✅ **Detecção de primeira mensagem**: Responde apenas para novos contatos (24h)
- ✅ **Detecção de idioma**: Português, Inglês, Espanhol
- ✅ **Horário comercial**: Mensagens diferentes dentro/fora do horário
- ✅ **Personalização**: Usa o nome do contato quando disponível
- ✅ **Templates configuráveis**: Sistema de templates multi-idioma

**Templates disponíveis:**
- `welcome`: Mensagem de boas-vindas
- `businessHours`: Informações de horário de atendimento
- `autoReply`: Resposta automática genérica

### 📋 3. Cache de Contatos para Performance

**Benefícios:**
- ✅ **Reduz chamadas à API**: Dados ficam em memória por 30 minutos
- ✅ **Melhora performance**: Respostas mais rápidas
- ✅ **Atualização automática**: Cache expira e renova automaticamente

### 📱 4. Processamento Completo de Mídias

**Tipos de mensagem suportados:**
- ✅ **Texto**: Simples e estendido
- ✅ **Imagem**: Com caption e metadados
- ✅ **Vídeo**: Com duração e dimensões
- ✅ **Áudio**: Diferencia áudio normal de nota de voz
- ✅ **Documento**: Com nome do arquivo e tamanho
- ✅ **Localização**: Com coordenadas e nome
- ✅ **Contato**: Com vCard e informações
- ✅ **Sticker**: Adesivos do WhatsApp

### 🔍 5. Busca de Informações via Evolution API

**Endpoints utilizados:**
- `GET /chat/findContacts/{instance}`: Buscar dados do contato
- `GET /chat/fetchProfilePictureUrl/{instance}`: Buscar foto de perfil

## 🛠️ Como Implementar

### Passo 1: Substituir o Webhook Atual

1. **Parar o webhook atual:**
```bash
# Se estiver rodando com PM2
pm2 stop webhook-evolution-complete

# Se estiver rodando diretamente
Ctrl+C no terminal
```

2. **Usar o novo webhook:**
```bash
node webhook-evolution-aprimorado.js
```

### Passo 2: Configurar Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=sua_api_key
VITE_SUPABASE_URL=sua_supabase_url
VITE_SUPABASE_ANON_KEY=sua_supabase_key
WEBHOOK_PORT=4000
NODE_ENV=production
```

### Passo 3: Testar Funcionalidades

1. **Health Check:**
```bash
curl http://localhost:4000/webhook/health
```

2. **Ver Cache de Contatos:**
```bash
curl http://localhost:4000/webhook/cache
```

3. **Limpar Cache:**
```bash
curl -X POST http://localhost:4000/webhook/clear-cache
```

## 📊 Estrutura de Dados Aprimorada

### ContactData (Classe)
```javascript
{
  id: "5511999000001",
  phone: "5511999000001", 
  name: "João Silva",
  pushName: "João Silva",
  profilePictureUrl: "https://...",
  isGroup: false,
  language: "pt",
  status: "active",
  lastSeen: "2025-01-17T10:30:00Z",
  isOnline: true,
  metadata: {
    remoteJid: "5511999000001@s.whatsapp.net",
    instance: "atendimento-ao-cliente-sac1",
    firstContact: "2025-01-17T10:25:00Z",
    source: "webhook"
  },
  messageCount: 5,
  lastInteraction: "2025-01-17T10:30:00Z"
}
```

### MessageInfo (Estrutura)
```javascript
{
  content: "Olá, preciso de ajuda!",
  type: "text", // text, image, video, audio, document, location, contact, sticker
  media: {
    // Para imagens/vídeos
    url: "https://...",
    mimetype: "image/jpeg",
    size: 1024000,
    width: 1920,
    height: 1080,
    
    // Para áudios
    duration: 30,
    isVoiceMessage: true,
    
    // Para documentos
    fileName: "arquivo.pdf"
  }
}
```

## 🔄 Sistema de Resposta Automática

### Lógica de Decisão
```javascript
// 1. Verificar se é grupo (não responder)
if (contactData.isGroup) return false;

// 2. Verificar se já respondeu nas últimas 24h
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentMessages = await supabase
  .from('messages')
  .select('id')
  .eq('sender_phone', contactData.phone)
  .gte('created_at', yesterday);

// 3. Enviar resposta apenas se for primeiro contato em 24h
return recentMessages.length === 0;
```

### Templates Multi-idioma
```javascript
const responseTemplates = {
  welcome: {
    pt: "Olá! 👋 Obrigado por entrar em contato...",
    en: "Hello! 👋 Thank you for contacting us...",
    es: "¡Hola! 👋 Gracias por contactarnos..."
  },
  businessHours: {
    pt: "📅 Nosso horário de atendimento é...",
    en: "📅 Our business hours are...",
    es: "📅 Nuestro horario de atención es..."
  }
};
```

## 📈 Benefícios da Versão Aprimorada

### 🎯 Para Atendimento
- **Resposta mais rápida**: Dados já extraídos e em cache
- **Informações completas**: Nome, foto, status online
- **Resposta automática**: Clientes recebem feedback imediato
- **Personalização**: Mensagens adaptadas ao idioma

### ⚡ Para Performance
- **Menos chamadas à API**: Cache reduz requisições
- **Processamento otimizado**: Dados estruturados
- **Logs detalhados**: Melhor debugging

### 🔧 Para Desenvolvimento
- **Código modular**: Classes e funções organizadas
- **Fácil manutenção**: Estrutura clara
- **Extensível**: Fácil adicionar novos recursos

## 🚨 Pontos de Atenção

1. **Rate Limiting**: Evolution API tem limites de requisições
2. **Cache Memory**: Contatos ficam em memória (limpar se necessário)
3. **Timeouts**: Configurados para 10s (contatos) e 5s (fotos)
4. **Fallback**: Sistema funciona mesmo se busca adicional falhar

## 📝 Logs Detalhados

O sistema gera logs detalhados para debug:

```
👤 Extraindo dados COMPLETOS do contato: {...}
📋 ✅ Dados do contato encontrados no cache
🔍 Buscando informações detalhadas do contato: {...}
📸 Foto de perfil encontrada
🤖 Decisão resposta automática: ENVIAR
✅ Resposta automática enviada com sucesso
📨 Dados COMPLETOS da mensagem processados: {...}
```

## 🔄 Migração do Webhook Atual

**Compatibilidade:** O novo webhook é **100% compatível** com o sistema atual.

**Principais diferenças:**
- ✅ Mais dados extraídos automaticamente
- ✅ Resposta automática opcional (pode ser desabilitada)
- ✅ Cache para melhor performance
- ✅ Logs mais detalhados
- ✅ Estrutura de dados mais rica

**Para usar:** Simplesmente substitua o arquivo e reinicie o servidor! 