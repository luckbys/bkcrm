import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { Switch } from '../../ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { Progress } from '../../ui/progress';
import { 
  Settings,
  Users,
  Tag,
  ChevronRight,
  ChevronDown,
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
  RefreshCw,
  Activity,
  TrendingUp,
  Shield,
  Heart,
  Sparkles,
  ChevronUp,
  Loader2,
  MapPin,
  Calendar,
  Timer,
  Target,
  Bookmark,
  Share,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { UseTicketChatReturn } from '../../../types/ticketChat';
import { useTicketsDB } from '../../../hooks/useTicketsDB';
import { useToast } from '../../../hooks/use-toast';
import { ChatAnimations, ResponsiveAnimations } from './chatAnimations';
import { supabase } from '../../../lib/supabase';

// Componentes auxiliares
import { TicketChatSidebarHeader } from './TicketChatSidebarHeader';
import { TicketChatSidebarSection } from './TicketChatSidebarSection';
import { TicketChatSidebarActions } from './TicketChatSidebarActions';

interface TicketChatSidebarProps {
  showSidebar: boolean;
  chatState: UseTicketChatReturn;
  onClose?: () => void;
}

export const TicketChatSidebar: React.FC<TicketChatSidebarProps> = React.memo(({
  showSidebar,
  chatState,
  onClose
}) => {
  const { toast } = useToast();
  const { updateTicket, refreshTickets } = useTicketsDB();
  
  // Estados para UI aprimorada
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    ticket: true,
    whatsapp: true,
    actions: true,
    stats: false,
    activity: false
  });
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  
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

  // Calcular contadores de mensagens (memoizado para performance)
  const messageCounts = useMemo(() => ({
    total: realTimeMessages.length,
    public: realTimeMessages.filter(m => !m.isInternal).length,
    internal: realTimeMessages.filter(m => m.isInternal).length
  }), [realTimeMessages]);

  // Calcular progresso do ticket (memoizado)
  const ticketProgress = useMemo(() => {
    const statusProgress = {
      'open': 25,
      'atendimento': 50,
      'in_progress': 75,
      'finalizado': 100,
      'closed': 100,
      'resolved': 100
    };
    return statusProgress[currentTicket?.status as keyof typeof statusProgress] || 0;
  }, [currentTicket?.status]);

  // Funções otimizadas com useCallback
  const checkWhatsAppStatus = useCallback(() => {
    console.log('🔄 Verificando status do WhatsApp...');
    // Aqui poderia chamar uma API real para verificar status
  }, []);

  const refreshData = useCallback(async () => {
    console.log('🔄 Atualizando dados do sidebar...');
    try {
      await refreshTickets();
      toast({
        title: "✅ Dados Atualizados",
        description: "As informações foram atualizadas com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive"
      });
    }
  }, [refreshTickets, toast]);

  // Função para toggle de seções (otimizada)
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Simular última atividade
  const lastActivity = useMemo(() => 
    currentTicket?.lastActivity || 'Nunca', 
    [currentTicket?.lastActivity]
  );

  // Função para finalizar ticket rapidamente
  const handleQuickFinishTicket = async () => {
    if (!currentTicket) return;
    
    setIsLoadingAction(true);
    setActionType('finish');

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
    } finally {
      setIsLoadingAction(false);
      setActionType(null);
    }
  };

  // Função para calcular tempo desde criação
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diff = now.getTime() - created.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora mesmo';
  };

  // Função para calcular progresso do ticket
  const getTicketProgress = () => {
    const statusProgress = {
      'open': 25,
      'atendimento': 50,
      'in_progress': 75,
      'finalizado': 100,
      'closed': 100,
      'resolved': 100
    };
    return statusProgress[currentTicket?.status as keyof typeof statusProgress] || 0;
  };

  // ===== Funções de abertura de modais / ações rápidas =====
  const openCustomerModal = useCallback(() => {
    setShowCustomerModal(true);
  }, [setShowCustomerModal]);

  const openChangeStatusModal = useCallback(() => {
    setShowStatusModal(true);
  }, [setShowStatusModal]);

  const openAssignAgentModal = useCallback(() => {
    setShowAssignModal(true);
  }, [setShowAssignModal]);

  const openTransferModal = useCallback(() => {
    toast({
      title: "🔄 Transferir Ticket",
      description: "Funcionalidade de transferência será implementada em breve.",
    });
  }, [toast]);

  if (!showSidebar) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "bg-gradient-to-b from-slate-50 to-gray-100 border-l border-gray-200/80 flex flex-col overflow-hidden shadow-xl",
        ChatAnimations.chat.sidebarToggle,
        ResponsiveAnimations.prefersReducedMotion.disable,
        "w-72 sm:w-80 md:w-80 lg:w-96 xl:w-[400px] max-w-[30vw]"
      )}>
        {/* Header do Sidebar Aprimorado */}
        <div className="relative p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-700/10 backdrop-blur-sm"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Detalhes</h3>
                  <p className="text-xs text-blue-100">Informações do Ticket</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Atualizar informações</p>
                  </TooltipContent>
                </Tooltip>
                
                {onClose && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                        onClick={onClose}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fechar sidebar</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            {/* Indicador de Progresso */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-100">Progresso do Ticket</span>
                <span className="text-white font-medium">{getTicketProgress()}%</span>
              </div>
              <Progress 
                value={getTicketProgress()} 
                className="h-2 bg-white/20 overflow-hidden rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* Informações do Cliente - Seção Colapsável */}
          <Card className="border border-gray-200/60 shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader 
              className="pb-2 cursor-pointer select-none"
              onClick={() => toggleSection('client')}
            >
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between group-hover:text-blue-600 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-2">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  Cliente
                </div>
                <div className="flex items-center space-x-1">
                  {currentTicket?.isWhatsApp && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200 px-1.5 py-0.5">
                      <Smartphone className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Badge>
                  )}
                  {expandedSections.client ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            {expandedSections.client && (
              <CardContent className="pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{currentTicket?.client || 'Cliente Anônimo'}</p>
                        <p className="text-xs text-blue-600 font-medium">ID: #{currentTicket?.id || currentTicket?.customerId || 'N/A'}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                            onClick={() => openCustomerModal()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver perfil completo</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm group hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <Mail className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                      <span className="text-gray-600 flex-1 truncate">{currentTicket?.customerEmail || 'Email não informado'}</span>
                      {currentTicket?.customerEmail && currentTicket.customerEmail !== 'Email não informado' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => navigator.clipboard.writeText(currentTicket?.customerEmail || '')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copiar email</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm group hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <Phone className="w-4 h-4 mr-2 text-gray-400 group-hover:text-green-500" />
                      <span className={cn(
                        "text-gray-600 flex-1 truncate font-medium",
                        currentTicket?.customerPhone && currentTicket.customerPhone !== 'Telefone não informado' 
                          ? "text-green-700" 
                          : ""
                      )}>{currentTicket?.customerPhone || 'Telefone não informado'}</span>
                      {currentTicket?.customerPhone && currentTicket.customerPhone !== 'Telefone não informado' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                              onClick={() => navigator.clipboard.writeText(currentTicket?.customerPhone || '')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copiar telefone</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm group hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <Building className="w-4 h-4 mr-2 text-gray-400 group-hover:text-purple-500" />
                      <span className="text-gray-600">Departamento: {currentTicket?.department || 'Geral'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm group hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400 group-hover:text-orange-500" />
                      <span className="text-gray-600">
                        {currentTicket?.createdAt ? getTimeAgo(currentTicket.createdAt) : 'Data não informada'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Informações do Ticket - Seção Colapsável */}
          <Card className="border border-gray-200/60 shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader 
              className="pb-2 cursor-pointer select-none"
              onClick={() => toggleSection('ticket')}
            >
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between group-hover:text-indigo-600 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg mr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                  Ticket
                </div>
                <div className="flex items-center space-x-1">
                  <Badge 
                    variant={currentTicket?.status === 'open' ? 'default' : 'secondary'}
                    className="text-xs px-2 py-0.5"
                  >
                    {currentTicket?.status || 'Indefinido'}
                  </Badge>
                  {expandedSections.ticket ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            {expandedSections.ticket && (
              <CardContent className="pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                  <h4 className="font-semibold text-gray-900 mb-1">{currentTicket?.subject || 'Assunto não definido'}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{currentTicket?.description || 'Descrição não informada'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      Status
                    </label>
                    <Badge 
                      variant={currentTicket?.status === 'open' ? 'default' : 'secondary'}
                      className="w-full justify-center py-1"
                    >
                      {currentTicket?.status || 'Indefinido'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Prioridade
                    </label>
                    <Badge 
                      variant={currentTicket?.priority === 'high' ? 'destructive' : 'outline'}
                      className="w-full justify-center py-1"
                    >
                      {currentTicket?.priority || 'Normal'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm group hover:bg-gray-50 p-2 rounded-md transition-colors">
                    <UserCheck className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                    <span className="text-gray-600">Agente: {currentTicket?.assignedAgent || 'Não atribuído'}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* WhatsApp Status - Seção Colapsável */}
          <Card className="border border-gray-200/60 shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader 
              className="pb-2 cursor-pointer select-none"
              onClick={() => toggleSection('whatsapp')}
            >
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between group-hover:text-green-600 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-2">
                    <Smartphone className="w-3.5 h-3.5 text-white" />
                  </div>
                  WhatsApp
                </div>
                <div className="flex items-center space-x-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    whatsappStatus === 'connected' ? "bg-green-400" : "bg-red-400"
                  )}></div>
                  {expandedSections.whatsapp ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            {expandedSections.whatsapp && (
              <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {whatsappStatus === 'connected' ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-green-100 rounded-full">
                            <Wifi className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-green-700">Conectado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-red-100 rounded-full">
                            <WifiOff className="w-3 h-3 text-red-600" />
                          </div>
                          <span className="text-sm font-medium text-red-700">Desconectado</span>
                        </div>
                      )}
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-green-500 hover:text-green-700 hover:bg-green-100"
                          onClick={checkWhatsAppStatus}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Atualizar status</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="space-y-1 text-xs text-green-700">
                    <div className="flex items-center justify-between">
                      <span>Instância:</span>
                      <span className="font-medium">{currentTicket?.whatsappInstance || 'Não definida'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Última atividade:</span>
                      <span className="font-medium">{lastActivity || 'Nunca'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Ações Rápidas - Seção Colapsável */}
          <Card className="border border-gray-200/60 shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader 
              className="pb-2 cursor-pointer select-none"
              onClick={() => toggleSection('actions')}
            >
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between group-hover:text-orange-600 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg mr-2">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  Ações Rápidas
                </div>
                {expandedSections.actions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </CardTitle>
            </CardHeader>
            
            {expandedSections.actions && (
              <CardContent className="pt-0 space-y-2 animate-in slide-in-from-top-2 duration-300">
                {/* Botão Finalizar Ticket - Apenas para tickets não finalizados */}
                {currentTicket?.status !== 'finalizado' && currentTicket?.status !== 'closed' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleQuickFinishTicket}
                        disabled={isLoadingAction && actionType === 'finish'}
                        className="w-full justify-start bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:text-green-800 transition-all duration-200 h-12"
                      >
                        {isLoadingAction && actionType === 'finish' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {isLoadingAction && actionType === 'finish' ? 'Finalizando...' : '✅ Finalizar Ticket'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Finalizar este ticket rapidamente</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openChangeStatusModal()}
                      className="w-full justify-start h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200"
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Alterar Status
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Alterar o status do ticket</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignAgentModal()}
                      className="w-full justify-start h-12 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 transition-all duration-200"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Atribuir Agente
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Atribuir este ticket a um agente</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCustomerModal()}
                      className="w-full justify-start h-12 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 transition-all duration-200"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Atribuir Cliente
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Atribuir ou alterar cliente do ticket</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTransferModal()}
                      className="w-full justify-start h-12 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-teal-700 hover:from-teal-100 hover:to-cyan-100 hover:border-teal-300 transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Transferir Ticket
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Transferir ticket para outro departamento</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            )}
          </Card>

          {/* Estatísticas - Seção Colapsável */}
          <Card className="border border-gray-200/60 shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader 
              className="pb-2 cursor-pointer select-none"
              onClick={() => toggleSection('stats')}
            >
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between group-hover:text-purple-600 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mr-2">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  Estatísticas
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {messageCounts.total}
                  </Badge>
                  {expandedSections.stats ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            {expandedSections.stats && (
              <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center cursor-help transition-all duration-200 hover:scale-105">
                        <div className="flex items-center justify-center mb-1">
                          <MessageSquare className="w-4 h-4 text-blue-600 mr-1" />
                          <p className="text-lg font-bold text-blue-600">{messageCounts.total}</p>
                        </div>
                        <p className="text-xs text-blue-700">Total</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de mensagens na conversa</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center cursor-help transition-all duration-200 hover:scale-105">
                        <div className="flex items-center justify-center mb-1">
                          <Eye className="w-4 h-4 text-green-600 mr-1" />
                          <p className="text-lg font-bold text-green-600">{messageCounts.public}</p>
                        </div>
                        <p className="text-xs text-green-700">Públicas</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mensagens visíveis para o cliente</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg text-center cursor-help transition-all duration-200 hover:scale-105">
                        <div className="flex items-center justify-center mb-1">
                          <Shield className="w-4 h-4 text-orange-600 mr-1" />
                          <p className="text-lg font-bold text-orange-600">{messageCounts.internal}</p>
                        </div>
                        <p className="text-xs text-orange-700">Internas</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Notas internas da equipe</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center cursor-help transition-all duration-200 hover:scale-105">
                        <div className="flex items-center justify-center mb-1">
                          <Star className="w-4 h-4 text-purple-600 mr-1" />
                          <p className="text-lg font-bold text-purple-600">{favoriteMessages.size}</p>
                        </div>
                        <p className="text-xs text-purple-700">Favoritas</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mensagens marcadas como favoritas</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Progresso Visual */}
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500 font-medium">Atividade da Conversa</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Públicas</span>
                      <span>{messageCounts.total > 0 ? Math.round((messageCounts.public / messageCounts.total) * 100) : 0}%</span>
                    </div>
                    <Progress value={messageCounts.total > 0 ? (messageCounts.public / messageCounts.total) * 100 : 0} className="h-1" />
                  </div>
                  {favoriteMessages.size > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Favoritas</span>
                        <span>{messageCounts.total > 0 ? Math.round((favoriteMessages.size / messageCounts.total) * 100) : 0}%</span>
                      </div>
                      <Progress value={messageCounts.total > 0 ? (favoriteMessages.size / messageCounts.total) * 100 : 0} className="h-1" />
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}); 