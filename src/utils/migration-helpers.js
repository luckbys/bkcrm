import { supabase } from '@/lib/supabase';
/**
 * Verifica o schema de uma tabela
 */
window.checkTableSchema = async (tableName) => {
    console.log(`🔍 [SCHEMA] Verificando tabela: ${tableName}`);
    try {
        // Buscar informações das colunas
        const { data, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', tableName)
            .eq('table_schema', 'public');
        if (error) {
            console.error(`❌ [SCHEMA] Erro ao buscar schema:`, error);
            return;
        }
        if (!data || data.length === 0) {
            console.warn(`⚠️ [SCHEMA] Tabela "${tableName}" não encontrada`);
            return;
        }
        console.log(`📋 [SCHEMA] Colunas da tabela "${tableName}":`);
        data.forEach((col) => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
        });
    }
    catch (error) {
        console.error(`❌ [SCHEMA] Erro:`, error);
    }
};
/**
 * Adiciona campos WhatsApp à tabela tickets
 */
window.addWhatsAppFieldsToTickets = async () => {
    console.log('🔧 [MIGRATION] Adicionando campos WhatsApp à tabela tickets...');
    try {
        // Script de migração
        const migrationSQL = `
      -- Adicionar campos WhatsApp se não existirem
      DO $$ 
      BEGIN
        -- client_phone
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tickets' AND column_name = 'client_phone') THEN
          ALTER TABLE tickets ADD COLUMN client_phone TEXT;
          CREATE INDEX IF NOT EXISTS idx_tickets_client_phone ON tickets(client_phone);
        END IF;
        
        -- client_whatsapp_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tickets' AND column_name = 'client_whatsapp_id') THEN
          ALTER TABLE tickets ADD COLUMN client_whatsapp_id TEXT;
          CREATE INDEX IF NOT EXISTS idx_tickets_client_whatsapp_id ON tickets(client_whatsapp_id);
        END IF;
        
        -- evolution_instance_name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tickets' AND column_name = 'evolution_instance_name') THEN
          ALTER TABLE tickets ADD COLUMN evolution_instance_name TEXT;
          CREATE INDEX IF NOT EXISTS idx_tickets_evolution_instance_name ON tickets(evolution_instance_name);
        END IF;
        
        -- evolution_instance_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tickets' AND column_name = 'evolution_instance_id') THEN
          ALTER TABLE tickets ADD COLUMN evolution_instance_id TEXT;
        END IF;
        
        -- whatsapp_contact_name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tickets' AND column_name = 'whatsapp_contact_name') THEN
          ALTER TABLE tickets ADD COLUMN whatsapp_contact_name TEXT;
        END IF;
      END $$;
    `;
        // Executar migração usando rpc (se disponível) ou tentar via SQL
        const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        if (error) {
            console.error('❌ [MIGRATION] Erro ao executar migração:', error);
            console.log('ℹ️ [MIGRATION] Execute manualmente no painel do Supabase:');
            console.log(migrationSQL);
        }
        else {
            console.log('✅ [MIGRATION] Campos WhatsApp adicionados com sucesso!');
        }
    }
    catch (error) {
        console.error('❌ [MIGRATION] Erro:', error);
        console.log('ℹ️ [MIGRATION] Execute a migração manualmente no painel do Supabase SQL Editor');
    }
};
/**
 * Verifica a tabela tickets
 */
window.verifyTicketsTable = async () => {
    console.log('🔍 [VERIFY] Verificando tabela tickets...');
    try {
        // Verificar se a tabela existe
        const { data: tableExists, error: tableError } = await supabase
            .from('tickets')
            .select('id')
            .limit(1);
        if (tableError && tableError.code === 'PGRST116') {
            console.error('❌ [VERIFY] Tabela tickets não existe!');
            console.log('💡 [VERIFY] Execute as migrações no painel do Supabase primeiro');
            return;
        }
        console.log('✅ [VERIFY] Tabela tickets existe');
        // Verificar schema
        await window.checkTableSchema('tickets');
        // Testar inserção simples
        const testTicket = {
            title: 'Teste de Schema',
            description: 'Teste para verificar se o schema está funcionando',
            status: 'pendente',
            priority: 'normal',
            channel: 'chat',
            metadata: {
                test: true,
                anonymous_contact: 'Teste Schema'
            }
        };
        console.log('🧪 [VERIFY] Testando inserção...');
        const { data: insertTest, error: insertError } = await supabase
            .from('tickets')
            .insert(testTicket)
            .select()
            .single();
        if (insertError) {
            console.error('❌ [VERIFY] Erro na inserção de teste:', insertError);
            if (insertError.message.includes('Could not find')) {
                console.log('💡 [VERIFY] Alguns campos não existem. Execute: addWhatsAppFieldsToTickets()');
            }
        }
        else {
            console.log('✅ [VERIFY] Inserção de teste bem-sucedida:', insertTest.id);
            // Remover o ticket de teste
            await supabase.from('tickets').delete().eq('id', insertTest.id);
            console.log('🗑️ [VERIFY] Ticket de teste removido');
        }
    }
    catch (error) {
        console.error('❌ [VERIFY] Erro na verificação:', error);
    }
};
/**
 * Corrige constraints da tabela tickets
 */
window.fixTicketsConstraints = async () => {
    console.log('🔧 [FIX] Corrigindo constraints da tabela tickets...');
    const fixSQL = `
    -- Atualizar constraint de channel para incluir todos os valores necessários
    ALTER TABLE tickets 
    DROP CONSTRAINT IF EXISTS tickets_channel_check;

    ALTER TABLE tickets 
    ADD CONSTRAINT tickets_channel_check 
    CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web'));
    
    -- Verificar constraint valid_customer_or_anonymous
    -- Este constraint permite tickets sem customer_id se tiver anonymous_contact no metadata
  `;
    console.log('💡 [FIX] Execute este SQL no painel do Supabase:');
    console.log(fixSQL);
};
// Mostrar comandos disponíveis
console.log(`
🛠️ MIGRATION HELPERS - Utilitários de Schema

📝 COMANDOS DISPONÍVEIS:
  checkTableSchema('tickets')        - Verificar schema da tabela
  verifyTicketsTable()              - Verificação completa da tabela tickets
  addWhatsAppFieldsToTickets()      - Adicionar campos WhatsApp (se suportado)
  fixTicketsConstraints()           - Corrigir constraints da tabela

🚀 FLUXO RECOMENDADO:
  1. verifyTicketsTable()           - Ver status atual
  2. checkTableSchema('tickets')    - Ver campos existentes
  3. addWhatsAppFieldsToTickets()   - Tentar adicionar campos automaticamente
  4. Se necessário, executar SQL manualmente no painel do Supabase

💡 DICA: Se der erro de campo não encontrado, execute a migração 
   '20240322000001_add_whatsapp_fields_to_tickets.sql' no painel do Supabase
`);
