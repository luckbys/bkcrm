// Indicadores de Status de Mensagem em Tempo Real
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  Send, 
  Check, 
  CheckCheck, 
  Eye, 
  AlertCircle, 
  Loader2,
  MessageSquare
} from 'lucide-react';
import { MessageStatus } from '@/hooks/useMessageStatus';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  timestamp?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  timestamp,
  deliveredAt,
  readAt,
  errorMessage,
  size = 'md',
  showText = false,
  showTimestamp = false,
  className = ''
}) => {
  // Configurações de status
  const statusConfig = {
    sending: {
      icon: Loader2,
      label: 'Enviando',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      badgeVariant: 'secondary' as const,
      animate: true
    },
    sent: {
      icon: Send,
      label: 'Enviado',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      badgeVariant: 'secondary' as const,
      animate: false
    },
    delivered: {
      icon: CheckCheck,
      label: 'Entregue',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      badgeVariant: 'default' as const,
      animate: false
    },
    read: {
      icon: Eye,
      label: 'Lida',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badgeVariant: 'default' as const,
      animate: false
    },
    failed: {
      icon: AlertCircle,
      label: 'Falha',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      badgeVariant: 'destructive' as const,
      animate: false
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Tamanhos dos ícones
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Formatação de timestamps
  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  // Tooltip content
  const getTooltipContent = () => {
    const lines: string[] = [];
    
    lines.push(`Status: ${config.label}`);
    
    if (timestamp) {
      lines.push(`Enviado: ${formatTimestamp(timestamp)}`);
    }
    
    if (deliveredAt) {
      lines.push(`Entregue: ${formatTimestamp(deliveredAt)}`);
    }
    
    if (readAt) {
      lines.push(`Lida: ${formatTimestamp(readAt)}`);
    }
    
    if (status === 'failed' && errorMessage) {
      lines.push(`Erro: ${errorMessage}`);
    }
    
    return lines.join('\n');
  };

  // Renderizar apenas ícone
  const renderIcon = () => (
    <StatusIcon 
      className={`${iconSizes[size]} ${config.color} ${
        config.animate ? 'animate-spin' : ''
      }`}
    />
  );

  // Renderizar badge com texto
  const renderBadge = () => (
    <Badge 
      variant={config.badgeVariant}
      className={`inline-flex items-center gap-1 ${config.bgColor} ${config.color} ${className}`}
    >
      <StatusIcon 
        className={`${iconSizes[size]} ${
          config.animate ? 'animate-spin' : ''
        }`}
      />
      {showText && (
        <span className="text-xs font-medium">
          {config.label}
        </span>
      )}
      {showTimestamp && timestamp && (
        <span className="text-xs opacity-75">
          {formatTimestamp(timestamp)}
        </span>
      )}
    </Badge>
  );

  const content = showText || showTimestamp ? renderBadge() : renderIcon();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center ${className}`}>
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-sm whitespace-pre-line">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Componente para múltiplos status (timeline)
interface MessageStatusTimelineProps {
  status: MessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  className?: string;
}

export const MessageStatusTimeline: React.FC<MessageStatusTimelineProps> = ({
  status,
  sentAt,
  deliveredAt,
  readAt,
  errorMessage,
  className = ''
}) => {
  const steps = [
    {
      key: 'sent',
      icon: Send,
      label: 'Enviado',
      timestamp: sentAt,
      completed: status !== 'sending' && status !== 'failed'
    },
    {
      key: 'delivered',
      icon: CheckCheck,
      label: 'Entregue',
      timestamp: deliveredAt,
      completed: status === 'delivered' || status === 'read'
    },
    {
      key: 'read',
      icon: Eye,
      label: 'Lida',
      timestamp: readAt,
      completed: status === 'read'
    }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = step.completed;
        const isFailed = status === 'failed' && step.key === 'sent';
        
        return (
          <React.Fragment key={step.key}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`
                    flex items-center justify-center w-6 h-6 rounded-full border-2 
                    ${isActive 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isFailed
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                    transition-colors duration-200
                  `}>
                    {isFailed ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <StepIcon className="h-3 w-3" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-medium">{step.label}</div>
                    {step.timestamp && (
                      <div className="text-xs opacity-75">
                        {formatDistanceToNow(step.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    )}
                    {isFailed && errorMessage && (
                      <div className="text-xs text-red-400 mt-1">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {index < steps.length - 1 && (
              <div className={`
                h-0.5 w-4 
                ${isActive ? 'bg-green-500' : 'bg-gray-300'}
                transition-colors duration-200
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Componente compacto para listas
interface MessageStatusCompactProps {
  status: MessageStatus;
  className?: string;
}

export const MessageStatusCompact: React.FC<MessageStatusCompactProps> = ({
  status,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-500" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case 'read':
        return <Eye className="h-3 w-3 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <MessageSquare className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {getStatusIcon()}
    </div>
  );
};

// Componente de estatísticas de status
interface MessageStatusStatsProps {
  stats: {
    total: number;
    sending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  className?: string;
}

export const MessageStatusStats: React.FC<MessageStatusStatsProps> = ({
  stats,
  className = ''
}) => {
  const statItems = [
    { label: 'Total', value: stats.total, color: 'text-gray-600', icon: MessageSquare },
    { label: 'Enviando', value: stats.sending, color: 'text-blue-500', icon: Loader2 },
    { label: 'Enviadas', value: stats.sent, color: 'text-gray-500', icon: Send },
    { label: 'Entregues', value: stats.delivered, color: 'text-green-500', icon: CheckCheck },
    { label: 'Lidas', value: stats.read, color: 'text-blue-600', icon: Eye },
    { label: 'Falhas', value: stats.failed, color: 'text-red-500', icon: AlertCircle }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-6 gap-4 ${className}`}>
      {statItems.map((item) => {
        const ItemIcon = item.icon;
        
        return (
          <div key={item.label} className="text-center">
            <div className={`flex items-center justify-center mb-1 ${item.color}`}>
              <ItemIcon className="h-4 w-4 mr-1" />
              <span className="text-lg font-semibold">{item.value}</span>
            </div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}; 