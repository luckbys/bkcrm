# 🔧 Debug - Instâncias Desconectadas na Evolution API

## Problema Reportado
"As instâncias criadas aparecem desconectadas na Evolution API"

## 🔍 Análise do Problema

### Possíveis Causas:
1. **Instância criada mas não conectada automaticamente**
2. **Timing inadequado** - verificação de status muito rápida
3. **Estados intermediários** - instância em processo de conexão
4. **Problemas de webhook** - Evolution API não consegue notificar mudanças

---

## ✅ Soluções Implementadas

### 1. Melhor Mapeamento de Status
```typescript
// Antes: apenas 'connected' ou 'disconnected'
// Agora: mapeamento completo dos estados da Evolution API

switch (status.instance.status) {
  case 'open': return 'connected';      // ✅ Conectado
  case 'close': return 'disconnected';  // ❌ Desconectado
  case 'created': return 'disconnected'; // 🔄 Criado mas não conectado
  case 'connecting': return 'connecting'; // ⏳ Conectando
}
```

### 2. Verificação Antes de Gerar QR Code
```typescript
// Agora verifica se instância já está conectada
if (statusCheck.instance.status === 'open') {
  toast({
    title: 'WhatsApp já conectado',
    description: 'Esta instância já está conectada ao WhatsApp.',
  });
  return; // Não gera QR Code desnecessário
}
```

### 3. Logs Detalhados de Sincronização
```
🔄 Sincronizando todas as instâncias...
Verificando status da instância dept_X_timestamp...
Status retornado para dept_X_timestamp: created
Status da instância dept_X_timestamp mudou de configured para disconnected
✅ Sincronização de instâncias concluída
```

### 4. Aguardo Adequado para Conexão
```typescript
// Aguarda 2 segundos após conectar antes de verificar status
await new Promise(resolve => setTimeout(resolve, 2000));

// Aguarda 1 segundo antes de obter QR Code
await new Promise(resolve => setTimeout(resolve, 1000));
```

---

## 🧪 Como Testar as Correções

### 1. Verificar Status Atual das Instâncias
Execute no console do navegador:

```javascript
// Listar instâncias na Evolution API
fetch('https://press-evolution-api.jhkbgs.easypanel.host/instance/fetchInstances', {
  headers: { 'apikey': '429683C4C977415CAAFCCE10F7D57E11' }
})
.then(r => r.json())
.then(instances => {
  console.log('📋 Instâncias na Evolution API:');
  instances.forEach(inst => {
    console.log(`   ${inst.instanceName}: ${inst.status}`);
  });
});
```

### 2. Verificar Estados no Sistema Local
```javascript
// Verificar instâncias salvas localmente
const localData = localStorage.getItem('department_instances');
if (localData) {
  const instances = JSON.parse(localData);
  console.log('💾 Instâncias locais:');
  instances.forEach(({departmentId, instance}) => {
    console.log(`   Dept ${departmentId}: ${instance.status} (${instance.instanceName})`);
  });
}
```

### 3. Forçar Sincronização
```javascript
// No sistema, acesse via console:
import { departmentInstanceManager } from '@/lib/evolution-config';
await departmentInstanceManager.syncAllInstances();
```

---

## 📊 Estados Esperados vs Problemáticos

### ✅ Estados Normais:
| Evolution API | Sistema Local | Descrição |
|---------------|---------------|-----------|
| `created` | `disconnected` | Instância criada, aguardando QR Code |
| `connecting` | `connecting` | Processando conexão WhatsApp |
| `open` | `connected` | Conectado com sucesso |
| `close` | `disconnected` | Desconectado (normal) |

### ❌ Estados Problemáticos:
| Evolution API | Sistema Local | Problema |
|---------------|---------------|----------|
| `created` | `configured` | Não sincronizado |
| `connecting` | `error` | Erro de timing |
| `open` | `disconnected` | Falha na sincronização |

---

## 🔧 Script de Correção Automática

Execute este script para corrigir instâncias desconectadas:

```javascript
async function corrigirInstanciasDesconectadas() {
  console.log('🔧 Iniciando correção de instâncias desconectadas...');
  
  const CREDENTIALS = {
    SERVER_URL: 'https://press-evolution-api.jhkbgs.easypanel.host/',
    API_KEY: '429683C4C977415CAAFCCE10F7D57E11'
  };

  // 1. Buscar instâncias na Evolution API
  const apiInstances = await fetch(`${CREDENTIALS.SERVER_URL}instance/fetchInstances`, {
    headers: { 'apikey': CREDENTIALS.API_KEY }
  }).then(r => r.json());

  console.log(`📋 Encontradas ${apiInstances.length} instâncias na Evolution API`);

  // 2. Buscar instâncias locais
  const localData = localStorage.getItem('department_instances');
  const localInstances = localData ? JSON.parse(localData) : [];
  
  console.log(`💾 Encontradas ${localInstances.length} instâncias locais`);

  // 3. Sincronizar estados
  let corrected = 0;
  
  for (const local of localInstances) {
    const apiInstance = apiInstances.find(api => api.instanceName === local.instance.instanceName);
    
    if (apiInstance) {
      let newStatus;
      switch (apiInstance.status) {
        case 'open': newStatus = 'connected'; break;
        case 'close':
        case 'created': newStatus = 'disconnected'; break;
        case 'connecting': newStatus = 'connecting'; break;
        default: newStatus = 'disconnected';
      }
      
      if (local.instance.status !== newStatus) {
        console.log(`🔄 Corrigindo ${local.instance.instanceName}: ${local.instance.status} → ${newStatus}`);
        local.instance.status = newStatus;
        local.instance.lastSync = new Date().toISOString();
        corrected++;
      }
    } else {
      console.log(`❌ Instância local ${local.instance.instanceName} não encontrada na API`);
      local.instance.status = 'not_found';
      corrected++;
    }
  }

  // 4. Salvar correções
  if (corrected > 0) {
    localStorage.setItem('department_instances', JSON.stringify(localInstances));
    console.log(`✅ ${corrected} instâncias corrigidas!`);
    console.log('🔄 Recarregue a página para ver as mudanças');
  } else {
    console.log('✅ Todas as instâncias já estão sincronizadas');
  }

  return { corrected, total: localInstances.length };
}

// Executar correção
corrigirInstanciasDesconectadas()
  .then(result => {
    console.log(`🎯 Resultado: ${result.corrected}/${result.total} instâncias corrigidas`);
  })
  .catch(error => {
    console.error('❌ Erro na correção:', error);
  });
```

---

## 🎯 Resultado Esperado

Após as correções implementadas:

1. **Status mais preciso:** Instâncias mostram estado real da Evolution API
2. **Sincronização automática:** A cada 30 segundos os status são atualizados
3. **Logs detalhados:** Console mostra exatamente o que está acontecendo
4. **Prevenção de duplicatas:** Não gera QR Code se já conectado
5. **Recovery automático:** Se instância não existe, recria automaticamente

**🎯 Status das Correções:** ✅ Implementadas e testadas para problemas de sincronização 