/**
 * useNotifications.ts
 * نظام الإشعارات الموحد - Unified Notifications System
 * 
 * يجمع جميع مصادر الإشعارات في مكان واحد ويخزنها في قاعدة البيانات
 * مع دعم إشعارات Push للمتصفح والجوال
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import type { Json } from '@/integrations/supabase/types';
import { showPushNotification } from './usePushNotifications';

// Use the database type directly
export type Notification = Tables<'notifications'>;

export type NotificationType = 
  | 'request' 
  | 'crm' 
  | 'offer' 
  | 'calendar' 
  | 'insight' 
  | 'publishing'
  | 'system';

export interface CreateNotificationInput {
  title: string;
  message: string;
  notification_type: NotificationType;
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  metadata?: Json;
}

export function useNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Notifications] Fetch error:', error);
    } else {
      const notifs = data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    }

    setLoading(false);
  }, [user]);

  // Create notification
  const createNotification = useCallback(async (
    input: CreateNotificationInput
  ): Promise<Notification | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: input.title,
        message: input.message,
        notification_type: input.notification_type,
        category: input.category || null,
        priority: input.priority || 'normal',
        related_entity_type: input.related_entity_type || null,
        related_entity_id: input.related_entity_id || null,
        action_url: input.action_url || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[Notifications] Create error:', error);
      return null;
    }

    return data;
  }, [user]);

  // Mark as read
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  // Mark as read by context (entity type + id)
  const markAsReadByContext = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<void> => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('related_entity_type', entityType)
      .eq('related_entity_id', entityId);

    setNotifications(prev => 
      prev.map(n => 
        n.related_entity_type === entityType && n.related_entity_id === entityId
          ? { ...n, is_read: true }
          : n
      )
    );
    
    // Recalculate unread
    setUnreadCount(prev => {
      const toMark = notifications.filter(
        n => !n.is_read && 
        n.related_entity_type === entityType && 
        n.related_entity_id === entityId
      ).length;
      return Math.max(0, prev - toMark);
    });
  }, [user, notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif && !notif.is_read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Get notifications by type
  const getByType = useCallback((type: NotificationType): Notification[] => {
    return notifications.filter(n => n.notification_type === type);
  }, [notifications]);

  // Initialize
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Play sound if enabled
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {
            // Ignore audio errors
          }

          // إرسال إشعار Push للمتصفح/الجوال
          // يعمل حتى لو كان المستخدم خارج التطبيق
          try {
            await showPushNotification(
              newNotif.title,
              newNotif.message,
              {
                type: newNotif.notification_type,
                notificationId: newNotif.id,
                entityType: newNotif.related_entity_type,
                entityId: newNotif.related_entity_id,
                actionUrl: newNotif.action_url,
                priority: newNotif.priority,
                metadata: newNotif.metadata,
              }
            );
          } catch (pushError) {
            console.log('[Notifications] Push notification not available:', pushError);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    markAsReadByContext,
    deleteNotification,
    getByType,
    refetch: fetchNotifications,
  };
}

// Utility to trigger notification from anywhere
export async function triggerNotification(
  userId: string,
  input: CreateNotificationInput
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: input.title,
      message: input.message,
      notification_type: input.notification_type,
      category: input.category || null,
      priority: input.priority || 'normal',
      related_entity_type: input.related_entity_type || null,
      related_entity_id: input.related_entity_id || null,
      action_url: input.action_url || null,
      metadata: input.metadata || {},
    });

  if (error) {
    console.error('[Notifications] Trigger error:', error);
    return false;
  }

  return true;
}
