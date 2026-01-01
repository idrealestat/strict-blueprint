/**
 * usePlatformListings.ts
 * Hook لإدارة العروض العقارية في قاعدة البيانات
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformListing {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  propertyType: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  image?: string;
  images?: string[];
  city: string;
  district: string;
  street?: string;
  ownerName?: string;
  ownerPhone?: string;
  views?: number;
  age?: number;
  direction?: string;
  features?: string[];
  videoUrl?: string;
  tour3DUrl?: string;
  livingRooms?: string;
  councils?: string;
  floors?: string;
  floorNumber?: string;
  cornerType?: string;
  streetWidth?: string;
  furnishing?: string;
  entrances?: string;
  balconies?: string;
  acUnits?: string;
  warehouses?: string;
  hasLaundryRoom?: boolean;
  curtains?: string;
  hasExtraKitchen?: boolean;
  extraKitchenAppliances?: string;
  category?: string;
  purpose?: string;
  smartPath?: string;
  warranties?: { type: string; duration: string }[];
  paymentOption?: string;
  paymentPrices?: {
    onePayment?: string;
    twoPayments?: string;
    fourPayments?: string;
    monthly?: string;
  };
  hashtags?: string[];
  customHashtags?: string[];
  deedNumber?: string;
  deedDate?: string;
  adLicense?: string;
  brokerPhone?: string;
  lat?: number;
  lng?: number;
  status: 'published' | 'draft' | 'archived';
  isPinned?: boolean;
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// تحويل من snake_case إلى camelCase
const mapDbToListing = (row: any): PlatformListing => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  price: Number(row.price),
  propertyType: row.property_type,
  area: row.area ? Number(row.area) : undefined,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  image: row.image,
  images: row.images || [],
  city: row.city,
  district: row.district,
  street: row.street,
  ownerName: row.owner_name,
  ownerPhone: row.owner_phone,
  views: row.views || 0,
  age: row.age,
  direction: row.direction,
  features: row.features || [],
  videoUrl: row.video_url,
  tour3DUrl: row.tour_3d_url,
  livingRooms: row.living_rooms,
  councils: row.councils,
  floors: row.floors,
  floorNumber: row.floor_number,
  cornerType: row.corner_type,
  streetWidth: row.street_width,
  furnishing: row.furnishing,
  entrances: row.entrances,
  balconies: row.balconies,
  acUnits: row.ac_units,
  warehouses: row.warehouses,
  hasLaundryRoom: row.has_laundry_room,
  curtains: row.curtains,
  hasExtraKitchen: row.has_extra_kitchen,
  extraKitchenAppliances: row.extra_kitchen_appliances,
  category: row.category,
  purpose: row.purpose,
  smartPath: row.smart_path,
  warranties: row.warranties || [],
  paymentOption: row.payment_option,
  paymentPrices: row.payment_prices || {},
  hashtags: row.hashtags || [],
  customHashtags: row.custom_hashtags || [],
  deedNumber: row.deed_number,
  deedDate: row.deed_date,
  adLicense: row.ad_license,
  brokerPhone: row.broker_phone,
  lat: row.lat ? Number(row.lat) : undefined,
  lng: row.lng ? Number(row.lng) : undefined,
  status: row.status,
  isPinned: row.is_pinned,
  isHidden: row.is_hidden,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// تحويل من camelCase إلى snake_case
const mapListingToDb = (listing: Partial<PlatformListing>) => ({
  slug: listing.slug,
  title: listing.title,
  description: listing.description,
  price: listing.price,
  property_type: listing.propertyType,
  area: listing.area,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  image: listing.image,
  images: listing.images,
  city: listing.city,
  district: listing.district,
  street: listing.street,
  owner_name: listing.ownerName,
  owner_phone: listing.ownerPhone,
  views: listing.views,
  age: listing.age,
  direction: listing.direction,
  features: listing.features,
  video_url: listing.videoUrl,
  tour_3d_url: listing.tour3DUrl,
  living_rooms: listing.livingRooms,
  councils: listing.councils,
  floors: listing.floors,
  floor_number: listing.floorNumber,
  corner_type: listing.cornerType,
  street_width: listing.streetWidth,
  furnishing: listing.furnishing,
  entrances: listing.entrances,
  balconies: listing.balconies,
  ac_units: listing.acUnits,
  warehouses: listing.warehouses,
  has_laundry_room: listing.hasLaundryRoom,
  curtains: listing.curtains,
  has_extra_kitchen: listing.hasExtraKitchen,
  extra_kitchen_appliances: listing.extraKitchenAppliances,
  category: listing.category,
  purpose: listing.purpose,
  smart_path: listing.smartPath,
  warranties: listing.warranties,
  payment_option: listing.paymentOption,
  payment_prices: listing.paymentPrices,
  hashtags: listing.hashtags,
  custom_hashtags: listing.customHashtags,
  deed_number: listing.deedNumber,
  deed_date: listing.deedDate,
  ad_license: listing.adLicense,
  broker_phone: listing.brokerPhone,
  lat: listing.lat,
  lng: listing.lng,
  status: listing.status,
  is_pinned: listing.isPinned,
  is_hidden: listing.isHidden,
});

export function usePlatformListings(slug?: string) {
  const [listings, setListings] = useState<PlatformListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب العروض
  const fetchListings = useCallback(async () => {
    if (!slug) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('platform_listings')
        .select('*')
        .eq('slug', slug)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setListings((data || []).map(mapDbToListing));
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // إضافة عرض جديد
  const addListing = async (listing: Omit<PlatformListing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dbData = mapListingToDb(listing);
      
      const { data, error: insertError } = await supabase
        .from('platform_listings')
        .insert(dbData)
        .select()
        .single();

      if (insertError) throw insertError;

      const newListing = mapDbToListing(data);
      setListings(prev => [newListing, ...prev]);
      toast.success('تم إضافة العرض بنجاح');
      return newListing;
    } catch (err: any) {
      console.error('Error adding listing:', err);
      toast.error('فشل في إضافة العرض');
      throw err;
    }
  };

  // تحديث عرض
  const updateListing = async (id: string, updates: Partial<PlatformListing>) => {
    try {
      const dbData = mapListingToDb(updates);
      
      const { data, error: updateError } = await supabase
        .from('platform_listings')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedListing = mapDbToListing(data);
      setListings(prev => prev.map(l => l.id === id ? updatedListing : l));
      toast.success('تم تحديث العرض بنجاح');
      return updatedListing;
    } catch (err: any) {
      console.error('Error updating listing:', err);
      toast.error('فشل في تحديث العرض');
      throw err;
    }
  };

  // حذف عرض
  const deleteListing = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('platform_listings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('تم حذف العرض بنجاح');
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      toast.error('فشل في حذف العرض');
      throw err;
    }
  };

  // مزامنة من localStorage إلى قاعدة البيانات
  const syncFromLocalStorage = async (currentSlug: string) => {
    try {
      // قراءة البيانات من localStorage
      const localData = localStorage.getItem('wasata_platform_complete');
      const publishedAds = localStorage.getItem('published_ads_list');
      
      let adsToSync: any[] = [];
      
      if (localData) {
        try {
          adsToSync = JSON.parse(localData);
        } catch (e) {
          console.error('Error parsing local data:', e);
        }
      }
      
      if (publishedAds) {
        try {
          const published = JSON.parse(publishedAds);
          // دمج مع العروض الموجودة
          published.forEach((ad: any) => {
            if (!adsToSync.find((a: any) => a.id === ad.id)) {
              adsToSync.push(ad);
            }
          });
        } catch (e) {
          console.error('Error parsing published ads:', e);
        }
      }

      if (adsToSync.length === 0) {
        toast.info('لا توجد عروض للمزامنة');
        return;
      }

      // تحويل وإدراج
      const listingsToInsert = adsToSync.map((ad: any) => ({
        slug: currentSlug,
        title: ad.title || 'عرض بدون عنوان',
        description: ad.description,
        price: Number(ad.price) || 0,
        property_type: ad.propertyType || 'شقة',
        area: ad.area ? Number(ad.area) : null,
        bedrooms: ad.bedrooms ? Number(ad.bedrooms) : null,
        bathrooms: ad.bathrooms ? Number(ad.bathrooms) : null,
        image: ad.image || (ad.images && ad.images[0]),
        images: ad.images || [],
        city: ad.city || 'غير محدد',
        district: ad.district || 'غير محدد',
        street: ad.street,
        owner_name: ad.ownerName,
        owner_phone: ad.ownerPhone,
        views: ad.views || 0,
        age: ad.age,
        direction: ad.direction,
        features: ad.features || [],
        video_url: ad.videoUrl,
        tour_3d_url: ad.tour3DUrl,
        living_rooms: ad.livingRooms,
        councils: ad.councils,
        floors: ad.floors,
        floor_number: ad.floorNumber,
        corner_type: ad.cornerType,
        street_width: ad.streetWidth,
        furnishing: ad.furnishing,
        entrances: ad.entrances,
        balconies: ad.balconies,
        ac_units: ad.acUnits,
        warehouses: ad.warehouses,
        has_laundry_room: ad.hasLaundryRoom || false,
        curtains: ad.curtains,
        has_extra_kitchen: ad.hasExtraKitchen || false,
        extra_kitchen_appliances: ad.extraKitchenAppliances,
        category: ad.category,
        purpose: ad.purpose,
        smart_path: ad.smartPath,
        warranties: ad.warranties || [],
        payment_option: ad.paymentOption,
        payment_prices: ad.paymentPrices || {},
        hashtags: ad.hashtags || [],
        custom_hashtags: ad.customHashtags || [],
        deed_number: ad.deedNumber,
        deed_date: ad.deedDate,
        ad_license: ad.adLicense,
        broker_phone: ad.brokerPhone,
        lat: ad.lat,
        lng: ad.lng,
        status: ad.status || 'published',
        is_pinned: ad.isPinned || false,
        is_hidden: ad.isHidden || false,
      }));

      const { data, error: insertError } = await supabase
        .from('platform_listings')
        .insert(listingsToInsert)
        .select();

      if (insertError) throw insertError;

      setListings((data || []).map(mapDbToListing));
      toast.success(`تم مزامنة ${listingsToInsert.length} عرض بنجاح`);
    } catch (err: any) {
      console.error('Error syncing from localStorage:', err);
      toast.error('فشل في المزامنة');
      throw err;
    }
  };

  // زيادة عدد المشاهدات
  const incrementViews = async (id: string) => {
    try {
      const listing = listings.find(l => l.id === id);
      if (!listing) return;

      await supabase
        .from('platform_listings')
        .update({ views: (listing.views || 0) + 1 })
        .eq('id', id);

      setListings(prev => prev.map(l => 
        l.id === id ? { ...l, views: (l.views || 0) + 1 } : l
      ));
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  // الاستماع للتحديثات الفورية
  useEffect(() => {
    if (!slug) return;

    fetchListings();

    const channel = supabase
      .channel(`platform-listings-${slug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_listings',
          filter: `slug=eq.${slug}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setListings(prev => [mapDbToListing(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setListings(prev => prev.map(l => 
              l.id === payload.new.id ? mapDbToListing(payload.new) : l
            ));
          } else if (payload.eventType === 'DELETE') {
            setListings(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, fetchListings]);

  return {
    listings,
    loading,
    error,
    fetchListings,
    addListing,
    updateListing,
    deleteListing,
    syncFromLocalStorage,
    incrementViews,
  };
}

// Hook للصفحة العامة (قراءة فقط)
export function usePublicPlatformListings(slug?: string) {
  const [listings, setListings] = useState<PlatformListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setListings([]);
      setLoading(false);
      return;
    }

    const fetchPublicListings = async () => {
      setLoading(true);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('platform_listings')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setListings((data || []).map(mapDbToListing));
      } catch (err: any) {
        console.error('Error fetching public listings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicListings();
  }, [slug]);

  return { listings, loading, error };
}
