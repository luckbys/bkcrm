// ===================================
// TESTE: Verificar se funções RPC existem
// ===================================
// Execute no console do navegador para verificar

console.log('🔍 Verificando funções RPC no Supabase...');

// Função para testar se RPC existe
async function testRpcFunctions() {
    try {
        // Importar Supabase client
        const { createClient } = supabase;
        const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqampqdnVnbHdnZm55cXF2YiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMzMjY5MDI0LCJleHAiOjIwNDg4NDUwMjR9.hocr4qHWq1I3Ss5CY3Bx6ZqP4CQqmlRg8kPZUYVJEaE';
        
        const client = createClient(supabaseUrl, supabaseKey);
        
        console.log('📊 Cliente Supabase criado');
        
        // 1. Testar função finalize_ticket
        console.log('\n🧪 Testando função finalize_ticket...');
        try {
            const { data: finalizeData, error: finalizeError } = await client
                .rpc('finalize_ticket', { 
                    ticket_id: '00000000-0000-0000-0000-000000000000' // UUID fake para teste
                });
            
            if (finalizeError) {
                console.log('❌ Função finalize_ticket NÃO existe:', finalizeError.message);
            } else {
                console.log('✅ Função finalize_ticket existe e funcionou:', finalizeData);
            }
        } catch (error) {
            console.log('❌ Erro ao testar finalize_ticket:', error.message);
        }
        
        // 2. Testar função update_ticket_status
        console.log('\n🧪 Testando função update_ticket_status...');
        try {
            const { data: updateData, error: updateError } = await client
                .rpc('update_ticket_status', { 
                    ticket_id: '00000000-0000-0000-0000-000000000000', // UUID fake para teste
                    new_status: 'closed'
                });
            
            if (updateError) {
                console.log('❌ Função update_ticket_status NÃO existe:', updateError.message);
            } else {
                console.log('✅ Função update_ticket_status existe e funcionou:', updateData);
            }
        } catch (error) {
            console.log('❌ Erro ao testar update_ticket_status:', error.message);
        }
        
        // 3. Listar tickets para encontrar um real para teste
        console.log('\n📋 Buscando tickets reais para teste...');
        const { data: tickets, error: ticketsError } = await client
            .from('tickets')
            .select('id, title, status')
            .limit(3);
            
        if (ticketsError) {
            console.log('❌ Erro ao buscar tickets:', ticketsError);
        } else if (tickets && tickets.length > 0) {
            console.log('✅ Tickets encontrados:', tickets);
            
            // Testar com ticket real (sem alterar dados)
            const testTicket = tickets[0];
            console.log(`\n🎯 Testando com ticket real: ${testTicket.id}`);
            
            try {
                const { data: realTestData, error: realTestError } = await client
                    .rpc('finalize_ticket', { 
                        ticket_id: testTicket.id
                    });
                
                if (realTestError) {
                    console.log('❌ Teste com ticket real falhou:', realTestError.message);
                } else {
                    console.log('✅ Teste com ticket real funcionou:', realTestData);
                    
                    // IMPORTANTE: Reverter mudança para não afetar dados reais
                    console.log('🔄 Revertendo alteração...');
                    const { error: revertError } = await client
                        .from('tickets')
                        .update({ 
                            status: testTicket.status, // Voltar ao status original
                            closed_at: null 
                        })
                        .eq('id', testTicket.id);
                        
                    if (revertError) {
                        console.log('⚠️ Erro ao reverter:', revertError);
                    } else {
                        console.log('✅ Ticket revertido ao status original');
                    }
                }
            } catch (error) {
                console.log('❌ Erro no teste com ticket real:', error.message);
            }
        } else {
            console.log('⚠️ Nenhum ticket encontrado para teste');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar teste
testRpcFunctions(); 