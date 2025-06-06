import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Variáveis de ambiente do Supabase:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key são necessários.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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