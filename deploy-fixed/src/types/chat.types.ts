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