import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';

// Configuração baseada no ambiente
const getWebSocketURL = () => {
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
  
  if (isDev) {
    return import.meta.env.VITE_EVOLUTION_WEBHOOK_URL || 'http://localhost:4000';
  }
  
  return import.meta.env.VITE_EVOLUTION_WEBHOOK_URL || 'https://webhook.bkcrm.devsible.com.br';
};

export interface EvolutionMessage {
  id?: string;
  from: string;
  content: string;
  timestamp: Date;
  instanceName?: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

export interface EvolutionInstance {
  name: string;
  status: 'open' | 'close' | 'connecting' | 'initializing';
  phone?: string;
  profilePicture?: string;
  connected?: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  lastConnected?: Date;
}

export const useEvolutionWebhook = () => {
  // Estados principais
  const [messages, setMessages] = useState<EvolutionMessage[]>([]);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false
  });

  // Refs para gerenciar o socket
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Inicializar conexão WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return; // Já conectado
    }

    const wsUrl = getWebSocketURL();
    console.log(`🔌 Conectando WebSocket Evolution API: ${wsUrl}`);

    try {
      // Criar nova conexão Socket.IO
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      socketRef.current = socket;

      // Event listeners da conexão
      socket.on('connect', () => {
        console.log('✅ [WebSocket] Conectado com Evolution API');
        setIsConnected(true);
        setConnectionStatus({
          connected: true,
          reconnecting: false,
          lastConnected: new Date()
        });
        reconnectAttempts.current = 0;

        toast({
          title: "🔄 WebSocket Conectado",
          description: "Conexão estabelecida com Evolution API",
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [WebSocket] Desconectado:', reason);
        setIsConnected(false);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          error: reason
        }));

        if (reason === 'io server disconnect') {
          // Reconexão manual necessária
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [WebSocket] Erro de conexão:', error);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          reconnecting: true,
          error: error.message
        }));

        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast({
            title: "❌ Erro de Conexão",
            description: "Falha ao conectar com Evolution API",
            variant: "destructive",
          });
        }
      });

      // Solicitar status inicial após conectar
      socket.on('connect', () => {
        console.log('🔄 Solicitando dados iniciais...');
        socket.emit('get-instances');
        socket.emit('get-qrcodes');
      });

      // Event listeners específicos da Evolution API
      socket.on('new-message', (data: any) => {
        console.log('📨 [WebSocket] Nova mensagem:', data);
        
        const message: EvolutionMessage = {
          id: data.messageId || data.id,
          from: data.from || data.sender || data.remoteJid || 'Desconhecido',
          content: data.content || data.text || data.message || 'Mensagem sem conteúdo',
          timestamp: new Date(data.timestamp || Date.now()),
          instanceName: data.instanceName || data.instance,
          messageType: data.messageType || 'text',
          mediaUrl: data.mediaUrl
        };

        setMessages(prev => [...prev, message]);

        // Toast para nova mensagem
        toast({
          title: "📨 Nova Mensagem",
          description: `De: ${message.from.substring(0, 20)}${message.from.length > 20 ? '...' : ''}`,
        });
      });

      socket.on('connection-update', (data: any) => {
        console.log('🔄 [WebSocket] Atualização de conexão:', data);
        
        const instanceName = data.instanceName || data.instance;
        if (instanceName) {
          setInstances(prev => {
            const updated = prev.map(instance => 
              instance.name === instanceName 
                ? { 
                    ...instance, 
                    status: data.state || data.status || instance.status,
                    phone: data.phone || instance.phone,
                    connected: data.state === 'open' || data.status === 'open'
                  }
                : instance
            );
            
            // Adicionar instância se não existir
            if (!updated.find(i => i.name === instanceName)) {
              updated.push({
                name: instanceName,
                status: data.state || data.status || 'close',
                phone: data.phone,
                connected: data.state === 'open' || data.status === 'open'
              });
            }
            
            return updated;
          });
        }
      });

      socket.on('qr-updated', (data: any) => {
        console.log('📱 [WebSocket] QR Code atualizado:', data);
        
        const instanceName = data.instanceName || data.instance;
        if (instanceName && data.qrcode) {
          setQrCodes(prev => ({
            ...prev,
            [instanceName]: data.qrcode
          }));

          toast({
            title: "📱 QR Code Atualizado",
            description: `QR Code disponível para ${instanceName}`,
          });
        }
      });

      socket.on('instance-status', (data: any) => {
        console.log('📊 [WebSocket] Status da instância:', data);
        
        if (Array.isArray(data)) {
          // Lista de instâncias
          const newInstances: EvolutionInstance[] = data.map(item => ({
            name: item.instanceName || item.name,
            status: item.state || item.status || 'close',
            phone: item.phone,
            connected: item.state === 'open' || item.status === 'open'
          }));
          
          setInstances(newInstances);
        } else if (data.instanceName) {
          // Instância única
          setInstances(prev => {
            const updated = prev.map(instance => 
              instance.name === data.instanceName 
                ? { 
                    ...instance, 
                    status: data.state || data.status || instance.status,
                    phone: data.phone || instance.phone,
                    connected: data.state === 'open' || data.status === 'open'
                  }
                : instance
            );
            
            if (!updated.find(i => i.name === data.instanceName)) {
              updated.push({
                name: data.instanceName,
                status: data.state || data.status || 'close',
                phone: data.phone,
                connected: data.state === 'open' || data.status === 'open'
              });
            }
            
            return updated;
          });
        }
      });

    } catch (error) {
      console.error('❌ Erro ao criar socket:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: 'Erro ao inicializar WebSocket'
      }));
    }
  }, []);

  // Reconectar
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus(prev => ({
      ...prev,
      reconnecting: true
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [connect]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setIsConnected(false);
    setConnectionStatus({ connected: false, reconnecting: false });
  }, []);

  // Entrar em uma instância específica
  const joinInstance = useCallback((instanceName: string) => {
    if (socketRef.current?.connected) {
      console.log(`🔌 Entrando na instância: ${instanceName}`);
      socketRef.current.emit('join-instance', { instanceName });
      
      return Promise.resolve();
    }
    
    return Promise.reject(new Error('WebSocket não conectado'));
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback((instanceName: string, number: string, text: string) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('WebSocket não conectado'));
        return;
      }

      const payload = {
        instanceName,
        number: number.replace(/\D/g, ''), // Remove caracteres não numéricos
        text,
        timestamp: new Date().toISOString()
      };

      console.log('📤 [WebSocket] Enviando mensagem:', payload);

      socketRef.current.emit('send-message', payload, (response: any) => {
        if (response?.success) {
          console.log('✅ Mensagem enviada com sucesso:', response);
          resolve(response);
        } else {
          console.error('❌ Erro ao enviar mensagem:', response);
          reject(new Error(response?.error || 'Erro ao enviar mensagem'));
        }
      });
    });
  }, []);

  // Obter status de uma instância
  const getInstanceStatus = useCallback((instanceName: string) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('WebSocket não conectado'));
        return;
      }

      socketRef.current.emit('get-instance-status', { instanceName }, (response: any) => {
        if (response) {
          resolve(response);
        } else {
          reject(new Error('Erro ao obter status da instância'));
        }
      });
    });
  }, []);

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Remover QR Code
  const clearQRCode = useCallback((instanceName: string) => {
    setQrCodes(prev => {
      const updated = { ...prev };
      delete updated[instanceName];
      return updated;
    });
  }, []);

  // Effect para inicializar conexão
  useEffect(() => {
    connect();

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Effect para limpeza de timeouts
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estados
    messages,
    instances,
    qrCodes,
    isConnected,
    connectionStatus,
    
    // Ações
    connect,
    reconnect,
    disconnect,
    joinInstance,
    sendMessage,
    getInstanceStatus,
    clearMessages,
    clearQRCode,
    
    // Informações úteis
    messagesCount: messages.length,
    connectedInstances: instances.filter(i => i.connected).length,
    totalInstances: instances.length
  };
}; 