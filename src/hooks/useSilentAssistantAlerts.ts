/**
 * useSilentAssistantAlerts.ts
 * Hook لإدارة تنبيهات المساعد الصامت (للمسؤول)
 * يقرأ التنبيهات + يحسب تنبيهات محلية بناءً على نشاط الأعضاء
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export interface SilentAlert {
  id: string;
  organization_user_id: string;
  target_user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, any>;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
}

export function useSilentAssistantAlerts() {
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState<SilentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('silent_assistant_alerts')
        .select('*')
        .eq('organization_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setAlerts((data || []) as SilentAlert[]);
    } catch (e) {
      console.error('[silent-alerts] fetch error', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = useCallback(async (id: string) => {
    if (!user?.id) return;
    await (supabase as any)
      .from('silent_assistant_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user.id })
      .eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, [user?.id]);

  const dismissAlert = useCallback(async (id: string) => {
    await (supabase as any)
      .from('silent_assistant_alerts')
      .update({ status: 'dismissed' })
      .eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    alerts: alerts.filter(a => a.status === 'open'),
    historyAlerts: alerts.filter(a => a.status !== 'open'),
    allAlerts: alerts,
    isLoading,
    refresh: fetchAlerts,
    resolveAlert,
    dismissAlert,
  };
}
