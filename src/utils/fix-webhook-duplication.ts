/**
 * 🔧 CORREÇÃO: Duplicação de Tickets no Webhook Evolution API
 * 
 * Problema identificado: Webhook está criando múltiplos tickets para o mesmo cliente/telefone
 * devido a condições de busca inadequadas ou processamento concorrente.
 */

import { supabase } from '../lib/supabase';

interface TicketData {
  id: string;
  phone_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  subject?: string;
  description?: string;
}

interface DuplicationAnalysis {
  totalTickets: number;
  uniquePhones: number;
  duplicatedPhones: string[];
  duplicateGroups: Record<string, TicketData[]>;
  recommendations: string[];
}

/**
 * 🔍 Analisar duplicação de tickets
 */
const analyzeDuplication = async (): Promise<DuplicationAnalysis> => {
  console.log('🔍 [ANÁLISE] Iniciando análise de duplicação de tickets...');
  
  try {
    // Buscar todos os tickets com números de telefone
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, phone_number, status, created_at, updated_at, customer_id, subject, description')
      .not('phone_number', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar tickets:', error);
      throw error;
    }
    
    console.log(`📊 Total de tickets encontrados: ${tickets?.length || 0}`);
    
    // Agrupar por número normalizado
    const phoneGroups: Record<string, TicketData[]> = {};
    const seenPhones = new Set<string>();
    
    tickets?.forEach(ticket => {
      const normalizedPhone = normalizePhone(ticket.phone_number);
      if (normalizedPhone) {
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = [];
        }
        phoneGroups[normalizedPhone].push(ticket);
        seenPhones.add(normalizedPhone);
      }
    });
    
    // Identificar duplicações
    const duplicateGroups: Record<string, TicketData[]> = {};
    const duplicatedPhones: string[] = [];
    
    Object.entries(phoneGroups).forEach(([phone, ticketGroup]) => {
      if (ticketGroup.length > 1) {
        duplicatedPhones.push(phone);
        duplicateGroups[phone] = ticketGroup;
      }
    });
    
    const recommendations: string[] = [];
    
    if (duplicatedPhones.length > 0) {
      recommendations.push(`Encontrados ${duplicatedPhones.length} números com duplicações`);
      recommendations.push('Execute fixDuplication() para consolidar tickets');
      recommendations.push('Considere implementar validação preventiva no webhook');
    } else {
      recommendations.push('Nenhuma duplicação encontrada');
      recommendations.push('Sistema está funcionando corretamente');
    }
    
    const analysis: DuplicationAnalysis = {
      totalTickets: tickets?.length || 0,
      uniquePhones: seenPhones.size,
      duplicatedPhones,
      duplicateGroups,
      recommendations
    };
    
    // Log da análise
    console.log('\n📊 RESULTADO DA ANÁLISE:');
    console.table({
      'Total de Tickets': analysis.totalTickets,
      'Números Únicos': analysis.uniquePhones,
      'Números Duplicados': analysis.duplicatedPhones.length,
      'Taxa de Duplicação': `${((analysis.duplicatedPhones.length / analysis.uniquePhones) * 100).toFixed(1)}%`
    });
    
    if (analysis.duplicatedPhones.length > 0) {
      console.log('\n🔍 DUPLICAÇÕES ENCONTRADAS:');
      Object.entries(analysis.duplicateGroups).forEach(([phone, tickets]) => {
        console.log(`\n📞 ${phone} (${tickets.length} tickets):`);
        tickets.forEach((ticket, index) => {
          console.log(`  ${index + 1}. ${ticket.id} - ${ticket.status} - ${new Date(ticket.created_at).toLocaleString()}`);
        });
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    throw error;
  }
};

/**
 * 🔧 Corrigir duplicação mantendo o ticket mais recente ativo
 */
const fixDuplication = async (simulate: boolean = true): Promise<void> => {
  console.log(`🔧 [FIX] ${simulate ? 'SIMULANDO' : 'EXECUTANDO'} correção de duplicações...`);
  
  try {
    // Primeiro fazer análise
    const analysis = await analyzeDuplication();
    
    if (analysis.duplicatedPhones.length === 0) {
      console.log('✅ Nenhuma duplicação encontrada para corrigir');
      return;
    }
    
    console.log(`\n🔧 Processando ${analysis.duplicatedPhones.length} números duplicados...`);
    
    let totalFixed = 0;
    let totalMerged = 0;
    
    for (const [phone, tickets] of Object.entries(analysis.duplicateGroups)) {
      console.log(`\n📞 Processando ${phone} (${tickets.length} tickets)...`);
      
      // Ordenar por data de criação (mais recente primeiro)
      tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const mainTicket = tickets[0]; // Mais recente
      const duplicateTickets = tickets.slice(1); // Outros
      
      console.log(`  ✅ Mantendo: ${mainTicket.id} (${new Date(mainTicket.created_at).toLocaleString()})`);
      
      // Processar duplicatas
      for (const duplicateTicket of duplicateTickets) {
        console.log(`  🔄 ${simulate ? 'SIMULARIA' : 'Processando'}: ${duplicateTicket.id}`);
        
        if (!simulate) {
          // 1. Mover mensagens do ticket duplicado para o principal
          const { error: moveError } = await supabase
            .from('messages')
            .update({ ticket_id: mainTicket.id })
            .eq('ticket_id', duplicateTicket.id);
          
          if (moveError) {
            console.error(`  ❌ Erro ao mover mensagens de ${duplicateTicket.id}:`, moveError);
            continue;
          }
          
          // 2. Atualizar status do ticket duplicado para fechado
          const { error: updateError } = await supabase
            .from('tickets')
            .update({ 
              status: 'closed',
              description: `Ticket consolidado em ${mainTicket.id} - ${duplicateTicket.description || ''}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', duplicateTicket.id);
          
          if (updateError) {
            console.error(`  ❌ Erro ao fechar ticket ${duplicateTicket.id}:`, updateError);
            continue;
          }
          
          console.log(`  ✅ Ticket ${duplicateTicket.id} consolidado em ${mainTicket.id}`);
        }
        
        totalMerged++;
      }
      
      totalFixed++;
    }
    
    console.log(`\n✅ CORREÇÃO ${simulate ? 'SIMULADA' : 'CONCLUÍDA'}:`);
    console.table({
      'Números Processados': totalFixed,
      'Tickets Consolidados': totalMerged,
      'Modo': simulate ? 'Simulação' : 'Execução Real'
    });
    
    if (simulate) {
      console.log('\n💡 Para executar a correção real, use: fixDuplication(false)');
    } else {
      console.log('\n🎉 Duplicações corrigidas com sucesso!');
      
      // Análise final
      console.log('\n🔍 Executando análise final...');
      await analyzeDuplication();
    }
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
};

/**
 * 📱 Normalizar número de telefone
 */
const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remover caracteres especiais e espaços
  let normalized = phone.replace(/[^\d]/g, '');
  
  // Remover código do país se presente (55 para Brasil)
  if (normalized.startsWith('55') && normalized.length > 11) {
    normalized = normalized.substring(2);
  }
  
  // Remover 9 extra se presente no celular
  if (normalized.length === 11 && normalized.charAt(2) === '9') {
    normalized = normalized.substring(0, 2) + normalized.substring(3);
  }
  
  return normalized;
};

/**
 * 🔍 Verificar webhook Evolution API para prevenir duplicação futura
 */
const analyzeWebhookBehavior = async (): Promise<void> => {
  console.log('🕷️ [WEBHOOK] Analisando comportamento do webhook...');
  
  try {
    // Buscar tickets criados nas últimas 24h
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    
    const { data: recentTickets, error } = await supabase
      .from('tickets')
      .select('id, phone_number, created_at, status')
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar tickets recentes:', error);
      return;
    }
    
    console.log(`📊 Tickets criados nas últimas 24h: ${recentTickets?.length || 0}`);
    
    if (!recentTickets || recentTickets.length === 0) {
      console.log('ℹ️ Nenhum ticket recente para analisar');
      return;
    }
    
    // Analisar padrões suspeitos
    const phoneFrequency: Record<string, number> = {};
    const timeGaps: number[] = [];
    
    recentTickets.forEach((ticket, index) => {
      const normalizedPhone = normalizePhone(ticket.phone_number);
      phoneFrequency[normalizedPhone] = (phoneFrequency[normalizedPhone] || 0) + 1;
      
      // Calcular gap entre tickets consecutivos
      if (index > 0) {
        const currentTime = new Date(ticket.created_at).getTime();
        const prevTime = new Date(recentTickets[index - 1].created_at).getTime();
        const gap = Math.abs(currentTime - prevTime) / 1000; // em segundos
        timeGaps.push(gap);
      }
    });
    
    // Identificar possíveis problemas
    const suspiciousPhones = Object.entries(phoneFrequency)
      .filter(([phone, count]) => count > 1)
      .map(([phone, count]) => ({ phone, count }));
    
    const avgGap = timeGaps.length > 0 ? timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length : 0;
    const minGap = Math.min(...timeGaps);
    
    console.log('\n📊 ANÁLISE DO WEBHOOK:');
    console.table({
      'Tickets nas 24h': recentTickets.length,
      'Números únicos': Object.keys(phoneFrequency).length,
      'Números duplicados': suspiciousPhones.length,
      'Gap médio (s)': Math.round(avgGap),
      'Gap mínimo (s)': Math.round(minGap)
    });
    
    if (suspiciousPhones.length > 0) {
      console.log('\n⚠️ NÚMEROS SUSPEITOS (múltiplos tickets):');
      suspiciousPhones.forEach(({ phone, count }) => {
        console.log(`📞 ${phone}: ${count} tickets`);
      });
    }
    
    if (minGap < 60) {
      console.log(`\n⚠️ Gap muito pequeno detectado: ${Math.round(minGap)}s`);
      console.log('💡 Considere implementar debounce no webhook');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise do webhook:', error);
  }
};

// 🌐 Exportar para uso global
declare global {
  interface Window {
    fixWebhookDuplication: {
      analyze: () => Promise<DuplicationAnalysis>;
      fix: (simulate: boolean) => Promise<void>;
      webhookAnalysis: () => Promise<void>;
      implementPrevention: () => void;
      normalizePhone: (phone: string) => string;
      fixAll: (simulate: boolean) => Promise<void>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.fixWebhookDuplication = {
    analyze: analyzeDuplication,
    fix: fixDuplication,
    webhookAnalysis: analyzeWebhookBehavior,
    implementPrevention: () => {
      console.log('🔧 [PREVENÇÃO] Implementando prevenção de duplicação...');
      
      const preventionCode = `
// 🛡️ PREVENÇÃO DE DUPLICAÇÃO NO WEBHOOK
async function preventDuplication(phoneNumber, webhookData) {
  const normalizedPhone = "${normalizePhone.toString()}";
  const phone = normalizedPhone(phoneNumber);
  
  // Verificar se já existe ticket ativo para este número
  const { data: existingTickets } = await supabase
    .from('tickets')
    .select('id, status, created_at')
    .eq('phone_number', phone)
    .in('status', ['open', 'pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (existingTickets && existingTickets.length > 0) {
    const existingTicket = existingTickets[0];
    console.log('🔄 Ticket existente encontrado:', existingTicket.id);
    
    // Adicionar nova mensagem ao ticket existente
    await supabase
      .from('messages')
      .insert([{
        ticket_id: existingTicket.id,
        content: webhookData.message || 'Nova interação via webhook',
        sender_name: webhookData.sender || 'Cliente',
        is_internal: false,
        type: 'message'
      }]);
    
    return { action: 'updated', ticketId: existingTicket.id };
  }
  
  // Criar novo ticket apenas se não existir
  return { action: 'create_new' };
}`;
      
      console.log('📋 Código de prevenção gerado:');
      console.log(preventionCode);
      
      console.log('\n💡 Para implementar:');
      console.log('1. Adicione esta função ao seu webhook handler');
      console.log('2. Chame preventDuplication() antes de criar novos tickets');
      console.log('3. Teste com analyzeWebhookBehavior() regularmente');
    },
    normalizePhone,
    fixAll: async (simulate: boolean) => {
      console.log('🔧 [FIX-ALL] Iniciando correção completa de duplicações...');
      await analyzeDuplication();
      await fixDuplication(simulate);
      await analyzeWebhookBehavior();
    }
  };

  console.log(`
🔧 CORREÇÃO DE DUPLICAÇÃO DE TICKETS ATIVADA

📋 Comandos disponíveis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 ANÁLISE:
fixWebhookDuplication.analyze()              // Analisar últimos 7 dias
fixWebhookDuplication.webhookAnalysis()       // Analisar webhook atual

🔧 CORREÇÃO:
fixWebhookDuplication.fix(true)               // Simular correção
fixWebhookDuplication.fix(false)              // Corrigir de fato

🔧 PREVENÇÃO:
fixWebhookDuplication.implementPrevention()     // Código de prevenção

🔧 CORREÇÃO COMPLETA:
fixWebhookDuplication.fixAll(true)             // Simular correção completa
fixWebhookDuplication.fixAll(false)            // Corrigir tudo (CUIDADO!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

export {
  analyzeDuplication,
  fixDuplication,
  analyzeWebhookBehavior
}; 