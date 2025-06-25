
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface TicketHeaderProps {
  sector: any;
  ticketCounts: {
    nonVisualized: number;
    total: number;
  };
  onOpenAddTicket: () => void;
}

export const TicketHeader = ({ sector, ticketCounts, onOpenAddTicket }: TicketHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900">{sector.name}</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('Filter by non-visualized')}
          >
            <Badge variant="destructive" className="mr-2">
              {ticketCounts.nonVisualized}
            </Badge>
            Não Visualizados
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('Show all tickets')}
          >
            <Badge variant="secondary" className="mr-2">
              {ticketCounts.total}
            </Badge>
            Total
          </Button>
        </div>
      </div>
      
      <Button onClick={onOpenAddTicket}>
        <Plus className="w-4 h-4 mr-2" />
        Novo Ticket
      </Button>
    </div>
  );
};
