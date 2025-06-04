import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Square, CheckSquare, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    agent?: string;
    createdAt?: Date;
    updatedAt?: Date;
    tags?: string[];
    description?: string;
  }>;
  onTicketClick: (ticket: any) => void;
  selectedTickets?: number[];
  onSelectTicket?: (ticketId: number) => void;
  viewMode?: 'list' | 'grid';
}

export const TicketsList = ({ 
  tickets, 
  onTicketClick, 
  selectedTickets = [], 
  onSelectTicket,
  viewMode = 'list' 
}: TicketsListProps) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'status-pending',
      'atendimento': 'status-in-progress',
      'finalizado': 'status-completed',
      'cancelado': 'status-cancelled'
    };
    return colors[status] || 'bg-muted text-muted-foreground border-border';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'border-l-destructive bg-destructive/5',
      'normal': 'border-l-primary bg-primary/5',
      'baixa': 'border-l-success bg-success/5'
    };
    return colors[priority] || 'border-l-muted bg-muted/20';
  };

  const handleTicketSelect = (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    onSelectTicket?.(ticketId);
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((ticket) => {
          const isSelected = selectedTickets.includes(ticket.id);
          
          return (
            <Card
              key={ticket.id}
              className={cn(
                "cursor-pointer hover:shadow-medium transition-all duration-200 border-l-4 group",
                getPriorityColor(ticket.priority),
                isSelected && "ring-2 ring-primary bg-primary/5 shadow-medium"
              )}
              onClick={() => onTicketClick(ticket)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">#{ticket.id}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {onSelectTicket && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-accent"
                        onClick={(e) => handleTicketSelect(e, ticket.id)}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                    {ticket.unread && (
                      <Badge variant="destructive" className="text-2xs px-2 py-0.5 animate-pulse shadow-soft">
                        Nova
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-foreground">{ticket.client}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{ticket.subject}</div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("text-2xs border", getStatusColor(ticket.status))}>
                    {ticket.status}
                  </Badge>
                  <Badge variant="outline" className="text-2xs border-border">
                    {ticket.channel}
                  </Badge>
                </div>
                
                <div className="text-2xs text-muted-foreground flex items-center justify-between">
                  <span>{ticket.lastMessage}</span>
                  {ticket.agent && (
                    <span className="font-medium text-foreground">{ticket.agent}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <Card className="shadow-soft">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {tickets.map((ticket) => {
            const isSelected = selectedTickets.includes(ticket.id);
            
            return (
              <div
                key={ticket.id}
                onClick={() => onTicketClick(ticket)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200 border-l-4 flex items-center space-x-4 group",
                  getPriorityColor(ticket.priority),
                  isSelected && "bg-primary/5 border-primary shadow-soft"
                )}
              >
                {onSelectTicket && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-accent"
                    onClick={(e) => handleTicketSelect(e, ticket.id)}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </Button>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="font-medium text-foreground flex-shrink-0">#{ticket.id}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{ticket.client}</div>
                        <div className="text-sm text-muted-foreground truncate">{ticket.subject}</div>
                      </div>
                      {ticket.unread && (
                        <Badge variant="destructive" className="text-2xs flex-shrink-0 animate-pulse shadow-soft">
                          Nova
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <Badge className={cn("text-2xs border", getStatusColor(ticket.status))}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline" className="text-2xs border-border">
                        {ticket.channel}
                      </Badge>
                      <div className="text-sm text-muted-foreground min-w-0">
                        {ticket.lastMessage}
                      </div>
                      {ticket.agent && (
                        <div className="text-2xs text-foreground font-medium bg-muted/40 px-2 py-1 rounded-md">
                          {ticket.agent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
