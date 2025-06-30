import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, BadgeProps } from '@/components/ui/badge';
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
  ArrowRight,
  Link
} from 'lucide-react';
// Hook removido - agora usando evolutionApiService diretamente
import { evolutionApiService } from '@/services/evolutionApiService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { EvolutionWebhookProcessor } from '@/services/evolution-webhook-processor';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { WhatsAppTicket, ActiveConversation } from "@/types/chat.types";
import { StatCard } from "./StatCard";

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

interface StatusBadgeProps extends BadgeProps {
  status: "online" | "offline" | "error";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const variants: Record<string, BadgeProps["variant"]> = {
    online: "default",
    offline: "secondary",
    error: "destructive",
  };

  return <Badge variant={variants[status]} {...props} />;
};

interface Stats {
  instances: {
    total: number;
    connected: number;
    disconnected: number;
  };
  messages: {
    total: number;
    today: number;
  };
  uptime: string;
  version: string;
}

export const EvolutionDashboard: React.FC<EvolutionDashboardProps> = ({
  departmentId,
  departmentName = "Dashboard Evolution API"
}) => {
  // Estados locais
  const [stats, setStats] = useState<Stats | null>(null);
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
  const { toast } = useToast();

  // Estados para simulação das funcionalidades do hook removido
  const [instances, setInstances] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

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
      const connectedInstance = instances.find(i => i.connected);
      if (connectedInstance) {
        setSelectedInstance(connectedInstance.name);
      } else {
        setSelectedInstance(instances[0].name);
      }
    }
  }, [instances]);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await evolutionApiService.getStats();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
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

  const getActiveTickets = async () => {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          status,
          metadata,
          last_message_at,
          created_at,
          messages:messages(
            content,
            created_at,
            sender
          )
        `)
        .in('status', ['open', 'pending'])
        .eq('channel', 'whatsapp')
        .order('last_message_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar tickets ativos:', error);
        return [];
      }

      return tickets || [];
    } catch (error) {
      console.error('Erro ao buscar tickets ativos:', error);
      return [];
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
      await evolutionApiService.sendMessage(selectedInstance, testNumber, testMessage);
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
        description: "Verifique a conexão e tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleCreateTestTicket = async () => {
    try {
      const webhook = new EvolutionWebhookProcessor();
      const result = await webhook.processMessage({
        event: 'messages.upsert',
        instance: selectedInstance || 'default',
        data: {
          key: {
            id: `test_${Date.now()}`,
            remoteJid: testNumber.includes('@') ? testNumber : `${testNumber}@s.whatsapp.net`,
            fromMe: false
          },
          message: {
            conversation: testMessage || 'Mensagem de teste'
          },
          messageTimestamp: Date.now(),
          pushName: 'Cliente Teste'
        }
      });

      if (result.success) {
        toast({
          title: "✅ Ticket criado",
          description: `Ticket de teste criado: ${result.ticketId}`,
        });
        
        // Recarregar dados
        loadWhatsAppTickets();
        loadActiveConversations();
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "Erro ao criar ticket",
        description: "Não foi possível criar o ticket de teste",
        variant: "destructive",
      });
    }
  };

  const handleOpenTicketChat = async (ticketId: string) => {
    try {
      const messages = await evolutionApiService.getTicketMessages(ticketId);
      console.log(`Carregando mensagens do ticket ${ticketId}:`, messages);
      
      // Navegar para o chat do ticket
      navigate(`/tickets/${ticketId}`);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro ao abrir chat",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      });
    }
  };

  const handleJoinInstance = async (instanceName: string) => {
    try {
      setSelectedInstance(instanceName);
      setConnectionStatus('connecting');
      
      // Simular conexão com a instância
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        toast({
          title: "✅ Conectado",
          description: `Conectado à instância ${instanceName}`,
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionStatus('error');
      toast({
        title: "Erro ao conectar",
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
    <div className="flex flex-col gap-4 p-4">
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Monitoramento e controle das instâncias WhatsApp
        </h2>
        <div className="flex items-center gap-2">
          <StatusBadge status={isConnected ? "online" : "offline"}>
            WebSocket {isConnected ? "Online" : "Offline"}
          </StatusBadge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadStats();
              loadWhatsAppTickets();
              loadActiveConversations();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Instâncias"
          value={stats?.instances?.total || 0}
          description={`${stats?.instances?.connected || 0} conectadas`}
          icon={<Smartphone className="w-4 h-4" />}
        />
        <StatCard
          title="Mensagens Hoje"
          value={stats?.messages?.today || 0}
          description={`Total: ${stats?.messages?.total || 0}`}
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <StatCard
          title="Tickets WhatsApp"
          value={ticketsStats.today}
          description={`${ticketsStats.open} criados hoje`}
          icon={<Ticket className="w-4 h-4" />}
        />
        <StatCard
          title="Conversas Ativas"
          value={activeConversations.length}
          description={`${activeConversations.filter(c => c.status === 'open').length} abertas`}
          icon={<MessageCircle className="w-4 h-4" />}
        />
      </div>

      {/* Seção de Tickets Recentes */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Tickets WhatsApp Recentes</h3>
          <Button variant="link" onClick={() => navigate('/tickets')}>
            Ver Todos <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="space-y-4">
          {whatsappTickets.slice(0, 3).map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  ticket.status === 'open' ? 'bg-green-500' :
                  ticket.status === 'pending' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <p className="font-medium">{ticket.metadata.client_name || ticket.metadata.anonymous_contact || 'Cliente'}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.lastMessage?.slice(0, 50)}...
                  </p>
                </div>
              </div>
              <StatusBadge status={ticket.status === 'open' ? 'online' : 'offline'}>
                {ticket.status}
              </StatusBadge>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Instâncias */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Status das Instâncias</h3>
          <Button variant="outline" size="sm" onClick={() => loadStats()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Status
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <div
              key={instance.name}
              className="p-4 bg-card rounded-lg border space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    instance.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <h4 className="font-medium">{instance.name}</h4>
                </div>
                <StatusBadge status={instance.connected ? 'online' : 'offline'}>
                  {instance.connected ? 'Conectado' : 'Desconectado'}
                </StatusBadge>
              </div>

              {/* QR Code se não estiver conectado */}
              {!instance.connected && qrCodes[instance.name] && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${qrCodes[instance.name]}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              )}

              {/* Ações da instância */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => joinInstance(instance.name)}
                  disabled={!isConnected}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getInstanceStatus(instance.name)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Status
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Teste de Mensagem */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Enviar Mensagem de Teste</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="instance">Instância</Label>
            <Select
              value={selectedInstance}
              onValueChange={setSelectedInstance}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {instances.map((instance) => (
                  <SelectItem
                    key={instance.name}
                    value={instance.name}
                    disabled={!instance.connected}
                  >
                    {instance.name} {!instance.connected && "(Desconectado)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="Ex: 5511999999999"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite uma mensagem de teste..."
            />
          </div>
          <Button
            className="self-end"
            onClick={() => {
              if (selectedInstance && testNumber && testMessage) {
                sendMessage(selectedInstance, testNumber, testMessage);
                setTestMessage('');
              }
            }}
            disabled={!selectedInstance || !testNumber || !testMessage || !isConnected}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}; 