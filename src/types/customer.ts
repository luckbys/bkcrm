export type DocumentType = 'cpf' | 'cnpj' | 'passport' | 'other';
export type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'blocked';
export type CustomerCategory = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: DocumentType;
  company: string;
  position: string;
  address: CustomerAddress;
  status: CustomerStatus;
  category: CustomerCategory;
  channel: string;
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

export interface CustomerFromDB {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  document_type: DocumentType;
  company: string | null;
  position: string | null;
  address: CustomerAddress;
  status: CustomerStatus;
  category: CustomerCategory;
  channel: string;
  tags: string[];
  notes: string | null;
  last_interaction: string | null;
  total_orders: number;
  total_value: number;
  average_ticket: number;
  responsible_agent_id: string | null;
  created_at: string;
  updated_at: string;
  responsible_agent: {
    name: string;
  } | null;
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