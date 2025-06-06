// ⚠️ DEPRECATED: Este arquivo contém dados mock de tickets
// Use o hook useTicketsDB() em vez deste arquivo
// Os dados agora vêm do banco de dados Supabase

console.warn('⚠️ DEPRECATED: src/data/tickets.ts - Use useTicketsDB() hook instead');

export interface MockTicket {
  id: number;
  client: string;
  subject: string;
  status: 'pendente' | 'atendimento' | 'finalizado' | 'cancelado';
  channel: string;
  lastMessage: string;
  unread: boolean;
  priority: 'alta' | 'normal' | 'baixa';
  agent?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  description?: string;
}

// Dados mock mantidos apenas para compatibilidade durante a migração
export const mockTickets: MockTicket[] = [
  {
    id: 1234,
    client: 'João Silva',
    subject: 'Problema com sistema de login',
    status: 'pendente',
    channel: 'whatsapp',
    lastMessage: '2 min atrás',
    unread: true,
    priority: 'alta',
    agent: 'Não atribuído',
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
    tags: ['login', 'urgente'],
    description: 'Cliente não consegue acessar sua conta há 2 dias'
  },
  {
    id: 1235,
    client: 'Maria Santos',
    subject: 'Dúvida sobre produto premium',
    status: 'atendimento',
    channel: 'email',
    lastMessage: '15 min atrás',
    unread: false,
    priority: 'normal',
    agent: 'Ana Costa',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    tags: ['produto', 'premium'],
    description: 'Quer entender as funcionalidades do plano premium'
  },
  {
    id: 1236,
    client: 'Pedro Costa',
    subject: 'Solicitação de cancelamento',
    status: 'finalizado',
    channel: 'telefone',
    lastMessage: '1 hora atrás',
    unread: false,
    priority: 'baixa',
    agent: 'Carlos Silva',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    tags: ['cancelamento'],
    description: 'Processo de cancelamento finalizado com sucesso'
  },
  {
    id: 1237,
    client: 'Ana Oliveira',
    subject: 'Integração API não funcionando',
    status: 'pendente',
    channel: 'chat',
    lastMessage: '5 min atrás',
    unread: true,
    priority: 'alta',
    agent: 'Não atribuído',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
    tags: ['api', 'integração', 'técnico'],
    description: 'Erro 500 ao fazer chamadas para a API'
  },
  {
    id: 1238,
    client: 'Roberto Lima',
    subject: 'Cobrança indevida',
    status: 'atendimento',
    channel: 'whatsapp',
    lastMessage: '30 min atrás',
    unread: false,
    priority: 'normal',
    agent: 'Fernanda Souza',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    tags: ['financeiro', 'cobrança'],
    description: 'Cliente questiona cobrança no cartão'
  }
];

export default mockTickets; 