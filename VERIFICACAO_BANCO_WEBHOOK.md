# 🔍 Verificação do Banco de Dados - Webhook Evolution API

## ❌ Problemas Identificados

Os logs mostram **4 erros críticos** no banco de dados:

1. **`column profiles.phone does not exist`** - Coluna phone não existe
2. **`Could not find function find_existing_ticket_webhook`** - Função RPC não existe  
3. **`Could not find function create_ticket_webhook`** - Função RPC não existe
4. **`invalid input syntax for type uuid`** - UUID inválido no fallback

## ✅ Solução Completa

### **1. Execute o Script SQL**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**  
3. Copie TODO o conteúdo de `CORRECAO_BANCO_PROFILES_PHONE.sql`
4. Cole no editor e clique **Run**
5. Aguarde todas as mensagens de sucesso

### **2. Verificações Necessárias**

Após executar o script, verifique se aparecem:

```sql
✅ Coluna profiles.phone: EXISTE
✅ Função find_existing_ticket_webhook: EXISTE  
✅ Função create_ticket_webhook: EXISTE
```

### **3. Teste das Funções**

O script automaticamente testa:

- ✅ Buscar ticket existente
- ✅ Criar cliente novo
- ✅ Criar ticket novo

### **4. Webhook Corrigido**

O webhook foi atualizado para:
- ✅ Usar funções RPC do banco
- ✅ Gerar UUIDs válidos no fallback
- ✅ Tratamento robusto de erros

## 🚀 Passos para Correção

### **Passo 1: Copiar Script**
```sql
-- Copie o arquivo: CORRECAO_BANCO_PROFILES_PHONE.sql
```

### **Passo 2: Executar no Supabase**
1. Dashboard → SQL Editor
2. Colar script completo
3. Clicar "Run"
4. Aguardar sucesso

### **Passo 3: Reiniciar Webhook**
```bash
# Parar processo atual (Ctrl+C)
# Iniciar novamente
node webhook-evolution-complete-corrigido.js
```

### **Passo 4: Testar**
1. Enviar mensagem WhatsApp
2. Verificar logs sem erros
3. Confirmar ticket criado

## 📊 Logs Esperados (Após Correção)

```
📞 [EXTRAÇÃO AVANÇADA] Telefone processado: {
  raw: "5512981022013",
  formatted: "+55 (12) 98102-2013",
  country: "brazil"
}

✅ [CLIENTE] Encontrado/criado via RPC: uuid-do-cliente

✅ [TICKET] Ticket criado via RPC: uuid-do-ticket

✅ Mensagem processada com sucesso
```

## 🎯 Resultado Final

**ANTES:**
- ❌ Erros de schema no banco
- ❌ Funções RPC inexistentes  
- ❌ UUIDs inválidos
- ❌ Webhook não funciona

**DEPOIS:**
- ✅ Estrutura do banco correta
- ✅ Funções RPC criadas
- ✅ UUIDs válidos
- ✅ Webhook 100% funcional

## ⚠️ IMPORTANTE

**Execute PRIMEIRO o script SQL antes de reiniciar o webhook!**

O webhook corrigido já está preparado para usar as novas funções RPC, mas elas precisam existir no banco primeiro.

---

**📝 Resumo:**
1. Execute `CORRECAO_BANCO_PROFILES_PHONE.sql` no Supabase
2. Reinicie o webhook corrigido  
3. Teste com mensagem WhatsApp
4. Confirme logs de sucesso

**🎉 Após isso, o sistema funcionará 100%!** 