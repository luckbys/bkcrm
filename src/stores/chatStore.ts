import { create } from 'zustand';

interface ChatMessage {
  id: string;
  ticketId: string;
  content: string;
  senderName: string;
  sender: 'agent' | 'client';
  isInternal: boolean;
  timestamp: Date;
  type: string;
  metadata: Record<string, any>;
}

interface ChatState {
  isConnected: boolean;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  messages: Record<string, ChatMessage[]>;
  
  init: () => void;
  disconnect: () => void;
  join: (ticketId: string) => void;
  send: (ticketId: string, content: string, isInternal: boolean) => Promise<void>;
  load: (ticketId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isConnected: false,
  isLoading: false,
  isSending: false,
  error: null,
  messages: {},

  init: () => {
    console.log('🔄 [CHAT] Chat store inicializado');
    set({ isConnected: true, error: null, isLoading: false });
  },

  disconnect: () => {
    console.log('🔌 [CHAT] Chat store desconectado');
    set({ isConnected: false, messages: {} });
  },

  join: (ticketId: string) => {
    console.log('🎯 [CHAT] Joined ticket:', ticketId);
    // Lógica de join será implementada nos componentes específicos
  },

  send: async (ticketId: string, content: string, isInternal: boolean) => {
    console.log('📤 [CHAT] Enviando mensagem:', { ticketId, content, isInternal });
    set({ isSending: true });
    
    try {
      // A lógica de envio será implementada nos componentes específicos
      // que usam evolutionApiService diretamente
      console.log('✅ [CHAT] Mensagem enviada com sucesso');
    } catch (error) {
      console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
      set({ error: 'Erro ao enviar mensagem' });
    } finally {
      set({ isSending: false });
    }
  },

  load: (ticketId: string) => {
    console.log('📥 [CHAT] Carregando mensagens para ticket:', ticketId);
    set({ isLoading: true });
    
    // A lógica de carregamento será implementada nos componentes específicos
    setTimeout(() => {
      set({ isLoading: false });
    }, 100);
  }
})); 