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
    whatsappStatus,
    whatsappInstance,
    setShowAssignModal,
    setShowStatusModal,
    setShowTagModal
  } = chatState;

  if (!showSidebar) return null;

  return (
    <div className={cn(
      "bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden transition-all duration-300",
      "w-72 sm:w-80 md:w-80 lg:w-96 xl:w-[400px]",
      "flex-shrink-0 max-w-[30vw]"
    )}>
      <div className="p-6 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
          Detalhes do Ticket
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Client Info Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{currentTicket?.client || 'Nome não informado'}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 truncate">{currentTicket?.customer_email || currentTicket?.client_email || 'Email não informado'}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{currentTicket?.client_phone || currentTicket?.metadata?.client_phone || '(11) 99999-9999'}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Detalhes do Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Canal</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{currentTicket?.channel || 'chat'}</span>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Depto</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{currentTicket?.department || 'Geral'}</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Criado em</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {currentTicket?.created_at ? new Date(currentTicket.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Data não disponível'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Responsável</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {currentTicket?.assignee || 'Não atribuído'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Prioridade</span>
              </div>
              <Badge className={cn(
                "text-xs px-2 py-1",
                currentTicket?.priority === 'alta' ? "bg-red-100 text-red-800 border-red-200" :
                currentTicket?.priority === 'baixa' ? "bg-green-100 text-green-800 border-green-200" :
                "bg-blue-100 text-blue-800 border-blue-200"
              )}>
                {currentTicket?.priority || 'normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Status Card */}
        {whatsappInstance && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <Smartphone className="w-4 h-4 mr-2 text-green-600" />
                Status WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {whatsappStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Instância:</span>
                </div>
                <span className="text-sm text-gray-600">{whatsappInstance}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <Badge 
                  className={cn(
                    "text-xs",
                    whatsappStatus === 'connected' 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                  )}
                >
                  {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
              <Eye className="w-4 h-4 mr-2 text-blue-600" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{realTimeMessages.length}</div>
                <div className="text-xs text-blue-600 font-medium">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{realTimeMessages.filter(m => !m.isInternal).length}</div>
                <div className="text-xs text-green-600 font-medium">Públicas</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{realTimeMessages.filter(m => m.isInternal).length}</div>
                <div className="text-xs text-orange-600 font-medium">Internas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                Ações Rápidas
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-300 transition-all"
              onClick={() => setShowStatusModal(true)}
            >
              <Settings className="w-4 h-4 mr-3" />
              Alterar Status
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 hover:bg-green-50 hover:border-green-300 transition-all"
              onClick={() => setShowAssignModal(true)}
            >
              <UserCheck className="w-4 h-4 mr-3" />
              Atribuir Agente
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 hover:bg-purple-50 hover:border-purple-300 transition-all"
              onClick={() => setShowTagModal(true)}
            >
              <Tag className="w-4 h-4 mr-3" />
              Adicionar Tag
            </Button>
          </CardContent>
        </Card>

        {/* Tags Card */}
        {currentTicket?.tags && currentTicket.tags.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <Tag className="w-4 h-4 mr-2 text-purple-600" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentTicket.tags.map((tag: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}; 