import React from 'react';
import { X, FileText, Search, Wifi, WifiOff, Settings, Volume2, VolumeX, Minimize2, Maximize2, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';
import { ChatAnimations, ResponsiveAnimations } from './chatAnimations';
import { useTicketsDB } from '../../../hooks/useTicketsDB';
import { useToast } from '../../../hooks/use-toast';
import { supabase } from '../../../lib/supabase';
import { RealtimeConnectionIndicator } from './RealtimeConnectionIndicator';

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
  const { toast } = useToast();
  const { updateTicket, refreshTickets, finalizeTicket } = useTicketsDB();
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
    realTimeMessages,
    setCurrentTicket
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

  // Função para finalizar ticket rapidamente
  const handleQuickFinishTicket = async () => {
    if (!currentTicket) return;

    const confirmMessage = `Tem certeza que deseja finalizar o ticket "${currentTicket.subject || currentTicket.title}"?\n\nEsta ação irá:\n• Marcar o ticket como "Finalizado"\n• Fechar a conversa\n• Atualizar os contadores automaticamente`;

    if (!window.confirm(confirmMessage)) return;

    try {
      console.log('🎯 Finalizando ticket:', {
        ticketId: currentTicket?.originalId || currentTicket?.id,
        currentStatus: currentTicket.status
      });

      // Atualizar estado local imediatamente
      setCurrentTicket((prev: any) => ({
        ...prev,
        status: 'closed',
        updated_at: new Date().toISOString()
      }));

      // Tentar finalizar no banco usando a nova função específica
      const ticketId = currentTicket?.originalId || currentTicket?.id;
      let persistenceSuccess = false;
      
      if (ticketId) {
        try {
          console.log('💾 Usando finalizeTicket...');
          
          // Usar a função finalizeTicket diretamente
          await finalizeTicket(ticketId);
          persistenceSuccess = true;
          console.log('✅ Ticket finalizado via finalizeTicket!');
          
        } catch (error) {
          console.log('❌ finalizeTicket falhou, tentando RPC direto:', error);
          
          try {
            // Fallback: usar RPC diretamente
            console.log('🔄 Fallback: usando RPC diretamente...');
            const { data: rpcResult, error: sqlError } = await supabase.rpc('finalize_ticket', {
              ticket_id: ticketId
            });
            
            if (!sqlError && rpcResult?.success) {
              persistenceSuccess = true;
              console.log('✅ Sucesso via RPC direto!', rpcResult);
            } else {
              console.log('❌ RPC direto falhou:', sqlError || rpcResult);
              
              // Último fallback: UPDATE simples
              console.log('🔄 Último fallback: UPDATE simples...');
              await updateTicket(ticketId, {
                status: 'closed',
                updated_at: new Date().toISOString(),
                closed_at: new Date().toISOString()
              });
              persistenceSuccess = true;
              console.log('✅ Sucesso via UPDATE simples!');
            }
          } catch (fallbackError) {
            console.log('❌ Todas as estratégias falharam:', fallbackError);
            persistenceSuccess = false;
          }
        }
        
        // Se conseguiu salvar no banco, atualizar contadores
        if (persistenceSuccess) {
          try {
            console.log('🔄 Recarregando tickets do banco...');
            await refreshTickets();
            console.log('✅ Contadores atualizados - Tickets recarregados do banco');
          } catch (error) {
            console.log('⚠️ Erro ao atualizar contadores:', error);
          }
        } else {
          console.log('⚠️ Não foi possível salvar no banco - mantendo apenas estado local');
        }
      }

      // Mostrar mensagem de sucesso
      const ticketTitle = currentTicket.subject || currentTicket.title || 'Ticket';
      
      if (persistenceSuccess) {
        toast({
          title: "🎉 Ticket Finalizado!",
          description: `"${ticketTitle}" foi finalizado com sucesso e os contadores foram atualizados.`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        
        // Fechar o modal após 2 segundos
        if (onClose) {
          setTimeout(() => {
            console.log('🔄 Fechando modal automaticamente...');
            onClose();
          }, 2000);
        }
      } else {
        toast({
          title: "⚠️ Ticket Finalizado (Apenas Local)",
          description: `"${ticketTitle}" foi finalizado localmente. O status será sincronizado quando possível.`,
          variant: "default",
          className: "bg-yellow-50 border-yellow-200 text-yellow-800"
        });
      }

    } catch (error) {
      console.error('❌ Erro ao finalizar ticket:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível finalizar o ticket. Tente novamente.",
        variant: "destructive"
      });
      
      // Reverter estado local em caso de erro completo
      setCurrentTicket((prev: any) => ({
        ...prev,
        status: currentTicket.status,
        updated_at: currentTicket.updated_at
      }));
    }
  };

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
      {/* Header Principal */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="relative">
              <Avatar className={cn(
                "w-12 h-12 ring-2 ring-blue-200 shadow-md",
                ChatAnimations.transition.scale
              )}>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                  {currentTicket?.client?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              {/* Indicador de conexão WhatsApp - Animação mais sutil */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4">
                {whatsappStatus === 'connected' ? (
                  <Wifi className={cn(
                    "w-4 h-4 text-green-500 bg-white rounded-full p-0.5 shadow-sm",
                    ChatAnimations.indicators.online
                  )} />
                ) : (
                  <WifiOff className={cn(
                    "w-4 h-4 text-red-500 bg-white rounded-full p-0.5 shadow-sm",
                    ChatAnimations.indicators.offline
                  )} />
                )}
              </div>
            </div>
            
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate flex items-center">
                {currentTicket?.client || 'Cliente'}
                {currentTicket?.isWhatsApp && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    📱 WhatsApp
                  </span>
                )}
                {userTyping && (
                  <span className={cn(
                    "ml-2 text-sm text-green-600",
                    ChatAnimations.indicators.typing
                  )}>digitando...</span>
                )}
              </h2>
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-mono">
                  #{currentTicket?.id || 'N/A'}
                </span>
                {currentTicket?.customerPhone && currentTicket.customerPhone !== 'Telefone não informado' && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">
                      {currentTicket.customerPhone}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="truncate">{currentTicket?.subject || currentTicket?.title || 'Assunto não definido'}</span>
              </div>
            </div>
          </div>
          
          {/* Status indicator com animação suave */}
          <div className="flex items-center space-x-3">
            <Badge 
              variant={currentTicket?.status === 'open' ? 'default' : 'secondary'}
              className={cn(
                "flex items-center gap-1 px-3 py-1 text-xs font-medium",
                ChatAnimations.transition.colors
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full bg-current mr-2",
                currentTicket?.status === 'open' 
                  ? ChatAnimations.indicators.online 
                  : ChatAnimations.indicators.offline
              )}></div>
              {currentTicket?.status || 'Indefinido'}
            </Badge>
            
            {/* Botão de Finalizar Ticket - Destaque */}
            {(currentTicket?.status === 'open' || currentTicket?.status === 'in_progress' || currentTicket?.status === 'atendimento') && (
              <Button
                variant="default"
                size="sm"
                onClick={handleQuickFinishTicket}
                className={cn(
                  "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700",
                  "flex items-center gap-2 px-3 py-1.5 text-xs font-medium",
                  ChatAnimations.transition.colors,
                  ChatAnimations.transition.scale
                )}
                title="Finalizar ticket rapidamente"
              >
                <CheckCircle className="w-4 h-4" />
                Finalizar
              </Button>
            )}
            
            {/* Controles UX - Animações suaves */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className={cn(
                "text-gray-400 hover:text-blue-600 hover:bg-blue-50",
                ChatAnimations.transition.colors
              )}
              title="Minimizar chat"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn(
                "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                ChatAnimations.transition.colors
              )}
              title="Fechar chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar com animações suaves */}
      <div className="px-6 pb-4 flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Pesquisar mensagens..."
            value={messageSearchTerm}
            onChange={(e) => setMessageSearchTerm(e.target.value)}
            className={cn(
              "pl-10 h-9",
              ChatAnimations.chat.inputFocus,
              showSidebar 
                ? "w-48 lg:w-56" 
                : "w-64 lg:w-80"
            )}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessageSearchTerm('')}
            className={cn(
              "absolute right-1 top-1/2 transform -translate-y-1/2 w-7 h-7 p-0 text-gray-400 hover:text-gray-600",
              ChatAnimations.transition.opacity
            )}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Realtime Connection Indicator */}
        <RealtimeConnectionIndicator
          isConnected={chatState.isRealtimeConnected}
          connectionStatus={chatState.connectionStatus}
          lastUpdateTime={chatState.lastUpdateTime}
          messageCount={messageCounts.total}
          onRefresh={chatState.refreshMessages}
        />

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Select value={messageFilter} onValueChange={setMessageFilter}>
            <SelectTrigger className={cn(
              "w-36 h-9 text-xs",
              ChatAnimations.transition.colors
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="public">Públicas</SelectItem>
              <SelectItem value="internal">Internas</SelectItem>
            </SelectContent>
          </Select>

          {/* Sound control */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "w-8 h-8",
              ChatAnimations.transition.colors,
              soundEnabled 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-400 hover:text-gray-600"
            )}
            title={soundEnabled ? "Desativar sons" : "Ativar sons"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50",
              ChatAnimations.transition.colors
            )}
            title="Configurações do chat"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* Toggle sidebar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-8 h-8",
              ChatAnimations.transition.colors,
              showSidebar 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            )}
            title={showSidebar ? "Ocultar sidebar" : "Mostrar sidebar"}
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 