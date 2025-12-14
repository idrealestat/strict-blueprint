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

// بيانات تجريبية للعرض
export function initMockAds(): void {
  const existingAds = getAllPublishedAds();
  if (existingAds.length > 0) return;
  
  const mockAds: PublishedAd[] = [
    {
      id: '1',
      title: 'فيلا فاخرة في حي النرجس',
      description: 'فيلا فاخرة مع مسبح وحديقة',
      price: 2500000,
      priceText: '2,500,000 ريال',
      purpose: 'بيع',
      propertyType: 'فيلا',
      propertyCategory: 'سكني',
      location: { city: 'الرياض', district: 'حي النرجس' },
      features: { bedrooms: 5, bathrooms: 4, area: 450 },
      mediaFiles: [{ id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400' }],
      owner: { id: '1', name: 'محمد أحمد', phone: '0501234567' },
      status: 'published',
      views: 150,
      favorites: 25,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'شقة مفروشة للإيجار',
      description: 'شقة مفروشة بالكامل',
      price: 5000,
      priceText: '5,000 ريال/شهرياً',
      purpose: 'إيجار',
      propertyType: 'شقة',
      propertyCategory: 'سكني',
      location: { city: 'جدة', district: 'حي الروضة' },
      features: { bedrooms: 3, bathrooms: 2, area: 180 },
      mediaFiles: [{ id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400' }],
      owner: { id: '2', name: 'سارة محمد', phone: '0559876543' },
      status: 'published',
      views: 89,
      favorites: 12,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      title: 'أرض تجارية على طريق الملك فهد',
      description: 'أرض تجارية موقع ممتاز',
      price: 15000000,
      priceText: '15,000,000 ريال',
      purpose: 'بيع',
      propertyType: 'أرض',
      propertyCategory: 'تجاري',
      location: { city: 'الرياض', district: 'طريق الملك فهد' },
      features: { area: 5000 },
      mediaFiles: [{ id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400' }],
      owner: { id: '3', name: 'عبدالله خالد', phone: '0541112233' },
      status: 'published',
      views: 210,
      favorites: 45,
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '4',
      title: 'فيلا للبيع في حي النرجس',
      description: 'فيلا حديثة',
      price: 3200000,
      priceText: '3,200,000 ريال',
      purpose: 'بيع',
      propertyType: 'فيلا',
      propertyCategory: 'سكني',
      location: { city: 'الرياض', district: 'حي النرجس' },
      features: { bedrooms: 6, bathrooms: 5, area: 500 },
      mediaFiles: [{ id: '4', type: 'image', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }],
      owner: { id: '4', name: 'فهد سعود', phone: '0533334444' },
      status: 'published',
      views: 120,
      favorites: 18,
      createdAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: '5',
      title: 'شقة للإيجار في حي الروضة',
      description: 'شقة عائلية',
      price: 4500,
      priceText: '4,500 ريال/شهرياً',
      purpose: 'إيجار',
      propertyType: 'شقة',
      propertyCategory: 'سكني',
      location: { city: 'جدة', district: 'حي الروضة' },
      features: { bedrooms: 2, bathrooms: 1, area: 120 },
      mediaFiles: [{ id: '5', type: 'image', url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400' }],
      owner: { id: '5', name: 'نورة علي', phone: '0555556666' },
      status: 'published',
      views: 65,
      favorites: 8,
      createdAt: new Date(Date.now() - 345600000).toISOString()
    }
  ];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAds));
  console.log('✅ تم تهيئة البيانات التجريبية:', mockAds.length, 'إعلان');
}
