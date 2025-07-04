// 🔍 Detectar Schema da Tabela Tickets
// Este script verifica se a tabela usa 'title' ou 'subject'

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detectarSchema() {
  console.log('🔍 DETECTANDO SCHEMA DA TABELA TICKETS');
  console.log('='.repeat(50));

  try {
    // Verificar estrutura da tabela tickets
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'tickets' });

    if (error) {
      console.log('⚠️ Não foi possível usar RPC, tentando método alternativo...');
      
      // Método alternativo: tentar inserir um registro de teste
      const testData = {
        title: 'Teste Schema Detection',
        description: 'Teste para detectar schema',
        status: 'open',
        priority: 'medium'
      };

      const { error: titleError } = await supabase
        .from('tickets')
        .insert([testData])
        .select()
        .limit(1);

      if (!titleError) {
        console.log('✅ Tabela tickets usa coluna: TITLE');
        
        // Limpar registro de teste
        await supabase
          .from('tickets')
          .delete()
          .eq('title', 'Teste Schema Detection');
        
        return 'title';
      }

      // Tentar com subject
      const testDataSubject = {
        subject: 'Teste Schema Detection',
        description: 'Teste para detectar schema',
        status: 'open',
        priority: 'medium'
      };

      const { error: subjectError } = await supabase
        .from('tickets')
        .insert([testDataSubject])
        .select()
        .limit(1);

      if (!subjectError) {
        console.log('✅ Tabela tickets usa coluna: SUBJECT');
        
        // Limpar registro de teste
        await supabase
          .from('tickets')
          .delete()
          .eq('subject', 'Teste Schema Detection');
        
        return 'subject';
      }

      console.log('❌ Não foi possível detectar o schema');
      return null;
    }

    // Analisar colunas retornadas
    const hasTitle = columns.some(col => col.column_name === 'title');
    const hasSubject = columns.some(col => col.column_name === 'subject');

    if (hasTitle) {
      console.log('✅ Tabela tickets usa coluna: TITLE');
      return 'title';
    } else if (hasSubject) {
      console.log('✅ Tabela tickets usa coluna: SUBJECT');
      return 'subject';
    } else {
      console.log('❌ Nenhuma coluna de título encontrada');
      return null;
    }

  } catch (error) {
    console.error('❌ Erro ao detectar schema:', error.message);
    return null;
  }
}

// Executar detecção
detectarSchema()
  .then(result => {
    console.log('');
    console.log('🎯 RESULTADO DA DETECÇÃO:');
    console.log(`Coluna de título: ${result || 'NÃO DETECTADA'}`);
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute CORRIGIR_SCHEMA_FINAL.sql no Supabase');
    console.log('2. O script detectará automaticamente a coluna correta');
    console.log('3. Reinicie o webhook: node webhook-evolution-complete.js');
  })
  .catch(console.error); 