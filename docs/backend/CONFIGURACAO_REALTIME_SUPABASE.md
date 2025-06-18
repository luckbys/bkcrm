# 📡 Configuração Realtime Supabase - BKCRM

## 🎯 **VISÃO GERAL**

O Realtime do Supabase precisa estar configurado para escutar mudanças em tempo real nas seguintes tabelas:

### **📋 Tabelas que Precisam de Realtime:**
- ✅ `tickets` - Novos tickets e atualizações
- ✅ `messages` - Novas mensagens (WhatsApp + Chat)  
- ✅ `profiles` - Atualizações de usuários
- ✅ `notifications` - Notificações do sistema

---

## 🔧 **CONFIGURAÇÃO NO PAINEL SUPABASE**

### **1. Acessar Realtime Inspector**
1. Acesse: **Supabase Dashboard** → **Realtime** (onde você está agora)
2. Clique em **"Join a channel"**

### **2. Configurar Channels Essenciais**

#### **📨 Channel: Messages (Mensagens WhatsApp)**
```javascript
Channel name: "messages-realtime"
Schema: public
Table: messages
Filter: none (ou specific ticket_id)
Events: INSERT, UPDATE
```

#### **🎫 Channel: Tickets (Novos Tickets)**  
```javascript
Channel name: "tickets-realtime"
Schema: public
Table: tickets
Filter: none
Events: INSERT, UPDATE
```

#### **👥 Channel: Profiles (Usuários)**
```javascript
Channel name: "profiles-realtime" 
Schema: public
Table: profiles
Filter: none
Events: UPDATE
```

#### **🔔 Channel: Notifications**
```javascript
Channel name: "notifications-realtime"
Schema: public
Table: notifications  
Filter: none
Events: INSERT, UPDATE, DELETE
```

---

## 📊 **STATUS ATUAL DO SISTEMA**

### **✅ Já Configurado no Código:**

1. **useWebhookResponses.ts** - Escuta mensagens WhatsApp
```typescript
// Subscription ativa para:
supabase.channel(`ticket-messages-${ticketId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public', 
    table: 'messages',
    filter: `ticket_id=eq.${ticketId}`
  })
```

2. **useNotifications.ts** - Escuta notificações
```typescript
// Subscription ativa para:
supabase.channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  })
```

3. **useTickets.ts** - Escuta tickets e mensagens
```typescript
// Multiple subscriptions ativas
```

---

## ⚙️ **HABILITAR REALTIME NAS TABELAS**

### **Via SQL Editor (Recomendado):**

```sql
-- Habilitar Realtime para tabelas críticas
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- Habilitar Realtime (se não estiver habilitado)
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."profiles";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."notifications";
```

### **Via Painel Supabase:**
1. **Database** → **Tables** 
2. Para cada tabela (`messages`, `tickets`, `profiles`, `notifications`):
   - Clique na tabela
   - **Settings** → **Enable Realtime**
   - ✅ Marcar **"Enable"**

---

## 🧪 **TESTE DE FUNCIONAMENTO**

### **1. Verificar Conexão (Console DevTools):**
```javascript
// Verificar se Realtime está conectado
console.log('Realtime conectado:', supabase.realtime.isConnected());

// Testar subscription
testSupabaseConnection()
```

### **2. Teste de Mensagens WhatsApp:**
```javascript
// Simular recebimento de mensagem
testWebhookTicketCreation()
```

### **3. Status no Painel:**
- **Realtime Inspector**: Deve mostrar channels ativos
- **Connections**: Deve mostrar conexões ativas
- **Messages**: Deve mostrar atividade em tempo real

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **❌ "WebSocket connection failed"**
**Causa**: Configuração de rede ou timeout
**Solução**: ✅ Já corrigido em `supabase.ts` com timeouts adequados

### **❌ "Channel subscription failed"**  
**Causa**: RLS (Row Level Security) bloqueando
**Solução**: Verificar políticas RLS nas tabelas

### **❌ "No messages received"**
**Causa**: Tabela não habilitada para Realtime
**Solução**: Executar SQL acima ou habilitar via painel

---

## 📈 **MONITORAMENTO**

### **Logs em Tempo Real:**
```javascript
// Habilitar logs detalhados
localStorage.setItem('supabase.realtime.debug', 'true');

// Ver status das subscriptions  
console.log('Subscriptions ativas:', supabase.realtime.channels);
```

### **Métricas Importantes:**
- **Connected Clients**: Quantos usuários conectados
- **Messages/sec**: Taxa de mensagens
- **Reconnection Rate**: Taxa de reconexão

---

## ✅ **CHECKLIST DE VERIFICAÇÃO**

- [ ] Realtime habilitado nas 4 tabelas principais
- [ ] Channels configurados no Inspector  
- [ ] RLS configurado adequadamente
- [ ] Timeouts configurados (já feito)
- [ ] Logs de debug habilitados
- [ ] Teste de mensagens funcionando
- [ ] Conexão estável (sem falhas repetidas)

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Configure os channels no painel** (onde você está)
2. **Execute o SQL** para habilitar tabelas
3. **Teste com** `testSupabaseConnection()`
4. **Monitore logs** no DevTools do navegador

O sistema está **95% configurado** - só falta habilitar as tabelas no painel! 🚀 

# 🔧 **CONFIGURAÇÃO REALTIME SUPABASE - Resolver WebSocket Failed**

## 🚨 **PROBLEMA IDENTIFICADO:**
```
WebSocket connection to 'wss://press-supabase.jhkbgs.easypanel.host/realtime/v1/websocket' failed
```

---

## 📋 **PASSOS PARA RESOLVER:**

### **1. 🔌 Verificar se o Realtime está habilitado no Painel**

1. **Acesse:** `https://press-supabase.jhkbgs.easypanel.host` (seu painel Supabase)
2. **Vá em:** `Settings` → `API` 
3. **Procure por:** "Realtime" 
4. **Verifique se está:** ✅ **ENABLED**

---

### **2. 🛡️ Verificar RLS (Row Level Security)**

No **SQL Editor** do Supabase, execute:

```sql
-- Verificar se RLS está habilitado corretamente
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tickets', 'messages', 'profiles')
ORDER BY tablename;
```

**Se RLS não estiver habilitado, execute:**

```sql
-- Habilitar RLS para as tabelas críticas
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

### **3. 🔑 Configurar Políticas de Acesso**

Execute no **SQL Editor**:

```sql
-- Política para tickets (usuários autenticados)
CREATE POLICY "Users can view tickets" ON public.tickets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tickets" ON public.tickets
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para messages (usuários autenticados)
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para profiles (usuários podem ver próprio perfil)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

### **4. 📡 Verificar Publicação Realtime**

Execute no **SQL Editor**:

```sql
-- Verificar tabelas na publicação
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Se alguma tabela estiver faltando:**

```sql
-- Adicionar tabelas faltantes (execute apenas se necessário)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

---

### **5. 🌐 Configurar CORS e Domínios**

1. **No painel Supabase:** `Settings` → `API`
2. **Adicione seus domínios em "URL Configuration":**
   - `http://localhost:3007`
   - `http://localhost:3009` 
   - `https://seu-dominio.com` (se em produção)

---

### **6. 🔧 Configurar Código Corretamente**

Atualize seu arquivo `.env`:

```env
VITE_SUPABASE_URL=https://press-supabase.jhkbgs.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
VITE_ENABLE_REALTIME=true
```

---

### **7. 💻 Teste Direto no Console**

**Abra o console do navegador (F12) e execute:**

```javascript
// Teste de conectividade básica
console.log('🔧 Testando conectividade Supabase...');

const testSupabaseConnection = async () => {
  try {
    // 1. Verificar se Supabase está configurado
    console.log('📊 URL:', window.supabase?.supabaseUrl);
    console.log('🔑 Tem chave:', !!window.supabase?.supabaseKey);
    
    // 2. Verificar autenticação
    const { data: user, error } = await window.supabase.auth.getUser();
    console.log('👤 Usuário:', user?.user?.email || 'Não logado');
    console.log('❌ Erro auth:', error);
    
    // 3. Testar conexão simples
    const { data, error: dbError } = await window.supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('📊 Teste DB:', data, 'Erro:', dbError);
    
    // 4. Testar Realtime (somente se logado)
    if (user?.user) {
      console.log('🚀 Testando Realtime...');
      
      const channel = window.supabase
        .channel('test-connection')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          (payload) => console.log('✅ Realtime funcionou!', payload.eventType)
        )
        .subscribe((status) => {
          console.log('📡 Status Realtime:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('🎉 REALTIME CONECTADO COM SUCESSO!');
          } else if (status === 'CHANNEL_ERROR') {
            console.log('❌ ERRO no canal Realtime');
          } else if (status === 'TIMED_OUT') {
            console.log('⏰ TIMEOUT na conexão Realtime');
          }
        });
      
      // Status após 5 segundos
      setTimeout(() => {
        console.log('🔌 Estado final:', window.supabase.realtime.connectionState());
        
        // Limpar teste
        setTimeout(() => channel.unsubscribe(), 1000);
      }, 5000);
    } else {
      console.log('⚠️ Faça login primeiro para testar Realtime');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
};

// Executar teste
testSupabaseConnection();
```

---

### **8. 🚀 Solução Alternativa (Se WebSocket continuar falhando)**

Se o WebSocket continuar falhando, podemos usar **Polling** como fallback:

```javascript
// No console do navegador
localStorage.setItem('supabase-realtime-fallback', 'polling');
location.reload(); // Recarregar página
```

---

### **9. ⚙️ Verificar Configurações de Rede**

Se estiver usando **VPN, Firewall corporativo ou proxy**:

1. **Desabilite VPN** temporariamente
2. **Teste em rede diferente** (mobile hotspot)
3. **Verifique portas:** 80, 443, 4000-4010

---

### **10. 🔄 Reiniciar Serviços**

Se nada funcionar:

1. **No painel Supabase:** `Settings` → `General` → **Restart project**
2. **Aguarde 2-3 minutos**
3. **Teste novamente**

---

## 🧪 **TESTE FINAL**

Após seguir os passos, execute este teste simples:

```javascript
// Teste final completo
window.finalRealtimeTest = async () => {
  console.log('🔬 TESTE FINAL DO REALTIME');
  
  try {
    const { data: user } = await window.supabase.auth.getUser();
    
    if (!user?.user) {
      console.log('❌ LOGIN NECESSÁRIO');
      return;
    }
    
    console.log('✅ Usuário logado:', user.user.email);
    
    const testChannel = window.supabase
      .channel('final-test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        () => console.log('✅ TICKETS REALTIME OK')
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        () => console.log('✅ MESSAGES REALTIME OK')
      )
      .subscribe(status => {
        console.log('📊 Status final:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎉 REALTIME 100% FUNCIONAL!');
        }
      });
    
    return testChannel;
  } catch (error) {
    console.error('❌ Erro no teste final:', error);
  }
};

// Executar
window.finalRealtimeTest();
```

---

## 📞 **SUPORTE ADICIONAL**

Se ainda não funcionar:

1. **Verifique logs do Supabase:** `Logs` → `Realtime`
2. **Contate suporte Supabase** com detalhes do erro
3. **Considere migrar** para instância Supabase mais próxima

---

**📌 Execute os passos na ordem e teste após cada um!** 