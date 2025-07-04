export interface ChatMessage {
  id: string;
  sender: 'client' | 'agent';
  content: string;
  timestamp: number;
  isInternal?: boolean;
}

export interface Department {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  currentTicket?: string;
  socket?: WebSocket;
  connect: () => void;
  joinTicket: (ticketId: string) => void;
  sendMessage: (message: string) => void;
  addMessage: (message: ChatMessage) => void;
}

export interface EvolutionInstance {
  id?: string;
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'unknown';
  departmentId: string;
  departmentName: string;
  phone?: string;
  connected: boolean;
  lastUpdate: Date;
  qrCode?: string;
  isDefault?: boolean;
  createdBy?: string;
}

export interface StatsResponse {
  success: boolean;
  totalInstances: number;
  connectedInstances: number;
  activeConnections: number;
}

export interface WebhookPayload {
  event: string;
  instance: string;
  data: any;
  timestamp: string;
  date_time: string;
  type?: string;
}

export interface ErrorInfo {
  type: 'api' | 'import' | 'css' | 'network' | 'runtime';
  component: string;
  message: string;
  stack?: any;
  url?: string;
  timestamp: Date;
}

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export type DocumentType = 'cpf' | 'cnpj' | 'other'; 