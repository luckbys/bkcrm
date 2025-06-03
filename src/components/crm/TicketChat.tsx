
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  X, 
  Send, 
  Paperclip, 
  Phone, 
  Mail, 
  MessageSquare,
  Clock,
  User,
  Building,
  Tag,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketChatProps {
  ticket: any;
  onClose: () => void;
}

export const TicketChat = ({ ticket, onClose }: TicketChatProps) => {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockMessages = [
    {
      id: 1,
      content: 'Olá, estou com problema no sistema. Não consigo acessar minha conta.',
      sender: 'client',
      senderName: ticket.client,
      timestamp: '14:30',
      type: 'text'
    },
    {
      id: 2,
      content: 'Olá! Vou verificar sua conta agora. Pode me informar seu e-mail de cadastro?',
      sender: 'agent',
      senderName: 'João Silva',
      timestamp: '14:32',
      type: 'text'
    },
    {
      id: 3,
      content: 'Meu e-mail é cliente@exemplo.com',
      sender: 'client',
      senderName: ticket.client,
      timestamp: '14:33',
      type: 'text'
    },
    {
      id: 4,
      content: 'Cliente verificado. Identificado problema na conta. Realizando correção.',
      sender: 'agent',
      senderName: 'João Silva',
      timestamp: '14:35',
      type: 'internal',
      isInternal: true
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    console.log('Enviando mensagem:', {
      content: message,
      isInternal,
      ticketId: ticket.id
    });

    setMessage('');
    // Aqui você adicionaria a lógica para enviar a mensagem
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'atendimento': 'bg-blue-100 text-blue-800 border-blue-200',
      'finalizado': 'bg-green-100 text-green-800 border-green-200',
      'cancelado': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'text-red-600',
      'normal': 'text-blue-600',
      'baixa': 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Ticket #{ticket.id}</h2>
              </div>
              <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                {ticket.status}
              </Badge>
              <span className={cn("text-sm font-medium", getPriorityColor(ticket.priority))}>
                Prioridade {ticket.priority}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender === 'client' ? 'justify-start' : 'justify-end'
                )}
              >
                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm",
                    msg.sender === 'client'
                      ? 'bg-white text-gray-900'
                      : msg.isInternal
                      ? 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                      : 'bg-blue-600 text-white',
                    "relative"
                  )}
                >
                  {msg.isInternal && (
                    <div className="text-xs font-medium mb-1 flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Nota Interna
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{msg.senderName}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t p-4">
            <div className="flex items-center space-x-2 mb-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Nota interna</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isInternal ? "Digite uma nota interna..." : "Digite sua mensagem..."}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ticket Info Sidebar */}
        <div className="w-80 bg-gray-50 border-l flex flex-col">
          <div className="p-6 border-b bg-white">
            <h3 className="text-lg font-semibold mb-4">Informações do Ticket</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {ticket.client.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ticket.client}</p>
                    <p className="text-sm text-gray-500">cliente@exemplo.com</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Assunto</label>
                <p className="mt-1 text-sm">{ticket.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Canal</label>
                <Badge variant="outline" className="mt-1">
                  {ticket.channel}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Última Atividade</label>
                <p className="mt-1 text-sm text-gray-500">{ticket.lastMessage}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Alterar Responsável
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Alterar Status
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Building className="w-4 h-4 mr-2" />
                  Ver Cliente
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Tag className="w-4 h-4 mr-2" />
                  Adicionar Etiqueta
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs text-gray-600">
                  <div>
                    <p><strong>14:25</strong> - Ticket criado</p>
                  </div>
                  <div>
                    <p><strong>14:30</strong> - Atribuído para João Silva</p>
                  </div>
                  <div>
                    <p><strong>14:32</strong> - Status alterado para "Em Atendimento"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
