import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface RealtimeConnectionIndicatorProps {
  isConnected: boolean;
  lastUpdateTime: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  onRefresh?: () => void;
  className?: string;
}

export const RealtimeConnectionIndicator: React.FC<RealtimeConnectionIndicatorProps> = ({
  isConnected,
  lastUpdateTime,
  connectionStatus,
  onRefresh,
  className
}) => {
  // 🎨 CONFIGURAÇÕES DE STATUS SIMPLIFICADAS
  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Conectado',
      animate: false
    },
    connecting: {
      icon: RotateCcw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Conectando',
      animate: true
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Erro',
      animate: false
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Desconectado',
      animate: false
    }
  };

  const config = statusConfig[connectionStatus];
  const IconComponent = config.icon;

  // ⏰ FORMATAÇÃO DE TEMPO SIMPLES
  const formatTime = (date: Date | null): string => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-200",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <IconComponent 
        className={cn(
          "w-4 h-4",
          config.color,
          config.animate && "animate-spin"
        )} 
      />
      
      <div className="flex items-center gap-2">
        <span className={cn("font-medium", config.color)}>
          {config.label}
        </span>
        
        {lastUpdateTime && (
          <span className="text-gray-500 text-xs">
            • {formatTime(lastUpdateTime)}
          </span>
        )}
      </div>

      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-6 w-6 p-0 hover:bg-white/50"
          title="Tentar reconectar"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}; 