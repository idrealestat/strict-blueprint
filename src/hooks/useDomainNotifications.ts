/**
 * useDomainNotifications.ts
 * إدارة إشعارات طلبات النطاقات
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DomainNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'approval' | 'rejection' | 'revocation' | 'new_request';
  request_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useDomainNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DomainNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('domain_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        notification_type: item.notification_type as DomainNotification['notification_type']
      }));

      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching domain notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // وضع علامة مقروء
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('domain_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // وضع علامة مقروء على الكل
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('domain_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // الاستماع للتغييرات في الوقت الفعلي
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // الاشتراك في الإشعارات الجديدة
    const channel = supabase
      .channel('domain_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'domain_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            notification_type: (payload.new as any).notification_type as DomainNotification['notification_type']
          } as DomainNotification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // إرسال حدث للنظام العام
          window.dispatchEvent(
            new CustomEvent('addNotification', {
              detail: {
                title: newNotification.title,
                message: newNotification.message,
                type: newNotification.notification_type === 'approval' ? 'success' 
                    : newNotification.notification_type === 'rejection' ? 'error'
                    : newNotification.notification_type === 'revocation' ? 'warning'
                    : 'info',
                category: 'system',
              },
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
