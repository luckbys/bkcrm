// 🔗 COMPONENTE DE STATUS DE CONEXÃO WEBSOCKET
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Loader2, 
  RefreshCw, Settings, Info, Clock, Users, Activity,
  Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface ConnectionInfo {
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting';
  latency?: number;
  lastSeen?: Date;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  error?: string;
  serverStatus?: 'online' | 'maintenance' | 'offline';
  clientsOnline?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ConnectionStatusProps {
  connectionInfo: ConnectionInfo;
  onReconnect?: () => void;
  onSettings?: () => void;
  className?: string;
  showDetails?: boolean;
  showPopover?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionInfo,
  onReconnect,
  onSettings,
  className,
  showDetails = true,
  showPopover = true
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [timeSinceLastSeen, setTimeSinceLastSeen] = useState<string>('');

  // Atualizar tempo desde última conexão
  useEffect(() => {
    if (!connectionInfo.lastSeen) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - connectionInfo.lastSeen!.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setTimeSinceLastSeen(`${hours}h ${minutes % 60}m atrás`);
      } else if (minutes > 0) {
        setTimeSinceLastSeen(`${minutes}m ${seconds % 60}s atrás`);
      } else {
        setTimeSinceLastSeen(`${seconds}s atrás`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [connectionInfo.lastSeen]);

  const getStatusConfig = () => {
    switch (connectionInfo.status) {
      case 'connected':
        return {
          icon: connectionInfo.quality === 'excellent' ? Signal : 
                connectionInfo.quality === 'good' ? SignalHigh :
                connectionInfo.quality === 'fair' ? SignalMedium : SignalLow,
          text: 'Online',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeVariant: 'default' as const,
          badgeColor: 'bg-green-500'
        };
      case 'connecting':
      case 'reconnecting':
        return {
          icon: Loader2,
          text: connectionInfo.status === 'reconnecting' ? 'Reconectando' : 'Conectando',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeVariant: 'secondary' as const,
          badgeColor: 'bg-yellow-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Erro',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const,
          badgeColor: 'bg-red-500'
        };
      default:
        return {
          icon: WifiOff,
          text: 'Offline',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeVariant: 'secondary' as const,
          badgeColor: 'bg-gray-500'
        };
    }
  };

  const getQualityColor = () => {
    switch (connectionInfo.quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getLatencyText = () => {
    if (!connectionInfo.latency) return 'N/A';
    
    if (connectionInfo.latency < 50) return 'Excelente';
    if (connectionInfo.latency < 100) return 'Boa';
    if (connectionInfo.latency < 200) return 'Regular';
    return 'Ruim';
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const StatusBadge = () => (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
      config.bgColor,
      config.borderColor,
      'hover:shadow-sm cursor-pointer',
      className
    )}>
      <Icon className={cn(
        'w-4 h-4',
        config.color,
        (connectionInfo.status === 'connecting' || connectionInfo.status === 'reconnecting') && 'animate-spin'
      )} />
      
      <span className={cn('text-sm font-medium', config.color)}>
        {config.text}
      </span>
      
      {showDetails && (
        <>
          {connectionInfo.latency && connectionInfo.status === 'connected' && (
            <Badge variant="secondary" className="text-xs">
              {connectionInfo.latency}ms
            </Badge>
          )}
          
          {connectionInfo.reconnectAttempts && connectionInfo.status === 'reconnecting' && (
            <Badge variant="secondary" className="text-xs">
              {connectionInfo.reconnectAttempts}/{connectionInfo.maxReconnectAttempts || 5}
            </Badge>
          )}
        </>
      )}
      
      {showPopover && <Info className="w-3 h-3 text-gray-400" />}
    </div>
  );

  const DetailedInfo = () => (
    <div className="w-80 space-y-4">
      {/* Status Principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', config.color)} />
          <span className="font-semibold">{config.text}</span>
        </div>
        <div className={cn('w-3 h-3 rounded-full', config.badgeColor)} />
      </div>

      {/* Informações de Conexão */}
      <div className="space-y-3">
        {connectionInfo.latency && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Latência:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{connectionInfo.latency}ms</span>
              <span className={cn('text-xs', getQualityColor())}>
                ({getLatencyText()})
              </span>
            </div>
          </div>
        )}

        {connectionInfo.quality && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Qualidade:</span>
            <Badge variant="outline" className={getQualityColor()}>
              {connectionInfo.quality === 'excellent' ? 'Excelente' :
               connectionInfo.quality === 'good' ? 'Boa' :
               connectionInfo.quality === 'fair' ? 'Regular' : 'Ruim'}
            </Badge>
          </div>
        )}

        {connectionInfo.lastSeen && connectionInfo.status !== 'connected' && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Última conexão:</span>
            <span className="text-sm text-gray-800">{timeSinceLastSeen}</span>
          </div>
        )}

        {connectionInfo.clientsOnline !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Usuários online:</span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-medium">{connectionInfo.clientsOnline}</span>
            </div>
          </div>
        )}

        {connectionInfo.serverStatus && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Servidor:</span>
            <Badge 
              variant={connectionInfo.serverStatus === 'online' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {connectionInfo.serverStatus === 'online' ? 'Online' :
               connectionInfo.serverStatus === 'maintenance' ? 'Manutenção' : 'Offline'}
            </Badge>
          </div>
        )}
      </div>

      {/* Informações de Erro */}
      {connectionInfo.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Erro de Conexão</p>
              <p className="text-xs text-red-600 mt-1">{connectionInfo.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        {(connectionInfo.status === 'disconnected' || connectionInfo.status === 'error') && onReconnect && (
          <Button 
            size="sm" 
            onClick={() => {
              onReconnect();
              setIsPopoverOpen(false);
            }}
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reconectar
          </Button>
        )}
        
        {onSettings && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              onSettings();
              setIsPopoverOpen(false);
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Footer com horário */}
      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 pt-2 border-t">
        <Clock className="w-3 h-3" />
        <span>Atualizado em {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );

  if (!showPopover) {
    return <StatusBadge />;
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div>
          <StatusBadge />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <DetailedInfo />
      </PopoverContent>
    </Popover>
  );
};

// Hook para gerenciar estado de conexão
export const useConnectionStatus = () => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: 'disconnected',
    latency: undefined,
    lastSeen: undefined,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    error: undefined,
    serverStatus: 'online',
    clientsOnline: 0,
    quality: 'good'
  });

  const updateStatus = (updates: Partial<ConnectionInfo>) => {
    setConnectionInfo(prev => ({ ...prev, ...updates }));
  };

  const setConnected = (latency?: number, quality?: ConnectionInfo['quality']) => {
    updateStatus({
      status: 'connected',
      latency,
      quality,
      lastSeen: new Date(),
      reconnectAttempts: 0,
      error: undefined
    });
  };

  const setDisconnected = (error?: string) => {
    updateStatus({
      status: 'disconnected',
      error,
      latency: undefined
    });
  };

  const setConnecting = () => {
    updateStatus({
      status: 'connecting',
      error: undefined
    });
  };

  const setError = (error: string) => {
    updateStatus({
      status: 'error',
      error,
      latency: undefined
    });
  };

  const incrementReconnectAttempt = () => {
    setConnectionInfo(prev => ({
      ...prev,
      status: 'reconnecting',
      reconnectAttempts: (prev.reconnectAttempts || 0) + 1
    }));
  };

  return {
    connectionInfo,
    updateStatus,
    setConnected,
    setDisconnected,
    setConnecting,
    setError,
    incrementReconnectAttempt
  };
}; 