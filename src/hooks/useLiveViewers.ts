/**
 * useLiveViewers.ts
 * Hook لتتبع المشاهدين المباشرين للعروض
 * يستخدم Supabase Realtime لتحديث العداد في الوقت الحقيقي
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveViewerState {
  [offerId: string]: number;
}

export function useLiveViewers(offerIds: string[] = []) {
  const [liveViewers, setLiveViewers] = useState<LiveViewerState>({});
  const viewersRef = useRef<Map<string, Set<string>>>(new Map());

  // الاستماع للأحداث المحلية (من نفس التطبيق)
  useEffect(() => {
    const handleOfferViewed = (event: CustomEvent) => {
      const { offerId, viewerId } = event.detail;
      if (!offerId) return;

      // إضافة المشاهد
      if (!viewersRef.current.has(offerId)) {
        viewersRef.current.set(offerId, new Set());
      }
      const viewers = viewersRef.current.get(offerId)!;
      const uniqueViewerId = viewerId || `viewer_${Date.now()}_${Math.random()}`;
      viewers.add(uniqueViewerId);

      setLiveViewers(prev => ({
        ...prev,
        [offerId]: viewers.size,
      }));

      // إزالة المشاهد بعد 60 ثانية (تقدير مدة المشاهدة)
      setTimeout(() => {
        viewers.delete(uniqueViewerId);
        setLiveViewers(prev => ({
          ...prev,
          [offerId]: viewers.size,
        }));
      }, 60000);
    };

    const handleAdViewedLive = (event: CustomEvent) => {
      const { adId, viewerId } = event.detail;
      handleOfferViewed({ detail: { offerId: adId, viewerId } } as CustomEvent);
    };

    window.addEventListener('offerViewedWithDetails', handleOfferViewed as EventListener);
    window.addEventListener('adViewedLive', handleAdViewedLive as EventListener);

    return () => {
      window.removeEventListener('offerViewedWithDetails', handleOfferViewed as EventListener);
      window.removeEventListener('adViewedLive', handleAdViewedLive as EventListener);
    };
  }, []);

  // الاستماع للتحديثات في قاعدة البيانات (عدد المشاهدات الإجمالي)
  useEffect(() => {
    if (offerIds.length === 0) return;

    const channel = supabase
      .channel('live-viewers-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'platform_listings',
        },
        (payload) => {
          if (offerIds.includes(payload.new.id)) {
            // يمكن استخدام هذا لتحديث إحصائيات إضافية
            console.log('Listing updated:', payload.new.id, 'Views:', payload.new.views);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [offerIds]);

  // الحصول على عدد المشاهدين لعرض محدد
  const getLiveViewers = useCallback((offerId: string): number => {
    return liveViewers[offerId] || 0;
  }, [liveViewers]);

  // تسجيل مشاهدة جديدة (يُستدعى من الصفحة العامة)
  const recordView = useCallback((offerId: string, viewerId?: string) => {
    window.dispatchEvent(new CustomEvent('adViewedLive', {
      detail: { adId: offerId, viewerId }
    }));
  }, []);

  return {
    liveViewers,
    getLiveViewers,
    recordView,
  };
}

// Hook مبسط لعرض واحد
export function useSingleOfferLiveViewers(offerId?: string) {
  const [liveCount, setLiveCount] = useState(0);
  const viewersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!offerId) return;

    const handleView = (event: CustomEvent) => {
      const { adId, offerId: viewedOfferId, viewerId } = event.detail;
      const targetId = adId || viewedOfferId;
      
      if (targetId !== offerId) return;

      const uniqueViewerId = viewerId || `viewer_${Date.now()}_${Math.random()}`;
      viewersRef.current.add(uniqueViewerId);
      setLiveCount(viewersRef.current.size);

      // إزالة بعد 60 ثانية
      setTimeout(() => {
        viewersRef.current.delete(uniqueViewerId);
        setLiveCount(viewersRef.current.size);
      }, 60000);
    };

    window.addEventListener('offerViewedWithDetails', handleView as EventListener);
    window.addEventListener('adViewedLive', handleView as EventListener);

    return () => {
      window.removeEventListener('offerViewedWithDetails', handleView as EventListener);
      window.removeEventListener('adViewedLive', handleView as EventListener);
    };
  }, [offerId]);

  return liveCount;
}
