# 🔧 Solução Definitiva para Problemas do Supabase

## ❌ Problema
O erro "Invalid API key" está aparecendo porque:
1. A chave anon key do Supabase está incorreta ou expirada
2. O projeto Supabase não está configurado corretamente
3. As variáveis de ambiente não estão sendo carregadas corretamente

## ✅ Soluções Implementadas

### 1. Chave Supabase Atualizada
- ✅ Atualizada a chave anon no `public/env.js`
- ✅ Atualizada a chave anon no `src/lib/supabase.ts`
- ✅ Desabilitado temporariamente o Realtime para focar na autenticação

### 2. Melhor Tratamento de Erros
- ✅ Adicionados logs detalhados para depuração
- ✅ Tratamento específico para diferentes tipos de erro
- ✅ Funções de diagnóstico disponíveis no console

### 3. Configuração do Nginx Corrigida
- ✅ Removidas diretivas duplicadas do nginx.conf
- ✅ Configuração limpa apenas para servidor web

## 🚀 Como Resolver Definitivamente

### Passo 1: Obter a Chave Correta do Supabase
1. Acesse: https://supabase.com/dashboard/project/ajlgjjjvuglwgfnyqqvb/settings/api
2. Copie a chave "anon public" (que começa com `eyJhbGciOiJIUzI1NiI...`)
3. Substitua nos arquivos:
   - `public/env.js`
   - `src/lib/supabase.ts` (na seção defaults)

### Passo 2: Verificar o Projeto Supabase
1. Confirme que o projeto está ativo no dashboard
2. Verifique se a URL está correta: `https://ajlgjjjvuglwgfnyqqvb.supabase.co`
3. Certifique-se de que a autenticação está habilitada

### Passo 3: Testar a Conexão
1. Abra o console do navegador (F12)
2. Execute: `window.testSupabaseConnection()`
3. Execute: `window.diagnoseSupabaseConnection()`
4. Verifique se retorna status 200

### Passo 4: Criar Usuário de Teste (se necessário)
1. No dashboard do Supabase, vá para Authentication > Users
2. Crie um usuário manualmente para testes
3. Use esse usuário para fazer login

### Passo 5: Verificar RLS (Row Level Security)
1. No dashboard, vá para Database > Tables
2. Se houver tabelas, verifique se RLS está configurado corretamente
3. Para testes, você pode desabilitar temporariamente o RLS

## 🛠️ Comandos para Debugging

### No Console do Navegador:
```javascript
// Testar conexão básica
window.testSupabaseConnection()

// Diagnóstico completo
window.diagnoseSupabaseConnection()

// Verificar configurações
console.log(window.env)
```

### No Terminal:
```bash
# Rebuildar o projeto
npm run build

# Testar localmente
npm run dev

# Verificar se o WebSocket está funcionando
node webhook-evolution-websocket.cjs
```

## 📋 Checklist de Verificação

- [ ] Chave anon atualizada no `public/env.js`
- [ ] Chave anon atualizada no `src/lib/supabase.ts`
- [ ] Projeto Supabase ativo e acessível
- [ ] URL do Supabase correta
- [ ] Usuário de teste criado no dashboard
- [ ] RLS configurado ou desabilitado para testes
- [ ] Teste de conexão retorna status 200
- [ ] Login funciona sem erros

## 🔄 Próximos Passos

1. **Imediato**: Obter a chave correta do dashboard do Supabase
2. **Curto prazo**: Configurar RLS adequadamente para produção
3. **Médio prazo**: Reabilitar Realtime após resolver autenticação
4. **Longo prazo**: Implementar monitoramento de conexão

## 📞 Suporte

Se o problema persistir após seguir todos os passos:
1. Verifique se há alguma mensagem de erro específica no console
2. Teste com um projeto Supabase completamente novo
3. Confirme que a conta Supabase não tem limitações ou suspensões

---

**Última atualização**: 27/06/2025
**Status**: Configurações aplicadas, aguardando teste em produção 