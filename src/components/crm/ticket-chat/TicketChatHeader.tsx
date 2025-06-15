import React from 'react';
import { X, FileText, Search, Wifi, WifiOff, Settings, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';

interface TicketChatHeaderProps {
  currentTicket: any;
  userTyping: boolean;
  showSidebar: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  chatState: UseTicketChatReturn;
}

export const TicketChatHeader: React.FC<TicketChatHeaderProps> = ({
  currentTicket,
  userTyping,
  showSidebar,
  onClose,
  onMinimize,
  chatState
}) => {
  const {
    messageSearchTerm,
    setMessageSearchTerm,
    messageFilter,
    setMessageFilter,
    soundEnabled,
    setSoundEnabled,
    compactMode,
    setCompactMode,
    autoScrollEnabled,
    setAutoScrollEnabled,
    whatsappStatus,
    toggleSidebar,
    toggleMinimize,
    realTimeMessages
  } = chatState;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'atendimento': 'bg-blue-100 text-blue-800 border-blue-300',
      'finalizado': 'bg-green-100 text-green-800 border-green-300',
      'cancelado': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'bg-red-100 text-red-800 border-red-300',
      'normal': 'bg-blue-100 text-blue-800 border-blue-300',
      'baixa': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Contadores de mensagens
  const messageCounts = {
    total: realTimeMessages.length,
    public: realTimeMessages.filter(m => !m.isInternal).length,
    internal: realTimeMessages.filter(m => m.isInternal).length
  };

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
      {/* Header Principal */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-blue-200 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                  {currentTicket?.client?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              {/* Indicador de conexão WhatsApp */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4">
                {whatsappStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5 shadow-sm" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500 bg-white rounded-full p-0.5 shadow-sm" />
                )}
              </div>
            </div>
            
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate flex items-center">
                {currentTicket?.client || 'Cliente'}
                {userTyping && (
                  <span className="ml-2 text-sm text-green-600 animate-pulse">digitando...</span>
                )}
              </h2>
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-mono">
                  #{currentTicket?.id || 'N/A'}
                </span>
                <span>•</span>
                <span className="truncate">{currentTicket?.subject || 'Assunto não definido'}</span>
              </div>
            </div>
          </div>
          
          {/* Badges de Status e Prioridade */}
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <Badge className={cn("text-xs px-3 py-1.5 font-bold border shadow-sm", getStatusColor(currentTicket?.status || 'pendente'))}>
                <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
                {currentTicket?.status || 'pendente'}
              </Badge>
              <Badge className={cn("text-xs px-3 py-1.5 font-bold border shadow-sm", getPriorityColor(currentTicket?.priority || 'normal'))}>
                {currentTicket?.priority || 'normal'}
              </Badge>
            </div>
            
            {/* Controles de ação */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <FileText className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="px-6 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Pesquisa */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar mensagens..."
                value={messageSearchTerm}
                onChange={(e) => setMessageSearchTerm(e.target.value)}
                className={cn(
                  "pl-10 h-9 transition-all",
                  showSidebar ? "w-48 lg:w-56" : "w-64 lg:w-80"
                )}
              />
              {messageSearchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMessageSearchTerm('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-7 h-7 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Filtro de Mensagens */}
            <Select value={messageFilter} onValueChange={(value: any) => setMessageFilter(value)}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas ({messageCounts.total})
                </SelectItem>
                <SelectItem value="public">
                  Públicas ({messageCounts.public})
                </SelectItem>
                <SelectItem value="internal">
                  Internas ({messageCounts.internal})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controles UX */}
          <div className="flex items-center space-x-2">
            {/* Som */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "w-8 h-8 transition-all",
                soundEnabled ? "text-blue-600 bg-blue-50" : "text-gray-400"
              )}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            {/* Minimizar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (onMinimize) {
                  onMinimize();
                } else {
                  toggleMinimize();
                }
              }}
              className="w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Minimizar chat"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>

            {/* Auto-scroll */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
              className={cn(
                "w-8 h-8 transition-all",
                autoScrollEnabled ? "text-blue-600 bg-blue-50" : "text-gray-400"
              )}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            {/* Configurações */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 