// ⚠️ DEPRECATED: Este arquivo contém dados mock de tickets
// Use o hook useTicketsDB() em vez deste arquivo
// Os dados agora vêm do banco de dados Supabase
console.warn('⚠️ DEPRECATED: src/data/tickets.ts - Use useTicketsDB() hook instead');
// Dados mock mantidos apenas para compatibilidade durante a migração
export const mockTickets = [
    {
        id: 1234,
        client: 'João Silva',
        subject: 'Problema com sistema de login',
        status: 'pendente',
        channel: 'chat',
        lastMessage: '2 min atrás',
        unread: true,
        priority: 'alta',
        agent: 'Não atribuído',
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000),
        tags: ['login', 'urgente', 'whatsapp'],
        description: 'Cliente não consegue acessar sua conta há 2 dias',
        metadata: {
            evolution_instance_name: 'suporte-principal',
            client_phone: '5511999998888',
            client_name: 'João Silva',
            created_from_whatsapp: true
        }
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
        tags: ['api', 'integração', 'técnico', 'whatsapp'],
        description: 'Erro 500 ao fazer chamadas para a API',
        metadata: {
            evolution_instance_name: 'tecnico-principal',
            client_phone: '5511987654321',
            client_name: 'Ana Oliveira',
            created_from_whatsapp: true
        }
    },
    {
        id: 1238,
        client: 'Roberto Lima',
        subject: 'Cobrança indevida',
        status: 'atendimento',
        channel: 'email',
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
