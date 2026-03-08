import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/contexts/AcademyContext';

export interface PlanLimit {
  id: string;
  account_type: string;
  plan_tier: number;
  plan_name: string;
  daily_opportunities: number;
  daily_opportunities_trained: number;
  max_cities: number;
  max_districts: number;
  max_cities_trained: number;
  max_districts_trained: number;
}

interface UserLimits {
  dailyOpportunities: number;
  maxCities: number;
  maxDistricts: number;
  planName: string;
  isTrained: boolean;
}

export function usePlanLimits() {
  const { user } = useAuth();
  const { status: academyStatus } = useAcademy();
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // جلب نوع الحساب من profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', user.id)
          .single();

        const accountType = profile?.account_type || 'individual';
        
        // تحويل نوع الحساب لمطابقة الجدول
        const mappedType = accountType === 'office' ? 'office' 
          : accountType === 'company' ? 'company' 
          : 'individual';

        // جلب حدود الباقة (الباقة 1 كافتراضي)
        const { data: planLimit } = await supabase
          .from('plan_limits')
          .select('*')
          .eq('account_type', mappedType)
          .eq('plan_tier', 1)
          .single();

        if (planLimit) {
          const isTrained = academyStatus?.training_completed || false;
          setLimits({
            dailyOpportunities: isTrained 
              ? (planLimit as any).daily_opportunities_trained 
              : (planLimit as any).daily_opportunities,
            maxCities: isTrained 
              ? (planLimit as any).max_cities_trained 
              : (planLimit as any).max_cities,
            maxDistricts: isTrained 
              ? (planLimit as any).max_districts_trained 
              : (planLimit as any).max_districts,
            planName: (planLimit as any).plan_name,
            isTrained,
          });
        } else {
          // افتراضي للأفراد
          setLimits({
            dailyOpportunities: 5,
            maxCities: 3,
            maxDistricts: 10,
            planName: 'أساسي',
            isTrained: false,
          });
        }
      } catch (error) {
        console.error('Error fetching plan limits:', error);
        setLimits({
          dailyOpportunities: 5,
          maxCities: 3,
          maxDistricts: 10,
          planName: 'أساسي',
          isTrained: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [user, academyStatus]);

  return { limits, loading };
}
