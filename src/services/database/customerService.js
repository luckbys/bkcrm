import { supabase } from '../../config/supabase.js';
import { generateUUID } from '../../utils/uuid.js';
import { logger } from '../../utils/logger.js';

export class CustomerService {
  static async findOrCreateCustomer(clientInfo) {
    try {
      logger.info('🔍 [CLIENTE AVANÇADO] Verificando cliente com dados enriquecidos:', {
        phone: clientInfo.phone,
        phoneFormatted: clientInfo.phoneFormatted,
        name: clientInfo.name,
        instance: clientInfo.instanceName
      });
      
      // Buscar cliente existente na tabela PROFILES
      const { data: existingProfiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, metadata')
        .or(`metadata->>phone.eq.${clientInfo.phone},email.eq.whatsapp-${clientInfo.phone}@auto-generated.com`)
        .eq('role', 'customer')
        .limit(1);

      if (searchError) {
        logger.error('❌ Erro na busca de cliente na tabela PROFILES:', searchError);
        throw new Error(`Erro na busca profiles: ${searchError.message}`);
      }

      if (existingProfiles && existingProfiles.length > 0) {
        const profile = existingProfiles[0];
        logger.info('✅ [CLIENTE AVANÇADO] Cliente existente encontrado:', profile.id);
        
        // Atualizar metadados com dados enriquecidos
        const updatedMetadata = {
          ...profile.metadata,
          phone: clientInfo.phone,
          phoneFormatted: clientInfo.phoneFormatted,
          whatsappJid: clientInfo.whatsappMetadata.whatsappJid,
          lastContact: new Date().toISOString(),
          country: clientInfo.whatsappMetadata.country,
          phoneFormat: clientInfo.whatsappMetadata.phoneFormat,
          instanceName: clientInfo.instanceName,
          responseData: clientInfo.responseData,
          isActive: true,
          canReply: true,
          lastMessageAt: new Date().toISOString(),
          messageCount: (profile.metadata?.messageCount || 0) + 1,
          updated_via: 'whatsapp_webhook_enhanced'
        };

        // Atualizar profile com dados enriquecidos
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: clientInfo.name,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          logger.warn('⚠️ Erro ao atualizar profile, mas continuando:', updateError);
        } else {
          logger.info('✅ [CLIENTE AVANÇADO] Metadados atualizados com sucesso');
        }
        
        return { id: profile.id, isNew: false };
      }

      // CRIAR NOVO PROFILE COM DADOS COMPLETOS
      logger.info('🆕 [CLIENTE AVANÇADO] Criando novo cliente com dados completos...');
      const newProfileData = {
        id: generateUUID(),
        name: clientInfo.name,
        email: `whatsapp-${clientInfo.phone}@auto-generated.com`,
        role: 'customer',
        metadata: {
          phone: clientInfo.phone,
          phoneFormatted: clientInfo.phoneFormatted,
          ...clientInfo.whatsappMetadata,
          responseData: clientInfo.responseData,
          isActive: true,
          canReply: true,
          source: 'whatsapp_webhook_enhanced',
          messageCount: 1,
          tags: ['whatsapp', 'auto-created', 'enhanced'],
          created_via: 'evolution_api_enhanced',
          first_contact: new Date().toISOString(),
          last_contact: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfileData])
        .select('id, name, email, metadata')
        .single();

      if (createError) {
        logger.error('❌ Erro ao criar profile enriquecido:', createError);
        throw new Error(`Erro ao criar profile: ${createError.message}`);
      }

      logger.info('✅ [CLIENTE AVANÇADO] Novo profile criado com dados completos:', {
        id: newProfile.id,
        name: newProfile.name,
        phone: newProfile.metadata.phone,
        phoneFormatted: newProfile.metadata.phoneFormatted,
        canReply: newProfile.metadata.canReply
      });

      return { id: newProfile.id, isNew: true };

    } catch (error) {
      logger.error('❌ Erro na verificação/criação de cliente avançado:', error);
      throw error;
    }
  }
} 