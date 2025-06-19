// HOOK PARA VALIDAÇÃO E BUSCA AUTOMÁTICA DE TELEFONE WHATSAPP
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';

interface PhoneSearchResult {
  found: boolean;
  phone?: string;
  phoneFormatted?: string;
  customerId?: string;
  customerName?: string;
  source: 'metadata' | 'customer_search' | 'manual' | 'not_found';
  confidence: 'high' | 'medium' | 'low';
}

interface ValidationResult {
  isValid: boolean;
  phone?: string;
  phoneFormatted?: string;
  error?: string;
  suggestions?: string[];
}

export const usePhoneValidationAndSearch = () => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);

  // Validar formato de telefone
  const validatePhoneFormat = useCallback((phone: string): ValidationResult => {
    if (!phone || phone === 'Telefone não informado') {
      return {
        isValid: false,
        error: 'Telefone não informado'
      };
    }

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return {
        isValid: false,
        error: 'Telefone muito curto (mínimo 10 dígitos)',
        suggestions: ['Verifique se não faltam dígitos', 'Inclua DDD + número']
      };
    }

    if (cleanPhone.length > 15) {
      return {
        isValid: false,
        error: 'Telefone muito longo (máximo 15 dígitos)',
        suggestions: ['Remova caracteres especiais', 'Verifique o formato']
      };
    }

    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      const ddd = cleanPhone.substring(2, 4);
      const number = cleanPhone.substring(4);
      
      const dddNum = parseInt(ddd);
      if (dddNum < 11 || dddNum > 99) {
        return {
          isValid: false,
          error: 'DDD brasileiro inválido (deve ser entre 11-99)',
          suggestions: ['Verifique o DDD', 'Use formato +55 (11) 99999-9999']
        };
      }

      if (number.length === 9) {
        const phoneFormatted = `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
        return {
          isValid: true,
          phone: cleanPhone,
          phoneFormatted
        };
      } else if (number.length === 8) {
        const phoneFormatted = `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
        return {
          isValid: true,
          phone: cleanPhone,
          phoneFormatted
        };
      }
    }

    if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
      return {
        isValid: true,
        phone: cleanPhone,
        phoneFormatted: `+${cleanPhone}`
      };
    }

    return {
      isValid: false,
      error: 'Formato de telefone não reconhecido',
      suggestions: ['Use formato internacional', 'Inclua código do país']
    };
  }, []);

  // Buscar telefone do cliente no banco
  const searchCustomerPhone = useCallback(async (ticketId: string, customerName?: string): Promise<PhoneSearchResult> => {
    setIsSearching(true);
    
    try {
      console.log('🔍 Buscando telefone do cliente...', { ticketId, customerName });

      const { data: messages } = await supabase
        .from('messages')
        .select('metadata, sender_name')
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'customer')
        .not('metadata->whatsapp_phone', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (messages && messages.length > 0) {
        const msg = messages[0];
        const phone = msg.metadata?.whatsapp_phone || msg.metadata?.client_phone;
        
        if (phone) {
          const validation = validatePhoneFormat(phone);
          if (validation.isValid) {
            return {
              found: true,
              phone: validation.phone,
              phoneFormatted: validation.phoneFormatted,
              customerName: msg.sender_name,
              source: 'metadata',
              confidence: 'high'
            };
          }
        }
      }

      const { data: ticket } = await supabase
        .from('tickets')
        .select('metadata, customer_id')
        .eq('id', ticketId)
        .single();

      if (ticket?.metadata) {
        const possiblePhones = [
          ticket.metadata.whatsapp_phone,
          ticket.metadata.client_phone,
          ticket.metadata.phone,
          typeof ticket.metadata.anonymous_contact === 'object' 
            ? ticket.metadata.anonymous_contact?.phone 
            : null
        ].filter(Boolean);

        for (const phone of possiblePhones) {
          const validation = validatePhoneFormat(phone);
          if (validation.isValid) {
            return {
              found: true,
              phone: validation.phone,
              phoneFormatted: validation.phoneFormatted,
              source: 'metadata',
              confidence: 'high'
            };
          }
        }
      }

      if (ticket?.customer_id) {
        const { data: customer } = await supabase
          .from('profiles')
          .select('id, phone, metadata, name')
          .eq('id', ticket.customer_id)
          .single();

        if (customer) {
          const possiblePhones = [
            customer.phone,
            customer.metadata?.phone,
            customer.metadata?.whatsapp_phone,
            customer.metadata?.client_phone
          ].filter(Boolean);

          for (const phone of possiblePhones) {
            const validation = validatePhoneFormat(phone);
            if (validation.isValid) {
              return {
                found: true,
                phone: validation.phone,
                phoneFormatted: validation.phoneFormatted,
                customerId: customer.id,
                customerName: customer.name,
                source: 'customer_search',
                confidence: 'medium'
              };
            }
          }
        }
      }

      return {
        found: false,
        source: 'not_found',
        confidence: 'low'
      };

    } catch (error) {
      console.error('❌ Erro ao buscar telefone:', error);
      return {
        found: false,
        source: 'not_found',
        confidence: 'low'
      };
    } finally {
      setIsSearching(false);
    }
  }, [validatePhoneFormat]);

  // Atualizar ticket com telefone
  const updateTicketWithPhone = useCallback(async (
    ticketId: string, 
    phoneData: PhoneSearchResult
  ): Promise<boolean> => {
    try {
      if (!phoneData.found || !phoneData.phone) return false;

      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('metadata, customer_id')
        .eq('id', ticketId)
        .single();

      if (!currentTicket) return false;

      const updatedMetadata = {
        ...currentTicket.metadata,
        whatsapp_phone: phoneData.phone,
        phone_formatted: phoneData.phoneFormatted,
        client_phone: phoneData.phone,
        is_whatsapp: true,
        can_reply_whatsapp: true
      };

      const updateData: any = {
        metadata: updatedMetadata,
        channel: 'whatsapp'
      };

      if (phoneData.customerId && !currentTicket.customer_id) {
        updateData.customer_id = phoneData.customerId;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) return false;

      toast({
        title: "📱 Telefone encontrado!",
        description: `${phoneData.phoneFormatted} vinculado ao ticket`,
      });

      return true;

    } catch (error) {
      console.error('❌ Erro ao atualizar ticket:', error);
      return false;
    }
  }, [toast]);

  // Função principal
  const validateAndSearchPhone = useCallback(async (
    ticketId: string,
    currentPhone?: string,
    customerName?: string
  ): Promise<{
    canSend: boolean;
    phone?: string;
    phoneFormatted?: string;
    reason?: string;
    searchResult?: PhoneSearchResult;
  }> => {
    if (currentPhone && currentPhone !== 'Telefone não informado') {
      const validation = validatePhoneFormat(currentPhone);
      if (validation.isValid) {
        return {
          canSend: true,
          phone: validation.phone,
          phoneFormatted: validation.phoneFormatted
        };
      }
    }

    const searchResult = await searchCustomerPhone(ticketId, customerName);

    if (searchResult.found) {
      const updated = await updateTicketWithPhone(ticketId, searchResult);
      
      if (updated) {
        return {
          canSend: true,
          phone: searchResult.phone,
          phoneFormatted: searchResult.phoneFormatted,
          searchResult
        };
      }
    }

    return {
      canSend: false,
      reason: 'Nenhum telefone WhatsApp válido encontrado para este cliente',
      searchResult
    };
  }, [validatePhoneFormat, searchCustomerPhone, updateTicketWithPhone]);

  return {
    validatePhoneFormat,
    searchCustomerPhone,
    updateTicketWithPhone,
    validateAndSearchPhone,
    isSearching
  };
};
