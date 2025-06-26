import { createClient } from '@supabase/supabase-js';

// Tenta obter as variáveis de ambiente de diferentes fontes
const getEnvVar = (key: string) => {
  // Tenta obter do import.meta.env primeiro
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Tenta obter do window.env (caso esteja usando o env.js)
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }
  
  // Tenta obter do process.env (caso esteja usando Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Valores padrão para desenvolvimento local
  const defaults = {
    VITE_SUPABASE_URL: 'https://ajlgjjjvuglwgfnyqqvb.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImF1ZCI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU'
  };
  
  return defaults[key];
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

console.log('Variáveis de ambiente do Supabase:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key são necessários.');
}

// Verificar se deve usar Realtime (pode ser desabilitado via variável de ambiente)
const useRealtime = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

console.log('🔌 Configuração Realtime:', useRealtime ? 'Habilitado' : 'Desabilitado (Fallback)');

// Configurações para Supabase com fallback para desabilitar Realtime
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    timeout: 20000,
    heartbeatIntervalMs: 15000
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'bkcrm-supabase-auth'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'bkcrm-client',
      'User-Agent': 'BKCRM/1.0.0'
    }
  }
});

// Conectar ao Realtime apenas se habilitado
if (useRealtime) {
  let connectionAttempts = 0;
  const maxAttempts = 3;

  const connectRealtime = () => {
    try {
      console.log('🔗 Tentando conectar ao Supabase Realtime...');
      supabase.realtime.connect();
      
      // Verificar status da conexão após um tempo
      setTimeout(() => {
        const isConnected = supabase.realtime.isConnected?.() || false;
        if (isConnected) {
          console.log('✅ Supabase Realtime: Conectado com sucesso');
        } else {
          console.warn('⚠️ Supabase Realtime: Conexão não estabelecida');
          
          // Tentar reconectar se ainda há tentativas
          if (connectionAttempts < maxAttempts) {
            connectionAttempts++;
            console.log(`🔄 Tentativa de reconexão ${connectionAttempts}/${maxAttempts}`);
            setTimeout(connectRealtime, 5000);
          } else {
            console.log('📴 Máximo de tentativas atingido - Sistema funcionará sem tempo real');
            // Desabilitar tentativas futuras
            (window as any).realtimeDisabled = true;
          }
        }
      }, 3000);
      
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Realtime:', error);
      console.log('📴 Sistema funcionará em modo offline para tempo real');
    }
  };

  // Iniciar conexão
  connectRealtime();
} else {
  console.log('📴 Realtime desabilitado - Sistema funcionará com polling manual');
}

// Função de diagnóstico global para debug
(window as any).diagnoseSupabaseConnection = async () => {
  const status = {
    url: supabaseUrl,
    realtimeEnabled: useRealtime,
    isConnected: useRealtime ? (supabase.realtime.isConnected?.() || false) : false,
    user: await supabase.auth.getUser(),
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 Diagnóstico Supabase:', status);
  return status;
};

// Função para alternar Realtime dinamicamente
(window as any).toggleRealtime = (enable: boolean) => {
  if (enable && !useRealtime) {
    console.log('🔄 Tentando reabilitar Realtime...');
    supabase.realtime.connect();
  } else if (!enable && useRealtime) {
    console.log('📴 Desabilitando Realtime...');
    supabase.realtime.disconnect();
  }
  
  (window as any).realtimeManuallyDisabled = !enable;
  console.log(`🔌 Realtime ${enable ? 'habilitado' : 'desabilitado'} manualmente`);
};

// Tipos para as tabelas do Supabase
export interface Profile {
  id: string;
  created_at: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'agent' | 'customer';
}

export interface Ticket {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
  agent_id?: string;
  department: string;
  // Campos para tipos de canal
  client_phone?: string;
  channel: 'email' | 'phone' | 'chat' | 'web';
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  created_at: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  is_internal: boolean;
}

// Funções auxiliares para autenticação
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Funções para gerenciamento de perfis
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Funções para gerenciamento de tickets
export const createTicket = async (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single();
  return { data, error };
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();
  return { data, error };
};

export const getTickets = async (filters?: Partial<Ticket>) => {
  let query = supabase.from('tickets').select('*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query;
  return { data, error };
};

// Funções para gerenciamento de mensagens
export const createMessage = async (message: Omit<Message, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
    .single();
  return { data, error };
};

export const getMessages = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  return { data, error };
};

// Função para upload de arquivos
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  return { data, error };
};

// Função para download de arquivos
export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}; 