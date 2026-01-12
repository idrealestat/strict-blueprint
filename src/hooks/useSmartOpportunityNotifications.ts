/**
 * useSmartOpportunityNotifications.ts
 * Hook لإشعارات الفرص الذكية الجديدة
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

interface SmartOpportunityNotification {
  id: string;
  type: 'new_opportunity' | 'match_found';
  title: string;
  message: string;
  similarity_score: number;
  other_item_title: string;
  other_broker_name?: string;
  opportunity_key: string;
  created_at: string;
  is_read: boolean;
}

export function useSmartOpportunityNotifications() {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [opportunities, setOpportunities] = useState<SmartOpportunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // إنشاء إشعار فرصة ذكية جديدة
  const notifyNewOpportunity = useCallback(async (data: {
    similarity_score: number;
    other_item_title: string;
    other_broker_name?: string;
    opportunity_key: string;
    type: 'offer_to_request' | 'request_to_offer';
  }) => {
    if (!user) return;

    const isOffer = data.type === 'offer_to_request';
    const title = isOffer 
      ? '🎯 فرصة ذكية جديدة - عرض مطابق!'
      : '🎯 فرصة ذكية جديدة - طلب مطابق!';
    
    const message = `تم العثور على ${isOffer ? 'عرض' : 'طلب'} يطابق ${isOffer ? 'طلبك' : 'عرضك'} بنسبة ${data.similarity_score}% - ${data.other_item_title}`;

    // إنشاء إشعار في قاعدة البيانات
    await createNotification({
      title,
      message,
      notification_type: 'insight',
      category: 'smart_opportunity',
      priority: data.similarity_score >= 80 ? 'high' : 'normal',
      related_entity_type: 'smart_opportunity',
      related_entity_id: data.opportunity_key,
      action_url: '/app/smart-opportunities',
      metadata: {
        similarity_score: data.similarity_score,
        other_item_title: data.other_item_title,
        other_broker_name: data.other_broker_name,
        opportunity_type: data.type,
      },
    });
  }, [user, createNotification]);

  // جلب عدد الفرص الذكية الجديدة غير المقروءة
  const fetchUnreadOpportunitiesCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'smart_opportunity')
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching smart opportunity notifications:', error);
    }
  }, [user]);

  // جلب إشعارات الفرص الذكية
  const fetchOpportunityNotifications = useCallback(async () => {
    if (!user) {
      setOpportunities([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'smart_opportunity')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const formatted = data.map(n => {
          const metadata = n.metadata as any || {};
          return {
            id: n.id,
            type: 'new_opportunity' as const,
            title: n.title,
            message: n.message,
            similarity_score: metadata.similarity_score || 0,
            other_item_title: metadata.other_item_title || '',
            other_broker_name: metadata.other_broker_name,
            opportunity_key: n.related_entity_id || '',
            created_at: n.created_at,
            is_read: n.is_read || false,
          };
        });
        setOpportunities(formatted);
        setUnreadCount(formatted.filter(o => !o.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching opportunity notifications:', error);
    }
  }, [user]);

  // تحديد إشعار كمقروء
  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setOpportunities(prev => 
      prev.map(o => o.id === id ? { ...o, is_read: true } : o)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // تحديد الكل كمقروء
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('category', 'smart_opportunity')
      .eq('is_read', false);

    setOpportunities(prev => prev.map(o => ({ ...o, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  useEffect(() => {
    fetchOpportunityNotifications();
  }, [fetchOpportunityNotifications]);

  // الاستماع للتغييرات في الوقت الفعلي
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('smart_opportunity_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif.category === 'smart_opportunity') {
            fetchOpportunityNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchOpportunityNotifications]);

  return {
    opportunities,
    unreadCount,
    notifyNewOpportunity,
    markAsRead,
    markAllAsRead,
    refetch: fetchOpportunityNotifications,
  };
}
