import React from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { 
  MessageSquare,
  User,
  Mail,
  Phone,
  Copy,
  FileText,
  Clock,
  UserCheck,
  Tag,
  Building,
  Eye,
  Zap,
  Settings,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';
import { ChatAnimations, ResponsiveAnimations } from './chatAnimations';

interface TicketChatSidebarProps {
  showSidebar: boolean;
  chatState: UseTicketChatReturn;
}

export const TicketChatSidebar: React.FC<TicketChatSidebarProps> = ({
  showSidebar,
  chatState
}) => {
  const {
    currentTicket,
    realTimeMessages,
    favoriteMessages,
    whatsappStatus,
    soundEnabled,
    compactMode,
    showAssignModal,
    setShowAssignModal,
    showStatusModal,
    setShowStatusModal,
    showTagModal,
    setShowTagModal,
    showCustomerModal,
    setShowCustomerModal,
    toggleSidebar,
    setSoundEnabled,
    setCompactMode
  } = chatState;

  // Calcular contadores de mensagens
  const messageCounts = {
    total: realTimeMessages.length,
    public: realTimeMessages.filter(m => !m.isInternal).length,
    internal: realTimeMessages.filter(m => m.isInternal).length
  };

  // Simular função de verificação de status
  const checkWhatsAppStatus = () => {
    console.log('Verificando status do WhatsApp...');
  };

  // Simular última atividade
  const lastActivity = currentTicket?.lastActivity || 'Nunca';

  // Funções de modal - usar as disponíveis no chatState
  const openChangeStatusModal = () => {
    setShowStatusModal(true);
  };

  const openAssignAgentModal = () => {
    setShowAssignModal(true);
  };

  const openTransferModal = () => {
    setShowTagModal(true);
  };

  const openCustomerModal = () => {
    setShowCustomerModal(true);
  };

  if (!showSidebar) {
    return null;
  }

  return (
    <div className={cn(
      "bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden",
      ChatAnimations.chat.sidebarToggle,
      ResponsiveAnimations.prefersReducedMotion.disable,
      "w-72 sm:w-80 md:w-80 lg:w-96 xl:w-[400px] max-w-[30vw]"
    )}>
      {/* Header do Sidebar */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Informações do Ticket
        </h3>
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Informações do Cliente */}
        <Card className={cn(
          "border border-gray-200 shadow-sm",
          ChatAnimations.transition.hoverGlow
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{currentTicket?.client || 'Cliente Anônimo'}</p>
                {currentTicket?.isWhatsApp && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                    WhatsApp
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">ID: #{currentTicket?.id || currentTicket?.customerId || 'N/A'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600 flex-1">{currentTicket?.customerEmail || 'Email não informado'}</span>
                {currentTicket?.customerEmail && currentTicket.customerEmail !== 'Email não informado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "ml-auto h-6 w-6 p-0 text-gray-400 hover:text-gray-600",
                      ChatAnimations.interactive.icon
                    )}
                    onClick={() => navigator.clipboard.writeText(currentTicket?.customerEmail || '')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span className={cn(
                  "text-gray-600 flex-1",
                  currentTicket?.customerPhone && currentTicket.customerPhone !== 'Telefone não informado' 
                    ? "font-medium text-blue-600" 
                    : ""
                )}>{currentTicket?.customerPhone || 'Telefone não informado'}</span>
                {currentTicket?.customerPhone && currentTicket.customerPhone !== 'Telefone não informado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "ml-auto h-6 w-6 p-0 text-gray-400 hover:text-gray-600",
                      ChatAnimations.interactive.icon
                    )}
                    onClick={() => navigator.clipboard.writeText(currentTicket?.customerPhone || '')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Ticket */}
        <Card className={cn(
          "border border-gray-200 shadow-sm",
          ChatAnimations.transition.hoverGlow
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div>
              <p className="font-medium text-gray-900">{currentTicket?.subject || 'Assunto não definido'}</p>
              <p className="text-sm text-gray-500 mt-1">{currentTicket?.description || 'Descrição não informada'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                <Badge 
                  variant={currentTicket?.status === 'open' ? 'default' : 'secondary'}
                  className={cn(
                    "mt-1 block w-fit",
                    ChatAnimations.transition.colors
                  )}
                >
                  {currentTicket?.status || 'Indefinido'}
                </Badge>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</label>
                <Badge 
                  variant={currentTicket?.priority === 'high' ? 'destructive' : 'outline'}
                  className={cn(
                    "mt-1 block w-fit",
                    ChatAnimations.transition.colors
                  )}
                >
                  {currentTicket?.priority || 'Normal'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  Criado em {currentTicket?.createdAt ? new Date(currentTicket.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <UserCheck className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Agente: {currentTicket?.assignedAgent || 'Não atribuído'}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Building className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Departamento: {currentTicket?.department || 'Geral'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Status */}
        <Card className={cn(
          "border border-gray-200 shadow-sm",
          ChatAnimations.transition.hoverGlow
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {whatsappStatus === 'connected' ? (
                  <Wifi className={cn(
                    "w-4 h-4 text-green-500",
                    ChatAnimations.indicators.online
                  )} />
                ) : (
                  <WifiOff className={cn(
                    "w-4 h-4 text-red-500",
                    ChatAnimations.indicators.offline
                  )} />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  whatsappStatus === 'connected' ? "text-green-600" : "text-red-600"
                )}>
                  {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 text-gray-400 hover:text-blue-600",
                  ChatAnimations.interactive.icon
                )}
                onClick={checkWhatsAppStatus}
                title="Atualizar status"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              <p>Instância: {currentTicket?.whatsappInstance || 'Não definida'}</p>
              <p>Última atividade: {lastActivity || 'Nunca'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className={cn(
          "border border-gray-200 shadow-sm",
          ChatAnimations.transition.hoverGlow
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openChangeStatusModal()}
              className={cn(
                "w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-300",
                ChatAnimations.transition.colors
              )}
            >
              <Tag className="w-4 h-4 mr-2" />
              Alterar Status
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAssignAgentModal()}
              className={cn(
                "w-full justify-start h-12 hover:bg-green-50 hover:border-green-300",
                ChatAnimations.transition.colors
              )}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Atribuir Agente
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCustomerModal()}
              className={cn(
                "w-full justify-start h-12 hover:bg-orange-50 hover:border-orange-300",
                ChatAnimations.transition.colors
              )}
            >
              <User className="w-4 h-4 mr-2" />
              Atribuir Cliente
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openTransferModal()}
              className={cn(
                "w-full justify-start h-12 hover:bg-purple-50 hover:border-purple-300",
                ChatAnimations.transition.colors
              )}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Transferir Ticket
            </Button>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card className={cn(
          "border border-gray-200 shadow-sm",
          ChatAnimations.transition.hoverGlow
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{messageCounts.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{messageCounts.public}</p>
                <p className="text-xs text-gray-500">Públicas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">{messageCounts.internal}</p>
                <p className="text-xs text-gray-500">Internas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{favoriteMessages.size}</p>
                <p className="text-xs text-gray-500">Favoritas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 