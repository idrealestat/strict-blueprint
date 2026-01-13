/**
 * useBusinessCardData.ts
 * Hook لجلب بيانات البطاقة من مصدر واحد - جدول business_cards
 * يُستخدم لكل من البطاقة الرسمية والرقمية وجميع الصفحات المرتبطة
 * 
 * ✅ الحماية: جميع البيانات تُجلب من قاعدة البيانات فقط
 * أي تعديل في صفحة التحرير → يُحفظ في business_cards → يظهر هنا تلقائياً
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessCardSourceOfTruth } from '@/types/businessCard';

const defaultData: BusinessCardSourceOfTruth = {
  name: '',
  title: 'وسيط عقاري معتمد',
  companyName: '',
  rating: 4.5,
  phone: '',
  email: '',
  city: '',
  district: '',
  location: '',
  slug: '',
  identityMode: 'profile',
  profileImageUrl: null,
  logoUrl: null,
  bio: '',
  falLicense: '',
  website: '',
};

export function useBusinessCardData() {
  const [data, setData] = useState<BusinessCardSourceOfTruth>(defaultData);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setData(defaultData);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // ✅ جلب البيانات من قاعدة البيانات فقط - المصدر الوحيد للحقيقة
      const { data: businessCard, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useBusinessCardData] Error fetching:', error);
        setData(defaultData);
        setLoading(false);
        return;
      }

      if (businessCard && businessCard.data) {
        const cardData = businessCard.data as Record<string, any>;
        setData(mapSupabaseDataToSource(cardData, businessCard.slug || ''));
      } else {
        // لا توجد بطاقة محفوظة - استخدم القيم الافتراضية
        setData(defaultData);
      }
    } catch (error) {
      console.error('[useBusinessCardData] Error:', error);
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // الاستماع للتحديثات عند حفظ البطاقة
    const handleBusinessCardUpdate = () => {
      console.log('[useBusinessCardData] Business card updated, refetching...');
      fetchData();
    };
    
    window.addEventListener('businessCardUpdated', handleBusinessCardUpdate);
    
    // الاستماع للتغييرات في الوقت الحقيقي من Supabase
    const channel = supabase
      .channel('business_cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_cards',
        },
        (payload) => {
          console.log('[useBusinessCardData] Realtime update:', payload);
          fetchData();
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener('businessCardUpdated', handleBusinessCardUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { data, loading, userId, refetch: fetchData };
}

/**
 * Hook لجلب بيانات البطاقة عبر user_id (للاستخدام في المنصة)
 */
export function useBusinessCardDataByUserId(targetUserId: string | undefined) {
  const [data, setData] = useState<BusinessCardSourceOfTruth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!targetUserId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: businessCard, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('[useBusinessCardDataByUserId] Error:', error);
        setData(null);
        setLoading(false);
        return;
      }

      if (businessCard && businessCard.data) {
        const cardData = businessCard.data as Record<string, any>;
        setData(mapSupabaseDataToSource(cardData, businessCard.slug || ''));
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('[useBusinessCardDataByUserId] Error:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchData();

    // الاستماع للتحديثات
    const handleBusinessCardUpdate = () => {
      fetchData();
    };
    
    window.addEventListener('businessCardUpdated', handleBusinessCardUpdate);
    
    return () => {
      window.removeEventListener('businessCardUpdated', handleBusinessCardUpdate);
    };
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

// Map Supabase data to source of truth
function mapSupabaseDataToSource(cardData: Record<string, any>, slug: string): BusinessCardSourceOfTruth {
  // Check swap state from cardData
  const isSwapped = cardData.swapState === true;

  return {
    name: cardData.userName || cardData.name || '',
    title: cardData.userTitle || cardData.title || 'وسيط عقاري معتمد',
    companyName: cardData.companyName || '',
    rating: cardData.rating || 4.5,
    phone: cardData.primaryPhone || cardData.phone || '',
    whatsapp: cardData.displayOptions?.whatsappNumber || '',
    email: cardData.email || '',
    city: cardData.location || cardData.city || '',
    district: cardData.officeAddressDetails?.district || cardData.district || '',
    location: cardData.officeAddress || cardData.location || '',
    slug: slug || cardData.userTitle || '',
    identityMode: isSwapped ? 'logo' : 'profile',
    profileImageUrl: cardData.profileImage || null,
    logoUrl: cardData.logoImage || null,
    coverImageUrl: cardData.coverImage || null,
    bio: cardData.bio || '',
    falLicense: cardData.falLicense || '',
    website: cardData.websiteUrl || cardData.domain || '',
    displayOptions: cardData.displayOptions || undefined,
  };
}
