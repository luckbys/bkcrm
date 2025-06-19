// =============================================================================
// 🔍 DIAGNÓSTICO: Campo nunmsg não está sendo preenchido
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configurações
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0NDk0MywiZXhwIjoyMDUxNTIwOTQzfQ.6CShPE-LsKHhM-K6mhMlV8CZqMGZhNTHJLZI5C4Lf5k';
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'http://localhost:4000';

async function diagnosticarProblema() {
  console.log('\n🔍 === DIAGNÓSTICO: Por que nunmsg não está preenchido? ===\n');

  // 1. VERIFICAR SE CAMPO NUNMSG EXISTE NA TABELA
  console.log('1️⃣ Verificando se campo nunmsg existe na tabela...');
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, nunmsg, channel, metadata')
      .eq('channel', 'whatsapp')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao consultar tabela tickets:', error.message);
      if (error.message.includes('column "nunmsg" does not exist')) {
        console.log('🚨 PROBLEMA ENCONTRADO: Campo nunmsg não existe na tabela!');
        console.log('💡 SOLUÇÃO: Execute o script SQL para adicionar o campo.');
        return false;
      }
    } else {
      console.log('✅ Campo nunmsg existe na tabela tickets');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar campo nunmsg:', err.message);
    return false;
  }

  // 2. VERIFICAR TICKETS WHATSAPP RECENTES
  console.log('\n2️⃣ Analisando tickets WhatsApp recentes...');
  try {
    const { data: recentTickets, error } = await supabase
      .from('tickets')
      .select('id, title, nunmsg, channel, metadata, created_at')
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar tickets:', error);
      return false;
    }

    console.log(`📊 Encontrados ${recentTickets.length} tickets WhatsApp recentes:`);
    
    recentTickets.forEach((ticket, index) => {
      console.log(`\n${index + 1}. Ticket ${ticket.id.substring(0, 8)}...`);
      console.log(`   📅 Criado: ${ticket.created_at}`);
      console.log(`   📱 nunmsg: ${ticket.nunmsg || 'NULL'}`);
      console.log(`   🏷️ Title: ${ticket.title}`);
      console.log(`   📞 Metadata phone: ${ticket.metadata?.client_phone || ticket.metadata?.whatsapp_phone || 'não encontrado'}`);
    });

    const comNunmsg = recentTickets.filter(t => t.nunmsg).length;
    const semNunmsg = recentTickets.filter(t => !t.nunmsg).length;
    
    console.log(`\n📈 Estatísticas: ${comNunmsg} com nunmsg | ${semNunmsg} sem nunmsg`);
    
    if (semNunmsg > 0) {
      console.log('🚨 PROBLEMA: Tickets WhatsApp sem nunmsg preenchido!');
    }

  } catch (err) {
    console.error('❌ Erro ao analisar tickets:', err.message);
    return false;
  }

  // 3. VERIFICAR STATUS DO WEBHOOK
  console.log('\n3️⃣ Verificando status do webhook...');
  try {
    const response = await fetch(`${WEBHOOK_URL}/webhook/health`);
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Webhook está rodando:', health);
    } else {
      console.log('❌ Webhook não está respondendo ou com erro');
      console.log('💡 SOLUÇÃO: Verificar se o webhook está rodando na porta 4000');
      return false;
    }
  } catch (err) {
    console.error('❌ Webhook não está acessível:', err.message);
    console.log('💡 SOLUÇÃO: Iniciar o webhook com: node webhook-evolution-complete-corrigido.js');
    return false;
  }

  // 4. TESTAR CRIAÇÃO MANUAL DE TICKET COM NUNMSG
  console.log('\n4️⃣ Testando criação manual de ticket com nunmsg...');
  try {
    const testTicket = {
      title: 'Teste nunmsg - ' + Date.now(),
      description: 'Ticket de teste para verificar campo nunmsg',
      status: 'open',
      priority: 'medium',
      channel: 'whatsapp',
      nunmsg: '+5511999887766', // TESTE: Campo nunmsg
      metadata: {
        test_diagnostic: true,
        client_phone: '+5511999887766',
        diagnostic_timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Criando ticket de teste com nunmsg...');
    
    const { data: createdTicket, error } = await supabase
      .from('tickets')
      .insert([testTicket])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar ticket de teste:', error);
      console.log('🚨 PROBLEMA: Não consegue inserir dados no campo nunmsg!');
      
      if (error.message.includes('column "nunmsg" does not exist')) {
        console.log('💡 SOLUÇÃO: Campo nunmsg não existe, execute o script SQL.');
      }
      
      return false;
    } else {
      console.log('✅ Ticket de teste criado com sucesso!');
      console.log(`   🆔 ID: ${createdTicket.id}`);
      console.log(`   📱 nunmsg: ${createdTicket.nunmsg}`);
      
      // Limpar ticket de teste
      await supabase
        .from('tickets')
        .delete()
        .eq('id', createdTicket.id);
      
      console.log('🧹 Ticket de teste removido');
    }
  } catch (err) {
    console.error('❌ Erro no teste manual:', err.message);
    return false;
  }

  // 5. VERIFICAR VERSÃO DO WEBHOOK
  console.log('\n5️⃣ Verificando se webhook tem código atualizado...');
  try {
    // Simular uma mensagem de teste para verificar logs
    const testPayload = {
      event: 'messages.upsert',
      instance: 'teste-diagnostico',
      data: {
        key: {
          remoteJid: '5511999887766@s.whatsapp.net',
          fromMe: false,
          id: 'test_diagnostic_' + Date.now()
        },
        message: {
          conversation: '[TESTE DIAGNÓSTICO] Verificando se nunmsg é preenchido'
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Teste Diagnóstico'
      }
    };

    console.log('📡 Enviando payload de teste para webhook...');
    
    const response = await fetch(`${WEBHOOK_URL}/webhook/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    if (response.ok && result.processed) {
      console.log('✅ Webhook processou mensagem de teste');
      console.log('📋 Resultado:', result);
      
      // Aguardar e verificar se ticket foi criado com nunmsg
      setTimeout(async () => {
        console.log('\n⏱️ Verificando ticket criado pelo teste...');
        
        const { data: testTickets } = await supabase
          .from('tickets')
          .select('id, nunmsg, metadata')
          .contains('metadata', { test_diagnostic: true })
          .order('created_at', { ascending: false })
          .limit(1);

        if (testTickets && testTickets.length > 0) {
          const ticket = testTickets[0];
          console.log(`🎫 Ticket encontrado: ${ticket.id.substring(0, 8)}...`);
          console.log(`📱 nunmsg: ${ticket.nunmsg || 'NULL'}`);
          
          if (ticket.nunmsg) {
            console.log('✅ SUCCESS: Webhook está preenchendo nunmsg corretamente!');
          } else {
            console.log('❌ PROBLEMA: Webhook criou ticket mas não preencheu nunmsg!');
            console.log('💡 SOLUÇÃO: Verificar se webhook tem código atualizado.');
          }
          
          // Limpar ticket de teste
          await supabase
            .from('tickets')
            .delete()
            .eq('id', ticket.id);
        } else {
          console.log('❌ Ticket de teste não foi encontrado');
        }
      }, 3000);
      
    } else {
      console.log('❌ Webhook não processou mensagem de teste:', result);
    }

  } catch (err) {
    console.error('❌ Erro ao testar webhook:', err.message);
  }

  return true;
}

// EXECUTAR DIAGNÓSTICO
diagnosticarProblema()
  .then((success) => {
    if (success) {
      console.log('\n🎯 === RESUMO DO DIAGNÓSTICO ===');
      console.log('1. Verifique os logs acima para identificar problemas');
      console.log('2. Se campo nunmsg não existe, execute o script SQL');
      console.log('3. Se webhook não está rodando, inicie com node webhook-evolution-complete-corrigido.js');
      console.log('4. Se webhook não está atualizado, reinicie com código novo');
      console.log('5. Aguarde 3 segundos para ver resultado do teste de webhook\n');
    }
  })
  .catch((error) => {
    console.error('❌ Erro no diagnóstico:', error);
  });

module.exports = { diagnosticarProblema }; 