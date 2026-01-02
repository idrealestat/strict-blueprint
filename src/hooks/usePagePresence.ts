/**
 * usePagePresence.ts
 * Hook لتتبع الزوار المتصلين حالياً في الصفحات العامة
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceUser {
  viewerId: string;
  pageType: string;
  pageSlug: string;
  joinedAt: string;
  device?: string;
  browser?: string;
  city?: string;
}

/**
 * Hook لتتبع عدد الزوار المتصلين حالياً في صفحة معينة
 */
export function usePagePresence(pageType: string, pageSlug?: string) {
  const [liveCount, setLiveCount] = useState(0);
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const viewerIdRef = useRef<string>(`viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!pageSlug) return;

    const channelName = `page-presence-${pageType}-${pageSlug}`;
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
        const state = channel.presenceState<PresenceUser>();
        const allViewers: PresenceUser[] = [];
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence: PresenceUser) => {
            allViewers.push(presence);
          });
        });
        
        setViewers(allViewers);
        setLiveCount(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Viewer joined page:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Viewer left page:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // جمع معلومات الجهاز
          const ua = navigator.userAgent;
          let browser = 'غير معروف';
          if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
          else if (ua.includes('Firefox')) browser = 'Firefox';
          else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
          else if (ua.includes('Edg')) browser = 'Edge';

          let device = 'Desktop';
          if (/Mobile|Android|iPhone|iPad/.test(ua)) device = 'Mobile';
          if (/Tablet|iPad/.test(ua)) device = 'Tablet';

          // تسجيل الحضور
          await channel.track({
            viewerId: viewerIdRef.current,
            pageType,
            pageSlug,
            joinedAt: new Date().toISOString(),
            device,
            browser,
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [pageType, pageSlug]);

  return { liveCount, viewers };
}

/**
 * Hook لتتبع زوار جميع صفحات منصة معينة
 */
export function usePlatformPagePresence(slug?: string) {
  const [platformLive, setPlatformLive] = useState(0);
  const [businessCardLive, setBusinessCardLive] = useState(0);
  const [calendarLive, setCalendarLive] = useState(0);
  const [offerFormLive, setOfferFormLive] = useState(0);
  const [requestFormLive, setRequestFormLive] = useState(0);
  const [quoteFormLive, setQuoteFormLive] = useState(0);

  const { liveCount: platform } = usePagePresence('platform', slug);
  const { liveCount: businessCard } = usePagePresence('businesscard', slug);
  const { liveCount: calendar } = usePagePresence('calendar', slug);
  const { liveCount: offer } = usePagePresence('offer', slug);
  const { liveCount: request } = usePagePresence('request', slug);
  const { liveCount: quote } = usePagePresence('quote', slug);

  useEffect(() => {
    setPlatformLive(platform);
    setBusinessCardLive(businessCard);
    setCalendarLive(calendar);
    setOfferFormLive(offer);
    setRequestFormLive(request);
    setQuoteFormLive(quote);
  }, [platform, businessCard, calendar, offer, request, quote]);

  const totalLive = platformLive + businessCardLive + calendarLive + offerFormLive + requestFormLive + quoteFormLive;

  return {
    totalLive,
    platformLive,
    businessCardLive,
    calendarLive,
    offerFormLive,
    requestFormLive,
    quoteFormLive,
  };
}
