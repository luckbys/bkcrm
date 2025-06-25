import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function RealtimeIndicator() {
  const { isConnected, unreadCount } = useRealtimeNotifications();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
      <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
        {isConnected ? 'Online' : 'Offline'}
      </Badge>
      {unreadCount > 0 && (
        <Badge variant="destructive" className="text-xs">
          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
} 