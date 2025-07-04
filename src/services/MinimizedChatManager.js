import { toast } from '@/hooks/use-toast';
// Gerenciador Singleton Simplificado
export class MinimizedChatManager {
    constructor() {
        Object.defineProperty(this, "chats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                soundEnabled: true,
                previewEnabled: true,
                autoMinimize: false,
                showNotifications: true,
                maxChats: 5,
            }
        });
        this.loadFromStorage();
        this.setupEventListeners();
    }
    static getInstance() {
        if (!MinimizedChatManager.instance) {
            MinimizedChatManager.instance = new MinimizedChatManager();
        }
        return MinimizedChatManager.instance;
    }
    // ====== CORE METHODS ======
    addChat(chatId, ticket) {
        if (this.chats.has(chatId)) {
            console.log(`🔄 Chat ${chatId} já existe, atualizando...`);
            return this.updateChat(chatId, { ticket });
        }
        if (this.chats.size >= this.settings.maxChats) {
            toast({
                title: "⚠️ Limite de chats atingido",
                description: `Máximo de ${this.settings.maxChats} chats minimizados permitidos`,
                variant: "destructive"
            });
            return false;
        }
        // Posição fixa simples - não precisa de cálculos complexos
        const position = {
            x: 0, // Não usado no posicionamento fixo
            y: 0, // Não usado no posicionamento fixo
            width: 280,
            height: 120,
            zIndex: 1000 + this.chats.size,
            isPinned: false,
            isVisible: true,
        };
        const newChat = {
            id: chatId,
            ticket,
            position,
            unreadCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.chats.set(chatId, newChat);
        this.saveToStorage();
        this.notifyListeners();
        toast({
            title: "💬 Chat minimizado",
            description: `${ticket.client || 'Cliente'} foi minimizado`,
        });
        return true;
    }
    removeChat(chatId) {
        if (!this.chats.has(chatId)) {
            return false;
        }
        const chat = this.chats.get(chatId);
        this.chats.delete(chatId);
        this.saveToStorage();
        this.notifyListeners();
        toast({
            title: "❌ Chat fechado",
            description: `Chat com ${chat?.ticket.client || 'cliente'} foi fechado`,
        });
        return true;
    }
    updateChat(chatId, updates) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        const updatedChat = {
            ...chat,
            ...updates,
            updatedAt: new Date(),
        };
        this.chats.set(chatId, updatedChat);
        this.saveToStorage();
        this.notifyListeners();
        return true;
    }
    togglePin(chatId) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        const isPinned = !chat.position.isPinned;
        chat.position.isPinned = isPinned;
        this.updateChat(chatId, { position: chat.position });
        toast({
            title: isPinned ? "📌 Chat fixado" : "📌 Chat desfixado",
            description: isPinned
                ? "Chat permanecerá visível"
                : "Chat pode ser fechado automaticamente",
        });
        return true;
    }
    toggleVisibility(chatId) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        const isVisible = !chat.position.isVisible;
        chat.position.isVisible = isVisible;
        return this.updateChat(chatId, { position: chat.position });
    }
    expandChat(chatId) {
        // Emitir evento para o TicketManagement capturar
        const chat = this.chats.get(chatId);
        if (chat) {
            const event = new CustomEvent('expandChat', {
                detail: { chatId, ticket: chat.ticket }
            });
            window.dispatchEvent(event);
            // Remover chat minimizado após expansão
            this.removeChat(chatId);
        }
    }
    // ====== GETTERS ======
    getChats() {
        return Array.from(this.chats.values())
            .filter(chat => chat.position && chat.position.isVisible)
            .sort((a, b) => (a.createdAt.getTime() - b.createdAt.getTime())); // Ordem de criação
    }
    getChat(chatId) {
        return this.chats.get(chatId);
    }
    getSettings() {
        return { ...this.settings };
    }
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveToStorage();
        this.notifyListeners();
        toast({
            title: "⚙️ Configurações atualizadas",
            description: "Suas preferências foram salvas",
        });
    }
    // ====== PERSISTENCE ======
    saveToStorage() {
        try {
            const data = {
                chats: Array.from(this.chats.entries()),
                settings: this.settings,
                timestamp: Date.now(),
            };
            localStorage.setItem('minimized-chats-manager', JSON.stringify(data));
        }
        catch (error) {
            console.error('❌ Erro ao salvar chats minimizados:', error);
        }
    }
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('minimized-chats-manager');
            if (!stored)
                return;
            const data = JSON.parse(stored);
            // Carregar chats (com validação de tempo)
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            if (data.timestamp && (Date.now() - data.timestamp) < maxAge) {
                // Validar e filtrar chats com posições válidas
                const validChats = (data.chats || []).filter(([id, chat]) => {
                    return chat && chat.position &&
                        typeof chat.position.isPinned === 'boolean' &&
                        typeof chat.position.isVisible === 'boolean';
                });
                this.chats = new Map(validChats);
                this.settings = { ...this.settings, ...(data.settings || {}) };
                console.log(`✅ Carregados ${validChats.length} chats válidos do storage`);
            }
        }
        catch (error) {
            console.error('❌ Erro ao carregar chats minimizados:', error);
            localStorage.removeItem('minimized-chats-manager');
        }
    }
    // ====== EVENT SYSTEM ======
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener();
            }
            catch (error) {
                console.error('❌ Erro no listener:', error);
            }
        });
    }
    setupEventListeners() {
        // Cleanup ao fechar janela
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.saveToStorage();
            });
        }
    }
    // ====== UTILITY METHODS ======
    clearAll() {
        this.chats.clear();
        this.saveToStorage();
        this.notifyListeners();
        toast({
            title: "🧹 Todos os chats fechados",
            description: "Todos os chats minimizados foram removidos",
        });
    }
    getStats() {
        return {
            totalChats: this.chats.size,
            visibleChats: this.getChats().length,
            pinnedChats: Array.from(this.chats.values()).filter(c => c.position?.isPinned).length,
            totalUnread: Array.from(this.chats.values()).reduce((sum, c) => sum + c.unreadCount, 0),
        };
    }
}
