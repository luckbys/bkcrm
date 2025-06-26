/**
 * 🔧 CORREÇÃO: Duplicação de Tickets no Webhook Evolution API
 * 
 * Problema identificado: Webhook está criando múltiplos tickets para o mesmo cliente/telefone
 * devido a condições de busca inadequadas ou processamento concorrente.
 */

import { supabase } from '../lib/supabase';

interface DuplicateAnalysis {
  totalDuplicates: number;
  phoneGroups: Array<{
    phone: string;
    tickets: Array<{
      id: string;
      title: string;
      created_at: string;
      status: string;
      customer_id?: string;
    }>;
    count: number;
  }>;
  fixable: number;
  summary: string;
}

/**
 * 🔍 Analisar duplicação de tickets
 */
const analyzeDuplication = async (daysBack: number = 7): Promise<DuplicateAnalysis> => {
  console.log(`🔍 [DUPLICATE-ANALYSIS] Analisando duplicação dos últimos ${daysBack} dias...`);

  try {
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    
    // Buscar todos os tickets WhatsApp recentes
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, created_at, status, customer_id, metadata, nunmsg')
      .gte('created_at', startDate.toISOString())
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [DUPLICATE-ANALYSIS] Erro ao buscar tickets:', error);
      throw error;
    }

    if (!tickets || tickets.length === 0) {
      return {
        totalDuplicates: 0,
        phoneGroups: [],
        fixable: 0,
        summary: 'Nenhum ticket WhatsApp encontrado'
      };
    }

    console.log(`📊 [DUPLICATE-ANALYSIS] ${tickets.length} tickets WhatsApp encontrados`);

    // Agrupar por telefone usando múltiplas fontes
    const phoneGroups: Record<string, any[]> = {};

    tickets.forEach(ticket => {
      // Extrair telefone de múltiplas fontes
      const phone = ticket.nunmsg || 
                   ticket.metadata?.whatsapp_phone || 
                   ticket.metadata?.client_phone || 
                   ticket.metadata?.phone ||
                   extractPhoneFromTitle(ticket.title) ||
                   'unknown';

      const normalizedPhone = normalizePhone(phone);
      
      if (!phoneGroups[normalizedPhone]) {
        phoneGroups[normalizedPhone] = [];
      }
      
      phoneGroups[normalizedPhone].push({
        id: ticket.id,
        title: ticket.title,
        created_at: ticket.created_at,
        status: ticket.status,
        customer_id: ticket.customer_id,
        original_phone: phone,
        metadata: ticket.metadata
      });
    });

    // Identificar grupos com duplicação
    const duplicateGroups = Object.entries(phoneGroups)
      .filter(([phone, groupTickets]) => groupTickets.length > 1 && phone !== 'unknown')
      .map(([phone, groupTickets]) => ({
        phone,
        tickets: groupTickets.map(t => ({
          id: t.id,
          title: t.title,
          created_at: t.created_at,
          status: t.status,
          customer_id: t.customer_id
        })),
        count: groupTickets.length
      }));

    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + (group.count - 1), 0);
    const fixable = duplicateGroups.filter(group => 
      group.tickets.some(t => t.status === 'open')
    ).length;

    const analysis: DuplicateAnalysis = {
      totalDuplicates,
      phoneGroups: duplicateGroups,
      fixable,
      summary: `${duplicateGroups.length} telefones com duplicação, ${totalDuplicates} tickets duplicados, ${fixable} grupos corrigíveis`
    };

    console.log(`📊 [DUPLICATE-ANALYSIS] Resultado:`, analysis.summary);
    
    // Log detalhado dos grupos
    duplicateGroups.forEach(group => {
      console.log(`📱 [DUPLICATE-ANALYSIS] ${group.phone}: ${group.count} tickets`);
      group.tickets.forEach(ticket => {
        console.log(`   • ${ticket.id} - ${ticket.status} - ${new Date(ticket.created_at).toLocaleString()}`);
      });
    });

    return analysis;

  } catch (error) {
    console.error('❌ [DUPLICATE-ANALYSIS] Erro na análise:', error);
    throw error;
  }
};

/**
 * 🔧 Corrigir duplicação mantendo o ticket mais recente ativo
 */
const fixDuplication = async (phone: string, dryRun: boolean = false): Promise<boolean> => {
  console.log(`🔧 [FIX-DUPLICATION] ${dryRun ? 'SIMULANDO' : 'CORRIGINDO'} duplicação para ${phone}`);

  try {
    const normalizedPhone = normalizePhone(phone);
    
    // Buscar todos os tickets deste telefone
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, created_at, status, title, metadata, customer_id')
      .eq('channel', 'whatsapp')
      .or(`nunmsg.eq.${normalizedPhone},metadata->>whatsapp_phone.eq.${normalizedPhone},metadata->>client_phone.eq.${normalizedPhone}`)
      .order('created_at', { ascending: false }); // Mais recente primeiro

    if (error) {
      console.error('❌ [FIX-DUPLICATION] Erro ao buscar tickets:', error);
      return false;
    }

    if (!tickets || tickets.length <= 1) {
      console.log(`✅ [FIX-DUPLICATION] Nenhuma duplicação encontrada para ${phone}`);
      return true;
    }

    // Encontrar o ticket a manter (mais recente com status open, ou simplesmente o mais recente)
    const openTickets = tickets.filter(t => t.status === 'open');
    const keepTicket = openTickets.length > 0 ? openTickets[0] : tickets[0];
    const duplicateTickets = tickets.filter(t => t.id !== keepTicket.id);

    console.log(`📋 [FIX-DUPLICATION] Mantendo: ${keepTicket.id} (${keepTicket.status})`);
    console.log(`🗑️ [FIX-DUPLICATION] Fechando: ${duplicateTickets.length} duplicados`);

    if (dryRun) {
      duplicateTickets.forEach(ticket => {
        console.log(`   • ${ticket.id} - ${ticket.status} - ${ticket.title}`);
      });
      return true;
    }

    // Fechar tickets duplicados
    const updates = duplicateTickets.map(ticket => 
      supabase
        .from('tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
          metadata: {
            ...ticket.metadata,
            closed_reason: 'duplicate_ticket',
            merged_into: keepTicket.id,
            auto_closed_at: new Date().toISOString(),
            original_status: ticket.status
          }
        })
        .eq('id', ticket.id)
    );

    const results = await Promise.allSettled(updates);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      console.warn(`⚠️ [FIX-DUPLICATION] ${failed} falhas ao fechar tickets duplicados`);
    }

    console.log(`✅ [FIX-DUPLICATION] ${successful} tickets duplicados fechados para ${phone}`);
    return failed === 0;

  } catch (error) {
    console.error('❌ [FIX-DUPLICATION] Erro ao corrigir:', error);
    return false;
  }
};

/**
 * 🔧 Corrigir toda a duplicação automaticamente
 */
const fixAllDuplication = async (dryRun: boolean = false, maxFix: number = 50) => {
  console.log(`🔧 [FIX-ALL] ${dryRun ? 'SIMULANDO' : 'CORRIGINDO'} todas as duplicações (max: ${maxFix})`);

  try {
    const analysis = await analyzeDuplication(7);
    
    if (analysis.totalDuplicates === 0) {
      console.log('✅ [FIX-ALL] Nenhuma duplicação encontrada');
      return { success: true, fixed: 0, errors: 0 };
    }

    console.log(`📊 [FIX-ALL] ${analysis.phoneGroups.length} grupos para processar`);

    let fixed = 0;
    let errors = 0;
    const toProcess = analysis.phoneGroups.slice(0, maxFix);

    for (const group of toProcess) {
      try {
        const success = await fixDuplication(group.phone, dryRun);
        if (success) {
          fixed++;
          console.log(`✅ [FIX-ALL] ${group.phone} - ${group.count - 1} duplicados processados`);
        } else {
          errors++;
          console.error(`❌ [FIX-ALL] Falha ao processar ${group.phone}`);
        }

        // Pequeno delay para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errors++;
        console.error(`❌ [FIX-ALL] Erro ao processar ${group.phone}:`, error);
      }
    }

    const summary = {
      success: errors === 0,
      fixed,
      errors,
      total: toProcess.length,
      duplicatesRemoved: analysis.totalDuplicates
    };

    console.log(`📊 [FIX-ALL] Resumo:`, summary);
    return summary;

  } catch (error) {
    console.error('❌ [FIX-ALL] Erro geral:', error);
    return { success: false, fixed: 0, errors: 1 };
  }
};

/**
 * 📱 Normalizar número de telefone
 */
const normalizePhone = (phone: string): string => {
  if (!phone || phone === 'unknown') return phone;
  
  // Remover caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Normalizar formato brasileiro
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    return `+55${cleaned}`;
  }
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    return `+55${cleaned}`;
  }
  
  return cleaned;
};

/**
 * 📱 Extrair telefone do título do ticket
 */
const extractPhoneFromTitle = (title: string): string | null => {
  // Buscar padrões de telefone no título
  const phonePattern = /(\+?55)?[\s\-]?(\d{2})[\s\-]?(\d{4,5})[\s\-]?(\d{4})/;
  const match = title.match(phonePattern);
  
  if (match) {
    const [, country, area, prefix, suffix] = match;
    return `+55${area}${prefix}${suffix}`;
  }
  
  return null;
};

/**
 * 🔍 Verificar webhook Evolution API para prevenir duplicação futura
 */
const analyzeWebhookBehavior = async () => {
  console.log('🔍 [WEBHOOK-ANALYSIS] Analisando comportamento do webhook...');

  try {
    // Buscar tickets criados nas últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const { data: recentTickets, error } = await supabase
      .from('tickets')
      .select('id, created_at, title, metadata')
      .gte('created_at', twoHoursAgo.toISOString())
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [WEBHOOK-ANALYSIS] Erro:', error);
      return;
    }

    if (!recentTickets || recentTickets.length === 0) {
      console.log('📊 [WEBHOOK-ANALYSIS] Nenhum ticket recente encontrado');
      return;
    }

    // Agrupar por intervalos de tempo
    const intervals: Record<string, number> = {};
    
    recentTickets.forEach(ticket => {
      const created = new Date(ticket.created_at);
      const interval = `${created.getHours()}:${Math.floor(created.getMinutes() / 5) * 5}`;
      intervals[interval] = (intervals[interval] || 0) + 1;
    });

    console.log('📊 [WEBHOOK-ANALYSIS] Tickets por intervalo de 5 min:');
    Object.entries(intervals)
      .sort()
      .forEach(([interval, count]) => {
        if (count > 1) {
          console.log(`   ${interval} - ${count} tickets ${count > 3 ? '⚠️ SUSPEITO' : ''}`);
        }
      });

    // Verificar padrões suspeitos
    const suspiciousIntervals = Object.entries(intervals).filter(([, count]) => count > 3);
    
    if (suspiciousIntervals.length > 0) {
      console.warn('⚠️ [WEBHOOK-ANALYSIS] Intervalos suspeitos detectados - possível duplicação em tempo real');
      
      suspiciousIntervals.forEach(([interval, count]) => {
        console.warn(`   ${interval}: ${count} tickets em 5 minutos`);
      });
    } else {
      console.log('✅ [WEBHOOK-ANALYSIS] Comportamento normal do webhook');
    }

  } catch (error) {
    console.error('❌ [WEBHOOK-ANALYSIS] Erro na análise:', error);
  }
};

// 🌐 Exportar para uso global
declare global {
  interface Window {
    fixWebhookDuplication: {
      analyze: (days?: number) => Promise<DuplicateAnalysis>;
      fix: (phone: string, dryRun?: boolean) => Promise<boolean>;
      fixAll: (dryRun?: boolean, maxFix?: number) => Promise<any>;
      analyzeWebhook: () => Promise<void>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.fixWebhookDuplication = {
    analyze: analyzeDuplication,
    fix: fixDuplication,
    fixAll: fixAllDuplication,
    analyzeWebhook: analyzeWebhookBehavior
  };

  console.log(`
🔧 CORREÇÃO DE DUPLICAÇÃO DE TICKETS ATIVADA

📋 Comandos disponíveis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 ANÁLISE:
fixWebhookDuplication.analyze()              // Analisar últimos 7 dias
fixWebhookDuplication.analyze(14)            // Analisar últimos 14 dias
fixWebhookDuplication.analyzeWebhook()       // Analisar webhook atual

🔧 CORREÇÃO:
fixWebhookDuplication.fix("PHONE", true)     // Simular correção
fixWebhookDuplication.fix("PHONE", false)    // Corrigir de fato
fixWebhookDuplication.fixAll(true)           // Simular correção completa
fixWebhookDuplication.fixAll(false)          // Corrigir tudo (CUIDADO!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

export {
  analyzeDuplication,
  fixDuplication,
  fixAllDuplication,
  analyzeWebhookBehavior
}; 