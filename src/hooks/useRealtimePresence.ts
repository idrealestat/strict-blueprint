/**
 * useRealtimePresence.ts
 * Hook للمشاهدات اللحظية الحقيقية باستخدام Supabase Presence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceState {
  [offerId: string]: number;
}

interface ViewerPresence {
  viewerId: string;
  offerId: string;
  joinedAt: string;
  device?: string;
  browser?: string;
  city?: string;
}

/**
 * Hook للمشاهدات اللحظية باستخدام Supabase Presence
 */
export function useRealtimePresence(offerIds: string[] = []) {
  const [liveViewers, setLiveViewers] = useState<PresenceState>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const viewerIdRef = useRef<string>(`viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (offerIds.length === 0) return;

    // إنشاء قناة Presence
    const channel = supabase.channel('live-viewers-presence', {
      config: {
        presence: {
          key: viewerIdRef.current,
        },
      },
    });

    channelRef.current = channel;

    // الاستماع للتحديثات
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<ViewerPresence>();
        
        // حساب عدد المشاهدين لكل عرض
        const viewerCounts: PresenceState = {};
        
        Object.values(state).forEach((presences: ViewerPresence[]) => {
          presences.forEach((presence) => {
            if (presence.offerId && offerIds.includes(presence.offerId)) {
              viewerCounts[presence.offerId] = (viewerCounts[presence.offerId] || 0) + 1;
            }
          });
        });

        setLiveViewers(viewerCounts);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Viewer joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Viewer left:', key, leftPresences);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [offerIds.join(',')]);

  // تسجيل مشاهدة لعرض معين
  const trackViewing = useCallback(async (offerId: string, viewerInfo?: Partial<ViewerPresence>) => {
    if (!channelRef.current) return;

    const presence: ViewerPresence = {
      viewerId: viewerIdRef.current,
      offerId,
      joinedAt: new Date().toISOString(),
      ...viewerInfo,
    };

    await channelRef.current.track(presence);
  }, []);

  // إلغاء تتبع المشاهدة
  const untrackViewing = useCallback(async () => {
    if (!channelRef.current) return;
    await channelRef.current.untrack();
  }, []);

  // الحصول على عدد المشاهدين لعرض معين
  const getLiveViewers = useCallback((offerId: string): number => {
    return liveViewers[offerId] || 0;
  }, [liveViewers]);

  return {
    liveViewers,
    getLiveViewers,
    trackViewing,
    untrackViewing,
  };
}

/**
 * Hook مبسط لعرض واحد
 */
export function useSingleOfferPresence(offerId?: string) {
  const [liveCount, setLiveCount] = useState(0);
  const viewerIdRef = useRef<string>(`viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!offerId) return;

    const channelName = `offer-presence-${offerId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: viewerIdRef.current,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setLiveCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // تسجيل الحضور عند الاشتراك
          await channel.track({
            offerId,
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [offerId]);

  return liveCount;
}

/**
 * دالة لتسجيل مشاهدة وتحديث DB
 */
export async function recordViewAndSync(offerId: string, viewerInfo?: {
  device?: string;
  browser?: string;
  city?: string;
  country?: string;
}): Promise<boolean> {
  try {
    // تحديث عدد المشاهدات في قاعدة البيانات
    const { data: listing } = await supabase
      .from('platform_listings')
      .select('views')
      .eq('id', offerId)
      .single();

    if (listing) {
      await supabase
        .from('platform_listings')
        .update({ views: (listing.views || 0) + 1 })
        .eq('id', offerId);
    }

    // إرسال حدث للإشعارات
    window.dispatchEvent(new CustomEvent('offerViewedWithDetails', {
      detail: {
        offerId,
        viewerId: `viewer_${Date.now()}`,
        viewerInfo,
        timestamp: new Date().toISOString(),
      }
    }));

    return true;
  } catch (err) {
    console.error('Error recording view:', err);
    return false;
  }
}
