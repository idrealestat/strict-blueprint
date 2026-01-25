/**
 * usePlatformListings.ts
 * Hook لإدارة العروض العقارية في قاعدة البيانات
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===== Helpers (بدون افتراضات على UI، فقط توحيد الربط بين العروض/المنصة/الصفحة العامة) =====

const isEmptyValue = (v: any) =>
  v === undefined ||
  v === null ||
  (typeof v === 'string' && (v.trim() === '' || v.trim() === 'غير محدد'));

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

  const parts = smartPath
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  // يدعم صيغتين موجودتين في المشروع:
  // (A) publishedAds: المدينة/الحي/نوع العقار/الغرض/التصنيف
  // (B) بعض الأجزاء القديمة: التصنيف/الغرض/المدينة/الحي
  const purposeLike = parts[1];
  const looksLikeFormatB = purposeLike === 'للبيع' || purposeLike === 'للإيجار' || purposeLike === 'للايجار';

  if (looksLikeFormatB) {
    const city = parts.length >= 3 ? parts[2] : undefined;
    const districtRaw = parts.length >= 4 ? parts[3] : undefined;
    const district = districtRaw ? normalizeDistrict(districtRaw) : undefined;
    return { city, district };
  }

  const city = parts.length >= 1 ? parts[0] : undefined;
  const districtRaw = parts.length >= 2 ? parts[1] : undefined;
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
  // حقول المالك الإضافية
  ownerIdNumber?: string;
  ownerBirthDate?: string;
  ownerCity?: string;
  ownerDistrict?: string;
  ownerNationalAddress?: string;
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
  deedCity?: string;
  adLicense?: string;
  adLicenseDate?: string;
  adLicenseDuration?: number;
  adLicenseExpiresAt?: string;
  brokerPhone?: string;
  lat?: number;
  lng?: number;
  // حقول معلومات التأجير
  contractDuration?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  isCurrentlyRented?: boolean;
  rentalContractFile?: string;
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
    // حقول المالك الإضافية
    ownerIdNumber: row.owner_id_number,
    ownerBirthDate: row.owner_birth_date,
    ownerCity: row.owner_city,
    ownerDistrict: row.owner_district,
    ownerNationalAddress: row.owner_national_address,
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
    deedCity: row.deed_city,
    adLicense: row.ad_license,
    adLicenseDate: row.ad_license_date,
    adLicenseDuration: row.ad_license_duration,
    adLicenseExpiresAt: row.ad_license_expires_at,
    brokerPhone: row.broker_phone,
    lat: row.lat ? Number(row.lat) : undefined,
    lng: row.lng ? Number(row.lng) : undefined,
    // حقول معلومات التأجير
    contractDuration: row.contract_duration,
    contractStartDate: row.contract_start_date,
    contractEndDate: row.contract_end_date,
    isCurrentlyRented: row.is_currently_rented,
    rentalContractFile: row.rental_contract_file,
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
  // حقول المالك الإضافية
  owner_id_number: listing.ownerIdNumber,
  owner_birth_date: listing.ownerBirthDate,
  owner_city: listing.ownerCity,
  owner_district: listing.ownerDistrict,
  owner_national_address: listing.ownerNationalAddress,
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
  deed_city: listing.deedCity,
  ad_license: listing.adLicense,
  ad_license_date: listing.adLicenseDate,
  ad_license_duration: listing.adLicenseDuration,
  broker_phone: listing.brokerPhone,
  lat: listing.lat,
  lng: listing.lng,
  // حقول معلومات التأجير
  contract_duration: listing.contractDuration,
  contract_start_date: listing.contractStartDate,
  contract_end_date: listing.contractEndDate,
  is_currently_rented: listing.isCurrentlyRented,
  rental_contract_file: listing.rentalContractFile,
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
        .is('deleted_at', null) // استبعاد العروض المحذوفة (soft delete)
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

  // حذف عرض (Soft Delete)
  const deleteListing = async (id: string, permanent = false) => {
    try {
      if (permanent) {
        // حذف نهائي
        const { error: deleteError } = await supabase
          .from('platform_listings')
          .delete()
          .eq('id', id);
        if (deleteError) throw deleteError;
      } else {
        // Soft delete - تحديث deleted_at فقط
        const { error: updateError } = await supabase
          .from('platform_listings')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (updateError) throw updateError;
      }

      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('تم حذف العرض بنجاح');
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      toast.error('فشل في حذف العرض');
      throw err;
    }
  };

  // مزامنة من localStorage إلى قاعدة البيانات
  const syncFromLocalStorage = async (
    currentSlug: string,
    options?: { silent?: boolean }
  ) => {
    const silent = Boolean(options?.silent);

    try {
      // ✅ الحصول على user_id - مطلوب لسياسات RLS
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user found, skipping sync');
        return;
      }

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
        if (!silent) toast.info('لا توجد عروض للمزامنة');
        return;
      }

      // نقرأ العروض الموجودة مسبقاً لهذا الـ slug حتى نمنع التكرار عند كل مزامنة
      // (بدون أي افتراضات على شكل الـ id القادم من localStorage)
      const { data: existingRows, error: existingErr } = await supabase
        .from('platform_listings')
        .select('id, title, price, city, district, property_type, smart_path')
        .eq('slug', currentSlug);

      if (existingErr) throw existingErr;

      const buildKey = (row: {
        title: any;
        price: any;
        city: any;
        district: any;
        property_type: any;
        smart_path: any;
      }) => {
        const title = String(row.title ?? '').trim();
        const price = String(row.price ?? '').trim();
        const city = String(row.city ?? '').trim();
        const district = String(row.district ?? '').trim();
        const propertyType = String(row.property_type ?? '').trim();
        const smartPath = String(row.smart_path ?? '').trim();
        return `${title}__${price}__${city}__${district}__${propertyType}__${smartPath}`;
      };

      const existingByKey = new Map<string, string>();
      (existingRows || []).forEach((r: any) => {
        if (!r?.id) return;
        const key = buildKey(r);
        if (!existingByKey.has(key)) existingByKey.set(key, r.id);
      });

      // تحويل وإدراج/تحديث (Upsert) بدون تكرار
      const listingsToUpsert = adsToSync.map((ad: any) => {
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
          firstNonEmpty(
            ad.locationDetails?.city,
            ad.location?.city,
            ad.city,
            parsedFromPath.city,
            'غير محدد'
          ) as any
        );
        const district = String(
          firstNonEmpty(
            ad.locationDetails?.district,
            ad.location?.district,
            ad.district,
            parsedFromPath.district,
            'غير محدد'
          ) as any
        );

        const titleCandidate = firstNonEmpty(ad.title);
        const title = !titleCandidate || String(titleCandidate).trim() === 'عرض بدون عنوان'
          ? buildFallbackTitle(ad, city, district)
          : String(titleCandidate);

        const description = firstNonEmpty(ad.aiDescription, ad.description);

        const base: any = {
          user_id: user.id, // ✅ مطلوب لسياسات RLS
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
          status: firstNonEmpty(ad.status, 'published'),
          is_pinned: Boolean(firstNonEmpty(ad.isPinned, false)),
          is_hidden: Boolean(firstNonEmpty(ad.isHidden, false)),
        };

        // 1) إذا كان لدينا UUID صالح من المصدر نستخدمه
        if (isUuid(ad.id)) return { id: ad.id, ...base };

        // 2) غير ذلك: نطابق على مفتاح ثابت (نفس بيانات العرض) لمنع تكرار الإدراج
        const key = buildKey({
          title: base.title,
          price: base.price,
          city: base.city,
          district: base.district,
          property_type: base.property_type,
          smart_path: base.smart_path,
        });
        const existingId = existingByKey.get(key);
        return existingId ? { id: existingId, ...base } : base;
      });

      const { data, error: upsertError } = await supabase
        .from('platform_listings')
        .upsert(listingsToUpsert, { onConflict: 'id' })
        .select();

      if (upsertError) throw upsertError;

      // Dedup على مستوى الواجهة أيضاً (حتى لو كانت هناك تكرارات قديمة في القاعدة)
      const seen = new Set<string>();
      const unique = (data || []).filter((row: any) => {
        const key = buildKey(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setListings(unique.map(mapDbToListing));
      if (!silent) toast.success(`تمت المزامنة (${unique.length})`);
    } catch (err: any) {
      console.error('Error syncing from localStorage:', err);
      if (!silent) toast.error('فشل في المزامنة');
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

  // ✅ دالة تنظيف التكرارات من قاعدة البيانات (للمالك فقط)
  const cleanupDuplicates = async () => {
    if (!slug) {
      toast.error('لا يوجد slug محدد');
      return { removed: 0 };
    }

    try {
      // جلب كل العروض لهذا الـ slug
      const { data: allRows, error: fetchError } = await supabase
        .from('platform_listings')
        .select('*')
        .eq('slug', slug)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (!allRows || allRows.length === 0) {
        toast.info('لا توجد عروض للتنظيف');
        return { removed: 0 };
      }

      // دالة بناء المفتاح الفريد
      const buildDuplicateKey = (row: any) => {
        const title = String(row.title ?? '').trim();
        const price = String(row.price ?? '').trim();
        const city = String(row.city ?? '').trim();
        const district = String(row.district ?? '').trim();
        const propertyType = String(row.property_type ?? '').trim();
        const smartPath = String(row.smart_path ?? '').trim();
        return `${title}__${price}__${city}__${district}__${propertyType}__${smartPath}`;
      };

      // تحديد التكرارات: نحتفظ بأول نسخة من كل مفتاح فريد
      const seen = new Map<string, string>(); // key -> id (الأول)
      const idsToDelete: string[] = [];

      allRows.forEach((row: any) => {
        const key = buildDuplicateKey(row);
        if (seen.has(key)) {
          // هذا تكرار - سيتم حذفه
          idsToDelete.push(row.id);
        } else {
          // هذا الأصلي - نحتفظ به
          seen.set(key, row.id);
        }
      });

      if (idsToDelete.length === 0) {
        toast.success('لا توجد تكرارات للحذف');
        return { removed: 0 };
      }

      // حذف التكرارات
      const { error: deleteError } = await supabase
        .from('platform_listings')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      // تحديث القائمة المحلية
      setListings((prev) => prev.filter((l) => !idsToDelete.includes(l.id)));

      toast.success(`تم حذف ${idsToDelete.length} عرض مكرر`);
      return { removed: idsToDelete.length };
    } catch (err: any) {
      console.error('Error cleaning duplicates:', err);
      toast.error('فشل في تنظيف التكرارات');
      throw err;
    }
  };

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
    cleanupDuplicates,
  };
}

// دالة مساعدة لبناء مفتاح فريد لمنع التكرار
const buildListingKey = (row: any) =>
  `${String(row.title ?? '').trim()}__${String(row.price ?? '').trim()}__${String(row.city ?? '').trim()}__${String(row.district ?? '').trim()}__${String(row.property_type ?? '').trim()}__${String(row.smart_path ?? '').trim()}`;

// Hook للصفحة العامة (قراءة فقط + تحديث لحظي)
// يدعم البحث بـ slug أو user_id
export function usePublicPlatformListings(slug?: string, userId?: string) {
  const [listings, setListings] = useState<PlatformListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // دالة لإزالة التكرارات
  const dedupeListings = (rows: any[]): PlatformListing[] => {
    const seen = new Set<string>();
    return rows
      .filter((row: any) => {
        const key = buildListingKey(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(mapDbToListing);
  };

  useEffect(() => {
    // نحتاج على الأقل slug أو userId
    if (!slug && !userId) {
      setListings([]);
      setLoading(false);
      return;
    }

    const fetchPublicListings = async () => {
      setLoading(true);

      try {
        let query = supabase
          .from('platform_listings')
          .select('*')
          .eq('status', 'published')
          .eq('is_hidden', false)
          .is('deleted_at', null);
        
        // البحث بـ slug أولاً، ثم user_id كخيار ثانٍ
        if (slug) {
          query = query.eq('slug', slug);
        } else if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error: fetchError } = await query
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setListings(dedupeListings(data || []));
      } catch (err: any) {
        console.error('Error fetching public listings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicListings();

    // ✅ تحديث لحظي (Realtime) - الزائر يرى التغييرات فوراً
    const channelId = slug ? `public-listings-${slug}` : `public-listings-user-${userId}`;
    const filterKey = slug ? 'slug' : 'user_id';
    const filterValue = slug || userId;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_listings',
          filter: `${filterKey}=eq.${filterValue}`,
        },
        (payload) => {
          console.log('Realtime public update:', payload);

          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            // نضيف فقط إذا كان published وغير مخفي
            if (newRow.status === 'published' && !newRow.is_hidden) {
              setListings((prev) => {
                const key = buildListingKey(newRow);
                // تحقق من عدم وجود نسخة مكررة
                const exists = prev.some((l) => buildListingKey(l) === key || l.id === newRow.id);
                if (exists) return prev;
                return [mapDbToListing(newRow), ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as any;
            setListings((prev) => {
              // إذا أصبح مخفياً أو غير منشور، نحذفه من القائمة
              if (updatedRow.status !== 'published' || updatedRow.is_hidden) {
                return prev.filter((l) => l.id !== updatedRow.id);
              }
              // تحديث العرض الموجود
              const exists = prev.some((l) => l.id === updatedRow.id);
              if (exists) {
                return prev.map((l) =>
                  l.id === updatedRow.id ? mapDbToListing(updatedRow) : l
                );
              }
              // إذا لم يكن موجوداً (أصبح منشوراً الآن)، نضيفه
              return [mapDbToListing(updatedRow), ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setListings((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, userId]);

  return { listings, loading, error };
}

// دالة مساعدة لمزامنة عرض واحد إلى قاعدة البيانات (تلقائياً عند النشر)
export async function syncSingleListingToDatabase(ad: any): Promise<boolean> {
  try {
    // ✅ الحصول على user_id - مطلوب لسياسات RLS
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found, skipping database sync');
      return false;
    }

    // ✅ الحصول على الـ slug من قاعدة البيانات مباشرة (أكثر موثوقية من localStorage)
    let slug = localStorage.getItem('public_platform_slug');
    if (!slug || slug === 'default') {
      const { data: cardData } = await supabase
        .from('business_cards')
        .select('slug')
        .eq('user_id', user.id)
        .single();
      
      if (cardData?.slug) {
        slug = cardData.slug;
        localStorage.setItem('public_platform_slug', slug);
      }
    }

    if (!slug || slug === 'default') {
      console.warn('No platform slug found, skipping database sync');
      return false;
    }

    console.log('🔄 Syncing listing to database with slug:', slug, 'user_id:', user.id);

    const smartPath = firstNonEmpty(ad.smartPath, ad.platformPath, ad.smart_path);
    const parsedFromPath = parseCityDistrictFromSmartPath(smartPath ? String(smartPath) : undefined);

    const city = String(
      firstNonEmpty(
        ad.locationDetails?.city,
        ad.location?.city,
        ad.city,
        parsedFromPath.city,
        'غير محدد'
      ) as any
    );
    const district = String(
      firstNonEmpty(
        ad.locationDetails?.district,
        ad.location?.district,
        ad.district,
        parsedFromPath.district,
        'غير محدد'
      ) as any
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
      user_id: user.id, // ✅ مطلوب لسياسات RLS
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
      // حقول المالك الإضافية
      owner_id_number: firstNonEmpty(ad.ownerIdNumber, null),
      owner_birth_date: firstNonEmpty(ad.ownerBirthDate, null),
      owner_city: firstNonEmpty(ad.ownerCity, ad.locationDetails?.city, null),
      owner_district: firstNonEmpty(ad.ownerDistrict, ad.locationDetails?.district, null),
      owner_national_address: firstNonEmpty(ad.ownerNationalAddress, null),
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
      deed_city: firstNonEmpty(ad.deedCity, null),
      ad_license: firstNonEmpty(ad.adLicense, null),
      broker_phone: firstNonEmpty(ad.brokerPhone, null),
      lat: firstNonEmpty(ad.locationDetails?.latitude, ad.lat, null),
      lng: firstNonEmpty(ad.locationDetails?.longitude, ad.lng, null),
      // حقول معلومات التأجير
      contract_duration: firstNonEmpty(ad.contractDuration, null),
      contract_start_date: firstNonEmpty(ad.contractStartDate, null),
      contract_end_date: firstNonEmpty(ad.contractEndDate, null),
      is_currently_rented: Boolean(firstNonEmpty(ad.isCurrentlyRented, false)),
      rental_contract_file: firstNonEmpty(ad.rentalContractFile, null),
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
