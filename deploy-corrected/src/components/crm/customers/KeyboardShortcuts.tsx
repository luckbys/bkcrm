import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Keyboard, 
  Plus, 
  Search, 
  Download, 
  Filter, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MessageCircle,
  Settings,
  Command
} from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutHandlers {
  onAddCustomer: () => void;
  onSearch: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onToggleFilters: () => void;
  onToggleView: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onFirstCustomer: () => void;
  onLastCustomer: () => void;
}

const shortcuts = [
  {
    category: 'Navegação Geral',
    icon: <Command className="w-4 h-4" />,
    items: [
      { keys: ['Ctrl', 'N'], description: 'Novo cliente', action: 'onAddCustomer' },
      { keys: ['Ctrl', 'F'], description: 'Buscar cliente', action: 'onSearch' },
      { keys: ['Ctrl', 'E'], description: 'Exportar dados', action: 'onExport' },
      { keys: ['F5'], description: 'Atualizar lista', action: 'onRefresh' },
      { keys: ['Ctrl', 'L'], description: 'Limpar filtros', action: 'onClearFilters' },
      { keys: ['?'], description: 'Mostrar atalhos', action: 'onShowHelp' }
    ]
  },
  {
    category: 'Filtros e Visualização',
    icon: <Filter className="w-4 h-4" />,
    items: [
      { keys: ['Ctrl', 'Shift', 'F'], description: 'Alternar filtros avançados', action: 'onToggleFilters' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Alternar modo de visualização', action: 'onToggleView' },
      { keys: ['Ctrl', 'Shift', '1'], description: 'Filtrar por ativos', action: 'onFilterActive' },
      { keys: ['Ctrl', 'Shift', '2'], description: 'Filtrar por inativos', action: 'onFilterInactive' },
      { keys: ['Ctrl', 'Shift', '3'], description: 'Filtrar por prospects', action: 'onFilterProspects' }
    ]
  },
  {
    category: 'Seleção e Navegação',
    icon: <Eye className="w-4 h-4" />,
    items: [
      { keys: ['Ctrl', 'A'], description: 'Selecionar todos', action: 'onSelectAll' },
      { keys: ['Escape'], description: 'Limpar seleção', action: 'onClearSelection' },
      { keys: ['↑', '↓'], description: 'Navegar entre clientes', action: 'navigation' },
      { keys: ['Home'], description: 'Primeiro cliente', action: 'onFirstCustomer' },
      { keys: ['End'], description: 'Último cliente', action: 'onLastCustomer' },
      { keys: ['Enter'], description: 'Ver detalhes do cliente', action: 'onViewCustomer' }
    ]
  },
  {
    category: 'Ações do Cliente',
    icon: <Settings className="w-4 h-4" />,
    items: [
      { keys: ['Ctrl', 'Enter'], description: 'Editar cliente selecionado', action: 'onEditCustomer' },
      { keys: ['Delete'], description: 'Excluir cliente selecionado', action: 'onDeleteCustomer' },
      { keys: ['Ctrl', 'P'], description: 'Ligar para cliente', action: 'onCallCustomer' },
      { keys: ['Ctrl', 'M'], description: 'Enviar email', action: 'onEmailCustomer' },
      { keys: ['Ctrl', 'W'], description: 'Enviar WhatsApp', action: 'onWhatsAppCustomer' }
    ]
  }
];

export const KeyboardShortcuts = ({ isOpen, onClose }: KeyboardShortcutsProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5" />
            <span>Atalhos de Teclado</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcuts.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  {category.icon}
                  <span>{category.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.description}</span>
                    <div className="flex items-center space-x-1">
                      {item.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center space-x-1">
                          {keyIndex > 0 && (
                            <span className="text-xs text-gray-400">+</span>
                          )}
                          <Badge variant="secondary" className="px-2 py-1 text-xs font-mono">
                            {key}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="text-center text-sm text-gray-600">
          <p>Pressione <Badge variant="secondary" className="px-2 py-1 text-xs">?</Badge> a qualquer momento para ver estes atalhos</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook para gerenciar atalhos de teclado
export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, shiftKey, key, code } = event;
    
    // Ignorar se estiver digitando em um input
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable')
    )) {
      return;
    }

    // Atalhos principais
    if (ctrlKey && !shiftKey) {
      switch (key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          handlers.onAddCustomer();
          break;
        case 'f':
          event.preventDefault();
          handlers.onSearch();
          break;
        case 'e':
          event.preventDefault();
          handlers.onExport();
          break;
        case 'a':
          event.preventDefault();
          handlers.onSelectAll();
          break;
        case 'p':
          event.preventDefault();
          // handlers.onCallCustomer();
          break;
        case 'm':
          event.preventDefault();
          // handlers.onEmailCustomer();
          break;
        case 'w':
          event.preventDefault();
          // handlers.onWhatsAppCustomer();
          break;
        case 'l':
          event.preventDefault();
          // handlers.onClearFilters();
          break;
      }
    }

    // Atalhos com Ctrl + Shift
    if (ctrlKey && shiftKey) {
      switch (key.toLowerCase()) {
        case 'f':
          event.preventDefault();
          handlers.onToggleFilters();
          break;
        case 'v':
          event.preventDefault();
          handlers.onToggleView();
          break;
        case '1':
          event.preventDefault();
          // handlers.onFilterActive();
          break;
        case '2':
          event.preventDefault();
          // handlers.onFilterInactive();
          break;
        case '3':
          event.preventDefault();
          // handlers.onFilterProspects();
          break;
      }
    }

    // Atalhos simples
    if (!ctrlKey && !shiftKey) {
      switch (key) {
        case 'F5':
          event.preventDefault();
          handlers.onRefresh();
          break;
        case 'Escape':
          event.preventDefault();
          handlers.onClearSelection();
          break;
        case 'Home':
          event.preventDefault();
          handlers.onFirstCustomer();
          break;
        case 'End':
          event.preventDefault();
          handlers.onLastCustomer();
          break;
        case '?':
          event.preventDefault();
          // handlers.onShowHelp();
          break;
      }
    }

    // Teclas especiais
    switch (code) {
      case 'Delete':
        if (!ctrlKey && !shiftKey) {
          event.preventDefault();
          // handlers.onDeleteCustomer();
        }
        break;
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Componente para mostrar dicas de atalhos
export const ShortcutHint = ({ 
  shortcut, 
  description, 
  className = '' 
}: { 
  shortcut: string[];
  description: string;
  className?: string;
}) => {
  return (
    <div className={`flex items-center space-x-2 text-xs text-gray-500 ${className}`}>
      <span>{description}:</span>
      <div className="flex items-center space-x-1">
        {shortcut.map((key, index) => (
          <div key={index} className="flex items-center space-x-1">
            {index > 0 && <span>+</span>}
            <Badge variant="outline" className="px-1 py-0 text-xs">
              {key}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}; 