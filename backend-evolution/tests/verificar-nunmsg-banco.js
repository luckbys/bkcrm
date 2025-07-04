// =============================================================================
// 🔍 VERIFICAR: Campo nunmsg no banco de dados
// =============================================================================

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0NDk0MywiZXhwIjoyMDUxNTIwOTQzfQ.6CShPE-LsKHhM-K6mhMlV8CZqMGZhNTHJLZI5C4Lf5k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarNunmsgBanco() {
  console.log('\n🔍 === VERIFICAÇÃO: Campo nunmsg no Banco ===\n');

  try {
    // 1. VERIFICAR SE CAMPO NUNMSG EXISTE
    console.log('1️⃣ Verificando se campo nunmsg existe...');
    
    const { data: campos, error: camposError } = await supabase
      .from('tickets')
      .select('nunmsg')
      .limit(1);

    if (camposError) {
      if (camposError.message.includes('column "nunmsg" does not exist')) {
        console.log('❌ PROBLEMA: Campo nunmsg não existe na tabela tickets!');
        console.log('💡 SOLUÇÃO: Execute o script CORRECAO_NUNMSG_COMPLETA.sql no Supabase');
        return;
      } else {
        console.error('❌ Erro ao verificar campo:', camposError);
        return;
      }
    }
    
    console.log('✅ Campo nunmsg existe na tabela');

    // 2. VERIFICAR TICKET DE TESTE
    console.log('\n2️⃣ Procurando ticket de teste (+5511999887766)...');
    
    const { data: ticketTeste, error: testeError } = await supabase
      .from('tickets')
      .select('id, title, nunmsg, channel, metadata, created_at')
      .eq('nunmsg', '+5511999887766')
      .order('created_at', { ascending: false })
      .limit(1);

    if (testeError) {
      console.error('❌ Erro ao buscar ticket de teste:', testeError);
      return;
    }

    if (ticketTeste && ticketTeste.length > 0) {
      const ticket = ticketTeste[0];
      console.log('✅ SUCESSO: Ticket de teste encontrado!');
      console.log(`   🆔 ID: ${ticket.id}`);
      console.log(`   📱 nunmsg: ${ticket.nunmsg}`);
      console.log(`   📢 Canal: ${ticket.channel}`);
      console.log(`   📅 Criado: ${ticket.created_at}`);
      console.log(`   🏷️ Título: ${ticket.title}`);
      
      console.log('\n🎯 RESULTADO: Webhook está salvando campo nunmsg corretamente!');
    } else {
      console.log('⚠️ Ticket de teste não encontrado');
      console.log('💡 Possíveis causas:');
      console.log('   - Webhook não conseguiu salvar no banco');
      console.log('   - Campo nunmsg não está sendo preenchido');
      console.log('   - Problema de permissões do banco');
    }

    // 3. ESTATÍSTICAS GERAIS
    console.log('\n3️⃣ Estatísticas dos tickets WhatsApp...');
    
    const { data: stats, error: statsError } = await supabase
      .from('tickets')
      .select('nunmsg, channel')
      .eq('channel', 'whatsapp');

    if (statsError) {
      console.error('❌ Erro ao buscar estatísticas:', statsError);
      return;
    }

    const total = stats.length;
    const comNunmsg = stats.filter(t => t.nunmsg).length;
    const semNunmsg = total - comNunmsg;
    const percentual = total > 0 ? ((comNunmsg / total) * 100).toFixed(1) : 0;

    console.log(`📊 Total tickets WhatsApp: ${total}`);
    console.log(`✅ Com nunmsg: ${comNunmsg} (${percentual}%)`);
    console.log(`❌ Sem nunmsg: ${semNunmsg}`);

    if (semNunmsg > 0) {
      console.log('\n💡 Para corrigir tickets antigos sem nunmsg:');
      console.log('Execute o script CORRECAO_NUNMSG_COMPLETA.sql no Supabase');
    }

    // 4. ÚLTIMOS TICKETS CRIADOS
    console.log('\n4️⃣ Últimos 3 tickets WhatsApp criados...');
    
    const { data: ultimosTickets, error: ultimosError } = await supabase
      .from('tickets')
      .select('id, title, nunmsg, created_at')
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(3);

    if (ultimosError) {
      console.error('❌ Erro ao buscar últimos tickets:', ultimosError);
      return;
    }

    ultimosTickets.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.id.substring(0, 8)}... - nunmsg: ${ticket.nunmsg || 'NULL'} - ${ticket.created_at}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// EXECUTAR VERIFICAÇÃO
console.log('🚀 Iniciando verificação do campo nunmsg no banco...');
verificarNunmsgBanco()
  .then(() => {
    console.log('\n🏁 Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  });

module.exports = { verificarNunmsgBanco }; 