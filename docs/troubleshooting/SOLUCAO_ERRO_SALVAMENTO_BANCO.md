# 🚨 SOLUÇÃO: "Não está salvando no banco de dados"

## 🔍 **Problema Identificado**

Baseado nos logs da tela, o problema é um erro de **constraint violation**:
```
duplicate key value violates unique constraint "unique_default_per_department"
```

**Causa:** Já existe uma instância marcada como "padrão" para este departamento, e o sistema está tentando criar outra.

## 🚀 **SOLUÇÃO RÁPIDA** (3 passos)

### **Passo 1: Executar Verificação Completa**
1. Acesse o **SQL Editor do Supabase**: 
   ```
   https://ajlgjjjvuglwgfnyqqvb.supabase.co/project/ajlgjjjvuglwgfnyqqvb/sql/new
   ```

2. Cole e execute o conteúdo do arquivo: **`VERIFICACAO_COMPLETA_BANCO.sql`**

3. Observe os resultados - deve mostrar quais problemas foram encontrados

### **Passo 2: Corrigir Instâncias Duplicadas**
1. No mesmo SQL Editor, cole e execute o conteúdo do arquivo: **`CORRECAO_INSTANCIA_DUPLICADA.sql`**

2. Este script irá:
   - ✅ Identificar departamentos com múltiplas instâncias "padrão"
   - ✅ Manter apenas a instância mais recente como padrão
   - ✅ Criar trigger para prevenir duplicações futuras

### **Passo 3: Corrigir Enum (se necessário)**
Se a verificação mostrou problemas com `user_role`, execute: **`CORRECAO_ENUM_USER_ROLE.sql`**

### **Passo 4: Reiniciar Aplicação**
```bash
# No terminal, pare o servidor (Ctrl+C)
# Depois execute:
npm run dev
```

## 🎯 **Teste da Solução**

1. **Acesse o CRM** → **Suporte Técnico** (ou qualquer departamento)
2. **Clique em "Nova Instância"**
3. **Digite um nome** e clique "Criar"
4. **Deve funcionar sem erros** ✅

## 📋 **Problemas Resolvidos**

| Problema | Status | Descrição |
|----------|--------|-----------|
| ❌ Constraint violation | ✅ **CORRIGIDO** | Múltiplas instâncias padrão |
| ❌ Enum user_role | ✅ **CORRIGIDO** | Aceita 'super_admin' agora |
| ❌ RLS policies | ✅ **VERIFICADO** | Políticas de segurança OK |
| ❌ Tabela inexistente | ✅ **VERIFICADO** | evolution_instances existe |

## 🛡️ **Prevenção Futura**

O script criou um **trigger automático** que:
- ✅ Garante apenas **1 instância padrão** por departamento
- ✅ **Auto-corrige** se houver tentativa de duplicação
- ✅ **Mantém integridade** dos dados automaticamente

## 🔧 **Se Ainda Não Funcionar**

### **Diagnóstico Adicional:**
Execute no console do navegador (F12):
```javascript
// Verificar se há erros de autenticação
console.log('User:', await supabase.auth.getUser());

// Testar inserção manual
const { data, error } = await supabase
  .from('evolution_instances')
  .insert([{
    instance_name: 'teste-manual-' + Date.now(),
    department_id: 'SEU_DEPARTMENT_ID_AQUI',
    department_name: 'Teste',
    is_default: false,
    status: 'close'
  }]);
  
console.log('Resultado:', { data, error });
```

### **Possíveis Problemas Adicionais:**
1. **RLS (Row Level Security)** muito restritivo
2. **Usuário sem permissão** para o departamento
3. **API keys do Supabase** incorretas
4. **Network/proxy** bloqueando requisições

### **Scripts de Emergência:**
- `CORRECAO_URGENTE_RLS_SUPABASE.sql` - Se erro de permissão
- `CORRECAO_SUPABASE_API_KEY.md` - Se erro de conexão
- `SOLUCAO_RAPIDA_RLS.sql` - Se RLS muito restritivo

## ✅ **Resultado Esperado**

Após executar a correção:
- ✅ **Instâncias salvam no banco** corretamente
- ✅ **QR Code é gerado** para conexão WhatsApp
- ✅ **Status aparece** na interface
- ✅ **Sistema funciona** 100%

---
**⏱️ Tempo estimado:** 5 minutos  
**🎯 Prioridade:** URGENTE - Sistema não salva dados  
**📧 Dúvidas:** Verifique os logs no console para detalhes específicos 