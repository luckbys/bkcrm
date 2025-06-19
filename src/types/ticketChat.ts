export interface LocalMessage {
  id: number;
  content: string;
  sender: 'client' | 'agent';
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio' | 'internal' | 'system';
  status: 'sent' | 'delivered' | 'read';
  isInternal?: boolean;
  attachments: {
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
  }[];
}

export interface QuickTemplate {
  id: number;
  title: string;
  content: string;
  category: string;
}

export interface TicketChatProps {
  ticket: any;
  onClose: () => void;
  onMinimize?: () => void;
}

export interface UseTicketChatReturn {
  // Estados principais
  message: string;
  setMessage: (message: string) => void;
  isInternal: boolean;
  setIsInternal: (isInternal: boolean) => void;
  isSending: boolean;
  isTyping: boolean;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  unreadCount: number;
  lastSentMessage: number | null;
  
  // Estados UX
  messageSearchTerm: string;
  setMessageSearchTerm: (term: string) => void;
  showSearchResults: boolean;
  filteredMessages: LocalMessage[];
  messageFilter: 'all' | 'internal' | 'public';
  setMessageFilter: (filter: 'all' | 'internal' | 'public') => void;
  favoriteMessages: Set<number>;
  quickReplyVisible: boolean;
  setQuickReplyVisible: (visible: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  autoScrollEnabled: boolean;
  setAutoScrollEnabled: (enabled: boolean) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  
  // Estados do ticket
  currentTicket: any;
  setCurrentTicket: (ticket: any) => void;
  
  // Estados modais
  showAssignModal: boolean;
  setShowAssignModal: (show: boolean) => void;
  showStatusModal: boolean;
  setShowStatusModal: (show: boolean) => void;
  showTagModal: boolean;
  setShowTagModal: (show: boolean) => void;
  showCustomerModal: boolean;
  setShowCustomerModal: (show: boolean) => void;
  
  // Mensagens
  realTimeMessages: LocalMessage[];
  isLoadingHistory: boolean;
  
  // Sidebar
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  
  // WhatsApp
  whatsappStatus: 'connected' | 'disconnected' | 'unknown';
  whatsappInstance: string | null;
  
  // 🚀 Realtime
  isRealtimeConnected: boolean;
  lastUpdateTime: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  refreshMessages: () => Promise<void>;
  
  // Funções
  handleSendMessage: () => Promise<void>;
  toggleMinimize: () => void;
  toggleMessageFavorite: (messageId: number) => void;
  handleTemplateSelect: (template: QuickTemplate) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  getRealTicketId: (ticketId: number | string) => Promise<string | null>;
  toggleSidebar: () => void;
} 