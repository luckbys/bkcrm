import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Square, CheckSquare, Grid3X3, List, User, Clock, MessageSquare } from 'lucide-react';
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
  compactView?: boolean;
}

export const TicketsList = ({ 
  tickets, 
  onTicketClick, 
  selectedTickets = [], 
  onSelectTicket,
  viewMode = 'list',
  compactView = false
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

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, any> = {
      whatsapp: MessageSquare,
      email: '📧',
      telefone: '📞', 
      chat: MessageSquare,
      presencial: '🏢'
    };
    return icons[channel] || MessageSquare;
  };

  if (viewMode === 'grid') {
    return (
      <div className={cn(
        "grid gap-4",
        compactView 
          ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {tickets.map((ticket) => {
          const isSelected = selectedTickets.includes(ticket.id);
          
          return (
            <Card
              key={ticket.id}
              className={cn(
                "cursor-pointer hover:shadow-medium transition-all duration-200 border-l-4 group",
                getPriorityColor(ticket.priority),
                isSelected && "ring-2 ring-primary bg-primary/5 shadow-medium",
                compactView && "hover:scale-[1.02] transform"
              )}
              onClick={() => onTicketClick(ticket)}
            >
              <CardHeader className={cn("pb-2", compactView && "pb-1 px-3 pt-3")}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn(
                    "text-sm font-semibold text-foreground",
                    compactView && "text-xs"
                  )}>
                    #{ticket.id}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    {onSelectTicket && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 w-6 p-0 hover:bg-accent", compactView && "h-4 w-4")}
                        onClick={(e) => handleTicketSelect(e, ticket.id)}
                      >
                        {isSelected ? (
                          <CheckSquare className={cn("w-4 h-4 text-primary", compactView && "w-3 h-3")} />
                        ) : (
                          <Square className={cn("w-4 h-4 text-muted-foreground", compactView && "w-3 h-3")} />
                        )}
                      </Button>
                    )}
                    {ticket.unread && (
                      <Badge variant="destructive" className={cn(
                        "text-2xs px-2 py-0.5 animate-pulse shadow-soft",
                        compactView && "px-1 py-0 text-[10px]"
                      )}>
                        Nova
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className={cn("space-y-2", compactView && "space-y-1 px-3 pb-3")}>
                <div>
                  <div className={cn(
                    "font-medium text-foreground",
                    compactView && "text-xs truncate"
                  )}>
                    {ticket.client}
                  </div>
                  <div className={cn(
                    "text-sm text-muted-foreground line-clamp-2",
                    compactView && "text-xs line-clamp-1"
                  )}>
                    {ticket.subject}
                  </div>
                </div>
                
                <div className={cn("flex flex-wrap gap-1", compactView && "gap-0.5")}>
                  <Badge className={cn(
                    "text-2xs border",
                    getStatusColor(ticket.status),
                    compactView && "text-[10px] px-1 py-0"
                  )}>
                    {compactView ? ticket.status.slice(0, 3) : ticket.status}
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "text-2xs border-border",
                    compactView && "text-[10px] px-1 py-0"
                  )}>
                    {typeof getChannelIcon(ticket.channel) === 'string' 
                      ? getChannelIcon(ticket.channel)
                      : ticket.channel.slice(0, 3)
                    }
                  </Badge>
                </div>
                
                {!compactView && (
                  <div className="text-2xs text-muted-foreground flex items-center justify-between">
                    <span>{ticket.lastMessage}</span>
                    {ticket.agent && (
                      <span className="font-medium text-foreground">{ticket.agent}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <Card className="shadow-soft border-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {tickets.map((ticket) => {
            const isSelected = selectedTickets.includes(ticket.id);
            
            return (
              <div
                key={ticket.id}
                onClick={() => onTicketClick(ticket)}
                className={cn(
                  "cursor-pointer hover:bg-accent/50 transition-all duration-200 border-l-4 flex items-center space-x-4 group",
                  getPriorityColor(ticket.priority),
                  isSelected && "bg-primary/5 border-primary shadow-soft",
                  compactView ? "p-2" : "p-4"
                )}
              >
                {onSelectTicket && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-shrink-0 hover:bg-accent",
                      compactView ? "h-5 w-5 p-0" : "h-6 w-6 p-0"
                    )}
                    onClick={(e) => handleTicketSelect(e, ticket.id)}
                  >
                    {isSelected ? (
                      <CheckSquare className={cn(
                        "text-primary",
                        compactView ? "w-3 h-3" : "w-4 h-4"
                      )} />
                    ) : (
                      <Square className={cn(
                        "text-muted-foreground hover:text-foreground",
                        compactView ? "w-3 h-3" : "w-4 h-4"
                      )} />
                    )}
                  </Button>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className={cn(
                        "font-medium text-foreground flex-shrink-0",
                        compactView && "text-sm"
                      )}>
                        #{ticket.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn(
                          "font-medium text-foreground truncate",
                          compactView && "text-sm"
                        )}>
                          {ticket.client}
                        </div>
                        {!compactView && (
                          <div className="text-sm text-muted-foreground truncate">
                            {ticket.subject}
                          </div>
                        )}
                      </div>
                      {ticket.unread && (
                        <Badge variant="destructive" className={cn(
                          "flex-shrink-0 animate-pulse shadow-soft",
                          compactView ? "text-[10px] px-1 py-0" : "text-2xs"
                        )}>
                          Nova
                        </Badge>
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex items-center flex-shrink-0",
                      compactView ? "space-x-2" : "space-x-3"
                    )}>
                      <Badge className={cn(
                        "border",
                        getStatusColor(ticket.status),
                        compactView ? "text-[10px] px-1" : "text-2xs"
                      )}>
                        {compactView ? ticket.status.slice(0, 3) : ticket.status}
                      </Badge>
                      
                      <Badge variant="outline" className={cn(
                        "border-border",
                        compactView ? "text-[10px] px-1" : "text-2xs"
                      )}>
                        {typeof getChannelIcon(ticket.channel) === 'string' 
                          ? getChannelIcon(ticket.channel)
                          : (compactView ? ticket.channel.slice(0, 3) : ticket.channel)
                        }
                      </Badge>
                      
                      {!compactView && (
                        <>
                          <div className="text-sm text-muted-foreground min-w-0">
                            {ticket.lastMessage}
                          </div>
                          {ticket.agent && (
                            <div className="text-2xs text-foreground font-medium bg-muted/40 px-2 py-1 rounded-md">
                              {ticket.agent}
                            </div>
                          )}
                        </>
                      )}
                      
                      {compactView && ticket.agent && (
                        <div className="text-xs text-foreground font-medium bg-muted/40 px-1 py-0.5 rounded text-center min-w-0">
                          <User className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {compactView && (
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      {ticket.subject}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
