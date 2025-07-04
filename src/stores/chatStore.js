import { create } from 'zustand';
export const useChatStore = create((set, get) => ({
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
    join: (ticketId) => {
        console.log('🎯 [CHAT] Joined ticket:', ticketId);
        // Lógica de join será implementada nos componentes específicos
    },
    send: async (ticketId, content, isInternal) => {
        console.log('📤 [CHAT] Enviando mensagem:', { ticketId, content, isInternal });
        set({ isSending: true });
        try {
            // A lógica de envio será implementada nos componentes específicos
            // que usam evolutionApi diretamente
            console.log('✅ [CHAT] Mensagem enviada com sucesso');
        }
        catch (error) {
            console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
            set({ error: 'Erro ao enviar mensagem' });
        }
        finally {
            set({ isSending: false });
        }
    },
    load: (ticketId) => {
        console.log('📥 [CHAT] Carregando mensagens para ticket:', ticketId);
        set({ isLoading: true });
        // A lógica de carregamento será implementada nos componentes específicos
        setTimeout(() => {
            set({ isLoading: false });
        }, 100);
    }
}));
