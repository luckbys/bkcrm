# 🔧 Solução: QR Code não aparece na Evolution API

## 📋 Problema Identificado

Você está enfrentando os seguintes erros:
- **Erro 404**: `GET https://press-evolution-api.jhkbgs.easypanel.host/instance/connectionState/test 404 (Not Found)`
- **QR Code não aparece**: A instância não está sendo criada ou conectada corretamente

## 🔍 Diagnóstico Rápido

Abra o console do navegador (F12) e execute estes comandos para diagnosticar:

```javascript
// 1. Testar conectividade básica
await testEvolutionConnection()

// 2. Listar instâncias existentes
await listEvolutionInstances()

// 3. Verificar se a instância 'test' existe
await checkInstanceStatus('test')
```

## ✅ Soluções Implementadas

### 1. **Criação Automática de Instâncias**
- O sistema agora detecta quando uma instância não existe
- Cria automaticamente antes de tentar obter o QR Code
- Aguarda estabilização antes de prosseguir

### 2. **Recuperação de Instâncias**
- Função de recuperação para instâncias em estado inconsistente
- Reinicia conexões problemáticas
- Oferece botão "Tentar Corrigir" nos erros

### 3. **Melhor Tratamento de Erros**
- Mensagens específicas para cada tipo de erro
- Sugestões de ação para resolver problemas
- Logs detalhados para debug

## 🚀 Como Resolver (Passo a Passo)

### **Método 1: Via Interface Admin**

1. **Acesse**: Painel Admin → Gerenciar Instâncias WhatsApp
2. **Clique**: Botão "Debug API" (ícone de bug vermelho)
3. **Execute**: Diagnóstico completo
4. **Se der erro**: Clique em "Tentar Corrigir" nos erros exibidos

### **Método 2: Via Console (Desenvolvimento)**

```javascript
// Passo 1: Verificar conectividade
await testEvolutionConnection()

// Passo 2: Criar instância se não existir
await createTestInstance('minha-instancia')

// Passo 3: Obter QR Code
await testInstanceQRCode('minha-instancia')

// Passo 4: Verificar status final
await checkInstanceStatus('minha-instancia')
```

### **Método 3: Recuperação de Instância Problemática**

```javascript
// Se a instância existe mas não gera QR Code
await restartInstanceConnection('test')

// Ou deletar e recriar
await deleteTestInstance('test')
await createTestInstance('test')
await testInstanceQRCode('test')
```

## 🔧 Comandos de Emergência

Se nada funcionar, use estes comandos para resetar tudo:

```javascript
// 1. Listar todas as instâncias
const instances = await listEvolutionInstances()

// 2. Deletar instância problemática
await deleteTestInstance('test')

// 3. Criar nova instância com nome único
const timestamp = Date.now()
await createTestInstance(`instancia-${timestamp}`)

// 4. Obter QR Code da nova instância
await testInstanceQRCode(`instancia-${timestamp}`)
```

## 📱 Verificações Importantes

### **1. URL da Evolution API**
Confirme se a URL está correta:
```
https://press-evolution-api.jhkbgs.easypanel.host
```

### **2. API Key**
Verifique se a chave está configurada:
```
429683C4C977415CAAFCCE10F7D57E11
```

### **3. Status do Servidor**
Teste se o servidor está respondendo:
```javascript
await testEvolutionConnection()
```

## ⚠️ Problemas Comuns e Soluções

| Erro | Solução |
|------|---------|
| `404 Not Found` | Instância não existe → Use `createTestInstance()` |
| `QR Code não gerado` | Instância já conectada → Use `restartInstanceConnection()` |
| `Estado inválido` | Reset completo → Delete + Create |
| `Timeout` | Servidor sobrecarregado → Aguarde e tente novamente |
| `500 Internal Error` | Problema no servidor → Contate administrador |

## 📊 Status Esperados

- **`close`**: Desconectado, pode gerar QR Code
- **`connecting`**: Conectando, aguarde
- **`open`**: Conectado, QR Code não necessário
- **`qr`**: QR Code disponível para escaneamento

## 🎯 Teste Final

Após seguir os passos, execute este teste completo:

```javascript
// Teste completo automatizado
async function testeCompleto() {
  console.log('🧪 Iniciando teste completo...');
  
  // 1. Conectividade
  const conn = await testEvolutionConnection();
  if (!conn.success) {
    console.error('❌ Falha na conectividade');
    return;
  }
  
  // 2. Criar instância única
  const instanceName = `teste-${Date.now()}`;
  const create = await createTestInstance(instanceName);
  if (!create.success) {
    console.error('❌ Falha na criação');
    return;
  }
  
  // 3. Obter QR Code
  const qr = await testInstanceQRCode(instanceName);
  if (qr.success) {
    console.log('✅ SUCESSO! QR Code funcionando');
    console.log(`📱 Use a instância: ${instanceName}`);
  } else {
    console.error('❌ QR Code ainda com problemas');
  }
}

// Execute o teste
testeCompleto();
```

## 📞 Suporte

Se ainda houver problemas:

1. **Copie os logs** do console completos
2. **Informe o erro específico** recebido
3. **Teste com instância nova** usando timestamp
4. **Verifique se o servidor Evolution API está online**

---

> **💡 Dica**: Sempre use nomes únicos para instâncias de teste (com timestamp) para evitar conflitos. DepartmentEvolutionManager.tsx:223 ✅ Instância criada na Evolution API: 
{instance: {…}, hash: '1208DDAF-59CB-481B-87AB-D9FFA14EA281', webhook: {…}, websocket: {…}, rabbitmq: {…}, …}
hash
: 
"1208DDAF-59CB-481B-87AB-D9FFA14EA281"
instance
: 
{instanceName: 'financeiro-encontra', instanceId: '62ec4da6-97e6-4bec-894c-c6177ccfdeb0', integration: 'WHATSAPP-BAILEYS', webhookWaBusiness: null, accessTokenWaBusiness: '', …}
qrcode
: 
{pairingCode: null, code: '2@lIcVeBAI41qZB4fV43HdiE0+JLLpeltCPnvjdp9eZ+9kG0lP…kFA=,aP8wgsD0m0qJCNosI6RZkt4Napi5C7XNqYkSkUc7Ffk=', base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVwA…MzF7xYGZmr3gwM7NX/ANYPOOFrFcrLAAAAABJRU5ErkJggg==', count: 1}
rabbitmq
: 
{}
settings
: 
{rejectCall: false, msgCall: 'Chamadas não são aceitas por este número.', groupsIgnore: false, alwaysOnline: false, readMessages: true, …}
sqs
: 
{}
webhook
: 
{webhookUrl: 'http://localhost:3001/api/webhooks/evolution', webhookByEvents: true, webhookBase64: false}
websocket
: 
{}
[[Prototype]]
: 
Object
evolutionApiService.ts:145 
 
 POST https://press-supabase.jhkbgs.easypanel.host/rest/v1/evolution_instances?co…2is_default%22%2C%22created_by%22%2C%22status%22%2C%22metadata%22&select=* 409 (Conflict)
XMLHttpRequest.send		
createInstance	@	evolutionApiService.ts:145
createNewInstance	@	DepartmentEvolutionManager.tsx:219
DepartmentEvolutionManager.tsx:252 
 ⚠️ Erro ao salvar no banco, mas instância criada: 
{code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "unique_default_per_department"'}
createNewInstance	@	DepartmentEvolutionManager.tsx:252
DepartmentEvolutionManager.tsx:330 📱 Obtendo QR Code para Financeiro: financeiro-encontra
evolutionApiService.ts:183 📱 Obtendo QR Code para instância: financeiro-encontra
evolutionApiService.ts:225 🔗 Status da instância obtido: financeiro-encontra 
{instance: {…}}
evolutionApiService.ts:196 📱 QR Code obtido para instância: financeiro-encontra
DepartmentEvolutionManager.tsx:336 ✅ QR Code obtido com sucesso
data:image/png;base6…AAABJRU5ErkJggg==:1 
 
 GET data:image/png;base64,data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVwAAAF…zsFQ9mZvaKBzMze8WDmZm94sHMzF7xYGZmr3gwM7NX/ANYPOOFrFcrLAAAAABJRU5ErkJggg== net::ERR_INVALID_URL
evolutionApiService.ts:224 
 
 GET https://press-evolution-api.jhkbgs.easypanel.host/instance/connectionState/test 404 (Not Found)
evolutionApiService.ts:228 
 ❌ Erro ao obter status da instância: 
{status: 404, error: 'Not Found', response: {…}}