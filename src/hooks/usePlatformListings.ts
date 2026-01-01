/**
 * usePlatformListings.ts
 * Hook لإدارة العروض العقارية في قاعدة البيانات
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===== Helpers (بدون افتراضات على UI، فقط توحيد الربط بين العروض/المنصة/الصفحة العامة) =====

const isEmptyValue = (v: any) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

const isUuid = (v: any) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const firstNonEmpty = <T,>(...values: T[]): T | undefined => {
  for (const v of values) {
    if (!isEmptyValue(v)) return v;
  }
  return undefined;
};

const normalizeDistrict = (district: string) => district.replace(/^حي\s+/u, '').trim();

const parseCityDistrictFromSmartPath = (smartPath?: string): { city?: string; district?: string } => {
  if (!smartPath) return {};

  // صيغة المسار عندنا غالباً: "سكني / للإيجار / الخبر / حي الحمراء"
  const parts = smartPath
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  // نتوقع: [category, purpose, city, district]
  const city = parts.length >= 3 ? parts[2] : undefined;
  const districtRaw = parts.length >= 4 ? parts[3] : undefined;
  const district = districtRaw ? normalizeDistrict(districtRaw) : undefined;

  return { city, district };
};

const buildFallbackTitle = (adLike: any, city?: string, district?: string): string => {
  // مطابق لمنطق العروض في MyPlatformComplete (بدون تغيير التصميم)
  const purpose = String(firstNonEmpty(adLike?.purpose, '') || '');
  const normalizedPurpose = purpose === 'للإيجار' ? 'للإيجار' : (purpose === 'للبيع' ? 'للبيع' : purpose);
  const propertyType = String(firstNonEmpty(adLike?.propertyType, adLike?.property_type, '') || '');
  const area = firstNonEmpty(adLike?.area, adLike?.features?.area, '') as any;
  const areaText = !isEmptyValue(area) ? `${String(area).replace(/[^\d]/g, '')}م` : '';

  // العنوان الأساسي كما كان في تبويب العروض
  const base = `${normalizedPurpose || 'عرض'} - ${propertyType || 'عقار'}${areaText ? ` - ${areaText}` : ''}`;

  // لا نضيف تفاصيل زيادة إلا إذا كانت موجودة فعلاً (بدون تحسين)
  if (!isEmptyValue(city) && !isEmptyValue(district)) return `${base} - ${city} - ${district}`;
  if (!isEmptyValue(city)) return `${base} - ${city}`;
  return base;
};


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
const mapDbToListing = (row: any): PlatformListing => {
  const parsedFromPath = parseCityDistrictFromSmartPath(row.smart_path);

  const city = String(
    firstNonEmpty(row.city, parsedFromPath.city, 'غير محدد') as any
  );
  const district = String(
    firstNonEmpty(row.district, parsedFromPath.district, 'غير محدد') as any
  );

  const titleFromRow = firstNonEmpty(row.title);
  const title = !titleFromRow || String(titleFromRow).trim() === 'عرض بدون عنوان'
    ? buildFallbackTitle(
        {
          purpose: row.purpose,
          propertyType: row.property_type,
          area: row.area,
        },
        city,
        district
      )
    : String(titleFromRow);

  const description = firstNonEmpty(row.description);

  return {
    id: row.id,
    slug: row.slug,
    title,
    description: description ? String(description) : undefined,
    price: Number(row.price),
    propertyType: row.property_type,
    area: row.area ? Number(row.area) : undefined,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    image: row.image,
    images: row.images || [],
    city,
    district,
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
  };
};

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

      const byId = new Map<string, any>();

      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            parsed.forEach((ad: any) => {
              if (ad?.id) byId.set(String(ad.id), ad);
            });
          }
        } catch (e) {
          console.error('Error parsing local data:', e);
        }
      }

      if (publishedAds) {
        try {
          const parsed = JSON.parse(publishedAds);
          if (Array.isArray(parsed)) {
            // الأهم: published_ads_list هو المصدر الأدق، لذلك يطغى على أي نسخة ناقصة موجودة مسبقاً
            parsed.forEach((ad: any) => {
              const id = String(ad?.id ?? '');
              if (!id) return;
              const prev = byId.get(id) || {};
              byId.set(id, { ...prev, ...ad });
            });
          }
        } catch (e) {
          console.error('Error parsing published ads:', e);
        }
      }

      const adsToSync = Array.from(byId.values());

      if (adsToSync.length === 0) {
        toast.info('لا توجد عروض للمزامنة');
        return;
      }

      // تحويل وإدراج
      const listingsToInsert = adsToSync.map((ad: any) => {
        // استخراج الصور
        const images =
          ad.images ||
          ad.media?.filter((m: any) => m.type === 'image').map((m: any) => m.url) ||
          [];

        // استخراج الفيديو
        const videoUrl =
          ad.videoUrl ||
          ad.videos?.[0] ||
          ad.media?.find((m: any) => m.type === 'video')?.url ||
          null;

        const smartPath = firstNonEmpty(ad.smartPath, ad.platformPath, ad.smart_path);
        const parsedFromPath = parseCityDistrictFromSmartPath(smartPath ? String(smartPath) : undefined);

        const city = String(
          firstNonEmpty(ad.locationDetails?.city, ad.city, parsedFromPath.city, 'غير محدد') as any
        );
        const district = String(
          firstNonEmpty(ad.locationDetails?.district, ad.district, parsedFromPath.district, 'غير محدد') as any
        );

        const titleCandidate = firstNonEmpty(ad.title);
        const title = !titleCandidate || String(titleCandidate).trim() === 'عرض بدون عنوان'
          ? buildFallbackTitle(ad, city, district)
          : String(titleCandidate);

        const description = firstNonEmpty(ad.aiDescription, ad.description);

        const base = {
          slug: currentSlug,
          title,
          description: description ? String(description) : null,
          price: Number(String(firstNonEmpty(ad.price, 0) as any).replace(/[^\d]/g, '')) || 0,
          property_type: firstNonEmpty(ad.propertyType, ad.property_type, 'شقة'),
          area: !isEmptyValue(ad.area) ? Number(String(ad.area).replace(/[^\d.]/g, '')) : null,
          bedrooms: !isEmptyValue(ad.bedrooms) ? Number(String(ad.bedrooms).replace(/[^\d]/g, '')) : null,
          bathrooms: !isEmptyValue(ad.bathrooms) ? Number(String(ad.bathrooms).replace(/[^\d]/g, '')) : null,
          image: firstNonEmpty(ad.image, images[0], null),
          images,
          city,
          district,
          street: firstNonEmpty(ad.locationDetails?.street, ad.street, null),
          owner_name: firstNonEmpty(ad.ownerName, null),
          owner_phone: firstNonEmpty(ad.ownerPhone, null),
          views: Number(firstNonEmpty(ad.views, 0)) || 0,
          age: !isEmptyValue(ad.propertyAge) ? Number(String(ad.propertyAge).replace(/[^\d]/g, '')) : (!isEmptyValue(ad.age) ? Number(ad.age) : null),
          direction: firstNonEmpty(ad.facade, ad.direction, null),
          features: firstNonEmpty(ad.features, ad.customFeatures, []) || [],
          video_url: videoUrl,
          tour_3d_url: firstNonEmpty(ad.tour3DUrl, ad.tour_3d_url, null),
          living_rooms: firstNonEmpty(ad.livingRooms, null),
          councils: firstNonEmpty(ad.councils, null),
          floors: firstNonEmpty(ad.floors, null),
          floor_number: firstNonEmpty(ad.floorNumber, null),
          corner_type: firstNonEmpty(ad.cornerType, null),
          street_width: firstNonEmpty(ad.streetWidth, null),
          furnishing: firstNonEmpty(ad.furnishing, null),
          entrances: firstNonEmpty(ad.entrances, null),
          balconies: firstNonEmpty(ad.balconies, null),
          ac_units: firstNonEmpty(ad.acUnits, null),
          warehouses: firstNonEmpty(ad.warehouses, null),
          has_laundry_room: Boolean(firstNonEmpty(ad.hasLaundryRoom, false)),
          curtains: firstNonEmpty(ad.curtains, null),
          has_extra_kitchen: Boolean(firstNonEmpty(ad.hasExtraKitchen, false)),
          extra_kitchen_appliances: firstNonEmpty(ad.extraKitchenAppliances, null),
          category: firstNonEmpty(ad.category, null),
          purpose: firstNonEmpty(ad.purpose, null),
          smart_path: smartPath ? String(smartPath) : null,
          warranties: firstNonEmpty(ad.warranties, []),
          payment_option: firstNonEmpty(ad.paymentOption, null),
          payment_prices: firstNonEmpty(ad.paymentPrices, {}),
          hashtags: firstNonEmpty(ad.hashtags, []),
          custom_hashtags: firstNonEmpty(ad.customHashtags, []),
          deed_number: firstNonEmpty(ad.deedNumber, null),
          deed_date: firstNonEmpty(ad.deedDate, null),
          ad_license: firstNonEmpty(ad.adLicense, null),
          broker_phone: firstNonEmpty(ad.brokerPhone, null),
          lat: firstNonEmpty(ad.locationDetails?.latitude, ad.lat, null),
          lng: firstNonEmpty(ad.locationDetails?.longitude, ad.lng, null),
          status: firstNonEmpty(ad.status, 'published'),
          is_pinned: Boolean(firstNonEmpty(ad.isPinned, false)),
          is_hidden: Boolean(firstNonEmpty(ad.isHidden, false)),
        };

        // توحيد الربط عبر نفس ID (بدون تكرار/نسخ ناقصة)
        return isUuid(ad.id) ? { id: ad.id, ...base } : base;
      });

      const { data, error: insertError } = await supabase
        .from('platform_listings')
        .upsert(listingsToInsert, { onConflict: 'id' })
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

// دالة مساعدة لمزامنة عرض واحد إلى قاعدة البيانات (تلقائياً عند النشر)
export async function syncSingleListingToDatabase(ad: any): Promise<boolean> {
  try {
    // الحصول على الـ slug من localStorage
    const slug = localStorage.getItem('public_platform_slug') || '1';

    if (!slug) {
      console.warn('No platform slug found, skipping database sync');
      return false;
    }

    const smartPath = firstNonEmpty(ad.smartPath, ad.platformPath, ad.smart_path);
    const parsedFromPath = parseCityDistrictFromSmartPath(smartPath ? String(smartPath) : undefined);

    const city = String(
      firstNonEmpty(ad.locationDetails?.city, ad.city, parsedFromPath.city, 'غير محدد') as any
    );
    const district = String(
      firstNonEmpty(ad.locationDetails?.district, ad.district, parsedFromPath.district, 'غير محدد') as any
    );

    // استخراج الصور
    const images =
      ad.images ||
      ad.media?.filter((m: any) => m.type === 'image').map((m: any) => m.url) ||
      [];

    // استخراج الفيديو
    const videoUrl =
      ad.videoUrl ||
      ad.videos?.[0] ||
      ad.media?.find((m: any) => m.type === 'video')?.url ||
      null;

    const titleCandidate = firstNonEmpty(ad.title);
    const title = !titleCandidate || String(titleCandidate).trim() === 'عرض بدون عنوان'
      ? buildFallbackTitle(ad, city, district)
      : String(titleCandidate);

    const description = firstNonEmpty(ad.aiDescription, ad.description);

    const listingData = {
      slug,
      title,
      description: description ? String(description) : null,
      price: Number(String(firstNonEmpty(ad.price, 0) as any).replace(/[^\d]/g, '')) || 0,
      property_type: firstNonEmpty(ad.propertyType, ad.property_type, 'شقة'),
      area: !isEmptyValue(ad.area) ? Number(String(ad.area).replace(/[^\d.]/g, '')) : null,
      bedrooms: !isEmptyValue(ad.bedrooms) ? Number(String(ad.bedrooms).replace(/[^\d]/g, '')) : null,
      bathrooms: !isEmptyValue(ad.bathrooms) ? Number(String(ad.bathrooms).replace(/[^\d]/g, '')) : null,
      image: firstNonEmpty(images[0], ad.image, null),
      images,
      city,
      district,
      street: firstNonEmpty(ad.locationDetails?.street, ad.street, null),
      owner_name: firstNonEmpty(ad.ownerName, null),
      owner_phone: firstNonEmpty(ad.ownerPhone, null),
      views: 0,
      age: !isEmptyValue(ad.propertyAge)
        ? Number(String(ad.propertyAge).replace(/[^\d]/g, ''))
        : (!isEmptyValue(ad.age) ? Number(ad.age) : null),
      direction: firstNonEmpty(ad.facade, ad.direction, null),
      features: firstNonEmpty(ad.features, ad.customFeatures, []) || [],
      video_url: videoUrl,
      tour_3d_url: firstNonEmpty(ad.tour3DUrl, ad.tour_3d_url, null),
      living_rooms: firstNonEmpty(ad.livingRooms, null),
      councils: firstNonEmpty(ad.councils, null),
      floors: firstNonEmpty(ad.floors, null),
      floor_number: firstNonEmpty(ad.floorNumber, null),
      corner_type: firstNonEmpty(ad.cornerType, null),
      street_width: firstNonEmpty(ad.streetWidth, null),
      furnishing: firstNonEmpty(ad.furnishing, null),
      entrances: firstNonEmpty(ad.entrances, null),
      balconies: firstNonEmpty(ad.balconies, null),
      ac_units: firstNonEmpty(ad.acUnits, null),
      warehouses: firstNonEmpty(ad.warehouses, null),
      has_laundry_room: Boolean(firstNonEmpty(ad.hasLaundryRoom, false)),
      curtains: firstNonEmpty(ad.curtains, null),
      has_extra_kitchen: Boolean(firstNonEmpty(ad.hasExtraKitchen, false)),
      extra_kitchen_appliances: firstNonEmpty(ad.extraKitchenAppliances, null),
      category: firstNonEmpty(ad.category, null),
      purpose: firstNonEmpty(ad.purpose, null),
      smart_path: smartPath ? String(smartPath) : null,
      warranties: firstNonEmpty(ad.warranties, []),
      payment_option: firstNonEmpty(ad.paymentOption, null),
      payment_prices: firstNonEmpty(ad.paymentPrices, {}),
      hashtags: firstNonEmpty(ad.hashtags, []),
      custom_hashtags: firstNonEmpty(ad.customHashtags, []),
      deed_number: firstNonEmpty(ad.deedNumber, null),
      deed_date: firstNonEmpty(ad.deedDate, null),
      ad_license: firstNonEmpty(ad.adLicense, null),
      broker_phone: firstNonEmpty(ad.brokerPhone, null),
      lat: firstNonEmpty(ad.locationDetails?.latitude, ad.lat, null),
      lng: firstNonEmpty(ad.locationDetails?.longitude, ad.lng, null),
      status: 'published',
      is_pinned: false,
      is_hidden: false,
    };

    const { error } = await supabase
      .from('platform_listings')
      .upsert(isUuid(ad.id) ? { id: ad.id, ...listingData } : listingData, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing listing to database:', error);
      return false;
    }

    console.log('Listing synced to database successfully');
    return true;
  } catch (err) {
    console.error('Error in syncSingleListingToDatabase:', err);
    return false;
  }
}
