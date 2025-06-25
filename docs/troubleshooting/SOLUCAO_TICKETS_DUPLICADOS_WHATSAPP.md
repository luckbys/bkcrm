# Solução para Tickets Duplicados do WhatsApp

## Problema
Mensagens do WhatsApp estavam criando tickets duplicados mesmo quando já existia um ticket ativo para o cliente, causando:
- Fragmentação do histórico de conversas
- Dificuldade no acompanhamento do atendimento
- Métricas incorretas de atendimento
- Confusão para os agentes

## Causa Raiz
- Webhook não verificava adequadamente a existência de tickets ativos
- Lógica de busca de tickets não considerava o número do WhatsApp
- Sistema criava novo ticket para cada mensagem recebida
- Falta de sequência numérica para organizar conversas

## Solução Implementada

### 1. Nova Função RPC
Criada função `find_or_create_whatsapp_ticket` que:
- Busca tickets ativos por número de telefone
- Atualiza dados do cliente em tickets existentes
- Cria novos tickets apenas quando necessário
- Mantém sequência numérica por cliente
- Retorna informações completas (ID, status novo/existente, sequência)

### 2. Webhook Aprimorado
O webhook foi atualizado para:
- Usar a nova função RPC como método principal
- Extrair corretamente dados do remetente
- Vincular mensagens ao ticket correto
- Manter metadados enriquecidos
- Garantir consistência dos dados

### 3. Sistema de Sequência
Implementado sistema que:
- Incrementa sequência apenas para novos tickets
- Mantém histórico organizado por cliente
- Facilita identificação visual (#1, #2, etc)
- Permite rastreamento de conversas

## Como Aplicar a Solução

1. Execute o script SQL para criar a função RPC:
   ```sql
   backend/database/CORRECAO_TICKETS_WHATSAPP.sql
   ```

2. Atualize o webhook:
   ```bash
   cp backend/webhooks/webhook-evolution-complete-corrigido.js /caminho/do/webhook/
   ```

3. Reinicie o servidor webhook:
   ```bash
   pm2 restart webhook-evolution
   ```

4. Teste a solução:
   ```bash
   node backend/tests/teste-correcao-tickets-whatsapp.js
   ```

## Verificação

Para verificar se a solução está funcionando:

1. Envie uma mensagem WhatsApp para um número não cadastrado
   - Deve criar ticket #1

2. Envie mais mensagens do mesmo número
   - Deve usar o mesmo ticket #1

3. Finalize o ticket #1 e envie nova mensagem
   - Deve criar ticket #2

4. Verifique no banco de dados:
   ```sql
   SELECT id, title, status, metadata->>'sequence_number' as seq
   FROM tickets 
   WHERE metadata->>'whatsapp_phone' = '+5511999998888'
   ORDER BY created_at;
   ```

## Rollback

Se necessário reverter:

1. Restaure o webhook anterior:
   ```bash
   cp webhook-evolution-backup.js webhook-evolution-complete-corrigido.js
   ```

2. Remova a função RPC:
   ```sql
   DROP FUNCTION IF EXISTS find_or_create_whatsapp_ticket;
   ```

3. Reinicie o webhook:
   ```bash
   pm2 restart webhook-evolution
   ```

## Monitoramento

Monitore os logs do webhook para:
- Erros na criação/busca de tickets
- Problemas com sequência numérica
- Falhas na vinculação de mensagens

## Resultados Esperados

- ✅ Mensagens agrupadas no mesmo ticket enquanto ativo
- ✅ Novos tickets criados apenas após finalizar anteriores
- ✅ Sequência numérica clara (#1, #2, etc)
- ✅ Histórico organizado por conversas
- ✅ Metadados completos e consistentes
- ✅ Performance otimizada (menos queries) 