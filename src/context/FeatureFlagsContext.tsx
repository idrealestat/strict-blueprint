/**
 * FeatureFlagsContext.tsx
 * THREE-LAYER Feature Control System
 * 
 * Priority Order (STRICT):
 * 1. USER OVERRIDE (Layer 2) - Highest priority
 * 2. BUSINESS RULE (Layer 3) - For office/company accounts only
 * 3. GLOBAL DEFAULT (Layer 1) - System-wide baseline
 * 4. SYSTEM FALLBACK - Hardcoded defaults
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

// All controllable features in the system
export interface FeatureFlags {
  // Dashboard Features
  publishing_enabled: boolean;
  smart_paths_enabled: boolean;
  spatial_intelligence_enabled: boolean;
  offers_requests_enabled: boolean;
  quick_calculator_enabled: boolean;
  // Left Slider
  left_slider_enabled: boolean;
  // Right Slider
  right_slider_mediation_course_enabled: boolean;
  right_slider_team_management_enabled: boolean;
  right_slider_workspace_enabled: boolean;
  right_slider_owner_panel_enabled: boolean;
  // Business Card
  business_card_add_colleague_enabled: boolean;
  official_business_card_enabled: boolean;
  // CRM Features
  crm_calls_section_enabled: boolean;
  // Floating Bubble (Owner Controlled)
  floating_bubble_enabled: boolean;
}

// Feature flag keys for iteration
export const FEATURE_FLAG_KEYS: (keyof FeatureFlags)[] = [
  'publishing_enabled',
  'smart_paths_enabled',
  'spatial_intelligence_enabled',
  'offers_requests_enabled',
  'quick_calculator_enabled',
  'left_slider_enabled',
  'right_slider_mediation_course_enabled',
  'right_slider_team_management_enabled',
  'right_slider_workspace_enabled',
  'right_slider_owner_panel_enabled',
  'business_card_add_colleague_enabled',
  'official_business_card_enabled',
  'crm_calls_section_enabled',
  'floating_bubble_enabled',
];

// Human-readable labels for each feature
export const FEATURE_FLAG_LABELS: Record<keyof FeatureFlags, string> = {
  publishing_enabled: 'النشر على المنصات',
  smart_paths_enabled: 'المسارات الذكية',
  spatial_intelligence_enabled: 'الذكاء المكاني',
  offers_requests_enabled: 'العروض والطلبات',
  quick_calculator_enabled: 'الحاسبة السريعة',
  left_slider_enabled: 'القائمة اليسرى',
  right_slider_mediation_course_enabled: 'دورة الوساطة',
  right_slider_team_management_enabled: 'إدارة الفريق',
  right_slider_workspace_enabled: 'مساحة العمل',
  right_slider_owner_panel_enabled: 'لوحة تحكم المالك',
  business_card_add_colleague_enabled: 'إضافة زميل',
  official_business_card_enabled: 'البطاقة الرسمية للطباعة',
  crm_calls_section_enabled: 'قسم الاتصالات',
  floating_bubble_enabled: 'المساعد الذكي العائم',
};

// Feature categories for UI grouping
export const FEATURE_CATEGORIES = {
  dashboard: ['publishing_enabled', 'smart_paths_enabled', 'spatial_intelligence_enabled', 'offers_requests_enabled', 'quick_calculator_enabled'] as (keyof FeatureFlags)[],
  left_slider: ['left_slider_enabled'] as (keyof FeatureFlags)[],
  right_slider: ['right_slider_mediation_course_enabled', 'right_slider_team_management_enabled', 'right_slider_workspace_enabled', 'right_slider_owner_panel_enabled'] as (keyof FeatureFlags)[],
  business_card: ['business_card_add_colleague_enabled', 'official_business_card_enabled'] as (keyof FeatureFlags)[],
  crm: ['crm_calls_section_enabled'] as (keyof FeatureFlags)[],
  assistant: ['floating_bubble_enabled'] as (keyof FeatureFlags)[],
};

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Layer access (for Owner Panel)
  globalDefaults: Partial<FeatureFlags> | null;
  userOverride: Partial<FeatureFlags> | null;
  businessRule: Partial<FeatureFlags> | null;
  accountType: string | null;
}

// System fallback defaults (Layer 4)
const systemFallbackDefaults: FeatureFlags = {
  publishing_enabled: true,
  smart_paths_enabled: true,
  spatial_intelligence_enabled: true,
  offers_requests_enabled: true,
  quick_calculator_enabled: true,
  left_slider_enabled: true,
  right_slider_mediation_course_enabled: true,
  right_slider_team_management_enabled: true,
  right_slider_workspace_enabled: true,
  right_slider_owner_panel_enabled: false, // Only for owners
  business_card_add_colleague_enabled: true,
  official_business_card_enabled: true,
  crm_calls_section_enabled: true,
  floating_bubble_enabled: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: systemFallbackDefaults,
  loading: true,
  error: null,
  refetch: async () => {},
  globalDefaults: null,
  userOverride: null,
  businessRule: null,
  accountType: null,
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
  const { user, isAuthenticated, isOwner } = useAuthContext();
  const [flags, setFlags] = useState<FeatureFlags>(systemFallbackDefaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalDefaults, setGlobalDefaults] = useState<Partial<FeatureFlags> | null>(null);
  const [userOverride, setUserOverride] = useState<Partial<FeatureFlags> | null>(null);
  const [businessRule, setBusinessRule] = useState<Partial<FeatureFlags> | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);

  /**
   * Resolve feature value using strict priority order:
   * 1. User Override (if not null)
   * 2. Business Rule (if account is office/company and not null)
   * 3. Global Default (if not null)
   * 4. System Fallback
   */
  const resolveFeatureValue = useCallback((
    key: keyof FeatureFlags,
    userOvr: Partial<FeatureFlags> | null,
    businessRl: Partial<FeatureFlags> | null,
    globalDef: Partial<FeatureFlags> | null,
    accType: string | null,
    ownerStatus: boolean
  ): boolean => {
    // Special case: Owner panel only for owners
    if (key === 'right_slider_owner_panel_enabled') {
      // Check user override first
      if (userOvr && userOvr[key] !== null && userOvr[key] !== undefined) {
        return userOvr[key] as boolean;
      }
      // Default: only owners see the panel
      return ownerStatus;
    }

    // Layer 2: User Override (highest priority)
    if (userOvr && userOvr[key] !== null && userOvr[key] !== undefined) {
      return userOvr[key] as boolean;
    }

    // Layer 3: Business Rule (for office/company only)
    if ((accType === 'office' || accType === 'company') && businessRl && businessRl[key] !== null && businessRl[key] !== undefined) {
      return businessRl[key] as boolean;
    }

    // Layer 1: Global Default
    if (globalDef && globalDef[key] !== null && globalDef[key] !== undefined) {
      return globalDef[key] as boolean;
    }

    // Layer 4: System Fallback
    return systemFallbackDefaults[key];
  }, []);

  const fetchFlags = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setFlags(systemFallbackDefaults);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all layers in parallel
      const [globalRes, userOverrideRes, profileRes] = await Promise.all([
        // Layer 1: Global Defaults
        supabase
          .from('global_feature_defaults')
          .select('*')
          .limit(1)
          .maybeSingle(),
        // Layer 2: User Override
        supabase
          .from('user_feature_overrides')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        // Get user's account type for Layer 3
        supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const globalData = globalRes.data;
      const userOverrideData = userOverrideRes.data;
      const userAccountType = profileRes.data?.account_type || 'individual';

      setGlobalDefaults(globalData);
      setUserOverride(userOverrideData);
      setAccountType(userAccountType);

      // Layer 3: Business Rule (only if office/company)
      let businessRuleData: any = null;
      if (userAccountType === 'office' || userAccountType === 'company') {
        const { data } = await supabase
          .from('business_feature_rules')
          .select('*')
          .eq('account_type', userAccountType)
          .maybeSingle();
        businessRuleData = data;
      }
      setBusinessRule(businessRuleData);

      // Resolve all flags using priority order
      const resolvedFlags: FeatureFlags = {} as FeatureFlags;
      for (const key of FEATURE_FLAG_KEYS) {
        resolvedFlags[key] = resolveFeatureValue(
          key,
          userOverrideData,
          businessRuleData,
          globalData,
          userAccountType,
          isOwner
        );
      }

      setFlags(resolvedFlags);
    } catch (err) {
      console.error('[FeatureFlags] Exception:', err);
      setError('حدث خطأ في جلب إعدادات الميزات');
      setFlags(systemFallbackDefaults);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, isOwner, resolveFeatureValue]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Subscribe to realtime changes on all layers
  useEffect(() => {
    if (!user?.id) return;

    const channels: any[] = [];

    // Global defaults changes
    const globalChannel = supabase
      .channel('global_feature_defaults_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_feature_defaults' }, () => {
        console.log('[FeatureFlags] Global defaults changed, refetching...');
        fetchFlags();
      })
      .subscribe();
    channels.push(globalChannel);

    // User override changes
    const userChannel = supabase
      .channel(`user_feature_overrides_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_feature_overrides',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        console.log('[FeatureFlags] User override changed, refetching...');
        fetchFlags();
      })
      .subscribe();
    channels.push(userChannel);

    // Business rules changes
    if (accountType === 'office' || accountType === 'company') {
      const businessChannel = supabase
        .channel(`business_feature_rules_${accountType}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'business_feature_rules',
          filter: `account_type=eq.${accountType}`,
        }, () => {
          console.log('[FeatureFlags] Business rules changed, refetching...');
          fetchFlags();
        })
        .subscribe();
      channels.push(businessChannel);
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [user?.id, accountType, fetchFlags]);

  return (
    <FeatureFlagsContext.Provider value={{
      flags,
      loading,
      error,
      refetch: fetchFlags,
      globalDefaults,
      userOverride,
      businessRule,
      accountType,
    }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export default FeatureFlagsContext;
