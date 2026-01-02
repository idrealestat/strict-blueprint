/**
 * publishedAds.ts
 * نظام إدارة الإعلانات المنشورة
 * حرفياً من الملف SMART_PATHS_COMPLETE_SYSTEM
 */

// واجهة الإعلان المنشور
export interface PublishedAd {
  id: string;
  title: string;
  description?: string;
  price: number;
  priceText?: string;
  purpose: 'بيع' | 'إيجار';
  propertyType: string;
  propertyCategory: 'سكني' | 'تجاري';
  location: {
    city: string;
    district: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    floors?: number;
  };
  mediaFiles: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
  }>;
  owner?: {
    id: string;
    name: string;
    phone: string;
  };
  status: 'draft' | 'published' | 'expired' | 'sold';
  views?: number;
  favorites?: number;
  smartPath?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

// واجهة المجموعة الذكية
export interface GroupedAds {
  path: string;
  ads: PublishedAd[];
  firstImage: string; // أول صورة من أول إعلان (الأقدم)
  count: number;
  pathParts: {
    city: string;
    district: string;
    propertyType: string;
    purpose: string;
    category: string;
  };
}

// مفتاح التخزين في localStorage
const STORAGE_KEY = 'wasata_published_ads';

/**
 * الحصول على جميع الإعلانات المنشورة
 */
export function getAllPublishedAds(): PublishedAd[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('خطأ في قراءة الإعلانات:', error);
  }
  return [];
}

/**
 * حفظ إعلان جديد
 */
export function savePublishedAd(ad: PublishedAd): void {
  const ads = getAllPublishedAds();
  const existingIndex = ads.findIndex(a => a.id === ad.id);
  
  if (existingIndex >= 0) {
    ads[existingIndex] = ad;
  } else {
    ads.push(ad);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
}

/**
 * حذف إعلان
 */
export function deletePublishedAd(adId: string): void {
  const ads = getAllPublishedAds().filter(a => a.id !== adId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
}

/**
 * توليد المسار الذكي للإعلان
 * الترتيب: المدينة/الحي/نوع العقار/الغرض/التصنيف
 */
export function generateSmartPath(ad: PublishedAd): string {
  const parts = [
    ad.location.city || 'غير محدد',
    ad.location.district || 'غير محدد',
    ad.propertyType || 'غير محدد',
    ad.purpose || 'غير محدد',
    ad.propertyCategory || 'غير محدد'
  ];
  
  return parts.join('/');
}

/**
 * تجميع الإعلانات حسب المسار الذكي
 */
export function groupAdsBySmartPath(): GroupedAds[] {
  const ads = getAllPublishedAds().filter(ad => ad.status === 'published');
  const groups = new Map<string, PublishedAd[]>();
  
  // تجميع الإعلانات حسب المسار
  ads.forEach(ad => {
    const path = ad.smartPath || generateSmartPath(ad);
    
    if (!groups.has(path)) {
      groups.set(path, []);
    }
    
    groups.get(path)!.push(ad);
  });
  
  // تحويل إلى مصفوفة GroupedAds
  const result: GroupedAds[] = [];
  
  groups.forEach((groupAds, path) => {
    // ترتيب الإعلانات حسب التاريخ (الأقدم أولاً)
    groupAds.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // الحصول على أول صورة من أول إعلان
    const firstAd = groupAds[0];
    const firstImage = firstAd.mediaFiles.length > 0 
      ? firstAd.mediaFiles[0].url 
      : '';
    
    // تقسيم المسار
    const parts = path.split('/');
    
    result.push({
      path,
      ads: groupAds,
      firstImage,
      count: groupAds.length,
      pathParts: {
        city: parts[0] || 'غير محدد',
        district: parts[1] || 'غير محدد',
        propertyType: parts[2] || 'غير محدد',
        purpose: parts[3] || 'غير محدد',
        category: parts[4] || 'غير محدد'
      }
    });
  });
  
  // ترتيب حسب عدد الإعلانات (الأكثر أولاً)
  result.sort((a, b) => b.count - a.count);
  
  return result;
}

/**
 * الحصول على إعلانات مسار معين
 */
export function getAdsByPath(path: string): PublishedAd[] {
  const ads = getAllPublishedAds().filter(ad => ad.status === 'published');
  return ads.filter(ad => {
    const adPath = ad.smartPath || generateSmartPath(ad);
    return adPath === path;
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * تحديث حالة الإعلان
 */
export function updateAdStatus(adId: string, status: PublishedAd['status']): void {
  const ads = getAllPublishedAds();
  const ad = ads.find(a => a.id === adId);
  if (ad) {
    ad.status = status;
    ad.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  }
}

/**
 * زيادة عدد المشاهدات
 */
export function incrementViews(adId: string): void {
  const ads = getAllPublishedAds();
  const ad = ads.find(a => a.id === adId);
  if (ad) {
    ad.views = (ad.views || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  }
}

/**
 * إضافة إلى المفضلة
 */
export function incrementFavorites(adId: string): void {
  const ads = getAllPublishedAds();
  const ad = ads.find(a => a.id === adId);
  if (ad) {
    ad.favorites = (ad.favorites || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  }
}

/**
 * البحث في الإعلانات
 */
export function searchAds(query: string): PublishedAd[] {
  const ads = getAllPublishedAds().filter(ad => ad.status === 'published');
  const lowerQuery = query.toLowerCase();
  
  return ads.filter(ad => 
    ad.title.toLowerCase().includes(lowerQuery) ||
    ad.location.city.toLowerCase().includes(lowerQuery) ||
    ad.location.district.toLowerCase().includes(lowerQuery) ||
    ad.propertyType.toLowerCase().includes(lowerQuery)
  );
}

/**
 * فلترة الإعلانات حسب المعايير
 */
export function filterAds(filters: {
  purpose?: 'بيع' | 'إيجار';
  city?: string;
  propertyType?: string;
  category?: 'سكني' | 'تجاري';
  minPrice?: number;
  maxPrice?: number;
}): PublishedAd[] {
  let ads = getAllPublishedAds().filter(ad => ad.status === 'published');
  
  if (filters.purpose) {
    ads = ads.filter(ad => ad.purpose === filters.purpose);
  }
  
  if (filters.city) {
    ads = ads.filter(ad => ad.location.city === filters.city);
  }
  
  if (filters.propertyType) {
    ads = ads.filter(ad => ad.propertyType === filters.propertyType);
  }
  
  if (filters.category) {
    ads = ads.filter(ad => ad.propertyCategory === filters.category);
  }
  
  if (filters.minPrice !== undefined) {
    ads = ads.filter(ad => ad.price >= filters.minPrice!);
  }
  
  if (filters.maxPrice !== undefined) {
    ads = ads.filter(ad => ad.price <= filters.maxPrice!);
  }
  
  return ads;
}

// دالة مسح جميع البيانات الوهمية من localStorage
export function clearMockAds(): void {
  // مسح البيانات الوهمية من جميع المفاتيح المحتملة
  const keysToCheck = [
    'wasata_published_ads',
    'published_ads_list',
    'platform_ads',
  ];
  
  // IDs الوهمية المعروفة
  const mockIds = ['1', '2', '3', '4', '5'];
  
  keysToCheck.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const ads = JSON.parse(data);
        if (Array.isArray(ads)) {
          // إزالة العروض الوهمية فقط
          const realAds = ads.filter((ad: any) => !mockIds.includes(ad.id?.toString()));
          localStorage.setItem(key, JSON.stringify(realAds));
        }
      }
    } catch (error) {
      console.error(`Error cleaning ${key}:`, error);
    }
  });
  
  console.log('✅ تم مسح البيانات الوهمية');
}

// تنفيذ مسح البيانات الوهمية تلقائياً عند تحميل الملف
clearMockAds();
