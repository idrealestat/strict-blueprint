/**
 * useCurrentUser.ts
 * Hook لجلب بيانات المستخدم الحالي من Supabase
 * مصدر الهوية الوحيد هو Supabase Auth
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  type: 'individual' | 'office' | 'company';
  companyName?: string;
  city: string;
  plan: string;
  rating: number;
}

const defaultUser: CurrentUser = {
  id: '',
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  type: 'individual',
  companyName: '',
  city: '',
  plan: 'مجاني',
  rating: 0,
};

export function useCurrentUser() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<CurrentUser>(defaultUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user) {
        setCurrentUser(defaultUser);
        setLoading(false);
        return;
      }

      try {
        // 1. جلب بيانات الملف الشخصي
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. جلب بيانات البطاقة
        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('data')
          .eq('user_id', user.id)
          .maybeSingle();

        const cardData = businessCard?.data as Record<string, any> | null;

        // 3. بناء كائن المستخدم
        const userData: CurrentUser = {
          id: user.id,
          name: profile?.full_name || cardData?.name || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: profile?.phone || cardData?.primaryPhone || cardData?.phone || '',
          whatsapp: profile?.phone || cardData?.primaryPhone || cardData?.phone || '',
          type: (profile?.account_type as CurrentUser['type']) || 'individual',
          companyName: profile?.company_name || cardData?.companyName || '',
          city: cardData?.location || '',
          plan: 'المحترف',
          rating: 4.5,
        };

        setCurrentUser(userData);
      } catch (error) {
        console.error('[useCurrentUser] Error fetching user data:', error);
        // Fallback to basic auth data
        setCurrentUser({
          ...defaultUser,
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || '',
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserData();
    }
  }, [user, isAuthenticated, authLoading]);

  return { currentUser, loading: authLoading || loading };
}
