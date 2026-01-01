/**
 * MyPublicPlatformContent.tsx
 * صفحة المنصة العامة - عرض العروض بشكل هرمي مع بطاقة الوسيط
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Star, Building2, MapPin, Eye, BedDouble, Bath, Maximize, Phone, MessageSquare, Share2, TrendingUp, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OfferDetailsPage from './OfferDetailsPage';
import SimilarOffersSection from './SimilarOffersSection';
import PlatformSearchFilter from './PlatformSearchFilter';
import PlatformStats from './PlatformStats';
import { toast } from 'sonner';
import { readPlatformComplete, readVisibilityState, syncPlatformCompleteFromPublishedAds } from '@/utils/platformStorage';
import { usePublicPlatformListings, usePlatformListings } from '@/hooks/usePlatformListings';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  propertyType: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  image: string;
  imageCount: number;
  city: string;
  district: string;
  images?: string[];
  ownerName?: string;
  ownerPhone?: string;
  createdAt?: string;
  views?: number;
  street?: string;
  age?: number;
  direction?: string;
  features?: string[];
  // حقول إضافية من نموذج النشر
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
}

interface District {
  id: string;
  name: string;
  listings: Listing[];
}

interface CityGroup {
  id: string;
  type: string;
  name: string;
  districts: District[];
}

interface UserData {
  name?: string;
  title?: string;
  rating?: number;
  badge?: string;
  totalDeals?: number;
}

interface BusinessCardData {
  userName: string;
  companyName: string;
  falLicense: string;
  falExpiry: string;
  commercialRegistration: string;
  commercialExpiryDate: string;
  primaryPhone: string;
  email: string;
  domain: string;
  googleMapsLocation: string;
  location: string;
  officialPlatform: string;
  bio: string;
  achievements: {
    totalDeals: number;
    totalProperties: number;
    totalClients: number;
    yearsOfExperience: number;
    awards: string[];
    certifications: string[];
    topPerformer: boolean;
    verified: boolean;
  };
  profileImage: string;
  coverImage: string;
  logoImage: string;
}

interface MyPublicPlatformContentProps {
  currentUser?: UserData;
  userId?: string;
  platformSlug?: string; // slug المستخدم في رابط المنصة العامة
  businessCardOverride?: (BusinessCardData & { swapState?: boolean }) | null; // بيانات قادمة من قاعدة البيانات للعرض العام
}

const MyPublicPlatformContent: React.FC<MyPublicPlatformContentProps> = ({
  currentUser,
  userId = 'default',
  platformSlug,
  businessCardOverride,
}) => {
  const [hierarchyData, setHierarchyData] = useState<CityGroup[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    district: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: ''
  });
  
  // مفتاح التخزين - نفس المفتاح المستخدم في بطاقة الأعمال
  const STORAGE_KEY = `business_card_${userId}`;
  const SWAP_KEY = `business_card_swap_${userId}`;

  // استخدام hook قاعدة البيانات للصفحة العامة
  const currentSlug = platformSlug || localStorage.getItem('public_platform_slug') || 'default';
  const { listings: dbListings, loading: dbLoading } = usePublicPlatformListings(currentSlug);
  const { syncFromLocalStorage } = usePlatformListings(currentSlug);

  // استخراج جميع العروض المسطحة من التسلسل الهرمي
  const flattenListings = (hierarchy: CityGroup[]): Listing[] => {
    const listings: Listing[] = [];
    hierarchy.forEach(city => {
      city.districts.forEach(district => {
        listings.push(...district.listings);
      });
    });
    return listings;
  };
  
  useEffect(() => {
    // إذا كانت هناك بيانات من قاعدة البيانات (للصفحة العامة)
    if (dbListings && dbListings.length > 0) {
      const adsFromDb = dbListings.map((listing: any) => ({
        ...listing,
        image: listing.image || (listing.images && listing.images[0]),
        imageCount: listing.images?.length || 1,
      }));
      const hierarchy = buildHierarchy(adsFromDb);
      setHierarchyData(hierarchy);
      setAllListings(flattenListings(hierarchy));
      return;
    }

    const loadData = () => {
      // ✅ توحيد مصدر البيانات:
      // - المنصة العامة كانت تعتمد على wasata_platform_complete فقط
      // - بينما لوحة الإدارة تعتمد على published_ads_list
      // لذلك نعمل مزامنة/دمج ثم نبني الواجهة.
      syncPlatformCompleteFromPublishedAds();

      const visibility = readVisibilityState();
      const ads = readPlatformComplete()
        .filter((ad: any) => (ad?.status ?? 'published') === 'published')
        .filter((ad: any) => !(visibility[`offer_${ad.id}`] ?? ad.isHidden ?? false));

      if (ads.length > 0) {
        const hierarchy = buildHierarchy(ads);
        setHierarchyData(hierarchy);
        setAllListings(flattenListings(hierarchy));
        return;
      }

      const mockHierarchy = getMockHierarchy();
      setHierarchyData(mockHierarchy);
      setAllListings(flattenListings(mockHierarchy));
    };

    // في الصفحة العامة: نستخدم البيانات القادمة من قاعدة البيانات
    if (typeof businessCardOverride !== 'undefined') {
      setBusinessCardData(businessCardOverride);
      setIsSwapped(Boolean((businessCardOverride as any)?.swapState));
      // إذا لا توجد بيانات من قاعدة البيانات، نحمل من localStorage
      if (!dbListings || dbListings.length === 0) {
        loadData();
      }
      return;
    }

    const loadCardData = () => {
      // تحميل بيانات بطاقة الأعمال بالكامل من نفس المفتاح
      const savedBusinessCard = localStorage.getItem(STORAGE_KEY);

      if (savedBusinessCard) {
        try {
          const data = JSON.parse(savedBusinessCard);
          setBusinessCardData(data);
        } catch (error) {
          console.error('خطأ في تحميل بيانات البطاقة:', error);
          setBusinessCardData(null);
        }
      } else {
        setBusinessCardData(null);
      }

      // تحميل حالة التبديل
      const swapState = localStorage.getItem(SWAP_KEY);
      setIsSwapped(swapState === 'true');
    };

    loadData();
    loadCardData();

    const handleUpdate = () => {
      loadData();
      loadCardData();
    };

    const handleSwap = () => {
      const swapState = localStorage.getItem(SWAP_KEY);
      setIsSwapped(swapState === 'true');
    };

    // الاستماع لحدث تحديث بطاقة الأعمال
    window.addEventListener('businessCardUpdated', handleUpdate);
    window.addEventListener('businessCardSwapped', handleSwap);
    window.addEventListener('publishedAdSaved', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('businessCardUpdated', handleUpdate);
      window.removeEventListener('businessCardSwapped', handleSwap);
      window.removeEventListener('publishedAdSaved', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentUser, STORAGE_KEY, SWAP_KEY, businessCardOverride, dbListings]);

  // دالة مزامنة العروض إلى قاعدة البيانات
  const handleSyncToDatabase = async () => {
    setIsSyncing(true);
    try {
      await syncFromLocalStorage(currentSlug);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // حساب مستوى الشارة
  const getBadgeLevel = () => {
    if (!businessCardData) return { name: "ماسي", icon: "💎", color: "from-purple-500 to-purple-700" };
    
    const deals = businessCardData.achievements?.totalDeals || 0;
    const years = businessCardData.achievements?.yearsOfExperience || 0;
    
    if (deals >= 100 && years >= 10) return { name: "ماسي", icon: "👑", color: "from-purple-500 to-purple-700" };
    if (deals >= 50 && years >= 5) return { name: "بلاتيني", icon: "🏆", color: "from-gray-400 to-gray-600" };
    if (deals >= 30 && years >= 3) return { name: "ذهبي", icon: "🥇", color: "from-yellow-400 to-yellow-600" };
    if (deals >= 15 && years >= 2) return { name: "فضي", icon: "🥈", color: "from-gray-300 to-gray-500" };
    if (deals >= 5 && years >= 1) return { name: "برونزي", icon: "🥉", color: "from-orange-400 to-orange-600" };
    return { name: "مبتدئ", icon: "⚡", color: "from-blue-400 to-blue-600" };
  };

  const badge = getBadgeLevel();
  
  const getMockHierarchy = (): CityGroup[] => {
    return [
      {
        id: 'city-jeddah',
        type: 'city',
        name: 'جدة',
        districts: [
          {
            id: 'district-jeddah-rawda',
            name: 'حي الروضة',
            listings: [
              { id: 'jed-1', title: 'شقة فاخرة للإيجار', description: 'شقة مؤثثة بالكامل مع إطلالة رائعة', price: 3000, propertyType: 'شقة', bedrooms: 3, bathrooms: 2, area: 180, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', imageCount: 12, city: 'جدة', district: 'حي الروضة' },
              { id: 'jed-2', title: 'شقة عائلية مميزة', description: 'شقة واسعة مناسبة للعائلات', price: 4500, propertyType: 'شقة', bedrooms: 4, bathrooms: 3, area: 220, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', imageCount: 8, city: 'جدة', district: 'حي الروضة' },
            ]
          },
          {
            id: 'district-jeddah-hamra',
            name: 'حي الحمراء',
            listings: [
              { id: 'jed-4', title: 'فيلا للبيع', description: 'فيلا فاخرة مع حديقة وحمام سباحة', price: 2500000, propertyType: 'فيلا', bedrooms: 6, bathrooms: 5, area: 500, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', imageCount: 15, city: 'جدة', district: 'حي الحمراء' },
            ]
          }
        ]
      },
      {
        id: 'city-riyadh',
        type: 'city',
        name: 'الرياض',
        districts: [
          {
            id: 'district-riyadh-narjis',
            name: 'حي النرجس',
            listings: [
              { id: 'riy-1', title: 'فيلا فاخرة جديدة', description: 'فيلا حديثة التصميم مع كافة المرافق', price: 3200000, propertyType: 'فيلا', bedrooms: 7, bathrooms: 6, area: 600, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', imageCount: 20, city: 'الرياض', district: 'حي النرجس' },
              { id: 'riy-2', title: 'فيلا مودرن', description: 'تصميم عصري مع تشطيبات فاخرة', price: 2800000, propertyType: 'فيلا', bedrooms: 5, bathrooms: 4, area: 450, image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400', imageCount: 18, city: 'الرياض', district: 'حي النرجس' },
            ]
          }
        ]
      }
    ];
  };
  
  const buildHierarchy = (ads: any[]): CityGroup[] => {
    const cityGroups: { [key: string]: any } = {};
    
    ads.forEach((ad: any) => {
      const city = ad.city || ad.location?.city || 'غير محدد';
      const district = ad.district || ad.location?.district || 'غير محدد';
      
      if (!cityGroups[city]) {
        cityGroups[city] = {
          id: `city-${city}`,
          type: 'city',
          name: city,
          districts: {}
        };
      }
      
      if (!cityGroups[city].districts[district]) {
        cityGroups[city].districts[district] = {
          id: `district-${city}-${district}`,
          name: district,
          listings: []
        };
      }
      
      // نقل جميع البيانات من الإعلان مع ضمان الحقول الأساسية
      cityGroups[city].districts[district].listings.push({
        ...ad, // نقل جميع الحقول الأصلية
        id: ad.id,
        title: ad.title,
        description: ad.description || ad.aiDescription, // الوصف من النموذج
        price: ad.price || 0,
        propertyType: ad.propertyType,
        area: ad.area,
        bedrooms: ad.bedrooms,
        bathrooms: ad.bathrooms,
        image: ad.images?.[0] || ad.media?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        imageCount: ad.images?.length || ad.media?.length || 1,
        images: ad.images || ad.media?.filter((m: any) => m.type === 'image').map((m: any) => m.url) || [],
        city: city,
        district: district,
        // حقول إضافية
        videoUrl: ad.videoUrl || ad.media?.find((m: any) => m.type === 'video')?.url,
        tour3DUrl: ad.tour3DUrl,
        ownerName: ad.ownerName,
        ownerPhone: ad.ownerPhone,
        street: ad.street || ad.locationDetails?.street,
        age: ad.age || ad.propertyAge,
        direction: ad.direction || ad.facade,
        features: ad.features || ad.customFeatures || [],
        views: ad.views || 0,
        createdAt: ad.createdAt || ad.publishedAt,
        // المواصفات التفصيلية
        livingRooms: ad.livingRooms,
        councils: ad.councils,
        floors: ad.floors,
        floorNumber: ad.floorNumber,
        cornerType: ad.cornerType,
        streetWidth: ad.streetWidth,
        furnishing: ad.furnishing,
        entrances: ad.entrances,
        balconies: ad.balconies,
        acUnits: ad.acUnits,
        warehouses: ad.warehouses,
        hasLaundryRoom: ad.hasLaundryRoom,
        curtains: ad.curtains,
        hasExtraKitchen: ad.hasExtraKitchen,
        extraKitchenAppliances: ad.extraKitchenAppliances,
        category: ad.category,
        purpose: ad.purpose,
        smartPath: ad.smartPath,
        warranties: ad.warranties,
        paymentOption: ad.paymentOption,
        paymentPrices: ad.paymentPrices,
        hashtags: ad.hashtags,
        customHashtags: ad.customHashtags,
        deedNumber: ad.deedNumber,
        deedDate: ad.deedDate,
        adLicense: ad.adLicense,
        brokerPhone: ad.brokerPhone,
        lat: ad.lat || ad.locationDetails?.latitude,
        lng: ad.lng || ad.locationDetails?.longitude,
      });
    });
    
    return Object.values(cityGroups).map((city: any) => ({
      ...city,
      districts: Object.values(city.districts)
    }));
  };
  
  const badgeConfig: { [key: string]: { color: string; icon: string } } = {
    "ماسي": { color: "from-purple-600 to-purple-800", icon: "💎" },
    "ذهبي": { color: "from-yellow-500 to-yellow-700", icon: "👑" },
    "فضي": { color: "from-gray-400 to-gray-600", icon: "⭐" },
    "برونزي": { color: "from-orange-400 to-orange-600", icon: "🥉" },
    "نشط": { color: "from-green-500 to-green-700", icon: "✅" },
    "جديد": { color: "from-blue-400 to-blue-600", icon: "🆕" }
  };
  
  const currentBadge = badgeConfig[badge.name] || badge;

  // بطاقة الإعلان
  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
    if (!listing) return null;

    const handleViewDetails = () => {
      setSelectedListing(listing);
      setShowDetails(true);
    };

    // تسجيل المشاهدة عند فتح التفاصيل
    const handleViewDetailsWithTracking = async () => {
      // زيادة عدد المشاهدات في localStorage
      try {
        const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
        const adIndex = publishedAds.findIndex((ad: any) => ad.id === listing.id);
        if (adIndex !== -1) {
          publishedAds[adIndex].views = (publishedAds[adIndex].views || 0) + 1;
          localStorage.setItem('published_ads_list', JSON.stringify(publishedAds));
          
          // جمع معلومات الزائر
          const ua = navigator.userAgent;
          let browser = 'غير معروف';
          if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
          else if (ua.includes('Firefox')) browser = 'Firefox';
          else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
          else if (ua.includes('Edg')) browser = 'Edge';
          
          let os = 'غير معروف';
          if (ua.includes('Windows')) os = 'Windows';
          else if (ua.includes('Mac')) os = 'macOS';
          else if (ua.includes('Android')) os = 'Android';
          else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
          
          let device = 'كمبيوتر';
          if (/iPhone|iPad|iPod/.test(ua)) device = 'iPhone/iPad';
          else if (/Android/.test(ua)) device = /Mobile/.test(ua) ? 'هاتف أندرويد' : 'تابلت';
          
          // محاولة الحصول على الموقع
          let locationInfo: { city?: string; country?: string; ip?: string } = {};
          try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
              const data = await response.json();
              locationInfo = { ip: data.ip, city: data.city, country: data.country_name };
            }
          } catch (e) { /* تجاهل */ }
          
          const viewerInfo = {
            ...locationInfo,
            device,
            browser,
            os,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString(),
            offerId: listing.id,
            offerTitle: listing.title,
          };
          
          // إطلاق حدث لتحديث الإحصائيات في الصفحات الأخرى
          window.dispatchEvent(new CustomEvent('offerViewed', { detail: { offerId: listing.id } }));
          
          // إطلاق حدث مفصل للإشعارات
          window.dispatchEvent(new CustomEvent('offerViewedWithDetails', { 
            detail: { 
              offerId: listing.id, 
              offerTitle: listing.title,
              viewerInfo 
            } 
          }));
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
      handleViewDetails();
    };

    const formatPrice = (price: number) => {
      if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)} مليون ريال`;
      } else if (price >= 1000) {
        return `${price.toLocaleString()} ريال`;
      }
      return `${price} ريال/شهرياً`;
    };

    return (
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
        onClick={handleViewDetailsWithTracking}
      >
        <div className="relative h-48">
          <img 
            src={listing.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'} 
            alt={listing.title || 'عقار'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {listing.imageCount > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
              📷 {listing.imageCount}
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-[#01411C] text-white px-3 py-1 rounded-lg font-bold text-sm">
            {formatPrice(listing.price)}
          </div>
          <Badge className="absolute top-2 left-2 bg-[#D4AF37] text-[#01411C] text-xs">
            {listing.propertyType}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 text-base">{listing.title || 'بدون عنوان'}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description || 'لا يوجد وصف'}</p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {listing.area && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Maximize className="w-3 h-3" />
                <span>{listing.area} م²</span>
              </div>
            )}
            {listing.bedrooms && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <BedDouble className="w-3 h-3" />
                <span>{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Bath className="w-3 h-3" />
                <span>{listing.bathrooms}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              <span>{listing.district}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetailsWithTracking();
              }}
              className="text-[#01411C] text-sm font-bold hover:text-[#065f41] transition-colors flex items-center gap-1"
            >
              عرض التفاصيل
              <span>←</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // إنشاء رابط المنصة الحقيقي (slug من النشر)
  const getPlatformUrl = () => {
    // يمكن استبدال هذا بالدومين المخصص لاحقاً
    const baseUrl = window.location.origin;
    const slug = platformSlug || localStorage.getItem('public_platform_slug') || 'default';
    return `${baseUrl}/platform/${slug}`;
  };

  // مشاركة رابط المنصة
  const sharePlatformLink = async () => {
    const platformLink = getPlatformUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منصة ${businessCardData?.userName || currentUser?.name || 'الوسيط'}`,
          text: 'تفضل بزيارة منصتي العقارية',
          url: platformLink
        });
      } catch (error) {
        navigator.clipboard.writeText(platformLink);
        toast.success(`تم نسخ الرابط: ${platformLink}`);
      }
    } else {
      navigator.clipboard.writeText(platformLink);
      toast.success(`تم نسخ الرابط: ${platformLink}`);
    }
  };

  // تحديد الصورة الكبيرة فقط بناءً على حالة التبديل (لا نعرض الصورة الصغيرة في منصتي)
  const mainImage = isSwapped ? businessCardData?.logoImage : businessCardData?.profileImage;

  // حساب الإحصائيات
  const platformStats = useMemo(() => {
    const totalListings = allListings.length;
    const cities = new Set(allListings.map(l => l.city));
    const citiesCount = cities.size;
    
    const propertyTypes: { [key: string]: number } = {};
    allListings.forEach(l => {
      propertyTypes[l.propertyType] = (propertyTypes[l.propertyType] || 0) + 1;
    });
    
    const totalPrice = allListings.reduce((sum, l) => sum + l.price, 0);
    const averagePrice = totalListings > 0 ? totalPrice / totalListings : 0;
    
    const totalViews = allListings.reduce((sum, l) => sum + (l.views || 0), 0);
    
    return { totalListings, citiesCount, propertyTypes, averagePrice, totalViews };
  }, [allListings]);

  // فلترة العروض
  const filteredHierarchy = useMemo(() => {
    if (!filters.search && !filters.city && !filters.district && !filters.propertyType && 
        !filters.minPrice && !filters.maxPrice && !filters.bedrooms) {
      return hierarchyData;
    }

    return hierarchyData.map(city => {
      // فلترة المدينة
      if (filters.city && city.name !== filters.city) {
        return null;
      }

      const filteredDistricts = city.districts.map(district => {
        // فلترة الحي
        if (filters.district && district.name !== filters.district) {
          return null;
        }

        const filteredListings = district.listings.filter(listing => {
          // فلترة نوع العقار
          if (filters.propertyType && listing.propertyType !== filters.propertyType) return false;
          
          // فلترة البحث
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchTitle = listing.title?.toLowerCase().includes(searchLower);
            const matchDesc = listing.description?.toLowerCase().includes(searchLower);
            const matchCity = listing.city?.toLowerCase().includes(searchLower);
            const matchDistrict = listing.district?.toLowerCase().includes(searchLower);
            if (!matchTitle && !matchDesc && !matchCity && !matchDistrict) return false;
          }
          
          // فلترة السعر
          if (filters.minPrice && listing.price < Number(filters.minPrice)) return false;
          if (filters.maxPrice && listing.price > Number(filters.maxPrice)) return false;
          
          // فلترة الغرف
          if (filters.bedrooms) {
            const bedroomsFilter = filters.bedrooms === '6+' ? 6 : Number(filters.bedrooms);
            if (filters.bedrooms === '6+') {
              if (!listing.bedrooms || listing.bedrooms < 6) return false;
            } else {
              if (listing.bedrooms !== bedroomsFilter) return false;
            }
          }
          
          return true;
        });

        if (filteredListings.length === 0) return null;
        
        return { ...district, listings: filteredListings };
      }).filter(Boolean);

      if (filteredDistricts.length === 0) return null;
      
      return { ...city, districts: filteredDistricts } as CityGroup;
    }).filter(Boolean) as CityGroup[];
  }, [hierarchyData, filters]);

  // استخراج بيانات الفلاتر
  const filterOptions = useMemo(() => {
    const cities = [...new Set(allListings.map(l => l.city))];
    const districts = [...new Set(allListings.map(l => l.district))];
    const propertyTypes = [...new Set(allListings.map(l => l.propertyType))];
    return { cities, districts, propertyTypes };
  }, [allListings]);

  // حساب عدد النتائج المفلترة
  const filteredListingsCount = useMemo(() => {
    return filteredHierarchy.reduce((sum, city) => 
      sum + city.districts.reduce((dSum, d) => dSum + d.listings.length, 0), 0
    );
  }, [filteredHierarchy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-white" dir="rtl">
      {/* Header - مطابق تماماً لبطاقة الأعمال */}
      <div 
        className="relative bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-6 shadow-2xl border-b-4 border-[#D4AF37] bg-cover bg-center transition-all duration-500"
        style={businessCardData?.coverImage ? {
          backgroundImage: `url(${businessCardData.coverImage})`,
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(1, 65, 28, 0.85)'
        } : undefined}
      >
        {/* Pattern overlay - only when no cover image */}
        {!businessCardData?.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>
        )}

        {/* أزرار أعلى اليمين */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {/* زر المزامنة - يظهر فقط للمالك (ليس في الصفحة العامة) */}
          {typeof businessCardOverride === 'undefined' && (
            <Button
              onClick={handleSyncToDatabase}
              variant="ghost"
              className="text-white hover:bg-white/20 flex items-center gap-2"
              disabled={isSyncing}
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'جاري المزامنة...' : 'مزامنة'}
            </Button>
          )}
          <Button
            onClick={sharePlatformLink}
            variant="ghost"
            className="text-white hover:bg-white/20 flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            مشاركة
          </Button>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Profile Image - نفس الحجم والتنسيق في بطاقة الأعمال */}
          <div className="flex justify-center pt-6">
            <div className="relative">
              {/* Main Image - الصورة الكبيرة حسب حالة التبديل */}
              <div className="w-36 h-36 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden bg-gradient-to-br from-white/20 to-white/10 transition-all duration-300">
                {mainImage ? (
                  <img 
                    src={mainImage} 
                    alt="Main"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-[#D4AF37]">
                    {businessCardData?.userName?.charAt(0) || currentUser?.name?.charAt(0) || 'و'}
                  </div>
                )}
              </div>
              {/* لا يتم عرض الصورة الصغيرة في منصتي - فقط الصورة الكبيرة */}
            </div>
          </div>

          {/* Profile Info - نفس التنسيق في بطاقة الأعمال */}
          <div className="pt-4 pb-8 px-4 text-center">
            {/* Name and Badge */}
            <h1 className="text-2xl font-bold text-white">{businessCardData?.userName || currentUser?.name || 'مستخدم تجريبي'}</h1>
            <div className="mt-2 inline-flex items-center gap-2 flex-wrap justify-center">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm"
                title={`${badge.name} - ${businessCardData?.achievements?.totalDeals || 0} صفقة - ${businessCardData?.achievements?.yearsOfExperience || 0} سنوات خبرة`}
              >
                {badge.icon} {badge.name}
              </span>
              {businessCardData?.achievements?.verified && (
                <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  ✅ موثق
                </span>
              )}
              {businessCardData?.achievements?.topPerformer && (
                <span className="px-2 py-1 rounded-full text-xs bg-[#D4AF37] text-white">
                  ⭐ أفضل أداء
                </span>
              )}
            </div>

            {/* Company */}
            {businessCardData?.companyName && (
              <p className="mt-2 text-white/90 flex items-center justify-center gap-1">
                <Building2 className="w-4 h-4" />
                {businessCardData.companyName}
              </p>
            )}

            {/* Licenses */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {businessCardData?.falLicense && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  📜 رخصة فال: {businessCardData.falLicense}
                </span>
              )}
              {businessCardData?.commercialRegistration && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  📋 السجل: {businessCardData.commercialRegistration}
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-white/90">
              {businessCardData?.primaryPhone && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  {businessCardData.primaryPhone}
                </span>
              )}
              {businessCardData?.email && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                  {businessCardData.email}
                </span>
              )}
              {businessCardData?.location && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  {businessCardData.location}
                </span>
              )}
            </div>

            {/* Website/Domain */}
            {businessCardData?.domain && (
              <div className="mt-3">
                <a 
                  href={businessCardData.domain} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-[#D4AF37] text-[#01411C] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#f1c40f] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  زيارة الموقع
                </a>
              </div>
            )}

            {/* أزرار التواصل */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => window.open(`https://wa.me/${businessCardData?.primaryPhone?.replace(/\D/g, '') || '966501234567'}`, '_blank')}
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                واتساب
              </Button>
              <Button 
                size="sm" 
                className="bg-[#D4AF37] hover:bg-[#c9a030] text-[#01411C]"
                onClick={() => window.open(`tel:${businessCardData?.primaryPhone || '+966501234567'}`, '_blank')}
              >
                <Phone className="w-4 h-4 ml-2" />
                اتصال
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* إحصائيات المنصة */}
        <PlatformStats
          totalListings={platformStats.totalListings}
          citiesCount={platformStats.citiesCount}
          propertyTypes={platformStats.propertyTypes}
          averagePrice={platformStats.averagePrice}
          totalViews={platformStats.totalViews}
        />

        {/* شريط البحث والفلترة */}
        <PlatformSearchFilter
          onFilterChange={setFilters}
          cities={filterOptions.cities}
          districts={filterOptions.districts}
          propertyTypes={filterOptions.propertyTypes}
          totalResults={filteredListingsCount}
        />

        {/* عرض العروض */}
        {filteredHierarchy.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 md:p-16 text-center border-2 border-dashed border-[#d4af37]">
            <div className="text-5xl md:text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {allListings.length === 0 ? 'لا توجد عروض منشورة' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-gray-600">
              {allListings.length === 0 ? 'ابدأ بنشر أول عرض عقاري' : 'جرب تغيير معايير البحث'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredHierarchy.map((city) => {
              if (city.districts && city.districts.length > 0) {
                const hasMultipleDistricts = city.districts.length > 1;
                const totalListings = city.districts.reduce((sum, d) => sum + d.listings.length, 0);
                
                return (
                  <div key={city.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border-2 border-[#01411C]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-[#01411C] flex items-center gap-2">
                        <span className="text-2xl">🏙️</span>
                        {city.name}
                      </h2>
                      <Badge className="bg-[#01411C] text-[#D4AF37]">
                        {totalListings} عقار
                      </Badge>
                    </div>
                    
                    {hasMultipleDistricts ? (
                      <div className="space-y-6">
                        {city.districts.map((district) => (
                          <div key={district.id}>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200">
                              <MapPin className="w-5 h-5 text-[#D4AF37]" />
                              {district.name}
                              <Badge variant="outline" className="text-xs">
                                {district.listings.length} عقار
                              </Badge>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {district.listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {city.districts[0].listings.map((listing) => (
                          <ListingCard key={listing.id} listing={listing} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        )}
        
        {/* Footer */}
        <footer className="bg-[#01411C] text-white py-4 text-center mt-12 rounded-xl">
          <p className="text-sm opacity-75 flex items-center justify-center gap-2">
            <span>مدعوم من</span>
            <span className="font-bold text-[#D4AF37]">وساطه AI Wasata</span>
          </p>
        </footer>
      </div>

      {/* صفحة تفاصيل العرض مع العروض المشابهة */}
      {selectedListing && (
        <OfferDetailsPage
          listing={{
            ...selectedListing,
            ownerPhone: businessCardData?.primaryPhone || selectedListing.ownerPhone
          }}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedListing(null);
          }}
          allListings={allListings}
          brokerPhone={businessCardData?.primaryPhone}
        />
      )}
    </div>
  );
};

export default MyPublicPlatformContent;
