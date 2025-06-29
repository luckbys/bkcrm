export const PRIORITY_LABELS = {
  high: 'Alta',
  normal: 'Normal',
  low: 'Baixa'
} as const;

export const PRIORITY_ICONS = {
  high: '🔴',
  normal: '🟡',
  low: '🟢'
} as const;

export const DEPARTMENT_ICONS = {
  default: '🏢',
  support: '🎧',
  sales: '💰',
  marketing: '📢',
  development: '💻',
  finance: '💳',
  hr: '👥',
  legal: '⚖️',
  operations: '⚙️',
  logistics: '🚚'
} as const;

export const DEPARTMENT_COLORS = {
  default: 'blue',
  support: 'indigo',
  sales: 'green',
  marketing: 'purple',
  development: 'blue',
  finance: 'emerald',
  hr: 'pink',
  legal: 'slate',
  operations: 'amber',
  logistics: 'orange'
} as const;

export const USER_STATUS = {
  online: {
    label: 'Online',
    color: 'text-green-500'
  },
  away: {
    label: 'Ausente',
    color: 'text-yellow-500'
  },
  busy: {
    label: 'Ocupado',
    color: 'text-red-500'
  },
  offline: {
    label: 'Offline',
    color: 'text-slate-400'
  }
} as const;

export const ERROR_MESSAGES = {
  loading: 'Erro ao carregar departamentos',
  empty: 'Nenhum departamento encontrado',
  emptySubtitle: 'Aguarde a configuração do sistema',
  retry: 'Tentar Novamente'
} as const; 