// FUNÇÕES AUXILIARES
export function extractPhoneFromJid(jid) {
  if (!jid) return null;
  if (jid.includes('@g.us')) return null;
  
  const cleanJid = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  if (!/^\d+$/.test(cleanJid) || cleanJid.length < 10) return null;
  
  return cleanJid;
}

export function extractAndNormalizePhone(jid, pushName = null) {
  try {
    if (!jid) return { phone: null, isValid: false };
    if (jid.includes('@g.us')) return { phone: null, isValid: false, format: 'group' };

    const rawPhone = jid.replace(/@[sc]\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');
    
    if (!rawPhone || rawPhone.length < 10) {
      return { phone: rawPhone, isValid: false };
    }

    let formattedPhone = rawPhone;
    let country = 'unknown';
    let format = 'international';

    if (rawPhone.startsWith('55') && rawPhone.length >= 12) {
      country = 'brazil';
      const ddd = rawPhone.substring(2, 4);
      const number = rawPhone.substring(4);
      formattedPhone = number.length === 9 
        ? `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
        : `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
      format = number.length === 9 ? 'brazil_mobile' : 'brazil_landline';
    }

    return {
      phone: rawPhone,
      phoneFormatted: formattedPhone,
      isValid: true,
      format,
      country,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erro na extração de telefone:', error);
    return { phone: null, isValid: false };
  }
}

export function extractMessageContent(message) {
  if (!message) return null;
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  
  // Outros tipos de mensagem podem ser implementados aqui
  return null;
}

export function prepareClientData(phoneInfo, messageData, instanceName) {
  try {
    console.log('🔄 Preparando dados do cliente:', {
      phoneInfo,
      pushName: messageData.pushName,
      instance: instanceName
    });

    if (!phoneInfo || !phoneInfo.phone) {
      console.warn('⚠️ Dados de telefone inválidos');
      return null;
    }

    return {
      phone: phoneInfo.phone,
      phoneFormatted: phoneInfo.phoneFormatted || phoneInfo.phone,
      name: messageData.pushName || `Cliente ${phoneInfo.phone.slice(-4)}`,
      instanceName,
      whatsappMetadata: {
        whatsappJid: messageData.key.remoteJid,
        pushName: messageData.pushName,
        country: phoneInfo.country || 'unknown',
        phoneFormat: phoneInfo.format || 'international',
        lastSeen: new Date().toISOString()
      },
      responseData: {
        canReply: true,
        isActive: true,
        lastMessageAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Erro ao preparar dados do cliente:', error);
    return null;
  }
} 