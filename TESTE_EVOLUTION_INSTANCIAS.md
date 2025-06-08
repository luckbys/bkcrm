# 🧪 Guia de Teste - Criação de Instâncias Evolution API

## 📋 Problema Identificado

A criação de instâncias na Evolution API não está funcionando corretamente. Este guia fornece ferramentas e passos para diagnosticar e resolver o problema.

## 🔧 Ferramentas de Debug Implementadas

### 1. Interface de Debug no Admin

**Localização:** Painel Admin → Instâncias WhatsApp → Botão "Debug API"

**Funcionalidades:**
- ✅ Teste de conectividade com Evolution API
- ✅ Verificação de configurações (URL e API Key)
- ✅ Listagem de instâncias existentes
- ✅ Diagnóstico completo com sugestões de solução

### 2. Comandos de Console (Dev Tools)

Abra o console do navegador (F12) e use os seguintes comandos:

```javascript
// 📋 Ver todos os comandos disponíveis
evolutionCommands()

// 🔗 Testar conectividade básica
testEvolutionConnection()

// 📋 Listar instâncias existentes
listEvolutionInstances()

// 🧪 Criar instância de teste
createTestEvolutionInstance("minha-instancia-teste")

// 📱 Obter QR Code de uma instância
getInstanceQRCode("nome-da-instancia")

// 🔍 Verificar status de uma instância
checkInstanceStatus("nome-da-instancia")

// 🔍 Debug completo da API
debugEvolutionAPI()

// 🧹 Limpar instâncias de teste
cleanTestInstances()
```

## 🚀 Passos para Diagnóstico

### Passo 1: Verificar Configurações

1. **Verificar variáveis de ambiente:**
   ```bash
   VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
   VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
   ```

2. **Testar acesso direto à API:**
   - Abra no navegador: `https://press-evolution-api.jhkbgs.easypanel.host`
   - Deve retornar informações da API

### Passo 2: Teste de Conectividade

1. **Via Interface:**
   - Acesse: Admin → Instâncias WhatsApp
   - Clique em "Debug API"
   - Execute o diagnóstico

2. **Via Console:**
   ```javascript
   testEvolutionConnection()
   ```

### Passo 3: Verificar Instâncias Existentes

```javascript
listEvolutionInstances()
```

### Passo 4: Tentar Criar Instância de Teste

```javascript
createTestEvolutionInstance("teste-debug-" + Date.now())
```

## 🔍 Problemas Comuns e Soluções

### ❌ Erro 401 - Unauthorized

**Problema:** API Key inválida ou não configurada

**Solução:**
1. Verificar se `VITE_EVOLUTION_API_KEY` está no arquivo `.env`
2. Confirmar se a chave está correta
3. Reiniciar o servidor de desenvolvimento

### ❌ Erro 400 - Bad Request

**Problema:** Payload da requisição inválido

**Solução:**
1. Verificar se todos os campos obrigatórios estão sendo enviados
2. Validar formato dos dados (especialmente webhook URL)
3. Verificar logs detalhados no console

### ❌ ECONNREFUSED

**Problema:** Evolution API não está respondendo

**Solução:**
1. Verificar se a Evolution API está rodando
2. Confirmar URL no arquivo `.env`
3. Testar acesso direto via navegador

### ❌ Erro 409 - Conflict

**Problema:** Instância já existe

**Solução:**
1. Usar nome diferente para a instância
2. Ou deletar a instância existente primeiro

## 📊 Payload Atualizado para Criação

O payload foi atualizado para incluir todos os campos necessários:

```javascript
{
  instanceName: "nome-da-instancia",
  qrcode: true,
  integration: "WHATSAPP-BAILEYS",
  webhook: {
    enabled: true,
    url: "https://seu-dominio.com/api/webhooks/evolution",
    byEvents: true,
    base64: false,
    events: [
      "APPLICATION_STARTUP",
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      // ... outros eventos
    ]
  },
  // Configurações padrão do WhatsApp
  rejectCall: false,
  msgCall: "Chamadas não são aceitas por este número.",
  groupsIgnore: false,
  alwaysOnline: false,
  readMessages: true,
  readStatus: true,
  syncFullHistory: false
}
```

## 🧪 Teste Completo Passo a Passo

### 1. Preparação
```javascript
// Limpar instâncias de teste antigas
cleanTestInstances()

// Verificar conectividade
testEvolutionConnection()
```

### 2. Criação de Instância
```javascript
// Criar nova instância
createTestEvolutionInstance("teste-completo")
```

### 3. Verificação
```javascript
// Listar instâncias para confirmar criação
listEvolutionInstances()

// Verificar status da nova instância
checkInstanceStatus("teste-completo")
```

### 4. Obter QR Code
```javascript
// Obter QR Code para conectar
getInstanceQRCode("teste-completo")
```

### 5. Limpeza (Opcional)
```javascript
// Remover instância de teste
cleanTestInstances()
```

## 📝 Logs Importantes

Durante os testes, observe os seguintes logs no console:

- ✅ **Sucesso:** `Evolution API conectada com sucesso!`
- ❌ **Erro de conectividade:** `Falha na conectividade`
- ❌ **Erro de criação:** `Falha na criação`
- ⚠️ **Aviso:** `Instância já existe`

## 🔄 Próximos Passos

1. **Execute o diagnóstico completo**
2. **Identifique o erro específico**
3. **Aplique a solução correspondente**
4. **Teste novamente**
5. **Documente o resultado**

## 📞 Suporte

Se os problemas persistirem:

1. **Capture logs completos** do console
2. **Documente o erro específico**
3. **Verifique configurações da Evolution API**
4. **Teste acesso direto à API**

---

**💡 Dica:** Use sempre o comando `debugEvolutionAPI()` primeiro para um diagnóstico completo antes de tentar criar instâncias. 