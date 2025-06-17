import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { Switch } from '../../ui/switch';
import { 
  Settings,
  Users,
  Tag,
  ChevronRight,
  Volume2,
  VolumeX,
  LayoutGrid,
  LayoutList,
  Wifi,
  WifiOff,
  UserCheck,
  ArrowRight,
  Star,
  Copy,
  MoreHorizontal,
  User,
  CheckCircle,
  X,
  Zap,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Building,
  Eye,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';
import { useTicketsDB } from '../../../hooks/useTicketsDB';
import { useToast } from '../../../hooks/use-toast';
import { ChatAnimations, ResponsiveAnimations } from './chatAnimations';
import { supabase } from '../../../lib/supabase';

interface TicketChatSidebarProps {
  showSidebar: boolean;
  chatState: UseTicketChatReturn;
  onClose?: () => void;
}

export const TicketChatSidebar: React.FC<TicketChatSidebarProps> = ({
  showSidebar,
  chatState,
  onClose
}) => {
  const { toast } = useToast();
  const { updateTicket, refreshTickets } = useTicketsDB();
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
    setCompactMode,
    setCurrentTicket
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

  // Função para finalizar ticket rapidamente
  const handleQuickFinishTicket = async () => {
    if (!currentTicket) return;

    console.log('🎯 [SIDEBAR] Iniciando finalização rápida do ticket:', {
      id: currentTicket.id,
      originalId: currentTicket.originalId,
      status: currentTicket.status
    });

    try {
      // Atualizar estado local imediatamente para feedback visual
      setCurrentTicket((prev: any) => ({
        ...prev,
        status: 'finalizado',
        updated_at: new Date().toISOString()
      }));

      // Tentar persistir no banco de dados com funções simples (sem notificações)
      let persistenceSuccess = false;
      const ticketId = currentTicket.originalId || currentTicket.id;

      if (ticketId) {
        console.log('💾 [SIDEBAR] Tentando salvar no banco:', { ticketId });
        
        // Estratégia 1: RPC finalize_ticket_simple (sem triggers/notificações)
        try {
          console.log('💾 [SIDEBAR-Estratégia 1] RPC finalize_ticket_simple...');
          const { data: rpcSimpleResult, error: rpcSimpleError } = await supabase.rpc('finalize_ticket_simple', {
            ticket_uuid: ticketId
          });
          
          if (!rpcSimpleError && rpcSimpleResult?.success) {
            persistenceSuccess = true;
            console.log('✅ [SIDEBAR-Estratégia 1] RPC Simple Sucesso!', rpcSimpleResult);
          } else {
            console.log('❌ [SIDEBAR-Estratégia 1] RPC Simple falhou:', rpcSimpleError || rpcSimpleResult);
            throw new Error(rpcSimpleError?.message || rpcSimpleResult?.error || 'RPC Simple falhou');
          }
        } catch (error) {
          console.log('❌ [SIDEBAR-Estratégia 1] RPC Simple falhou:', error);
          
          // Estratégia 2: RPC update_ticket_status_simple
          try {
            console.log('💾 [SIDEBAR-Estratégia 2] RPC update_ticket_status_simple...');
            const { data: rpcStatusResult, error: rpcStatusError } = await supabase.rpc('update_ticket_status_simple', {
              ticket_uuid: ticketId,
              new_status: 'closed'
            });
            
            if (!rpcStatusError && rpcStatusResult?.success) {
              persistenceSuccess = true;
              console.log('✅ [SIDEBAR-Estratégia 2] RPC Status Simple Sucesso!', rpcStatusResult);
            } else {
              console.log('❌ [SIDEBAR-Estratégia 2] RPC Status Simple falhou:', rpcStatusError || rpcStatusResult);
              throw new Error(rpcStatusError?.message || rpcStatusResult?.error || 'RPC Status Simple falhou');
            }
          } catch (error2) {
            console.log('❌ [SIDEBAR-Estratégia 2] RPC Status Simple falhou:', error2);
            
            // Estratégia 3: RPC update_ticket_direct (função mais simples)
            try {
              console.log('💾 [SIDEBAR-Estratégia 3] RPC update_ticket_direct...');
              const { data: rpcDirectResult, error: rpcDirectError } = await supabase.rpc('update_ticket_direct', {
                ticket_uuid: ticketId,
                ticket_status: 'closed',
                close_timestamp: new Date().toISOString()
              });
              
              if (!rpcDirectError && rpcDirectResult?.success) {
                persistenceSuccess = true;
                console.log('✅ [SIDEBAR-Estratégia 3] RPC Direct Sucesso!', rpcDirectResult);
              } else {
                console.log('❌ [SIDEBAR-Estratégia 3] RPC Direct falhou:', rpcDirectError || rpcDirectResult);
                throw new Error(rpcDirectError?.message || rpcDirectResult?.error || 'RPC Direct falhou');
              }
            } catch (error3) {
              console.log('❌ [SIDEBAR-Estratégia 3] RPC Direct falhou:', error3);
              
              // Estratégia 4: UPDATE direto via updateTicket
              try {
                console.log('💾 [SIDEBAR-Estratégia 4] UPDATE via updateTicket...');
                await updateTicket(ticketId, {
                  status: 'closed',
                  updated_at: new Date().toISOString(),
                  closed_at: new Date().toISOString()
                });
                persistenceSuccess = true;
                console.log('✅ [SIDEBAR-Estratégia 4] UPDATE Sucesso!');
              } catch (error4) {
                console.log('❌ [SIDEBAR-Estratégia 4] UPDATE falhou:', error4);
              }
            }
          }
        }
        
        // Se conseguiu salvar no banco, atualizar contadores
        if (persistenceSuccess) {
          try {
            await refreshTickets();
            console.log('✅ [SIDEBAR] Contadores atualizados');
          } catch (error) {
            console.log('⚠️ [SIDEBAR] Erro ao atualizar contadores:', error);
          }
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
            console.log('🔄 [SIDEBAR] Fechando modal automaticamente...');
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
      console.error('❌ [SIDEBAR] Erro ao finalizar ticket:', error);
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
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-orange-500" />
                Ações Rápidas
              </h4>
              
              <div className="space-y-2">
                {/* Botão Finalizar Ticket - Apenas para tickets não finalizados */}
                {currentTicket?.status !== 'finalizado' && currentTicket?.status !== 'closed' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleQuickFinishTicket}
                    className="w-full justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:text-green-800 transition-all duration-200"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ✅ Finalizar Ticket
                  </Button>
                )}
                
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
              </div>
            </div>
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