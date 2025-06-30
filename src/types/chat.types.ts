export interface Message {
  id: string;
  ticket_id: string;
  content: string;
  sender: 'client' | 'agent';
  sender_name: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'file';
  metadata?: {
    is_from_client?: boolean;
    is_test_message?: boolean;
    message_type?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

export interface ChatInputEvent extends React.KeyboardEvent<HTMLInputElement> {
  key: string;
  shiftKey: boolean;
}

export interface WhatsAppTicket {
  id: string;
  status: 'open' | 'pending' | 'closed';
  phone: string;
  message: string;
  customer?: {
    name: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ActiveConversation {
  id: string;
  isOpen: boolean;
  lastMessage: string;
  customer: {
    name: string;
    phone: string;
  };
  unreadCount: number;
  lastActivity: string;
} 