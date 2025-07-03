# Integração WhatsApp com Evolution API

Este projeto integra com a **Evolution API** para permitir que cada departamento do CRM tenha sua própria instância WhatsApp configurada.

## 📋 Pré-requisitos

1. **Evolution API** rodando e acessível
2. **API Key** configurada na Evolution API
3. **Banco de dados** com a tabela `whatsapp_instances` criada

## 🚀 Configuração Inicial

### 1. Configurar Evolution API

Primeiro, certifique-se que a Evolution API está rodando. Você pode usar Docker:

```bash
# Clone o repositório da Evolution API
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure as variáveis de ambiente
cp .env.example .env

# Execute com Docker
docker-compose up -d
```

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```env
# Evolution API Configuration
VITE_EVOLUTION_API_URL=http://localhost:8080
VITE_EVOLUTION_API_KEY=your_api_key_here
VITE_EVOLUTION_GLOBAL_API_KEY=your_global_api_key_here

# WhatsApp Webhook Configuration
VITE_WEBHOOK_BASE_URL=https://your-domain.com/webhook
```

### 3. Criar Tabela no Banco de Dados

Execute o script SQL localizado em `database/whatsapp_instances.sql` no seu banco Supabase:

```sql
-- O script criará a tabela whatsapp_instances com todas as colunas necessárias
-- Veja o arquivo database/whatsapp_instances.sql para o script completo
```

## 📱 Como Usar

### 1. Configurar WhatsApp para um Departamento

1. Acesse o CRM e navegue até a sidebar de departamentos
2. Clique no menu de opções (⋮) de qualquer departamento
3. Selecione **"Configurar WhatsApp"**
4. No modal que abrir:
   - Clique em **"Criar Instância"** se for a primeira vez
   - Configure as opções desejadas
   - Conecte escaneando o QR Code

### 2. Funcionalidades Disponíveis

#### **Visão Geral**
- Status da instância em tempo real
- Informações do perfil WhatsApp conectado
- Verificação de saúde da conexão
- Opções para deletar instância

#### **Conexão**
- Conectar/desconectar instância
- Gerar QR Code para pareamento
- Monitoramento do status de conexão

#### **Mensagens Automáticas**
- Configurar mensagem de boas-vindas
- Definir mensagem para fora do horário
- Configurar horário comercial
- Ativar/desativar respostas automáticas

#### **Configurações Avançadas**
- Rejeitar chamadas automaticamente
- Ignorar mensagens de grupos
- Manter status sempre online
- Marcar mensagens como lidas
- Sincronizar histórico completo

## 🔧 Tipos de Integração

### WhatsApp Web (Baileys)
- **Gratuito**
- Baseado no WhatsApp Web
- Ideal para pequenas e médias empresas
- Limitações da versão web

### WhatsApp Business API (Meta)
- **Pago**
- API oficial do Meta/Facebook
- Maior confiabilidade e recursos
- Suporte a volumes maiores

## 📊 Estrutura de Dados

### Tabela `whatsapp_instances`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da instância |
| `department_id` | UUID | ID do departamento |
| `instance_name` | VARCHAR | Nome único na Evolution API |
| `integration` | VARCHAR | Tipo: WHATSAPP-BAILEYS ou WHATSAPP-BUSINESS |
| `status` | VARCHAR | Status: active, inactive, connecting, error |
| `phone_number` | VARCHAR | Número WhatsApp conectado |
| `profile_name` | VARCHAR | Nome do perfil |
| `auto_reply` | BOOLEAN | Resposta automática ativa |
| `business_hours` | JSONB | Configurações de horário |
| `welcome_message` | TEXT | Mensagem de boas-vindas |
| `away_message` | TEXT | Mensagem fora do horário |
| `settings` | JSONB | Configurações específicas |

## 🔌 API Endpoints Utilizados

### Evolution API Endpoints

```typescript
// Gerenciamento de Instâncias
POST   /instance/create          // Criar instância
GET    /instance/fetchInstances  // Listar instâncias
GET    /instance/fetchInstance/:name // Buscar instância específica
PUT    /instance/connect/:name   // Conectar instância
DELETE /instance/logout/:name    // Desconectar instância
DELETE /instance/delete/:name    // Deletar instância

// Status e Conexão
GET    /instance/connectionState/:name // Estado da conexão
GET    /instance/status/:name          // Status da instância

// Mensagens
POST   /message/sendText/:name   // Enviar texto
POST   /message/sendMedia/:name  // Enviar mídia
POST   /message/sendButtons/:name // Enviar botões

// Configurações
POST   /webhook/set/:name        // Configurar webhook
GET    /webhook/find/:name       // Obter webhook
```

## 🎯 Hooks Personalizados

### `useWhatsAppInstances`

Hook principal para gerenciar instâncias WhatsApp:

```typescript
const {
  instances,
  loading,
  error,
  createInstance,
  deleteInstance,
  connectInstance,
  disconnectInstance,
  getQRCode,
  updateInstanceConfig,
  checkInstanceHealth,
  refreshInstances
} = useWhatsAppInstances();
```

## 🔒 Segurança

### Autenticação
- API Keys são obrigatórias para todas as requisições
- Use HTTPS em produção
- Mantenha as chaves seguras

### Webhooks
- Configure webhooks para receber eventos em tempo real
- Valide a origem das requisições
- Use URLs HTTPS para webhooks

### Banco de Dados
- Row Level Security (RLS) ativado por padrão
- Políticas de acesso configuráveis
- Foreign keys para integridade referencial

## 🚨 Troubleshooting

### Problemas Comuns

#### Instância não conecta
1. Verifique se a Evolution API está rodando
2. Confirme as credenciais da API
3. Verifique a conectividade de rede

#### QR Code não aparece
1. Certifique-se que a instância foi criada corretamente
2. Verifique se o endpoint de conexão está respondendo
3. Limpe o cache do navegador

#### Mensagens não são enviadas
1. Confirme que a instância está com status "active"
2. Verifique se o número de destino é válido
3. Confira os logs da Evolution API

### Logs e Debugging

```typescript
// Ativar logs detalhados
console.log('🔍 [WhatsApp] Instance status:', instanceStatus);
console.log('🔍 [WhatsApp] Health check:', healthResult);
```

## 📈 Monitoramento

### Métricas Importantes
- Status das instâncias por departamento
- Taxa de sucesso de conexões
- Volume de mensagens enviadas/recebidas
- Tempo de resposta da API

### Alertas Recomendados
- Instância desconectada por mais de 5 minutos
- Falhas consecutivas na API
- QR Code não escaneado em 10 minutos

## 🔄 Atualizações e Manutenção

### Backup
- Faça backup regular da tabela `whatsapp_instances`
- Mantenha backup das configurações da Evolution API

### Atualizações
- Monitore atualizações da Evolution API
- Teste em ambiente de desenvolvimento primeiro
- Mantenha compatibilidade com versões anteriores

## 📞 Suporte

- **Evolution API**: [GitHub Repository](https://github.com/EvolutionAPI/evolution-api)
- **Documentação**: [Evolution API Docs](https://doc.evolution-api.com/)
- **Comunidade**: Discord e Telegram da Evolution API

## 🤝 Contribuindo

Para contribuir com melhorias nesta integração:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

---

**Nota**: Esta integração foi desenvolvida baseada na Evolution API v2.3.0. Sempre consulte a documentação oficial para a versão mais recente. 