import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Smartphone, 
  Users, 
  Activity,
  RefreshCw,
  Send,
  QrCode,
  CheckCircle,
  AlertCircle,
  XCircle,
  Phone,
  MessageCircle,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  Eye,
  MoreVertical,
  ExternalLink,
  Ticket,
  UserPlus,
  MessagesSquare,
  ArrowRight
} from 'lucide-react';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { evolutionApiService } from '@/services/evolutionApiService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { EvolutionWebhookProcessor } from '@/services/evolution-webhook-processor';

interface EvolutionDashboardProps {
  departmentId?: string;
  departmentName?: string;
}

interface WhatsAppTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  last_message_at: string;
  unread: boolean;
  metadata: {
    client_name?: string;
    client_phone?: string;
    evolution_instance_name?: string;
    auto_created?: boolean;
    anonymous_contact?: string;
  };
  tags: string[];
}

interface ActiveTicket {
  id: string;
  title: string;
  status: string;
  metadata: {
    client_name?: string;
    client_phone?: string;
    whatsapp_phone?: string;
    evolution_instance_name?: string;
    anonymous_contact?: string;
  };
  last_message_at: string;
  created_at: string;
  messages: {
    content: string;
    created_at: string;
    sender: string;
  }[];
}

interface ActiveConversation {
  ticketId: string;
  clientName: string;
  clientPhone: string;
  instanceName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: string;
}

export const EvolutionDashboard: React.FC<EvolutionDashboardProps> = ({
  departmentId,
  departmentName = "Dashboard Evolution API"
}) => {
  // Estados locais
  const [stats, setStats] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Estados para integração com tickets
  const [whatsappTickets, setWhatsappTickets] = useState<WhatsAppTicket[]>([]);
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsStats, setTicketsStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    today: 0
  });

  const navigate = useNavigate();

  // Hook do WebSocket
  const {
    messages,
    instances,
    qrCodes,
    isConnected,
    connectionStatus,
    reconnect,
    joinInstance,
    sendMessage,
    getInstanceStatus,
    loadTicketMessages
  } = useEvolutionWebhook();

  // Carregar dados iniciais
  useEffect(() => {
    loadStats();
    loadWhatsAppTickets();
    loadActiveConversations();
    
    const interval = setInterval(() => {
      loadStats();
      loadWhatsAppTickets();
      loadActiveConversations();
    }, 30000); // Atualizar a cada 30s
    
    return () => clearInterval(interval);
  }, []);

  // Auto-selecionar primeira instância disponível
  useEffect(() => {
    if (instances.length > 0 && !selectedInstance) {
      setSelectedInstance(instances[0].name);
    }
  }, [instances]);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await evolutionApiService.getStats();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível conectar com o servidor Evolution API",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadWhatsAppTickets = async () => {
    setIsLoadingTickets(true);
    try {
      // Buscar tickets do WhatsApp criados automaticamente
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .or('channel.eq.whatsapp,metadata->>auto_created.eq.true,metadata->>created_from_whatsapp.eq.true')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao carregar tickets WhatsApp:', error);
        return;
      }

      const whatsappTicketsList = (tickets || []).map(ticket => ({
        id: ticket.id,
        title: ticket.title || 'Conversa WhatsApp',
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        last_message_at: ticket.last_message_at || ticket.created_at,
        unread: ticket.unread || false,
        metadata: ticket.metadata || {},
        tags: ticket.tags || []
      }));

      setWhatsappTickets(whatsappTicketsList);

      // Calcular estatísticas
      const today = new Date().toISOString().split('T')[0];
      const todayTickets = whatsappTicketsList.filter(t => 
        t.created_at.startsWith(today)
      );

      setTicketsStats({
        total: whatsappTicketsList.length,
        open: whatsappTicketsList.filter(t => t.status === 'open').length,
        pending: whatsappTicketsList.filter(t => t.status === 'pending').length,
        today: todayTickets.length
      });

    } catch (error) {
      console.error('Erro ao carregar tickets WhatsApp:', error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const loadActiveConversations = async () => {
    try {
      const activeTickets = await getActiveTickets();
      
      if (!activeTickets) {
        setActiveConversations([]);
        return;
      }

      const conversations: ActiveConversation[] = (activeTickets || []).map((ticket: ActiveTicket) => {
        const lastMessage = ticket.messages?.[0];
        const metadata = ticket.metadata || {};
        
        return {
          ticketId: ticket.id,
          clientName: metadata.client_name || metadata.anonymous_contact || 'Cliente',
          clientPhone: metadata.client_phone || metadata.whatsapp_phone || '',
          instanceName: metadata.evolution_instance_name || '',
          lastMessage: lastMessage?.content || 'Nova conversa',
          lastMessageTime: ticket.last_message_at || ticket.created_at,
          unreadCount: 0, // TODO: implementar contagem de não lidas
          status: ticket.status
        };
      });

      setActiveConversations(conversations);

    } catch (error) {
      console.error('Erro ao carregar conversas ativas:', error);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testMessage.trim() || !testNumber.trim() || !selectedInstance) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o número, mensagem e selecione uma instância",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage(selectedInstance, testNumber, testMessage);
      toast({
        title: "✅ Mensagem enviada",
        description: `Mensagem teste enviada para ${testNumber}`,
      });
      setTestMessage('');
      setTestNumber('');
      
      // Recarregar dados após 2 segundos para capturar novo ticket se criado
      setTimeout(() => {
        loadWhatsAppTickets();
        loadActiveConversations();
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Verifique o número e a conexão da instância",
        variant: "destructive",
      });
    }
  };

  const handleCreateTestTicket = async () => {
    try {
      const testData = {
        clientName: `Cliente Teste ${Date.now()}`,
        clientPhone: '5511999998888',
        instanceName: selectedInstance || 'default',
        firstMessage: 'Mensagem de teste para criação de ticket',
        messageId: `test_${Date.now()}`
      };

      const ticketId = await EvolutionWebhookProcessor.createTicketAutomatically(testData);
      
      if (ticketId) {
        toast({
          title: "✅ Ticket de teste criado",
          description: `Ticket criado com sucesso: ${ticketId}`,
        });
        loadWhatsAppTickets();
        loadActiveConversations();
      } else {
        throw new Error('Falha na criação do ticket');
      }
    } catch (error) {
      console.error('Erro ao criar ticket de teste:', error);
      toast({
        title: "Erro ao criar ticket",
        description: "Não foi possível criar o ticket de teste",
        variant: "destructive",
      });
    }
  };

  const handleOpenTicketChat = async (ticketId: string) => {
    try {
      // Carregar mensagens do ticket
      await loadTicketMessages(ticketId);
      
      // Navegar para a página do chat
      navigate(`/chat/${ticketId}`);
    } catch (error) {
      console.error('❌ [CHAT] Erro ao carregar mensagens:', error);
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar o histórico de mensagens",
        variant: "destructive",
      });
    }
  };

  const handleJoinInstance = async (instanceName: string) => {
    try {
      await joinInstance(instanceName);
      toast({
        title: "Conectado à instância",
        description: `Conectado com sucesso à instância ${instanceName}`,
      });
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar à instância",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
      case 'initializing':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'close':
      case 'disconnected':
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
      case 'initializing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'close':
      case 'disconnected':
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {departmentName} - Evolution API
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoramento e controle das instâncias WhatsApp
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={isConnected ? "default" : "destructive"} className="px-3 py-1">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                WebSocket Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                WebSocket Offline
              </>
            )}
          </Badge>
          <Button
            onClick={() => {
              reconnect();
              loadStats();
              loadWhatsAppTickets();
              loadActiveConversations();
            }}
            variant="outline"
            size="sm"
            disabled={isLoadingStats}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingStats ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estatísticas do Sistema */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Instâncias</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.instances?.total || instances.length}
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.instances?.connected || 0} conectadas
                </p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.messages?.today || messages.length}
                </p>
                <p className="text-xs text-gray-500">
                  Total: {stats?.messages?.total || 0}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Tickets */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets WhatsApp</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ticketsStats.total}
                </p>
                <p className="text-xs text-gray-500">
                  {ticketsStats.today} criados hoje
                </p>
              </div>
              <Ticket className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeConversations.length}
                </p>
                <p className="text-xs text-gray-500">
                  {ticketsStats.open} abertas
                </p>
              </div>
              <MessagesSquare className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets WhatsApp Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Ticket className="w-5 h-5 mr-2" />
                Tickets WhatsApp Recentes
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateTestTicket}
                disabled={!selectedInstance}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Criar Teste
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {isLoadingTickets ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto animate-spin mb-3" />
                  <p className="text-gray-500">Carregando tickets...</p>
                </div>
              ) : whatsappTickets.length > 0 ? (
                <div className="space-y-3">
                  {whatsappTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleOpenTicketChat(ticket.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {ticket.metadata.client_name || ticket.metadata.anonymous_contact || 'Cliente'}
                          </span>
                          {ticket.unread && (
                            <Badge variant="destructive" className="text-xs">
                              Não lida
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {ticket.metadata.client_phone && (
                          <span className="text-blue-600">
                            📱 {ticket.metadata.client_phone}
                          </span>
                        )}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {formatRelativeTime(ticket.last_message_at)}
                        </span>
                        {ticket.metadata.evolution_instance_name && (
                          <Badge variant="outline" className="text-xs">
                            {ticket.metadata.evolution_instance_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum ticket WhatsApp encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Tickets serão criados automaticamente quando mensagens chegarem
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversas Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <MessagesSquare className="w-5 h-5 mr-2" />
                Conversas Ativas (24h)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/tickets')}
              >
                Ver Todas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {activeConversations.length > 0 ? (
                <div className="space-y-3">
                  {activeConversations.map((conversation) => (
                    <div 
                      key={conversation.ticketId} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleOpenTicketChat(conversation.ticketId)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {conversation.clientName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(conversation.status)}>
                            {conversation.status}
                          </Badge>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {conversation.lastMessage}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          📱 {conversation.clientPhone}
                        </span>
                        <span>
                          {formatRelativeTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessagesSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma conversa ativa</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Conversas aparecerão aqui quando houver atividade recente
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Instâncias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Status das Instâncias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {instances.length > 0 ? (
                <div className="space-y-3">
                  {instances.map((instance) => (
                    <div key={instance.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(instance.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {instance.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {instance.phone || 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(instance.status)}>
                          {instance.status || 'Desconhecido'}
                        </Badge>
                        {instance.status !== 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJoinInstance(instance.name)}
                          >
                            Conectar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma instância encontrada</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={loadStats}
                  >
                    Recarregar
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              QR Codes de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {Object.keys(qrCodes).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(qrCodes).map(([instanceName, qrCode]) => (
                    <div key={instanceName} className="text-center">
                      <p className="font-medium text-gray-900 mb-2">
                        {instanceName}
                      </p>
                      <div className="bg-white p-4 rounded-lg border inline-block">
                        <img
                          src={qrCode}
                          alt={`QR Code para ${instanceName}`}
                          className="w-32 h-32"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Escaneie com o WhatsApp
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum QR Code disponível</p>
                  <p className="text-sm text-gray-400 mt-1">
                    QR Codes aparecem quando uma instância precisa de conexão
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Teste de Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="w-5 h-5 mr-2" />
            Teste de Envio de Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instância
              </label>
              <select
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma instância</option>
                {instances.map((instance) => (
                  <option key={instance.name} value={instance.name}>
                    {instance.name} ({instance.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número (com código do país)
              </label>
              <Input
                type="text"
                placeholder="5511999998888"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSendTestMessage}
                className="w-full"
                disabled={!selectedInstance || !testMessage.trim() || !testNumber.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem
            </label>
            <Textarea
              placeholder="Digite sua mensagem de teste..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Mensagens Recentes
            </span>
            <span className="text-sm text-gray-500">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.slice(-10).reverse().map((message, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {message.from || 'Desconhecido'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                    {message.instanceName && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {message.instanceName}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma mensagem recente</p>
                <p className="text-sm text-gray-400 mt-1">
                  As mensagens aparecerão aqui em tempo real
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}; 