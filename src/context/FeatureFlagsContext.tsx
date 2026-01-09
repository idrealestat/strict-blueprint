/**
 * FeatureFlagsContext.tsx
 * Context لإدارة Feature Flags للمستخدم الحالي
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export interface FeatureFlags {
  publishing_enabled: boolean;
  smart_paths_enabled: boolean;
  spatial_intelligence_enabled: boolean;
  offers_requests_enabled: boolean;
  quick_calculator_enabled: boolean;
  left_slider_enabled: boolean;
  right_slider_mediation_course_enabled: boolean;
  right_slider_team_management_enabled: boolean;
  right_slider_workspace_enabled: boolean;
  business_card_add_colleague_enabled: boolean;
}

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultFlags: FeatureFlags = {
  publishing_enabled: true,
  smart_paths_enabled: true,
  spatial_intelligence_enabled: true,
  offers_requests_enabled: true,
  quick_calculator_enabled: true,
  left_slider_enabled: true,
  right_slider_mediation_course_enabled: true,
  right_slider_team_management_enabled: true,
  right_slider_workspace_enabled: true,
  business_card_add_colleague_enabled: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: defaultFlags,
  loading: true,
  error: null,
  refetch: async () => {},
});

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setFlags(defaultFlags);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[FeatureFlags] Error fetching:', fetchError);
        setError(fetchError.message);
        setFlags(defaultFlags);
      } else if (data) {
        setFlags({
          publishing_enabled: data.publishing_enabled ?? true,
          smart_paths_enabled: data.smart_paths_enabled ?? true,
          spatial_intelligence_enabled: data.spatial_intelligence_enabled ?? true,
          offers_requests_enabled: data.offers_requests_enabled ?? true,
          quick_calculator_enabled: data.quick_calculator_enabled ?? true,
          left_slider_enabled: data.left_slider_enabled ?? true,
          right_slider_mediation_course_enabled: data.right_slider_mediation_course_enabled ?? true,
          right_slider_team_management_enabled: data.right_slider_team_management_enabled ?? true,
          right_slider_workspace_enabled: data.right_slider_workspace_enabled ?? true,
          business_card_add_colleague_enabled: data.business_card_add_colleague_enabled ?? true,
        });
      } else {
        // لا يوجد سجل، استخدم الافتراضي
        setFlags(defaultFlags);
      }
    } catch (err) {
      console.error('[FeatureFlags] Exception:', err);
      setError('حدث خطأ في جلب إعدادات الميزات');
      setFlags(defaultFlags);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`feature_flags_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feature_flags',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[FeatureFlags] Realtime update:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            setFlags({
              publishing_enabled: newData.publishing_enabled ?? true,
              smart_paths_enabled: newData.smart_paths_enabled ?? true,
              spatial_intelligence_enabled: newData.spatial_intelligence_enabled ?? true,
              offers_requests_enabled: newData.offers_requests_enabled ?? true,
              quick_calculator_enabled: newData.quick_calculator_enabled ?? true,
              left_slider_enabled: newData.left_slider_enabled ?? true,
              right_slider_mediation_course_enabled: newData.right_slider_mediation_course_enabled ?? true,
              right_slider_team_management_enabled: newData.right_slider_team_management_enabled ?? true,
              right_slider_workspace_enabled: newData.right_slider_workspace_enabled ?? true,
              business_card_add_colleague_enabled: newData.business_card_add_colleague_enabled ?? true,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, error, refetch: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export default FeatureFlagsContext;
