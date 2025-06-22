// 🔗 COMPONENTE DE STATUS DE CONEXÃO WEBSOCKET
import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError?: string | null;
  lastActivity?: Date | null;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionError,
  lastActivity,
  className
}) => {
  const getStatusConfig = () => {
    if (connectionError) {
      return {
        icon: AlertTriangle,
        text: 'Erro de Conexão',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        detail: connectionError
      };
    }

    if (isConnected) {
      return {
        icon: Wifi,
        text: 'Conectado',
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        detail: 'Tempo real ativo'
      };
    }

    return {
      icon: Loader2,
      text: 'Conectando...',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      detail: 'Tentando reconectar'
    };
  };

  const { icon: Icon, text, color, bgColor, borderColor, detail } = getStatusConfig();

  const formatLastActivity = () => {
    if (!lastActivity) return null;
    
    const now = new Date();
    const diff = now.getTime() - lastActivity.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes === 1) return '1 minuto atrás';
    if (minutes < 60) return `${minutes} minutos atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hora atrás';
    if (hours < 24) return `${hours} horas atrás`;
    
    return lastActivity.toLocaleDateString('pt-BR');
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
      bgColor,
      borderColor,
      className
    )}>
      <Icon 
        className={cn(
          "w-4 h-4",
          color,
          !isConnected && !connectionError && "animate-spin"
        )} 
      />
      
      <div className="flex flex-col">
        <span className={cn("text-sm font-medium", color)}>
          {text}
        </span>
        {detail && (
          <span className="text-xs text-gray-500">
            {detail}
          </span>
        )}
        {lastActivity && isConnected && (
          <span className="text-xs text-gray-400">
            Última atividade: {formatLastActivity()}
          </span>
        )}
      </div>
    </div>
  );
}; 