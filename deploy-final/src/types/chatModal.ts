// Estados de carregamento do modal de chat
export interface ChatLoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  stage?: 'connecting' | 'loading-messages' | 'syncing' | 'finalizing';
}

// Estados do modal
export type ModalState = 'closed' | 'minimized' | 'expanded';

// Props do modal básico
export interface TicketChatModalProps {
  ticket: any;
  onClose: () => void;
  isOpen: boolean;
}

// Configurações de performance
export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableSkeleton: boolean;
  retryAttempts: number;
  loadingTimeout: number;
}

// Interfaces de Acessibilidade
export interface AccessibilityConfig {
  enableFocusTrap?: boolean;
  enableScreenReader?: boolean;
  enableReducedMotion?: boolean;
  keyboardShortcuts?: boolean;
  highContrast?: boolean;
}

export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: 'all' | 'text' | 'additions' | 'removals';
  'aria-hidden'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  role?: string;
  tabIndex?: number;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export interface ScreenReaderMessage {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timeout?: number;
  context?: string;
} 