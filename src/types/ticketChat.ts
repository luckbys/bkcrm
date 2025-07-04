export interface LocalMessage {
  id: string;
  content: string;
  sender: 'client' | 'agent';
  timestamp: number;
  isInternal?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  metadata?: {
    attachments?: {
      type: string;
      url: string;
      name: string;
      size?: number;
    }[];
    quotedMessage?: {
      id: string;
      content: string;
      sender: string;
    };
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: 'agent' | 'client';
  avatar?: string;
}

export interface ChatSession {
  id: string;
  participants: ChatParticipant[];
  messages: LocalMessage[];
  status: 'active' | 'closed';
  createdAt: number;
  updatedAt: number;
  metadata?: {
    departmentId?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}

export interface ChatStore {
  sessions: Record<string, ChatSession>;
  currentSession?: string;
  connect: () => void;
  disconnect: () => void;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  sendMessage: (message: Omit<LocalMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<LocalMessage>) => void;
  deleteMessage: (messageId: string) => void;
} 