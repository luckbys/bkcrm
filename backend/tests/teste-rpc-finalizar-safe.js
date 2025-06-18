// ================================================
// TESTE RPC FINALIZE_TICKET_SAFE
// ================================================
// Testa a nova função RPC que bypassa triggers

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testarRPCFinalizeSafe() {
  console.log('🧪 Testando RPC finalize_ticket_safe...\n');

  try {
    // 1. Buscar um ticket em status 'open' para testar
    console.log('1️⃣ Buscando ticket para teste...');
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, title, status, customer_id')
      .eq('status', 'open')
      .limit(1);

    if (fetchError) {
      console.error('❌ Erro ao buscar tickets:', fetchError);
      return;
    }

    if (!tickets || tickets.length === 0) {
      console.log('⚠️ Nenhum ticket em status "open" encontrado. Criando ticket de teste...');
      
      // Criar ticket de teste
      const { data: newTicket, error: createError } = await supabase
        .from('tickets')
        .insert([{
          title: 'Teste RPC Safe - ' + new Date().toISOString(),
          status: 'open',
          priority: 'normal',
          channel: 'whatsapp',
          metadata: { test: true, rpc_safe: true }
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

    // 2. Testar RPC finalize_ticket_safe
    console.log('\n2️⃣ Testando RPC finalize_ticket_safe...');
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_ticket_safe', {
      ticket_uuid: testTicket.id
    });

    if (rpcError) {
      console.error('❌ Erro na RPC finalize_ticket_safe:', rpcError);
      return;
    }

    console.log('📊 Resultado da RPC:', rpcResult);

    if (rpcResult && rpcResult.success) {
      console.log('✅ RPC executada com sucesso!');
      
      // 3. Verificar se o ticket foi realmente atualizado
      console.log('\n3️⃣ Verificando atualização no banco...');
      
      const { data: updatedTicket, error: verifyError } = await supabase
        .from('tickets')
        .select('id, title, status, closed_at, updated_at')
        .eq('id', testTicket.id)
        .single();

      if (verifyError) {
        console.error('❌ Erro ao verificar ticket atualizado:', verifyError);
        return;
      }

      console.log('📋 Ticket após RPC:', {
        id: updatedTicket.id,
        title: updatedTicket.title,
        status: updatedTicket.status,
        closed_at: updatedTicket.closed_at,
        updated_at: updatedTicket.updated_at
      });

      if (updatedTicket.status === 'closed' && updatedTicket.closed_at) {
        console.log('🎉 SUCESSO TOTAL! Ticket finalizado corretamente.');
      } else {
        console.log('⚠️ RPC executou mas status não foi atualizado:', updatedTicket.status);
      }

    } else {
      console.log('❌ RPC retornou falha:', rpcResult);
    }

    // 4. Testar função alternativa update_ticket_status_safe
    console.log('\n4️⃣ Testando RPC update_ticket_status_safe...');
    
    // Primeiro, reverter o ticket para 'open' se necessário
    if (rpcResult && rpcResult.success) {
      console.log('Revertendo ticket para "open" para testar segunda função...');
      await supabase
        .from('tickets')
        .update({ status: 'open', closed_at: null })
        .eq('id', testTicket.id);
    }

    const { data: rpcResult2, error: rpcError2 } = await supabase.rpc('update_ticket_status_safe', {
      ticket_uuid: testTicket.id,
      new_status: 'closed'
    });

    if (rpcError2) {
      console.error('❌ Erro na RPC update_ticket_status_safe:', rpcError2);
    } else {
      console.log('📊 Resultado da RPC update_ticket_status_safe:', rpcResult2);
      
      if (rpcResult2 && rpcResult2.success) {
        console.log('✅ RPC update_ticket_status_safe funcionou!');
      } else {
        console.log('❌ RPC update_ticket_status_safe falhou:', rpcResult2);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testarRPCFinalizeSafe().then(() => {
  console.log('\n🏁 Teste concluído.');
  process.exit(0);
}); 