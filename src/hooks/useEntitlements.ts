import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PlanCode = 'INDIVIDUAL' | 'OFFICE';
export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export type FeatureKey = 
  | 'business_card'
  | 'crm'
  | 'requests_forms'
  | 'offers_requests'
  | 'publish_listings'
  | 'analytics_basic'
  | 'ai_assistant_basic'
  | 'ai_assistant_advanced'
  | 'team_management'
  | 'central_publishing';

export interface UserEntitlement {
  planCode: PlanCode | null;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  daysRemaining: number;
  onboardingCompleted: boolean;
  isLoading: boolean;
}

// تعريف الميزات حسب الباقة والحالة
const FEATURES_CONFIG: Record<string, Record<string, FeatureKey[]>> = {
  INDIVIDUAL: {
    trial: [
      'business_card', 'crm', 'requests_forms', 'offers_requests',
      'publish_listings', 'analytics_basic', 'ai_assistant_basic', 'ai_assistant_advanced'
    ],
    active: [
      'business_card', 'crm', 'requests_forms', 'offers_requests',
      'publish_listings', 'analytics_basic', 'ai_assistant_basic'
    ],
    expired: []
  },
  OFFICE: {
    trial: [
      'business_card', 'crm', 'requests_forms', 'offers_requests',
      'publish_listings', 'analytics_basic', 'ai_assistant_basic', 'ai_assistant_advanced',
      'team_management', 'central_publishing'
    ],
    active: [
      'business_card', 'crm', 'requests_forms', 'offers_requests',
      'publish_listings', 'analytics_basic', 'ai_assistant_basic', 'ai_assistant_advanced',
      'team_management', 'central_publishing'
    ],
    expired: []
  }
};

export function useEntitlements() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [hasFetched, setHasFetched] = useState(false);
  const [entitlement, setEntitlement] = useState<UserEntitlement>({
    planCode: null,
    status: 'trial',
    trialEndsAt: null,
    daysRemaining: 30,
    onboardingCompleted: false,
    isLoading: true
  });

  const fetchEntitlement = useCallback(async () => {
    if (!user?.id) {
      setEntitlement(prev => ({ ...prev, isLoading: false }));
      setHasFetched(true);
      return;
    }

    try {
      // استخدام الدالة المخزنة للحصول على الحالة المحدثة
      const { data, error } = await supabase
        .rpc('get_user_entitlement_status', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching entitlement:', error);
        // محاولة جلب البيانات مباشرة
        const { data: directData } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (directData) {
          const now = new Date();
          const trialEnd = new Date(directData.trial_ends_at);
          const isInTrial = now <= trialEnd;
          
          setEntitlement({
            planCode: directData.plan_code as PlanCode | null,
            status: isInTrial ? 'trial' : (directData.plan_code ? 'active' : 'expired'),
            trialEndsAt: trialEnd,
            daysRemaining: Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
            onboardingCompleted: directData.onboarding_completed,
            isLoading: false
          });
          setHasFetched(true);
        } else {
          setEntitlement(prev => ({ ...prev, isLoading: false }));
          setHasFetched(true);
        }
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setEntitlement({
          planCode: result.plan_code as PlanCode | null,
          status: result.status as SubscriptionStatus,
          trialEndsAt: result.trial_ends_at ? new Date(result.trial_ends_at) : null,
          daysRemaining: result.days_remaining || 0,
          onboardingCompleted: result.onboarding_completed || false,
          isLoading: false
        });
      } else {
        setEntitlement(prev => ({ ...prev, isLoading: false }));
      }
      setHasFetched(true);
    } catch (err) {
      console.error('Error in fetchEntitlement:', err);
      setEntitlement(prev => ({ ...prev, isLoading: false }));
      setHasFetched(true);
    }
  }, [user?.id]);

  useEffect(() => {
    // انتظر حتى انتهاء تحميل المصادقة
    if (authLoading) return;
    
    if (isAuthenticated && user?.id && !hasFetched) {
      fetchEntitlement();
    } else if (!isAuthenticated && !hasFetched) {
      setEntitlement(prev => ({ ...prev, isLoading: false }));
      setHasFetched(true);
    }
  }, [isAuthenticated, authLoading, user?.id, hasFetched, fetchEntitlement]);

  // التحقق من صلاحية ميزة معينة
  const canUseFeature = useCallback((feature: FeatureKey): boolean => {
    const { planCode, status } = entitlement;
    
    // إذا لم يختر باقة بعد - نعتبره في trial مع ميزات INDIVIDUAL
    if (!planCode) {
      if (status === 'expired') return false;
      return FEATURES_CONFIG.INDIVIDUAL.trial.includes(feature);
    }

    const planFeatures = FEATURES_CONFIG[planCode];
    if (!planFeatures) return false;

    const statusFeatures = planFeatures[status] || [];
    return statusFeatures.includes(feature);
  }, [entitlement]);

  // التحقق من أن المستخدم يحتاج لاختيار باقة
  const needsPlanSelection = useCallback((): boolean => {
    return !entitlement.planCode && !entitlement.isLoading;
  }, [entitlement.planCode, entitlement.isLoading]);

  // التحقق من أن المستخدم يحتاج لإكمال البطاقة
  const needsOnboarding = useCallback((): boolean => {
    return !entitlement.onboardingCompleted && !entitlement.isLoading;
  }, [entitlement.onboardingCompleted, entitlement.isLoading]);

  // التحقق من أن الاشتراك منتهي
  const isExpired = useCallback((): boolean => {
    return entitlement.status === 'expired';
  }, [entitlement.status]);

  // تحديث الباقة
  const updatePlan = useCallback(async (planCode: PlanCode): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_entitlements')
        .update({ plan_code: planCode, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setEntitlement(prev => ({ ...prev, planCode }));
      return true;
    } catch (err) {
      console.error('Error updating plan:', err);
      return false;
    }
  }, [user?.id]);

  // تحديث حالة الـ onboarding
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_entitlements')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setEntitlement(prev => ({ ...prev, onboardingCompleted: true }));
      return true;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      return false;
    }
  }, [user?.id]);

  // إعادة تحميل البيانات
  const refresh = useCallback(() => {
    fetchEntitlement();
  }, [fetchEntitlement]);

  return {
    ...entitlement,
    canUseFeature,
    needsPlanSelection,
    needsOnboarding,
    isExpired,
    updatePlan,
    completeOnboarding,
    refresh
  };
}
