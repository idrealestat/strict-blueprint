/**
 * useOfferViewsLog.ts
 * Hook for managing offer views analytics
 * Uses Supabase instead of localStorage for security
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface OfferViewLog {
  id: string;
  user_id: string;
  offer_id: string;
  offer_title: string | null;
  city: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  ip_address: string | null;
  session_id: string | null;
  view_duration: number | null;
  metadata: Json;
  created_at: string;
}

export interface CreateViewLogInput {
  offer_id: string;
  offer_title?: string;
  city?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  session_id?: string;
  view_duration?: number;
  metadata?: Record<string, any>;
}

// Legacy localStorage key for migration
const LEGACY_KEY = 'offer_views_log';

export function useOfferViewsLog() {
  const { user } = useAuthContext();
  const [logs, setLogs] = useState<OfferViewLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Migrate localStorage data to DB (one-time)
  const migrateLocalData = useCallback(async () => {
    if (!user) return;

    const migrationKey = `offer_views_migrated_${user.id}`;
    if (localStorage.getItem(migrationKey)) return;

    try {
      const data = localStorage.getItem(LEGACY_KEY);
      if (!data) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }

      const legacyLogs = JSON.parse(data);
      if (!Array.isArray(legacyLogs) || legacyLogs.length === 0) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }

      console.log(`[OfferViewsLog] Migrating ${legacyLogs.length} logs from localStorage...`);

      // Only migrate last 1000 entries to avoid large insert
      const toMigrate = legacyLogs.slice(0, 1000);

      const toInsert = toMigrate.map((log: any) => ({
        user_id: user.id,
        offer_id: log.offerId || log.offer_id || 'unknown',
        offer_title: log.offerTitle || log.offer_title || null,
        city: log.city || null,
        country: log.country || null,
        device: log.device || null,
        browser: log.browser || null,
        os: log.os || null,
        referrer: log.referrer || null,
        session_id: log.sessionId || log.session_id || null,
        view_duration: log.viewDuration || log.view_duration || null,
        metadata: { 
          legacyTimestamp: log.timestamp,
          ...log.metadata 
        },
      }));

      const { error } = await supabase
        .from('offer_views_log')
        .insert(toInsert);

      if (error) {
        console.error('[OfferViewsLog] Migration error:', error);
      } else {
        console.log(`[OfferViewsLog] Successfully migrated ${toInsert.length} logs`);
        localStorage.setItem(migrationKey, 'true');
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch (e) {
      console.error('[OfferViewsLog] Migration parse error:', e);
    }
  }, [user]);

  // Fetch logs from DB
  const fetchLogs = useCallback(async (limit: number = 500) => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('offer_views_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[OfferViewsLog] Fetch error:', error);
      setError(error.message);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  }, [user]);

  // Log a view
  const logView = useCallback(async (input: CreateViewLogInput): Promise<OfferViewLog | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('offer_views_log')
      .insert({
        user_id: user.id,
        offer_id: input.offer_id,
        offer_title: input.offer_title || null,
        city: input.city || null,
        country: input.country || null,
        device: input.device || null,
        browser: input.browser || null,
        os: input.os || null,
        referrer: input.referrer || null,
        session_id: input.session_id || null,
        view_duration: input.view_duration || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[OfferViewsLog] Log view error:', error);
      return null;
    }

    setLogs(prev => [data, ...prev.slice(0, 499)]);
    return data;
  }, [user]);

  // Get stats
  const getStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const todayViews = logs.filter(l => new Date(l.created_at) >= today).length;
    const weekViews = logs.filter(l => new Date(l.created_at) >= last7Days).length;
    const monthViews = logs.filter(l => new Date(l.created_at) >= last30Days).length;

    // Group by offer
    const offerCounts: Record<string, number> = {};
    logs.forEach(l => {
      offerCounts[l.offer_id] = (offerCounts[l.offer_id] || 0) + 1;
    });

    // Top offers
    const topOffers = Object.entries(offerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([offerId, count]) => ({
        offerId,
        title: logs.find(l => l.offer_id === offerId)?.offer_title || offerId,
        count,
      }));

    return {
      total: logs.length,
      todayViews,
      weekViews,
      monthViews,
      topOffers,
    };
  }, [logs]);

  // Clear old logs (keep last N days)
  const clearOldLogs = useCallback(async (daysToKeep: number = 90): Promise<number> => {
    if (!user) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('offer_views_log')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('[OfferViewsLog] Clear old logs error:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    if (deletedCount > 0) {
      await fetchLogs();
    }
    return deletedCount;
  }, [user, fetchLogs]);

  // Initialize
  useEffect(() => {
    if (user) {
      migrateLocalData().then(() => fetchLogs());
    } else {
      setLogs([]);
      setLoading(false);
    }
  }, [user, migrateLocalData, fetchLogs]);

  return {
    logs,
    loading,
    error,
    logView,
    getStats,
    clearOldLogs,
    refetch: fetchLogs,
  };
}
