export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF/CNPJ
  documentType: 'cpf' | 'cnpj';
  company?: string;
  position?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'ativo' | 'inativo' | 'suspenso' | 'prospect';
  category: 'bronze' | 'prata' | 'ouro' | 'diamante';
  channel: 'whatsapp' | 'email' | 'telefone' | 'site' | 'indicacao' | 'marketplace';
  tags: string[];
  notes: string;
  customerSince: string;
  lastInteraction: string;
  totalOrders: number;
  totalValue: number;
  averageTicket: number;
  responsibleAgent: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search: string;
  status: string;
  category: string;
  channel: string;
  dateRange: {
    start: string;
    end: string;
  };
  agent: string;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  prospects: number;
  newThisMonth: number;
  totalValue: number;
  averageTicket: number;
} 