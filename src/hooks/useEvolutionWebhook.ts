import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG, APP_CONFIG } from '@/config';
import { useRealtimeNotifications } from './useRealtimeNotifications';

interface EvolutionMessage {
  id: string;
  instance: string;
  from: string;
  to?: string;
  pushName?: string;
  content: string;
  messageType: string;
  timestamp: Date;
  metadata?: any;
}

interface EvolutionInstance {
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'open' | 'close';
  statusReason?: string;
  lastUpdate: Date;
  qrCode?: string;
}

interface UseEvolutionWebhookReturn {
  // Estado da conexão
  isConnected: boolean;
  socket: Socket | null;
  connectionStatus: string;
  
  // Dados
  messages: EvolutionMessage[];
  instances: Record<string, EvolutionInstance>;
  qrCodes: Record<string, string>;
  
  // Métodos
  joinInstance: (instanceName: string) => void;
  leaveInstance: (instanceName: string) => void;
  pingServer: () => void;
  getInstanceStatus: (instanceName: string) => void;
  clearMessages: () => void;
  
  // Estatísticas
  stats: any;
  refreshStats: () => void;
}

export function useEvolutionWebhook(): UseEvolutionWebhookReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [messages, setMessages] = useState<EvolutionMessage[]>([]);
  const [instances, setInstances] = useState<Record<string, EvolutionInstance>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<any>(null);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = APP_CONFIG.WEBSOCKET_RECONNECT_ATTEMPTS;
  
  const { addNotification } = useRealtimeNotifications();

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Refresh estatísticas
  const refreshStats = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('get-stats');
    }
  }, [socket, isConnected]);

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    console.log('🔌 Conectando ao Evolution Webhook Server:', API_CONFIG.WEBSOCKET_URL);
    setConnectionStatus('Conectando...');

    const newSocket = io(API_CONFIG.WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: APP_CONFIG.WEBSOCKET_RECONNECT_DELAY,
      forceNew: true
    });

    // Eventos de conexão
    newSocket.on('connect', () => {
      console.log('✅ Conectado ao Evolution Webhook Server');
      setIsConnected(true);
      setConnectionStatus('Conectado');
      reconnectAttempts.current = 0;
      
      addNotification({
        title: '🔗 WebSocket Conectado',
        message: 'Conectado ao servidor Evolution API',
        type: 'success'
      });

      // Solicitar estatísticas iniciais
      newSocket.emit('get-stats');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Desconectado do Evolution Webhook Server:', reason);
      setIsConnected(false);
      setConnectionStatus(`Desconectado: ${reason}`);
      
      addNotification({
        title: '🔌 WebSocket Desconectado',
        message: `Conexão perdida: ${reason}`,
        type: 'warning'
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      setConnectionStatus(`Erro: ${error.message}`);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        addNotification({
          title: '❌ Falha na Conexão',
          message: 'Não foi possível conectar ao servidor Evolution',
          type: 'error'
        });
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconectado após ${attemptNumber} tentativas`);
      addNotification({
        title: '🔄 Reconectado',
        message: `Conexão restabelecida após ${attemptNumber} tentativas`,
        type: 'success'
      });
    });

    // Status inicial do servidor
    newSocket.on('server-status', (data) => {
      console.log('📊 Status do servidor:', data);
      setStats(data);
    });

    // Nova mensagem recebida
    newSocket.on('new-message', (data) => {
      console.log('📨 Nova mensagem Evolution:', data);
      
      const message: EvolutionMessage = {
        id: data.id || `${Date.now()}-${Math.random()}`,
        instance: data.instance || 'unknown',
        from: data.from || data.remoteJid || 'unknown',
        to: data.to,
        pushName: data.pushName || data.notifyName,
        content: data.content || data.text || data.body || '',
        messageType: data.messageType || data.type || 'text',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        metadata: data
      };

      setMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(msg => msg.id === message.id);
        if (!exists) {
          const updated = [message, ...prev].slice(0, 100); // Manter últimas 100 mensagens
          
          // Notificar apenas se for mensagem de cliente
          if (!data.fromMe && data.pushName) {
            addNotification({
              title: `💬 ${data.pushName}`,
              message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
              type: 'info',
              metadata: { messageId: message.id, instance: message.instance }
            });
          }
          
          return updated;
        }
        return prev;
      });
    });

    // Atualização de conexão de instância
    newSocket.on('connection-update', (data) => {
      console.log('🔗 Status de conexão Evolution:', data);
      
      setInstances(prev => ({
        ...prev,
        [data.instance]: {
          name: data.instance,
          status: data.status || data.state,
          statusReason: data.statusReason,
          lastUpdate: new Date(),
          qrCode: prev[data.instance]?.qrCode
        }
      }));

      // Notificar mudanças importantes de status
      if (data.status === 'open') {
        addNotification({
          title: '📱 WhatsApp Conectado',
          message: `Instância ${data.instance} conectada com sucesso`,
          type: 'success'
        });
      } else if (data.status === 'close') {
        addNotification({
          title: '📱 WhatsApp Desconectado',
          message: `Instância ${data.instance} foi desconectada`,
          type: 'warning'
        });
      }
    });

    // QR Code atualizado
    newSocket.on('qr-updated', (data) => {
      console.log('📱 QR Code atualizado:', data.instance);
      
      if (data.qrCode) {
        setQrCodes(prev => ({
          ...prev,
          [data.instance]: data.qrCode
        }));

        setInstances(prev => ({
          ...prev,
          [data.instance]: {
            ...prev[data.instance],
            name: data.instance,
            status: 'connecting',
            lastUpdate: new Date(),
            qrCode: data.qrCode
          }
        }));

        addNotification({
          title: '📱 QR Code Atualizado',
          message: `Novo QR Code disponível para ${data.instance}`,
          type: 'info'
        });
      }
    });

    // Startup da aplicação
    newSocket.on('application-startup', (data) => {
      console.log('🚀 Aplicação iniciada:', data.instance);
      
      setInstances(prev => ({
        ...prev,
        [data.instance]: {
          ...prev[data.instance],
          name: data.instance,
          status: 'connecting',
          lastUpdate: new Date()
        }
      }));
    });

    // Eventos genéricos
    newSocket.on('generic-event', (data) => {
      console.log('📨 Evento genérico Evolution:', data.event, data.instance);
    });

    // Estatísticas do servidor
    newSocket.on('stats', (data) => {
      console.log('📊 Estatísticas do servidor:', data);
      setStats(data);
    });

    setSocket(newSocket);
  }, [socket, addNotification, maxReconnectAttempts]);

  // Métodos para interagir com o WebSocket
  const joinInstance = useCallback((instanceName: string) => {
    if (socket && instanceName && isConnected) {
      socket.emit('join-instance', instanceName);
      console.log(`🔌 Entrando na sala da instância: ${instanceName}`);
      
      addNotification({
        title: '🏠 Sala Conectada',
        message: `Conectado à instância ${instanceName}`,
        type: 'info'
      });
    }
  }, [socket, isConnected, addNotification]);

  const leaveInstance = useCallback((instanceName: string) => {
    if (socket && instanceName && isConnected) {
      socket.emit('leave-instance', instanceName);
      console.log(`🔌 Saindo da sala da instância: ${instanceName}`);
    }
  }, [socket, isConnected]);

  const pingServer = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('ping');
      console.log('🏓 Ping enviado ao servidor');
    }
  }, [socket, isConnected]);

  const getInstanceStatus = useCallback((instanceName: string) => {
    if (socket && instanceName && isConnected) {
      socket.emit('get-instance-status', instanceName);
      console.log(`📊 Solicitando status da instância: ${instanceName}`);
    }
  }, [socket, isConnected]);

  // Conectar na inicialização
  useEffect(() => {
    connect();

    // Cleanup
    return () => {
      if (socket) {
        console.log('🔌 Desconectando WebSocket...');
        socket.disconnect();
      }
    };
  }, []); // Remover socket das dependências para evitar reconexões desnecessárias

  // Auto-conectar à instância padrão
  useEffect(() => {
    if (isConnected && socket) {
      const defaultInstance = 'atendimento-ao-cliente-suporte';
      setTimeout(() => {
        joinInstance(defaultInstance);
      }, 1000); // Aguardar 1s após conexão
    }
  }, [isConnected, socket, joinInstance]);

  return {
    // Estado
    isConnected,
    socket,
    connectionStatus,
    messages,
    instances,
    qrCodes,
    stats,
    
    // Métodos
    joinInstance,
    leaveInstance,
    pingServer,
    getInstanceStatus,
    clearMessages,
    refreshStats
  };
} 