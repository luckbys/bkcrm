import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  X, 
  Download,
  Upload,
  RefreshCw,
  Clock,
  Users
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  progress?: number;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  }>;
  persistent?: boolean;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationSystem = ({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: NotificationSystemProps) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>(notifications);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    visibleNotifications.forEach((notification) => {
      if (!notification.persistent && notification.duration) {
        timers[notification.id] = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);
      }
    });

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [visibleNotifications, onDismiss]);

  const getIcon = (type: Notification['type']) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-600" />,
      error: <XCircle className="w-5 h-5 text-red-600" />,
      warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />
    };
    return icons[type];
  };

  const getColors = (type: Notification['type']) => {
    const colors = {
      success: 'border-green-200 bg-green-50',
      error: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50'
    };
    return colors[type];
  };

  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    };
    return positions[position];
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`}>
      {visibleNotifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`${getColors(notification.type)} border shadow-lg animate-in slide-in-from-right-full duration-300`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.persistent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(notification.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Barra de progresso */}
                {notification.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{notification.progress}%</span>
                    </div>
                    <Progress value={notification.progress} className="h-2" />
                  </div>
                )}

                {/* Ações */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex space-x-2 mt-3">
                    {notification.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.action}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Notificações pré-configuradas
  const notify = {
    success: (title: string, message: string, options?: Partial<Notification>) => 
      addNotification({ type: 'success', title, message, duration: 5000, ...options }),
    
    error: (title: string, message: string, options?: Partial<Notification>) => 
      addNotification({ type: 'error', title, message, duration: 7000, ...options }),
    
    warning: (title: string, message: string, options?: Partial<Notification>) => 
      addNotification({ type: 'warning', title, message, duration: 6000, ...options }),
    
    info: (title: string, message: string, options?: Partial<Notification>) => 
      addNotification({ type: 'info', title, message, duration: 5000, ...options }),

    // Notificações especializadas para CRM
    customerAdded: (customerName: string) => 
      notify.success(
        '✅ Cliente cadastrado',
        `${customerName} foi adicionado com sucesso`,
        {
          actions: [
            {
              label: 'Ver cliente',
              action: () => console.log('Ver cliente'),
              variant: 'outline'
            }
          ]
        }
      ),

    customerUpdated: (customerName: string) => 
      notify.success(
        '✅ Cliente atualizado',
        `Dados de ${customerName} foram atualizados`,
      ),

    customerDeleted: (customerName: string) => 
      notify.success(
        '✅ Cliente removido',
        `${customerName} foi removido do sistema`,
      ),

    exportStarted: (recordCount: number) => {
      const id = notify.info(
        '📊 Iniciando exportação',
        `Preparando ${recordCount} registros para download`,
        { 
          persistent: true, 
          progress: 0,
          actions: [
            {
              label: 'Cancelar',
              action: () => dismissNotification(id),
              variant: 'outline'
            }
          ]
        }
      );
      return id;
    },

    exportProgress: (id: string, progress: number) => 
      updateNotification(id, { 
        progress,
        message: `Processando... ${progress}% concluído`
      }),

    exportCompleted: (id: string, fileName: string) => 
      updateNotification(id, {
        type: 'success',
        title: '✅ Exportação concluída',
        message: `Arquivo ${fileName} está pronto para download`,
        progress: undefined,
        persistent: false,
        duration: 5000,
        actions: [
          {
            label: 'Download',
            action: () => console.log('Download file'),
            variant: 'default'
          }
        ]
      }),

    contactInitiated: (customerName: string, method: string) => 
      notify.info(
        `${method === 'phone' ? '📞' : method === 'email' ? '📧' : '💬'} Contato iniciado`,
        `Conectando com ${customerName} via ${method}`,
      ),

    bulkActionStarted: (action: string, count: number) => {
      const id = notify.info(
        `🔄 ${action} em lote`,
        `Processando ${count} clientes...`,
        { 
          persistent: true, 
          progress: 0 
        }
      );
      return id;
    },

    connectionError: () => 
      notify.error(
        '🔌 Erro de conexão',
        'Problema ao conectar com o servidor',
        {
          actions: [
            {
              label: 'Tentar novamente',
              action: () => window.location.reload(),
              variant: 'default'
            }
          ],
          persistent: true
        }
      ),

    filterApplied: (resultCount: number, totalCount: number) => 
      notify.info(
        '🔍 Filtros aplicados',
        `Mostrando ${resultCount} de ${totalCount} clientes`,
        { duration: 3000 }
      ),

    dataRefreshed: () => 
      notify.success(
        '🔄 Dados atualizados',
        'Lista de clientes foi atualizada',
        { duration: 3000 }
      )
  };

  return {
    notifications,
    addNotification,
    updateNotification,
    dismissNotification,
    clearAll,
    notify
  };
}; 