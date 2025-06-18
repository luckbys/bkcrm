# 🔧 Guia de Debug - Evolution API WhatsApp

## Problemas Comuns e Soluções

### 🚨 Erro 404 - Instância não encontrada

**Sintomas:**
```
GET https://press-evolution-api.jhkbgs.easypanel.host/instance/connectionState/dept_1_xxx 404 (Not Found)
```

**Causa:** A instância foi salva localmente mas não existe na Evolution API.

**Solução Automática Implementada:**
1. Sistema detecta erro 404
2. Remove instância inválida do localStorage  
3. Recria instância automaticamente
4. Tenta conectar novamente

**Solução Manual:**
```javascript
// No console do navegador:
localStorage.clear(); // Remove todas as configurações
location.reload(); // Recarrega a página
```

### 🌐 Problemas de Conectividade

**Verificar se a API está acessível:**
```bash
curl -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  https://press-evolution-api.jhkbgs.easypanel.host/
```

**Resposta esperada:**
```json
{
  "status": 200,
  "message": "Evolution API",
  "version": "x.x.x"
}
```

### 🔄 Sincronização de Status

**Como funciona:**
- Verificação automática a cada 30 segundos
- Pausa quando modais estão abertos
- Atualiza indicadores visuais automaticamente

**Forçar sincronização manual:**
```javascript
// No console do navegador:
import { departmentInstanceManager } from '@/lib/evolution-config';
await departmentInstanceManager.syncAllInstances();
```

### 📱 Problemas com QR Code

**Fluxo normal:**
1. Conectar → Testa API
2. Criar/Verificar instância
3. Conectar instância
4. Gerar QR Code
5. Exibir modal

**Se QR Code não aparece:**
1. Verificar logs no console
2. Confirmar se instância foi criada
3. Tentar recriar instância

## Logs de Debug

### Habilitando logs detalhados:
```javascript
// No console do navegador:
localStorage.setItem('debug-evolution-api', 'true');
```

### Verificando instâncias ativas:
```javascript
// Ver todas as instâncias locais:
console.log(JSON.parse(localStorage.getItem('department_instances') || '[]'));

// Ver configurações por setor:
console.log(JSON.parse(localStorage.getItem('whatsapp_config_1') || '{}'));
```

### Limpeza completa:
```javascript
// Remover todas as configurações:
Object.keys(localStorage)
  .filter(key => key.includes('whatsapp_config') || key.includes('department_instances'))
  .forEach(key => localStorage.removeItem(key));
```

## Estados da Instância

### Status possíveis:
- `configured`: Instância criada mas não conectada
- `connecting`: Tentando conectar
- `connected`: Conectada e funcionando
- `disconnected`: Desconectada
- `error`: Erro de conexão
- `not_found`: Instância não existe na API

### Fluxo de estados:
```
configured → connecting → connected
    ↓             ↓          ↓
   error     not_found  disconnected
```

## Testando Manualmente

### 1. Testar conectividade da API:
```javascript
import { evolutionAPIService } from '@/lib/evolution-config';
const info = await evolutionAPIService.getInfo();
console.log('API Info:', info);
```

### 2. Listar instâncias existentes:
```javascript
const instances = await evolutionAPIService.fetchInstances();
console.log('Instâncias:', instances);
```

### 3. Criar instância manual:
```javascript
import { departmentInstanceManager } from '@/lib/evolution-config';
const instance = await departmentInstanceManager.createDepartmentInstance(
  'test-1',
  'Teste',
  { phoneNumber: '+5511999999999' }
);
console.log('Instância criada:', instance);
```

### 4. Verificar status:
```javascript
const status = await evolutionAPIService.getInstanceStatus('nome-da-instancia');
console.log('Status:', status);
```

## Códigos de Erro Comuns

### 404 - Not Found
- Instância não existe
- URL incorreta
- Nome da instância inválido

### 401 - Unauthorized  
- API Key incorreta
- API Key expirada

### 500 - Internal Server Error
- Problema no servidor Evolution API
- Configuração incorreta no servidor

### Network Error
- Sem conexão com internet
- URL da API inacessível
- Firewall bloqueando

## Monitoramento

### Verificar saúde do sistema:
```javascript
// Status de todas as instâncias:
const allInstances = departmentInstanceManager.getAllDepartmentInstances();
console.table(allInstances.map(i => ({
  dept: i.departmentName,
  status: i.status,
  lastSync: i.lastSync
})));
```

### Logs em tempo real:
```javascript
// Ativar logs detalhados:
window.debugEvolutionAPI = true;
```

## Recuperação de Erros

### Se tudo falhar:
1. Limpar localStorage completamente
2. Recarregar página
3. Reconfigurar setores do zero
4. Verificar conectividade da API

### Backup de configurações:
```javascript
// Salvar configurações:
const backup = {
  departments: localStorage.getItem('department_instances'),
  configs: Object.keys(localStorage)
    .filter(k => k.includes('whatsapp_config'))
    .reduce((acc, key) => ({...acc, [key]: localStorage.getItem(key)}), {})
};
console.log('Backup:', JSON.stringify(backup));

// Restaurar configurações:
const backup = /* cole o backup aqui */;
localStorage.setItem('department_instances', backup.departments);
Object.entries(backup.configs).forEach(([key, value]) => 
  localStorage.setItem(key, value)
);
```

## Contato para Suporte

Se os problemas persistirem, forneça as seguintes informações:

1. **Logs do console:** Copie todos os erros exibidos
2. **Configurações:** Execute o backup de configurações acima
3. **Versão do navegador:** Chrome/Firefox/Safari versão X
4. **URL da API:** Confirme se está acessível
5. **Passos para reproduzir:** Descreva exatamente o que foi feito

---

**🔧 Debug Mode:** Ativado para melhor troubleshooting 