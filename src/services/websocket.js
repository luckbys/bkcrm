import { io } from 'socket.io-client';
class WebSocketService {
    constructor() {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "reconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "maxReconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(this, "reconnectDelay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        // Singleton
    }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    connect(ticketId) {
        if (this.socket?.connected) {
            console.log('🔌 [WS] Já conectado ao WebSocket');
            return this.socket;
        }
        console.log('🔌 [WS] Iniciando conexão WebSocket...');
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
        this.socket = io(wsUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            query: ticketId ? { ticketId } : undefined
        });
        this.setupEventListeners();
        return this.socket;
    }
    setupEventListeners() {
        if (!this.socket)
            return;
        this.socket.on('connect', () => {
            console.log('✅ [WS] Conectado ao WebSocket');
            this.reconnectAttempts = 0;
        });
        this.socket.on('disconnect', (reason) => {
            console.log('❌ [WS] Desconectado do WebSocket:', reason);
        });
        this.socket.on('connect_error', (error) => {
            console.error('❌ [WS] Erro de conexão:', error);
            this.handleReconnect();
        });
        this.socket.on('error', (error) => {
            console.error('❌ [WS] Erro no WebSocket:', error);
        });
    }
    handleReconnect() {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ [WS] Máximo de tentativas de reconexão atingido');
            return;
        }
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`🔄 [WS] Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);
        setTimeout(() => {
            if (this.socket) {
                this.socket.connect();
            }
        }, delay);
    }
    joinTicket(ticketId) {
        if (!this.socket?.connected) {
            console.warn('⚠️ [WS] Socket não conectado ao tentar entrar no ticket');
            return;
        }
        console.log('👥 [WS] Entrando na sala do ticket:', ticketId);
        this.socket.emit('join-ticket', ticketId);
    }
    leaveTicket(ticketId) {
        if (!this.socket?.connected)
            return;
        console.log('👋 [WS] Saindo da sala do ticket:', ticketId);
        this.socket.emit('leave-ticket', ticketId);
    }
    onNewMessage(callback) {
        if (!this.socket)
            return;
        this.socket.on('new-message', (message) => {
            console.log('📨 [WS] Nova mensagem recebida:', message);
            callback(message);
        });
    }
    sendMessage(event, data) {
        if (!this.socket?.connected) {
            console.warn('⚠️ [WS] Socket não conectado ao tentar enviar mensagem');
            return false;
        }
        console.log(`📤 [WS] Enviando evento "${event}":`, data);
        this.socket.emit(event, data);
        return true;
    }
    disconnect() {
        if (this.socket) {
            console.log('👋 [WS] Desconectando WebSocket');
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
export const wsService = WebSocketService.getInstance();
