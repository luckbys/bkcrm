import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { Badge } from '../../ui/badge';
import { 
  CheckCircle, 
  Tag, 
  UserCheck, 
  User, 
  RefreshCw, 
  Loader2,
  Clock,
  AlertTriangle,
  Bookmark,
  Share,
  Archive,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';

interface TicketChatSidebarActionsProps {
  chatState: UseTicketChatReturn;
  onQuickFinish: () => Promise<void>;
  isLoadingAction: boolean;
  actionType: string | null;
}

export const TicketChatSidebarActions: React.FC<TicketChatSidebarActionsProps> = ({
  chatState,
  onQuickFinish,
  isLoadingAction,
  actionType
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);
  
  const {
    currentTicket,
    setShowStatusModal,
    setShowAssignModal,
    setShowCustomerModal,
    setShowTagModal
  } = chatState;

  // Ações principais (sempre visíveis)
  const primaryActions = [
    {
      id: 'finish',
      label: 'Finalizar Ticket',
      icon: CheckCircle,
      onClick: onQuickFinish,
      className: 'from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100',
      disabled: currentTicket?.status === 'finalizado' || currentTicket?.status === 'closed',
      tooltip: 'Finalizar este ticket rapidamente',
      priority: 'high' as const
    },
    {
      id: 'status',
      label: 'Alterar Status',
      icon: Tag,
      onClick: () => setShowStatusModal(true),
      className: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100',
      tooltip: 'Alterar o status do ticket'
    },
    {
      id: 'assign',
      label: 'Atribuir Agente',
      icon: UserCheck,
      onClick: () => setShowAssignModal(true),
      className: 'from-purple-50 to-violet-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-violet-100',
      tooltip: 'Atribuir este ticket a um agente'
    },
    {
      id: 'customer',
      label: 'Atribuir Cliente',
      icon: User,
      onClick: () => setShowCustomerModal(true),
      className: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-orange-100',
      tooltip: 'Atribuir ou alterar cliente do ticket'
    }
  ];

  // Ações secundárias (opcionais)
  const secondaryActions = [
    {
      id: 'transfer',
      label: 'Transferir',
      icon: RefreshCw,
      onClick: () => setShowTagModal(true),
      className: 'from-teal-50 to-cyan-50 border-teal-200 text-teal-700 hover:from-teal-100 hover:to-cyan-100',
      tooltip: 'Transferir ticket para outro departamento'
    },
    {
      id: 'bookmark',
      label: 'Favoritar',
      icon: Bookmark,
      onClick: () => console.log('Bookmark ticket'),
      className: 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700 hover:from-yellow-100 hover:to-amber-100',
      tooltip: 'Marcar ticket como favorito'
    },
    {
      id: 'share',
      label: 'Compartilhar',
      icon: Share,
      onClick: () => navigator.clipboard.writeText(window.location.href),
      className: 'from-gray-50 to-slate-50 border-gray-200 text-gray-700 hover:from-gray-100 hover:to-slate-100',
      tooltip: 'Copiar link do ticket'
    },
    {
      id: 'archive',
      label: 'Arquivar',
      icon: Archive,
      onClick: () => console.log('Archive ticket'),
      className: 'from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100',
      tooltip: 'Arquivar este ticket'
    }
  ];

  // Ações de contato (se for WhatsApp)
  const contactActions = currentTicket?.isWhatsApp ? [
    {
      id: 'call',
      label: 'Ligar',
      icon: Phone,
      onClick: () => window.open(`tel:${currentTicket?.customerPhone}`, '_self'),
      className: 'from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100',
      tooltip: `Ligar para ${currentTicket?.customerPhone}`,
      disabled: !currentTicket?.customerPhone
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Web',
      icon: MessageSquare,
      onClick: () => window.open(`https://wa.me/${currentTicket?.customerPhone?.replace(/\D/g, '')}`, '_blank'),
      className: 'from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100',
      tooltip: 'Abrir no WhatsApp Web',
      disabled: !currentTicket?.customerPhone
    }
  ] : [];

  const renderActionButton = (action: any, size: 'default' | 'sm' = 'sm') => (
    <Tooltip key={action.id}>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size={size}
          onClick={action.onClick}
          disabled={action.disabled || (isLoadingAction && actionType === action.id)}
          className={cn(
            "w-full justify-start transition-all duration-200",
            size === 'default' ? "h-12" : "h-10",
            action.className,
            action.priority === 'high' && "ring-2 ring-green-200 font-semibold"
          )}
        >
          {isLoadingAction && actionType === action.id ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <action.icon className="w-4 h-4 mr-2" />
          )}
          {isLoadingAction && actionType === action.id 
            ? `${action.label.split(' ')[0]}ando...` 
            : action.label
          }
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{action.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-3">
      {/* Status do Ticket */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            currentTicket?.status === 'open' && "bg-green-400 animate-pulse",
            currentTicket?.status === 'atendimento' && "bg-blue-400 animate-pulse",
            currentTicket?.status === 'finalizado' && "bg-gray-400",
            currentTicket?.status === 'closed' && "bg-gray-400"
          )}></div>
          <span className="text-sm font-medium text-gray-700">
            Status Atual
          </span>
        </div>
        <Badge variant={currentTicket?.status === 'open' ? 'default' : 'secondary'}>
          {currentTicket?.status || 'Indefinido'}
        </Badge>
      </div>

      {/* Ações Principais */}
      <div className="space-y-2">
        {primaryActions.map(action => renderActionButton(action, 'default'))}
      </div>

      {/* Ações de Contato (WhatsApp) */}
      {contactActions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
            <MessageSquare className="w-3 h-3" />
            <span>Contato Direto</span>
          </div>
          {contactActions.map(action => renderActionButton(action))}
        </div>
      )}

      {/* Toggle para Mais Ações */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMoreActions(!showMoreActions)}
        className="w-full justify-center text-xs text-gray-500 hover:text-gray-700 border-dashed border border-gray-300 hover:border-gray-400"
      >
        <Zap className="w-3 h-3 mr-1" />
        {showMoreActions ? 'Menos Ações' : 'Mais Ações'}
      </Button>

      {/* Ações Secundárias (Colapsável) */}
      {showMoreActions && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
            <RefreshCw className="w-3 h-3" />
            <span>Ações Avançadas</span>
          </div>
          {secondaryActions.map(action => renderActionButton(action))}
        </div>
      )}

      {/* Aviso para Tickets Finalizados */}
      {(currentTicket?.status === 'finalizado' || currentTicket?.status === 'closed') && (
        <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Este ticket está finalizado</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Algumas ações podem não estar disponíveis
          </p>
        </div>
      )}
    </div>
  );
}; 