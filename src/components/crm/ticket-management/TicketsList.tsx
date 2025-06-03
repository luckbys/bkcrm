
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface TicketsListProps {
  tickets: Array<{
    id: number;
    client: string;
    subject: string;
    status: string;
    channel: string;
    lastMessage: string;
    unread: boolean;
    priority: string;
  }>;
  onTicketClick: (ticket: any) => void;
}

export const TicketsList = ({ tickets, onTicketClick }: TicketsListProps) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'atendimento': 'bg-blue-100 text-blue-800',
      'finalizado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'border-l-red-500',
      'normal': 'border-l-blue-500',
      'baixa': 'border-l-green-500'
    };
    return colors[priority] || 'border-l-gray-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lista de Tickets</CardTitle>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onTicketClick(ticket)}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(ticket.priority)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="font-medium text-gray-900">#{ticket.id}</div>
                  <div>
                    <div className="font-medium">{ticket.client}</div>
                    <div className="text-sm text-gray-600">{ticket.subject}</div>
                  </div>
                  {ticket.unread && (
                    <Badge variant="destructive" className="text-xs">
                      Nova
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  <Badge variant="outline">
                    {ticket.channel}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {ticket.lastMessage}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
