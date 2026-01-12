/**
 * useSmartOpportunityNotifications.ts
 * Hook لإشعارات الفرص الذكية الجديدة
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { getSmartOpportunitiesPreferences } from '@/components/settings/SmartOpportunitiesSettings';

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
    purpose?: 'sale' | 'rent';
    category?: 'residential' | 'commercial';
  }) => {
    if (!user) return;

    // التحقق من إعدادات المستخدم
    const prefs = getSmartOpportunitiesPreferences();
    
    // إذا كانت الإشعارات معطلة
    if (!prefs.notificationsEnabled) return;
    
    // التحقق من الحد الأدنى لنسبة التطابق
    if (data.similarity_score < prefs.minMatchScore) return;
    
    // التحقق من نوع التطابق
    const isListingMatch = data.type === 'offer_to_request';
    if (isListingMatch && !prefs.enableListingMatches) return;
    if (!isListingMatch && !prefs.enableRequestMatches) return;
    
    // التحقق من نوع الصفقة
    if (data.purpose === 'sale' && !prefs.notifyForSale) return;
    if (data.purpose === 'rent' && !prefs.notifyForRent) return;
    
    // التحقق من تصنيف العقار
    if (data.category === 'residential' && !prefs.notifyForResidential) return;
    if (data.category === 'commercial' && !prefs.notifyForCommercial) return;

    const isOffer = data.type === 'offer_to_request';
    const title = isOffer 
      ? '🎯 فرصة ذكية جديدة - عرض مطابق!'
      : '🎯 فرصة ذكية جديدة - طلب مطابق!';
    
    const message = `تم العثور على ${isOffer ? 'عرض' : 'طلب'} يطابق ${isOffer ? 'طلبك' : 'عرضك'} بنسبة ${data.similarity_score}% - ${data.other_item_title}`;

    // تشغيل صوت الإشعار إذا كان مفعلاً
    if (prefs.soundEnabled) {
      playNotificationSound();
    }

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

  // تشغيل صوت الإشعار
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // نغمة صاعدة للفرصة الجديدة
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
      oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3); // C6
      
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  };

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
