# 🛠️ SOLUÇÃO URGENTE - Erro Enum user_role

## ❌ **Problema Identificado**
```
ERROR: invalid input value for enum user_role: "super_admin"
```

O banco de dados tem registros com `"super_admin"` mas o enum `user_role` só aceita: `'admin', 'agent', 'customer'`

## 🚀 **Solução Rápida** (2 minutos)

### 1️⃣ **Execute no SQL Editor do Supabase**
1. Acesse: https://ajlgjjjvuglwgfnyqqvb.supabase.co/project/ajlgjjjvuglwgfnyqqvb/sql/new
2. Cole e execute o conteúdo do arquivo: `CORRECAO_ENUM_USER_ROLE.sql`

### 2️⃣ **Reinicie a Aplicação**
```bash
# Parar o servidor (Ctrl+C no terminal)
# Depois executar:
npm run dev
```

### 3️⃣ **Verificar se Funcionou**
- O erro `invalid input value for enum` deve desaparecer
- O `DepartmentEvolutionManager` deve carregar normalmente
- As instâncias Evolution API devem aparecer

## 🔍 **Diagnóstico**

O problema aconteceu porque:
1. ✅ Dados foram inseridos com `role = 'super_admin'`
2. ❌ Enum `user_role` não tinha esse valor definido
3. 💥 Consultas falhavam com erro 22P02

## 🎯 **Após Resolver**

Com o enum corrigido, você deve ver:
- ✅ Departamentos carregando normalmente
- ✅ Instâncias Evolution API visíveis
- ✅ Sistema CRM funcionando 100%

## 🔧 **Se o Problema Persistir**

Execute no console do navegador:
```javascript
// Verificar dados atuais
await supabase.from('profiles').select('role').limit(5)
```

---
**⏱️ Tempo estimado: 2 minutos**  
**🎯 Prioridade: URGENTE - Sistema não funciona sem isso**
