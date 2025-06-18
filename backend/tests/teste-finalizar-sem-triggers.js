// ================================================
// TESTE FINALIZAR TICKETS SEM MANIPULAR TRIGGERS
// ================================================
// Testa a nova função RPC finalize_ticket_without_triggers

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarFinalizarSemTriggers() {
  console.log('🧪 Testando finalização de tickets sem manipular triggers...\n');

  try {
    // 1. Verificar se existem triggers na tabela tickets
    console.log('1️⃣ Verificando triggers existentes...');
    const { data: triggers, error: triggerError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          triggername,
          triggerdef
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'tickets'
        AND n.nspname = 'public'
        AND t.tgname NOT LIKE 'RI_%';
      `
    });

    if (triggers && triggers.length > 0) {
      console.log('⚠️ Triggers encontrados na tabela tickets:');
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.triggername}`);
      });
    } else {
      console.log('✅ Nenhum trigger personalizado encontrado na tabela tickets');
    }

    // 2. Buscar ticket para teste
    console.log('\n2️⃣ Buscando ticket para teste...');
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, title, status, customer_id')
      .neq('status', 'closed')
      .limit(1);

    if (fetchError) {
      console.error('❌ Erro ao buscar tickets:', fetchError);
      return;
    }

    if (!tickets || tickets.length === 0) {
      console.log('⚠️ Criando ticket de teste...');
      
      const { data: newTicket, error: createError } = await supabase
        .from('tickets')
        .insert([{
          title: 'Teste Finalizar Sem Triggers - ' + new Date().toISOString(),
          status: 'open',
          priority: 'normal',
          channel: 'whatsapp',
          metadata: { test: true, no_triggers: true }
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar ticket de teste:', createError);
        return;
      }

      tickets.push(newTicket);
    }

    const testTicket = tickets[0];
    console.log('✅ Ticket para teste:', {
      id: testTicket.id,
      title: testTicket.title,
      status: testTicket.status
    });

    // 3. Testar nova função RPC finalize_ticket_without_triggers
    console.log('\n3️⃣ Testando RPC finalize_ticket_without_triggers...');
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_ticket_without_triggers', {
      ticket_uuid: testTicket.id
    });

    if (rpcError) {
      console.error('❌ Erro na RPC:', rpcError);
      
      // 4. Testar função alternativa update_ticket_simple
      console.log('\n4️⃣ Testando RPC update_ticket_simple como fallback...');
      
      const { data: rpcSimple, error: rpcSimpleError } = await supabase.rpc('update_ticket_simple', {
        ticket_uuid: testTicket.id,
        new_status: 'closed'
      });

      if (rpcSimpleError) {
        console.error('❌ Erro na RPC Simple:', rpcSimpleError);
        return;
      }

      console.log('📊 Resultado RPC Simple:', rpcSimple);
      
      if (rpcSimple && rpcSimple.success) {
        console.log('✅ RPC Simple executada com sucesso!');
      } else {
        console.log('❌ RPC Simple falhou:', rpcSimple);
        return;
      }
    } else {
      console.log('📊 Resultado RPC Without Triggers:', rpcResult);

      if (rpcResult && rpcResult.success) {
        console.log('✅ RPC Without Triggers executada com sucesso!');
      } else {
        console.log('❌ RPC Without Triggers falhou:', rpcResult);
        return;
      }
    }

    // 5. Verificar se o ticket foi realmente atualizado
    console.log('\n5️⃣ Verificando atualização no banco...');
    
    const { data: updatedTicket, error: verifyError } = await supabase
      .from('tickets')
      .select('id, title, status, closed_at, updated_at')
      .eq('id', testTicket.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar ticket atualizado:', verifyError);
      return;
    }

    console.log('📋 Ticket após teste:', {
      id: updatedTicket.id,
      title: updatedTicket.title,
      status: updatedTicket.status,
      closed_at: updatedTicket.closed_at,
      updated_at: updatedTicket.updated_at
    });

    if (updatedTicket.status === 'closed' && updatedTicket.closed_at) {
      console.log('\n🎉 SUCESSO TOTAL! Ticket finalizado sem erros de trigger.');
      
      // 6. Verificar se o frontend mapeia corretamente
      console.log('\n6️⃣ Testando mapeamento de status no frontend...');
      
      // Simular função mapStatus do frontend
      const mapStatus = (status) => {
        const statusMap = {
          'pendente': 'pendente',
          'open': 'pendente',
          'atendimento': 'atendimento',
          'in_progress': 'atendimento',
          'finalizado': 'finalizado',
          'resolved': 'finalizado',
          'closed': 'finalizado',
          'cancelado': 'cancelado',
          'cancelled': 'cancelado'
        };
        return statusMap[status] || 'pendente';
      };

      const frontendStatus = mapStatus(updatedTicket.status);
      console.log(`📱 Status no banco: "${updatedTicket.status}" → Frontend: "${frontendStatus}"`);
      
      if (frontendStatus === 'finalizado') {
        console.log('✅ Mapeamento correto! Ticket aparecerá no filtro "Finalizados"');
      } else {
        console.log('❌ Mapeamento incorreto! Verificar função mapStatus');
      }
      
    } else {
      console.log('\n⚠️ Ticket não foi finalizado corretamente:', {
        status: updatedTicket.status,
        closed_at: updatedTicket.closed_at
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testarFinalizarSemTriggers().then(() => {
  console.log('\n🏁 Teste concluído.');
  process.exit(0);
}); 