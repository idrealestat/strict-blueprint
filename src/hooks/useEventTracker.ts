/**
 * useEventTracker.ts
 * نظام تتبع الأحداث الموحد - Unified Event Tracking System
 * 
 * يستخدم في جميع أنحاء التطبيق لتسجيل الأحداث في قاعدة البيانات
 * مع دعم الفصل بين القنوات (public_web, in_app_preview, in_app_admin)
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Event channels
export type EventChannel = 'public_web' | 'in_app_preview' | 'in_app_admin';

// Actor types
export type ActorType = 'user' | 'system' | 'visitor';

// Entity types
export type EntityType = 
  | 'offer' 
  | 'customer' 
  | 'business_card' 
  | 'calendar' 
  | 'request' 
  | 'platform'
  | 'notification'
  | 'quote'
  | 'task';

// Event names - UNIFIED NAMING SCHEMA
export type EventName =
  // Page views
  | 'page_view'
  | 'page_leave'
  // Offer events
  | 'offer_view'
  | 'offer_share'
  | 'offer_call'
  | 'offer_whatsapp'
  | 'offer_email'
  | 'offer_quote_request'
  | 'offer_deposit'
  | 'offer_publish'
  | 'offer_update'
  | 'offer_hide'
  | 'offer_delete'
  // Customer events
  | 'customer_create'
  | 'customer_update'
  | 'customer_call'
  | 'customer_whatsapp'
  | 'customer_email'
  | 'customer_note_add'
  // Business card events
  | 'card_view'
  | 'card_share'
  | 'card_call'
  | 'card_whatsapp'
  | 'card_email'
  | 'card_location'
  | 'card_save_contact'
  // Calendar events (UNIFIED)
  | 'appointment_create'
  | 'appointment_update'
  | 'appointment_cancel'
  | 'appointment_complete'
  // Form submissions (UNIFIED)
  | 'request_submit'      // العميل يرسل طلب عقار
  | 'quote_submit'        // العميل يرسل طلب عرض سعر
  | 'property_offer_submit' // مالك العقار يرسل عرض للوسيط
  // Generic
  | 'interaction'
  | 'search'
  | 'filter'
  | 'download'
  | 'print';

export interface TrackEventParams {
  eventName: EventName | string;
  actorType?: ActorType;
  channel?: EventChannel;
  entityType?: EntityType | string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
}

// Get device info from user agent
function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  }
  
  const ua = navigator.userAgent;
  
  let browser = 'غير معروف';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'غير معروف';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let device = 'Desktop';
  if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile';
  if (/Tablet|iPad/.test(ua)) device = 'Tablet';

  return { device, browser, os };
}

// Generate viewer ID for anonymous visitors
function getOrCreateViewerId(): string {
  if (typeof localStorage === 'undefined') {
    return `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const key = 'wasata_viewer_id';
  let viewerId = localStorage.getItem(key);
  if (!viewerId) {
    viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, viewerId);
  }
  return viewerId;
}

// Standalone function for tracking events
export async function trackEvent(params: TrackEventParams): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const deviceInfo = getDeviceInfo();
    const viewerId = user ? null : getOrCreateViewerId();

    const eventData = {
      user_id: user?.id || null,
      event_name: params.eventName,
      actor_type: params.actorType || (user ? 'user' : 'visitor'),
      channel: params.channel || 'in_app_admin',
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      metadata: (params.metadata || {}) as Json,
      viewer_id: viewerId,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
    };

    const { error } = await supabase
      .from('events')
      .insert(eventData);

    if (error) {
      console.error('[EventTracker] Error inserting event:', error);
      return false;
    }

    // Dispatch custom event for real-time listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wasataEvent', { 
        detail: { ...eventData, timestamp: new Date().toISOString() }
      }));
    }

    return true;
  } catch (err) {
    console.error('[EventTracker] Exception:', err);
    return false;
  }
}

// React hook for component usage
export function useEventTracker() {
  const trackedRef = useRef<Set<string>>(new Set());

  const track = useCallback(async (params: TrackEventParams): Promise<boolean> => {
    return trackEvent(params);
  }, []);

  // Track once per session (useful for page views)
  const trackOnce = useCallback(async (
    key: string, 
    params: TrackEventParams
  ): Promise<boolean> => {
    if (trackedRef.current.has(key)) {
      return false;
    }
    trackedRef.current.add(key);
    return track(params);
  }, [track]);

  // Track page view with channel detection
  const trackPageView = useCallback(async (
    pageType: string,
    pageSlug: string,
    channel: EventChannel = 'public_web'
  ): Promise<boolean> => {
    const key = `${pageType}-${pageSlug}-${channel}`;
    return trackOnce(key, {
      eventName: 'page_view',
      actorType: 'visitor',
      channel,
      entityType: pageType as EntityType,
      entityId: pageSlug,
      metadata: { 
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      },
    });
  }, [trackOnce]);

  // Track offer interaction
  const trackOfferInteraction = useCallback(async (
    offerId: string,
    interactionType: 'view' | 'call' | 'whatsapp' | 'email' | 'share' | 'quote' | 'deposit',
    channel: EventChannel = 'public_web',
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    return track({
      eventName: `offer_${interactionType}` as EventName,
      channel,
      entityType: 'offer',
      entityId: offerId,
      metadata,
    });
  }, [track]);

  // Track business card interaction
  const trackCardInteraction = useCallback(async (
    cardSlug: string,
    interactionType: 'view' | 'call' | 'whatsapp' | 'email' | 'share' | 'location',
    channel: EventChannel = 'public_web',
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    return track({
      eventName: `card_${interactionType}` as EventName,
      channel,
      entityType: 'business_card',
      entityId: cardSlug,
      metadata,
    });
  }, [track]);

  // Track customer event
  const trackCustomerEvent = useCallback(async (
    customerId: string,
    eventType: 'create' | 'update' | 'call' | 'whatsapp' | 'email' | 'note_add',
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    return track({
      eventName: `customer_${eventType}` as EventName,
      channel: 'in_app_admin',
      entityType: 'customer',
      entityId: customerId,
      metadata,
    });
  }, [track]);

  // Track calendar event
  const trackCalendarEvent = useCallback(async (
    appointmentId: string,
    eventType: 'create' | 'update' | 'cancel' | 'complete',
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    return track({
      eventName: `appointment_${eventType}` as EventName,
      channel: 'in_app_admin',
      entityType: 'calendar',
      entityId: appointmentId,
      metadata,
    });
  }, [track]);

  return {
    track,
    trackOnce,
    trackPageView,
    trackOfferInteraction,
    trackCardInteraction,
    trackCustomerEvent,
    trackCalendarEvent,
  };
}

// Utility to get event stats
export async function getEventStats(
  entityType: string,
  entityId: string,
  channel?: EventChannel
): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let baseQuery = supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (channel) {
      baseQuery = baseQuery.eq('channel', channel);
    }

    const { count: total } = await baseQuery;

    const { count: today } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .gte('created_at', todayStart);

    const { count: thisWeek } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .gte('created_at', weekStart);

    const { count: thisMonth } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .gte('created_at', monthStart);

    return {
      total: total || 0,
      today: today || 0,
      thisWeek: thisWeek || 0,
      thisMonth: thisMonth || 0,
    };
  } catch (err) {
    console.error('[EventTracker] Error getting stats:', err);
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
  }
}
