import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
}

export function useNotifications(userId: string | null) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (userId) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = data as Notification[];
      const unreadCount = notifications.filter(n => !n.read).length;

      setState({
        notifications,
        unreadCount,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          setState(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1
          }));
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotification = payload.new as Notification;
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            ),
            unreadCount: prev.notifications.filter(n => !n.read).length
          }));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== deletedId),
            unreadCount: prev.notifications.filter(n => !n.read && n.id !== deletedId).length
          }));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setState(prev => {
        const notifications = prev.notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        return {
          ...prev,
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setState(prev => {
        const notifications = prev.notifications.filter(n => n.id !== notificationId);
        return {
          ...prev,
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      throw error;
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      throw error;
    }
  };

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refresh: loadNotifications
  };
} 