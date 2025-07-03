// Debug script para testar criação de instâncias WhatsApp
import { evolutionAPI } from '../services/evolutionAPI';
import { supabase } from '../lib/supabase';

interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export async function debugWhatsAppInstanceCreation(departmentId: string, phoneNumber: string = '5511999999999') {
  console.log('🔍 Iniciando debug de criação de instância WhatsApp...');
  
  const results: DebugResult[] = [];
  
  try {
    // Step 1: Verificar configuração do Evolution API
    console.log('\n📋 Passo 1: Verificando configuração Evolution API...');
    
    // Forçar configurações corretas do public/env.js
    const config = {
      baseUrl: window.env?.VITE_EVOLUTION_API_URL || 'https://webhook.bkcrm.devsible.com.br/api',
      apiKey: window.env?.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11',
      globalApiKey: window.env?.VITE_EVOLUTION_GLOBAL_API_KEY || window.env?.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11'
    };
    
    console.log('Config:', config);
    results.push({
      step: 'Config Evolution API',
      success: !!config.baseUrl && !!config.apiKey,
      data: config
    });
    
    // Step 2: Testar conexão com Evolution API
    console.log('\n🌐 Passo 2: Testando conexão com Evolution API...');
    try {
      const testResponse = await fetch(`${config.baseUrl}/instance/fetchInstances`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.globalApiKey || config.apiKey
        }
      });
      
      console.log('Status da resposta:', testResponse.status);
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log('Instâncias existentes:', data);
        results.push({
          step: 'Conexão Evolution API',
          success: true,
          data: { status: testResponse.status, instances: data }
        });
      } else {
        const errorData = await testResponse.text();
        console.error('Erro na API:', errorData);
        results.push({
          step: 'Conexão Evolution API',
          success: false,
          error: `${testResponse.status}: ${errorData}`
        });
      }
    } catch (apiError) {
      console.error('Erro ao conectar com Evolution API:', apiError);
      results.push({
        step: 'Conexão Evolution API',
        success: false,
        error: apiError instanceof Error ? apiError.message : 'Erro desconhecido'
      });
    }
    
    // Step 3: Testar conexão com Supabase
    console.log('\n🗄️ Passo 3: Testando conexão com Supabase...');
    try {
      const { data: tables, error: supabaseError } = await supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      if (supabaseError) {
        console.error('Erro Supabase:', supabaseError);
        results.push({
          step: 'Conexão Supabase',
          success: false,
          error: supabaseError.message
        });
      } else {
        console.log('Supabase conectado com sucesso');
        results.push({
          step: 'Conexão Supabase',
          success: true,
          data: 'Conexão OK'
        });
      }
    } catch (dbError) {
      console.error('Erro na conexão Supabase:', dbError);
      results.push({
        step: 'Conexão Supabase',
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
      });
    }
    
    // Step 4: Testar criação de instância na Evolution API
    console.log('\n🚀 Passo 4: Testando criação de instância na Evolution API...');
    const instanceName = `debug_${departmentId}_${Date.now()}`;
    
    try {
      // Payload correto para Evolution API v2
      const createData = {
        instanceName,
        token: config.apiKey,
        qrcode: true,
        number: phoneNumber,
        integration: 'WHATSAPP-BAILEYS', // Adicionar integration obrigatório
        webhook: 'https://webhook.bkcrm.devsible.com.br/webhook/evolution',
        webhook_by_events: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
        reject_call: false,
        msg_call: '',
        groups_ignore: false,
        always_online: true,
        read_messages: true,
        read_status: false,
        sync_full_history: false
      };
      
      console.log('Dados para criação:', createData);
      
      const response = await fetch(`${config.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.globalApiKey || config.apiKey
        },
        body: JSON.stringify(createData)
      });
      
      console.log('Status da criação:', response.status);
      
      if (response.ok) {
        const evolutionResponse = await response.json();
        console.log('Resposta Evolution API:', evolutionResponse);
        
        results.push({
          step: 'Criação na Evolution API',
          success: true,
          data: evolutionResponse
        });
        
        // Step 5: Se criou na API, testar salvamento no Supabase
        console.log('\n💾 Passo 5: Testando salvamento no Supabase...');
        
        try {
          const { data: savedInstance, error: saveError } = await supabase
            .from('whatsapp_instances')
            .insert({
              id: `debug_${Date.now()}`,
              instance_id: `debug_${Date.now()}`,
              department_id: departmentId,
              instance_name: instanceName,
              integration: 'WHATSAPP-BAILEYS',
              status: 'connecting',
              auto_reply: false,
              business_hours: {
                enabled: false,
                start: '09:00',
                end: '18:00',
                days: [1, 2, 3, 4, 5],
                timezone: 'America/Sao_Paulo'
              },
              settings: {
                qrcode: true,
                reject_call: false,
                groups_ignore: false,
                always_online: true,
                read_messages: true,
                read_status: false,
                sync_full_history: false
              },
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (saveError) {
            console.error('Erro ao salvar no Supabase:', saveError);
            results.push({
              step: 'Salvamento no Supabase',
              success: false,
              error: saveError.message
            });
            
            // Limpar instância da Evolution API se falhou no Supabase
            try {
              await fetch(`${config.baseUrl}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': config.globalApiKey || config.apiKey
                }
              });
              console.log('✅ Instância removida da Evolution API após falha no Supabase');
            } catch (deleteErr) {
              console.warn('⚠️ Erro ao limpar instância da Evolution API:', deleteErr);
            }
          } else {
            console.log('✅ Instância salva no Supabase com sucesso:', savedInstance);
            results.push({
              step: 'Salvamento no Supabase',
              success: true,
              data: savedInstance
            });
            
            // Limpar dados de teste após 5 segundos
            setTimeout(async () => {
              try {
                await supabase
                  .from('whatsapp_instances')
                  .delete()
                  .eq('id', savedInstance.id);
                
                await fetch(`${config.baseUrl}/instance/delete/${instanceName}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': config.globalApiKey || config.apiKey
                  }
                });
                console.log('🧹 Dados de teste removidos');
              } catch (cleanupErr) {
                console.warn('⚠️ Erro ao limpar dados de teste:', cleanupErr);
              }
            }, 5000);
          }
        } catch (dbSaveError) {
          console.error('Erro inesperado ao salvar no Supabase:', dbSaveError);
          results.push({
            step: 'Salvamento no Supabase',
            success: false,
            error: dbSaveError instanceof Error ? dbSaveError.message : 'Erro desconhecido'
          });
        }
      } else {
        const errorData = await response.text();
        console.error('Erro na criação:', errorData);
        results.push({
          step: 'Criação na Evolution API',
          success: false,
          error: `${response.status}: ${errorData}`
        });
      }
      
    } catch (createError) {
      console.error('Erro ao criar instância na Evolution API:', createError);
      results.push({
        step: 'Criação na Evolution API',
        success: false,
        error: createError instanceof Error ? createError.message : 'Erro desconhecido'
      });
    }
    
  } catch (generalError) {
    console.error('Erro geral no debug:', generalError);
    results.push({
      step: 'Erro Geral',
      success: false,
      error: generalError instanceof Error ? generalError.message : 'Erro desconhecido'
    });
  }
  
  // Resumo final
  console.log('\n📊 RESUMO DO DEBUG:');
  console.log('==================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.step}: ${result.success ? 'SUCESSO' : 'FALHOU'}`);
    
    if (!result.success && result.error) {
      console.log(`   Erro: ${result.error}`);
    }
    
    if (result.data) {
      console.log(`   Dados:`, result.data);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalSteps = results.length;
  
  console.log(`\n🎯 Resultado: ${successCount}/${totalSteps} passos concluídos com sucesso`);
  
  if (successCount === totalSteps) {
    console.log('🎉 Todos os testes passaram! O problema pode estar na interface do usuário.');
  } else {
    console.log('🚨 Problemas identificados nos passos marcados com ❌');
  }
  
  return results;
}

// Função para adicionar ao window
export function setupWhatsAppDebug() {
  (window as any).debugWhatsAppInstance = debugWhatsAppInstanceCreation;
  
  console.log(`
🔧 DEBUG WHATSAPP INSTANCE DISPONÍVEL
====================================

Para testar a criação de instância, execute no console:

debugWhatsAppInstance('seu-department-id', '5511999999999')

Exemplo:
debugWhatsAppInstance('comercial', '5511999999999')

Este debug irá:
1. ✅ Verificar configuração Evolution API
2. 🌐 Testar conexão com Evolution API
3. 🗄️ Testar conexão com Supabase
4. 🚀 Testar criação de instância na Evolution API
5. 💾 Testar salvamento no Supabase

Os dados de teste serão automaticamente removidos após 5 segundos.
  `);
} 