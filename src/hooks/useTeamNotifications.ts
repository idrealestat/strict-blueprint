/**
 * useTeamNotifications.ts
 * Hook لإدارة إشعارات الفريق
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export interface TeamNotification {
  id: string;
  organization_user_id: string;
  recipient_user_id: string;
  sender_user_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export function useTeamNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_notifications')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedNotifications = (data || []) as TeamNotification[];
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('[useTeamNotifications] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // تحديد إشعار كمقروء
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('team_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[markAsRead] Error:', error);
    }
  }, [user]);

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('team_notifications')
        .update({ is_read: true })
        .eq('recipient_user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[markAllAsRead] Error:', error);
    }
  }, [user]);

  // إرسال إشعار جديد
  const sendNotification = useCallback(async (params: {
    recipientUserId: string;
    organizationUserId: string;
    type: TeamNotification['notification_type'];
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('team_notifications').insert({
        organization_user_id: params.organizationUserId,
        recipient_user_id: params.recipientUserId,
        sender_user_id: user.id,
        notification_type: params.type,
        title: params.title,
        message: params.message,
        related_entity_type: params.relatedEntityType || null,
        related_entity_id: params.relatedEntityId || null,
        metadata: params.metadata || {},
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[sendNotification] Error:', error);
      return false;
    }
  }, [user]);

  // تحميل البيانات
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // الاشتراك في الإشعارات الحية
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('team-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as TeamNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    sendNotification,
    refresh: fetchNotifications,
  };
}
