# 📱 Instruções para Criar Instância WhatsApp

## 🛠️ Como Testar a Criação de Instâncias

### 1. **Abrir o Sistema**
- Acesse o sistema BKCRM no navegador
- Faça login normalmente
- Vá para a página de **Departamentos**

### 2. **Acessar Modal de Configuração WhatsApp**
- Clique no ícone de **configuração** (⚙️) ao lado de qualquer departamento
- Selecione **"Configurar WhatsApp"**

### 3. **Testar Conectividade**
- No modal que abrir, você verá:
  - **"Nenhuma integração configurada"**
  - Botão verde **"Criar Integração WhatsApp"**
  - Botão cinza **"Testar Conectividade"**

- **PRIMEIRO**: Clique em **"Testar Conectividade"**
- Abra o **Console do Navegador** (F12 → Console)
- Verifique se aparece: ✅ **"API funcionando!"**

### 4. **Criar Instância**
- Se o teste de conectividade passou, clique em **"Criar Integração WhatsApp"**
- Observe os logs no console
- A criação deve mostrar:
  ```
  🚀 Criando instância: whatsapp-dep-[ID]
  ✅ Instância criada: [dados da resposta]
  ```

### 5. **Verificar QR Code**
- Após a criação, deve aparecer um QR Code
- Se não aparecer, a instância pode estar em estado "connecting"
- Aguarde alguns segundos e recarregue o modal

## 🧪 **Testes Avançados no Console**

Abra o console (F12) e execute:

### **Teste Rápido de Conectividade:**
```javascript
await quickTestEvolution()
```

### **Diagnóstico Completo da API:**
```javascript
await debugEvolutionAPI()
```

### **Criar Instância de Teste:**
```javascript
await testInstanceCreation('meu-departamento')
```

### **Limpar Instâncias de Teste:**
```javascript
await cleanupTestInstances()
```

## ❌ **Possíveis Problemas e Soluções**

### **1. Erro de Conectividade**
```
❌ API não respondeu: 500 Internal Server Error
```
**Solução**: Verificar se o servidor webhook está rodando na porta 4000

### **2. Erro de API Key**
```
❌ Unauthorized: Invalid API key
```
**Solução**: Verificar se a API key está correta no arquivo de configuração

### **3. Instância Já Existe**
```
❌ Instância whatsapp-dep-X já existe
```
**Solução**: Use um nome diferente ou execute `cleanupTestInstances()`

### **4. Erro de Webhook**
```
❌ Failed to create instance: webhook URL invalid
```
**Solução**: Verificar se a URL do webhook está acessível

## 🔧 **URLs de Configuração**

- **Evolution API**: `https://press-evolution-api.jhkbgs.easypanel.host`
- **Webhook Local**: `http://localhost:4000/webhook/evolution`
- **Webhook Produção**: `https://webhook.bkcrm.devsible.com.br/webhook/evolution`

## 📊 **Status Esperados**

- **connecting**: Aguardando QR Code
- **open**: Conectado com WhatsApp
- **close**: Desconectado

## 🚨 **Em Caso de Erro**

1. **Copie todos os logs do console**
2. **Tire screenshot do erro no modal**
3. **Verifique se:**
   - Servidor webhook está rodando
   - URLs estão corretas
   - API keys estão válidas
   - Não há firewall bloqueando

## 💡 **Dicas**

- Sempre teste a conectividade primeiro
- Use o console para debugs detalhados
- Aguarde 5-10 segundos após criar a instância
- QR Code expira em 45 segundos 