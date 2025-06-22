// 🎯 TIPOS CORE DO SISTEMA DE CHAT MODERNO
// Arquitetura robusta com TypeScript

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
export type MessageSender = 'client' | 'agent' | 'system';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  sender: MessageSender;
  senderName: string;
  senderId?: string;
  timestamp: Date;
  isInternal: boolean;
  status: MessageStatus;
  metadata?: {
    isEdited?: boolean;
    editedAt?: Date;
    replyTo?: string;
    mentions?: string[];
    reactions?: Array<{
      emoji: string;
      userId: string;
      userName: string;
    }>;
    attachment?: {
      url: string;
      name: string;
      size: number;
      mimeType: string;
    };
    whatsapp?: {
      messageId: string;
      instanceName: string;
      fromPhone: string;
    };
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: 'client' | 'agent' | 'admin';
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ChatChannel {
  id: string;
  type: 'whatsapp' | 'email' | 'chat' | 'sms';
  name: string;
  isActive: boolean;
  settings: {
    allowFileUpload: boolean;
    allowVoiceMessages: boolean;
    allowEmojis: boolean;
    autoTranslate: boolean;
    notifications: boolean;
  };
}

export interface ChatState {
  isLoading: boolean;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastActivity: Date | null;
  unreadCount: number;
  isTyping: boolean;
  typingUsers: string[];
  error: string | null;
}

export interface ChatActions {
  sendMessage: (content: string, isInternal?: boolean) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  setTyping: (isTyping: boolean) => void;
  refreshMessages: () => Promise<void>;
  searchMessages: (query: string) => ChatMessage[];
}

export interface ChatConfiguration {
  ticketId: string;
  channel: ChatChannel;
  participants: ChatParticipant[];
  settings: {
    realTimeEnabled: boolean;
    fallbackToDatabase: boolean;
    autoSave: boolean;
    maxMessageLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
    showTimestamps: boolean;
    showReadReceipts: boolean;
    enableReactions: boolean;
    enableReplies: boolean;
  };
}

export interface ChatStore {
  messages: ChatMessage[];
  state: ChatState;
  configuration: ChatConfiguration;
  actions: ChatActions;
}

// 🔧 Hook Return Types
export interface UseChatReturn {
  // Estado
  messages: ChatMessage[];
  state: ChatState;
  
  // Ações principais
  sendMessage: (content: string, isInternal?: boolean) => Promise<void>;
  refreshMessages: () => Promise<void>;
  
  // Utilitários
  searchMessages: (query: string) => ChatMessage[];
  getMessageById: (id: string) => ChatMessage | undefined;
  
  // Estados derivados
  hasUnreadMessages: boolean;
  lastMessage: ChatMessage | null;
  
  // Configuração
  configuration: ChatConfiguration;
}

// 🎨 UI Component Props
export interface ChatModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  className?: string;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReaction?: (message: ChatMessage, emoji: string) => void;
}

export interface ChatInputProps {
  onSend: (content: string, isInternal?: boolean) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  allowFileUpload?: boolean;
  allowEmojis?: boolean;
  className?: string;
}

export interface ChatHeaderProps {
  participant: ChatParticipant;
  channel: ChatChannel;
  state: ChatState;
  onClose: () => void;
  onMinimize?: () => void;
  onSettings?: () => void;
}

// 🔗 Provider Types
export interface ChatProviderProps {
  children: React.ReactNode;
  configuration: ChatConfiguration;
}

export interface ChatContextValue {
  store: ChatStore;
  subscribe: (callback: (store: ChatStore) => void) => () => void;
  dispatch: (action: ChatAction) => void;
}

// 🎯 Action Types
export type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_TYPING'; payload: { userId: string; isTyping: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'ADD_REACTION'; payload: { messageId: string; emoji: string; userId: string; userName: string } }
  | { type: 'REMOVE_REACTION'; payload: { messageId: string; emoji: string; userId: string } };

// 🌐 API Types
export interface SendMessageRequest {
  content: string;
  isInternal: boolean;
  replyTo?: string;
  mentions?: string[];
  attachment?: File;
}

export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

export interface MessageSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    sender?: MessageSender;
    type?: MessageType;
    dateFrom?: Date;
    dateTo?: Date;
    isInternal?: boolean;
  };
}

export interface MessageSearchResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

// 🎭 Theme Types
export interface ChatTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Tipos específicos para o hook useChatSocket
export interface SocketTypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface SocketConnectionStatus {
  status: 'connected' | 'error' | 'connecting';
  text: string;
  color: string;
}

export interface SocketChatStats {
  total: number;
  clientMessages: number;
  agentMessages: number;
  internalNotes: number;
} 