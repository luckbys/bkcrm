# 🚀 **PASSO A PASSO - Configuração Realtime Supabase BKCRM**

## 📋 **PRÉ-REQUISITOS**

- ✅ Acesso ao painel do Supabase
- ✅ Projeto BKCRM criado no Supabase  
- ✅ Tabelas do banco de dados já criadas
- ✅ Usuário autenticado no sistema

---

## ❌ **SE RECEBEU ERRO "function does not exist"**

Se você recebeu o erro:
```
ERROR: 42883: function public.check_realtime_config() does not exist
```

**Execute PRIMEIRO o script de correção:**

1. **Abra o SQL Editor**
2. **Cole o conteúdo do arquivo:** `CORRECAO_FUNCOES_REALTIME.sql`
3. **Execute o script** (Ctrl+Enter)
4. **Aguarde a conclusão** (deve mostrar "Success")
5. **Continue com o passo 1 abaixo**

---

## 🔧 **PASSO 1: Executar o Script SQL Principal**

### **1.1 Abrir SQL Editor**
1. Acesse: **Supabase Dashboard** → **SQL Editor** (ícone `</>`)
2. Clique em **"+ New query"**
3. Cole o conteúdo do arquivo: `CONFIGURACAO_REALTIME_SUPABASE_SQL.sql`

### **1.2 Executar o Script**
1. **Clique em "Run"** (ou `Ctrl+Enter`)
2. ⏱️ **Aguarde**: A execução pode levar 30-60 segundos
3. ✅ **Verificar**: Deve mostrar "Success" sem erros

### **1.3 Possíveis Erros e Soluções**

#### **❌ "table does not exist"**
```sql
-- Execute primeiro as migrações das tabelas
CREATE TABLE IF NOT EXISTS "public"."messages" (...);
CREATE TABLE IF NOT EXISTS "public"."tickets" (...);
```

#### **❌ "function does not exist"**
- Execute o arquivo `CORRECAO_FUNCOES_REALTIME.sql` PRIMEIRO
- Em seguida, execute o script principal novamente

#### **❌ "permission denied"**
- Verifique se você tem permissões de administrador no projeto
- Tente executar em partes menores

---

## 🧪 **PASSO 2: Testar a Configuração**

### **2.1 Diagnóstico Completo**
Execute no SQL Editor:
```sql
SELECT public.diagnostic_realtime();
```

**Resultado esperado:**
```json
{
  "user_authenticated": true,
  "publication_exists": true,
  "tables_exist": {
    "messages": true,
    "tickets": true,
    "notifications": true,
    "profiles": true
  },
  "status": "ready"
}
```

### **2.2 Verificar Configuração Realtime**
```sql
SELECT public.check_realtime_config();
```

### **2.3 Teste de Conexão (Com usuário logado)**
```sql
SELECT public.test_realtime_connection();
```

### **2.4 Limpar Dados de Teste**
```sql
SELECT public.cleanup_test_data();
```

---

## 📡 **PASSO 3: Configurar no Frontend**

### **3.1 Verificar Hook useWebhookResponses**
O arquivo `src/hooks/useWebhookResponses.ts` já está configurado para usar Realtime.

### **3.2 Testar Realtime no Frontend**

1. **Faça login no sistema**
2. **Abra o console do navegador** (F12)
3. **Execute este teste:**

```javascript
// Testar se Realtime está funcionando
window.testRealtimeConnection = async () => {
  try {
    const { data, error } = await window.supabase.rpc('test_realtime_connection');
    
    if (error) {
      console.error('❌ Erro Realtime:', error);
      return false;
    }
    
    console.log('✅ Teste Realtime:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro no teste:', err);
    return false;
  }
};

// Executar teste
window.testRealtimeConnection();
```

### **3.3 Monitorar Atividade Realtime**
```javascript
// Ver atividade em tempo real
window.monitorRealtime = () => {
  window.supabase
    .channel('monitor-activity')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public'
    }, (payload) => {
      console.log('🔄 Mudança detectada:', payload);
    })
    .subscribe();
};

window.monitorRealtime();
```

---

## 🔍 **PASSO 4: Verificação Final**

### **4.1 Checklist de Verificação**

- [ ] ✅ Script SQL executado sem erros
- [ ] ✅ Função `diagnostic_realtime()` retorna status "ready"  
- [ ] ✅ Teste de conexão funciona no frontend
- [ ] ✅ WebSocket conecta sem erros no console
- [ ] ✅ Mensagens chegam em tempo real no TicketChat

### **4.2 Logs para Verificar**

1. **Console do Navegador:**
   - Deve mostrar conexão WebSocket bem-sucedida
   - Sem erros de autenticação

2. **Network Tab:**
   - Deve mostrar conexão WebSocket ativa
   - Status 101 (Switching Protocols)

3. **No CRM:**
   - Mensagens chegam instantaneamente
   - Notificações aparecem em tempo real

---

## 🚨 **SOLUÇÃO DE PROBLEMAS**

### **Problema 1: "function does not exist"**
**Solução:** Execute `CORRECAO_FUNCOES_REALTIME.sql` primeiro

### **Problema 2: "publication does not exist"**
```sql
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."messages";
```

### **Problema 3: "User not authenticated"**
**Solução:** Faça login no sistema antes de testar

### **Problema 4: WebSocket não conecta**
1. Verifique as credenciais do Supabase
2. Confirme que RLS está habilitado nas tabelas
3. Verifique as políticas de segurança

### **Problema 5: Mensagens não chegam em tempo real**
1. Verifique se as tabelas estão na publicação:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

2. Confirme que o hook está configurado corretamente:
```javascript
// No componente React
const { evolutionMessages } = useWebhookResponses(ticket?.id?.toString());
```

---

## 🎉 **CONFIGURAÇÃO CONCLUÍDA!**

Quando todos os passos forem executados com sucesso:

- ✅ **Realtime configurado** e funcionando
- ✅ **WebSocket conectado** no frontend  
- ✅ **Mensagens em tempo real** no TicketChat
- ✅ **Notificações instantâneas** funcionando
- ✅ **Status de leitura** sincronizado
- ✅ **Performance otimizada** com subscriptions eficientes

**🚀 Agora o sistema BKCRM está com Realtime totalmente configurado!** 