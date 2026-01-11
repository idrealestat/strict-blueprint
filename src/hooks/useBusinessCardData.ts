/**
 * useBusinessCardData.ts
 * Hook لجلب بيانات البطاقة من مصدر واحد
 * يُستخدم لكل من البطاقة الرسمية والرقمية
 */

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Try localStorage fallback
          const localKey = Object.keys(localStorage).find(k => k.startsWith('business_card_'));
          if (localKey) {
            const localData = localStorage.getItem(localKey);
            if (localData) {
              const parsed = JSON.parse(localData);
              setData(mapLocalDataToSource(parsed));
            }
          }
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Fetch from Supabase
        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (businessCard) {
          const cardData = businessCard.data as Record<string, any>;
          setData(mapSupabaseDataToSource(cardData, businessCard.slug || ''));
        } else {
          // Fallback to localStorage
          const localData = localStorage.getItem(`business_card_${user.id}`);
          if (localData) {
            const parsed = JSON.parse(localData);
            setData(mapLocalDataToSource(parsed));
          }
        }
      } catch (error) {
        console.error('[useBusinessCardData] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for changes
    const handleStorageChange = () => {
      fetchData();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('businessCardSwapped', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('businessCardSwapped', handleStorageChange);
    };
  }, []);

  return { data, loading, userId, refetch: () => {} };
}

// Map localStorage data to source of truth
function mapLocalDataToSource(localData: Record<string, any>): BusinessCardSourceOfTruth {
  // Check swap state
  const swapKey = Object.keys(localStorage).find(k => k.startsWith('business_card_swap_'));
  const isSwapped = swapKey ? localStorage.getItem(swapKey) === 'true' : false;

  return {
    name: localData.userName || localData.name || '',
    title: localData.userTitle || localData.title || 'وسيط عقاري معتمد',
    companyName: localData.companyName || '',
    rating: localData.rating || 4.5,
    phone: localData.primaryPhone || localData.phone || '',
    email: localData.email || '',
    city: localData.location || localData.city || '',
    district: localData.officeAddressDetails?.district || '',
    location: localData.officeAddress || localData.location || '',
    slug: localData.userTitle || localData.slug || '',
    identityMode: isSwapped ? 'logo' : 'profile',
    profileImageUrl: localData.profileImage || null,
    logoUrl: localData.logoImage || null,
    bio: localData.bio || '',
    falLicense: localData.falLicense || '',
    website: localData.websiteUrl || localData.domain || '',
  };
}

// Map Supabase data to source of truth
function mapSupabaseDataToSource(cardData: Record<string, any>, slug: string): BusinessCardSourceOfTruth {
  // Check swap state from cardData or localStorage
  const isSwapped = cardData.swapState === true;

  return {
    name: cardData.userName || cardData.name || '',
    title: cardData.userTitle || cardData.title || 'وسيط عقاري معتمد',
    companyName: cardData.companyName || '',
    rating: cardData.rating || 4.5,
    phone: cardData.primaryPhone || cardData.phone || '',
    email: cardData.email || '',
    city: cardData.location || cardData.city || '',
    district: cardData.officeAddressDetails?.district || '',
    location: cardData.officeAddress || cardData.location || '',
    slug: slug || cardData.userTitle || '',
    identityMode: isSwapped ? 'logo' : 'profile',
    profileImageUrl: cardData.profileImage || null,
    logoUrl: cardData.logoImage || null,
    bio: cardData.bio || '',
    falLicense: cardData.falLicense || '',
    website: cardData.websiteUrl || cardData.domain || '',
  };
}
