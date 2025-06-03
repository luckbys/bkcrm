
import { useState } from 'react';
import { TicketChat } from './TicketChat';
import { TicketHeader } from './ticket-management/TicketHeader';
import { TicketFilters } from './ticket-management/TicketFilters';
import { TicketsList } from './ticket-management/TicketsList';

interface TicketManagementProps {
  sector: any;
  onOpenAddTicket: () => void;
}

export const TicketManagement = ({ sector, onOpenAddTicket }: TicketManagementProps) => {
  const [filters, setFilters] = useState({
    responsible: 'todos',
    status: 'todos',
    channel: '',
    tags: '',
    agent: '',
    client: '',
    cnpj: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketCounts, setTicketCounts] = useState({
    nonVisualized: sector.nonVisualized || 0,
    total: sector.total || 0
  });

  const mockTickets = [
    {
      id: 1234,
      client: 'João Silva',
      subject: 'Problema com sistema',
      status: 'pendente',
      channel: 'whatsapp',
      lastMessage: '2 min atrás',
      unread: true,
      priority: 'alta'
    },
    {
      id: 1235,
      client: 'Maria Santos',
      subject: 'Dúvida sobre produto',
      status: 'atendimento',
      channel: 'email',
      lastMessage: '15 min atrás',
      unread: false,
      priority: 'normal'
    },
    {
      id: 1236,
      client: 'Pedro Costa',
      subject: 'Solicitação de cancelamento',
      status: 'finalizado',
      channel: 'telefone',
      lastMessage: '1 hora atrás',
      unread: false,
      priority: 'baixa'
    }
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="space-y-6">
      <TicketHeader 
        sector={sector}
        ticketCounts={ticketCounts}
        onOpenAddTicket={onOpenAddTicket}
      />

      <TicketFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <TicketsList 
        tickets={mockTickets}
        onTicketClick={handleTicketClick}
      />

      {/* Ticket Chat Modal */}
      {selectedTicket && (
        <TicketChat 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};
