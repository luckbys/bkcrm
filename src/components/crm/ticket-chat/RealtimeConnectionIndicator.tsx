import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RealtimeConnectionIndicatorProps {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastUpdateTime: Date | null;
  messageCount: number;
  onRefresh?: () => void;
}

export const RealtimeConnectionIndicator: React.FC<RealtimeConnectionIndicatorProps> = ({
  isConnected,
  connectionStatus,
  lastUpdateTime,
  messageCount,
  onRefresh
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Conectado',
          pulse: false
        };
      case 'connecting':
        return {
          icon: RotateCcw,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Conectando...',
          pulse: true
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Erro de conexão',
          pulse: false
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Desconectado',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastUpdate = () => {
    if (!lastUpdateTime) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdateTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return lastUpdateTime.toLocaleDateString();
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200",
      config.bg,
      config.border,
      config.color
    )}>
      <Icon className={cn(
        "w-4 h-4",
        config.pulse && "animate-spin"
      )} />
      
      <div className="flex flex-col gap-0.5">
        <span className="leading-none">{config.label}</span>
        <div className="flex items-center gap-3 text-xs opacity-70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatLastUpdate()}
          </span>
          <span>{messageCount} msgs</span>
        </div>
      </div>

      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-2 p-1 rounded hover:bg-white/50 transition-colors"
          title="Tentar reconectar"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}; 