# 🚀 Como Configurar Evolution API

## ⚠️ Problema Atual
O sistema está tentando usar uma Evolution API externa (`press-evolution-api.jhkbgs.easypanel.host`) que retorna erro 404.

## 💡 Soluções

### **Opção 1: Modo Offline (Recomendado para Desenvolvimento)**
O sistema já foi configurado para funcionar completamente offline. As instâncias são:
- ✅ Criadas e gerenciadas no banco de dados local
- ✅ Interface totalmente funcional
- ⚠️ WhatsApp não funciona (apenas simulação)

### **Opção 2: Evolution API Própria**

#### **1. Instalar Evolution API**
```bash
# Clonar repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Instalar dependências
npm install
```

#### **2. Configurar .env**
Crie arquivo `.env` na raiz da Evolution API:
```env
# Servidor
SERVER_TYPE=http
SERVER_PORT=8080
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

# Autenticação
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA_AQUI

# Banco (opcional)
DATABASE_ENABLED=true
DATABASE_CONNECTION_URI=postgresql://user:pass@localhost:5432/evolution

# Webhook
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=http://localhost:5173/api/webhook

# QR Code
QRCODE_LIMIT=30
```

#### **3. Iniciar Evolution API**
```bash
npm run start:dev
```

#### **4. Configurar no CRM**
Crie arquivo `.env.local` no CRM:
```env
VITE_EVOLUTION_API_URL=http://localhost:8080
VITE_EVOLUTION_API_KEY=SUA_CHAVE_SECRETA_AQUI
```

### **Opção 3: Evolution API na Nuvem**

#### **Easypanel (Recomendado)**
1. Acesse [Easypanel](https://easypanel.io)
2. Crie novo projeto
3. Use template Evolution API
4. Configure variáveis de ambiente
5. Obtenha URL da sua instância

#### **Railway**
1. Acesse [Railway](https://railway.app)
2. Deploy do GitHub (evolution-api)
3. Configure variáveis de ambiente
4. Obtenha URL da aplicação

#### **DigitalOcean**
1. Crie Droplet Ubuntu
2. Clone e configure Evolution API
3. Configure reverse proxy (nginx)
4. Configure SSL (Let's Encrypt)

## 🔧 Configuração Avançada

### **Webhook do CRM**
O CRM precisa receber webhooks da Evolution API:

```typescript
// src/services/webhook-handler.ts
export const handleEvolutionWebhook = async (payload: any) => {
  // Processar mensagens recebidas
  if (payload.event === 'messages.upsert') {
    // Criar ticket automaticamente
    // Salvar mensagem no banco
    // Notificar agentes
  }
};
```

### **SSL/HTTPS**
Para produção, configure HTTPS:
```bash
# Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sua-api.dominio.com
```

## 📊 Status Atual do Sistema

### ✅ Funcionando
- Interface de gerenciamento de instâncias
- Criação/listagem de instâncias no banco
- Modo offline completo
- Sistema de tickets integrado

### ⚠️ Configuração Necessária
- Evolution API real para WhatsApp
- Webhooks para receber mensagens
- SSL para produção

## 🎯 Próximos Passos

1. **Verificar migrações**: Execute `checkMigrationStatus()` no console
2. **Testar modo offline**: Criar instâncias e verificar funcionamento
3. **Decidir sobre Evolution API**: Própria ou terceirizada
4. **Configurar webhooks**: Para receber mensagens automáticas

## 💡 Recomendação

Para desenvolvimento e testes, use o **modo offline** que já está funcionando.
Para produção com WhatsApp real, configure sua própria Evolution API. 