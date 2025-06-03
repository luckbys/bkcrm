
export const sectors = [
  {
    id: 1,
    name: 'Atendimento',
    icon: 'headset',
    color: 'bg-blue-500',
    textColor: 'text-white',
    tipo: 'atendimento',
    nonVisualized: 7,
    total: 112
  },
  {
    id: 2,
    name: 'Vendas Frenty',
    icon: 'shopping-cart',
    color: 'bg-green-500',
    textColor: 'text-white',
    tipo: 'vendas',
    nonVisualized: 3,
    total: 45
  },
  {
    id: 3,
    name: 'Vendas NFEsistemas',
    icon: 'shopping-cart',
    color: 'bg-emerald-500',
    textColor: 'text-white',
    tipo: 'vendas_nfe',
    nonVisualized: 12,
    total: 89
  },
  {
    id: 4,
    name: 'Qualidade',
    icon: 'clipboard-check',
    color: 'bg-purple-500',
    textColor: 'text-white',
    tipo: 'qualidade',
    nonVisualized: 2,
    total: 23
  },
  {
    id: 5,
    name: 'Cobrança',
    icon: 'chart-bar',
    color: 'bg-red-500',
    textColor: 'text-white',
    tipo: 'cobranca',
    nonVisualized: 5,
    total: 67
  },
  {
    id: 6,
    name: 'Disparo CRM',
    icon: 'chart-line',
    color: 'bg-orange-500',
    textColor: 'text-white',
    tipo: 'disparo',
    nonVisualized: 0,
    total: 15
  },
  {
    id: 7,
    name: 'Atendimento CRM2',
    icon: 'headset',
    color: 'bg-indigo-500',
    textColor: 'text-white',
    tipo: 'atendimento_crm2',
    nonVisualized: 8,
    total: 134
  }
];

export const menuItems = [
  { name: 'Dashboard', icon: 'tachometer-alt', url: '/dashboard' },
  { name: 'Clientes', icon: 'user', url: '/clientes' },
  { name: 'Produtos', icon: 'box-open', url: '/produtos' },
  { name: 'Disparos', icon: 'chart-line', url: '/disparos' },
  { name: 'ERP Link', icon: 'sitemap', url: '/erp', external: true },
  { name: 'Tarefas', icon: 'clipboard-check', url: '/tarefas', conditional: true },
  { name: 'Processos', icon: 'clipboard-check', url: '/processos', conditional: true },
  { name: 'Kanban', icon: 'clipboard-check', url: '/kanban', conditional: true },
  { name: 'Estatísticas', icon: 'chart-bar', url: '/estatisticas' },
  { name: 'Setup', icon: 'cogs', url: '/setup' }
];

export const statusOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atendimento', label: 'Em Atendimento' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' }
];

export const channelOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'email', label: 'Email' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'site', label: 'Site' }
];

export const agentTypes = [
  { value: 'tec', label: 'TEC' },
  { value: 'ia', label: 'I.A' },
  { value: 'bot', label: 'BOT' }
];
