/**
 * MyPublicPlatformContent.tsx
 * صفحة المنصة العامة - عرض العروض بشكل هرمي مع بطاقة الوسيط
 * 
 * هذا المكون يُستخدم في سياقين:
 * 1. in_app_preview: داخل منصتي (المالك يشاهد) - لا يؤثر على الإحصائيات العامة
 * 2. public_web: الزائر يشاهد المنصة العامة - يُسجل في الإحصائيات
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Building2, MapPin, Eye, BedDouble, Bath, Maximize, Phone, MessageSquare, Share2, TrendingUp, RefreshCw, Download, User, Copy, Link, Users } from 'lucide-react';
import { getDisplayName } from '@/components/business-card/DisplayNameSettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OfferDetailsPage from './OfferDetailsPage';
import SimilarOffersSection from './SimilarOffersSection';
import PlatformSearchFilter from './PlatformSearchFilter';
import PlatformStats from './PlatformStats';
import { toast } from 'sonner';
import { usePlatformListings, usePublicPlatformListings } from '@/hooks/usePlatformListings';
import { useEventTracker } from '@/hooks/useEventTracker';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';

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
  accountType?: 'individual' | 'office' | 'company'; // نوع الحساب
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
  // إعدادات اسم العرض
  displayNameType?: 'personal' | 'company' | 'platform';
  platformNameArabic?: string;
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
  
  // Event Tracker - لتتبع الأحداث
  const { track, trackPageView } = useEventTracker();
  
  // الحصول على IDs العروض للمشاهدين المباشرين
  const offerIds = useMemo(() => allListings.map(l => l.id), [allListings]);
  
  // المشاهدين المباشرين باستخدام Supabase Presence
  const { liveViewers, getLiveViewers, trackViewing } = useRealtimePresence(offerIds);
  
  // مفتاح التخزين - نفس المفتاح المستخدم في بطاقة الأعمال
  const STORAGE_KEY = `business_card_${userId}`;
  const SWAP_KEY = `business_card_swap_${userId}`;

  // تحديد وضع الصفحة العامة للزائر
  // الزائر: عندما يكون هناك platformSlug أو businessCardOverride (يأتي من صفحة خارجية)
  const isPublicViewer = Boolean(platformSlug && businessCardOverride);
  
  // تحديد القناة: in_app_preview للمالك، public_web للزائر
  const trackingChannel = isPublicViewer ? 'public_web' : 'in_app_preview';

  // slug المستخدم للمنصة العامة
  const currentSlug = platformSlug || localStorage.getItem('public_platform_slug') || 'default';
  // مزامنة (للـمالك فقط)
  const { syncFromLocalStorage } = usePlatformListings(!isPublicViewer ? currentSlug : undefined);

  // جلب العروض للزوار من قاعدة البيانات (حتى تظهر على أي جهاز)
  // يستخدم slug أولاً، ثم user_id كخيار ثانٍ
  const {
    listings: publicDbListings,
    loading: publicDbLoading,
    error: publicDbError,
  } = usePublicPlatformListings(
    isPublicViewer ? currentSlug : undefined,
    isPublicViewer && userId && userId !== 'default' ? userId : undefined
  );
  
  // تتبع مشاهدة صفحة المنصة (مرة واحدة عند التحميل)
  useEffect(() => {
    if (currentSlug && currentSlug !== 'default') {
      trackPageView('platform', currentSlug, trackingChannel);
    }
  }, [currentSlug, trackingChannel, trackPageView]);



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

  // ===== تحميل العروض =====
  useEffect(() => {
    // (1) صفحة عامة للزائر: المصدر هو قاعدة البيانات + localStorage كـ fallback
    if (isPublicViewer) {
      // بطاقة الوسيط للزائر تأتي من businessCardOverride (من الـ backend)
      // ملاحظة: businessCardOverride قد يكون صف DB يحتوي على data، لذلك نطبعّه لشكل BusinessCardData المتوقع.
      if (typeof businessCardOverride !== 'undefined' && businessCardOverride !== null) {
        const overrideAny = businessCardOverride as any;
        const normalizedCard = overrideAny?.data && typeof overrideAny.data === 'object'
          ? overrideAny.data
          : overrideAny;

        setBusinessCardData(normalizedCard);
        setIsSwapped(Boolean(overrideAny?.data?.swapState ?? overrideAny?.swapState));
      }

      if (publicDbError) {
        console.error('Public listings error:', publicDbError);
      }

      if (publicDbLoading) return;

      // إذا وجدنا عروض في قاعدة البيانات نستخدمها
      if (publicDbListings && publicDbListings.length > 0) {
        const hierarchy = buildHierarchy(publicDbListings as any[]);
        setHierarchyData(hierarchy);
        setAllListings(flattenListings(hierarchy));
      } else {
        // Fallback: جلب من localStorage (مؤقتاً حتى تتم المزامنة)
        try {
          const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
          const visibility = JSON.parse(localStorage.getItem('platform_visibility_state') || '{}');
          
          if (Array.isArray(publishedAds) && publishedAds.length > 0) {
            const visibleAds = publishedAds.filter((ad: any) => {
              const isHidden = visibility[`offer_${ad.id}`] ?? ad.isHidden ?? false;
              const status = ad.status ?? 'published';
              return !isHidden && status === 'published';
            });
            
            if (visibleAds.length > 0) {
              const hierarchy = buildHierarchy(visibleAds);
              setHierarchyData(hierarchy);
              setAllListings(flattenListings(hierarchy));
            } else {
              setHierarchyData([]);
              setAllListings([]);
            }
          } else {
            setHierarchyData([]);
            setAllListings([]);
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
          setHierarchyData([]);
          setAllListings([]);
        }
      }
      return;
    }

    // (2) منصة المالك داخل نفس المتصفح: المصدر هو localStorage (كما في منصتي)
    const loadData = () => {
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      const visibility = JSON.parse(localStorage.getItem('platform_visibility_state') || '{}');

      if (!Array.isArray(publishedAds) || publishedAds.length === 0) {
        setHierarchyData([]);
        setAllListings([]);
        return;
      }

      const visibleAds = publishedAds.filter((ad: any) => {
        const isHidden = visibility[`offer_${ad.id}`] ?? ad.isHidden ?? false;
        const status = ad.status ?? 'published';
        return !isHidden && status === 'published';
      });

      if (visibleAds.length > 0) {
        const hierarchy = buildHierarchy(visibleAds);
        setHierarchyData(hierarchy);
        setAllListings(flattenListings(hierarchy));
      } else {
        setHierarchyData([]);
        setAllListings([]);
      }
    };

    loadData();

    const autoRefreshInterval = setInterval(() => {
      loadData();
    }, 2000);

    // في الصفحة العامة: نستخدم البيانات القادمة من قاعدة البيانات للبطاقة فقط
    if (typeof businessCardOverride !== 'undefined') {
      if (businessCardOverride !== null) {
        const overrideAny = businessCardOverride as any;
        const normalizedCard = overrideAny?.data && typeof overrideAny.data === 'object'
          ? overrideAny.data
          : overrideAny;

        setBusinessCardData(normalizedCard);
        setIsSwapped(Boolean(overrideAny?.data?.swapState ?? overrideAny?.swapState));
      }
      return () => {
        clearInterval(autoRefreshInterval);
      };
    }

    const loadCardData = async () => {
      // ✅ الحماية: جلب بيانات البطاقة من قاعدة البيانات فقط
      // أي تعديل في صفحة التحرير → يظهر هنا تلقائياً
      
      // الحصول على user_id من المستخدم الحالي إذا لم يكن متاحاً
      let targetUserId = userId;
      if (!targetUserId || targetUserId === 'default' || targetUserId === 'public') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          targetUserId = user.id;
        }
      }
      
      if (targetUserId && targetUserId !== 'default' && targetUserId !== 'public') {
        try {
          const { data: businessCard } = await supabase
            .from('business_cards')
            .select('data')
            .eq('user_id', targetUserId)
            .maybeSingle();
          
          if (businessCard?.data) {
            const cardData = businessCard.data as Record<string, any>;
            setBusinessCardData({
              userName: cardData.userName || cardData.name || '',
              companyName: cardData.companyName || '',
              accountType: cardData.accountType || 'individual',
              falLicense: cardData.falLicense || '',
              falExpiry: cardData.falExpiry || '',
              commercialRegistration: cardData.commercialRegistration || '',
              commercialExpiryDate: cardData.commercialExpiryDate || '',
              primaryPhone: cardData.primaryPhone || cardData.phone || '',
              email: cardData.email || '',
              domain: cardData.domain || '',
              googleMapsLocation: cardData.googleMapsLocation || '',
              location: cardData.location || '',
              officialPlatform: cardData.officialPlatform || '',
              bio: cardData.bio || '',
              achievements: cardData.achievements || {
                totalDeals: 0,
                totalProperties: 0,
                totalClients: 0,
                yearsOfExperience: 0,
                awards: [],
                certifications: [],
                topPerformer: false,
                verified: false
              },
              profileImage: cardData.profileImage || '',
              coverImage: cardData.coverImage || '',
              logoImage: cardData.logoImage || '',
              displayNameType: cardData.displayNameType || 'personal',
              platformNameArabic: cardData.platformNameArabic || '',
            });
            // جلب حالة التبديل من البيانات
            setIsSwapped(Boolean(cardData.swapState));
          } else {
            setBusinessCardData(null);
          }
        } catch (error) {
          console.error('[MyPublicPlatformContent] Error loading card from DB:', error);
          setBusinessCardData(null);
        }
      } else {
        setBusinessCardData(null);
      }
    };

    loadCardData();

    const handleUpdate = () => {
      loadData();
      loadCardData();
    };

    const handleSwap = () => {
      const swapState = localStorage.getItem(SWAP_KEY);
      setIsSwapped(swapState === 'true');
    };

    window.addEventListener('businessCardUpdated', handleUpdate);
    window.addEventListener('businessCardSwapped', handleSwap);
    window.addEventListener('publishedAdSaved', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(autoRefreshInterval);
      window.removeEventListener('businessCardUpdated', handleUpdate);
      window.removeEventListener('businessCardSwapped', handleSwap);
      window.removeEventListener('publishedAdSaved', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [
    isPublicViewer,
    currentSlug,
    publicDbLoading,
    publicDbError,
    publicDbListings,
    currentUser,
    STORAGE_KEY,
    SWAP_KEY,
    businessCardOverride,
  ]);

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
  
  
  const parseCityDistrictFromSmartPathLocal = (smartPath?: string): { city?: string; district?: string } => {
    if (!smartPath) return {};
    const parts = smartPath.split('/').map((p) => p.trim()).filter(Boolean);
    const purposeLike = parts[1];
    const looksLikeFormatB = purposeLike === 'للبيع' || purposeLike === 'للإيجار' || purposeLike === 'للايجار';
    if (looksLikeFormatB) {
      const city = parts.length >= 3 ? parts[2] : undefined;
      const district = parts.length >= 4 ? parts[3]?.replace(/^حي\s+/u, '').trim() : undefined;
      return { city, district };
    }
    const city = parts.length >= 1 ? parts[0] : undefined;
    const district = parts.length >= 2 ? parts[1]?.replace(/^حي\s+/u, '').trim() : undefined;
    return { city, district };
  };

  const buildHierarchy = (ads: any[]): CityGroup[] => {
    const cityGroups: { [key: string]: any } = {};
    
    ads.forEach((ad: any) => {
      const smartPath = ad.smartPath || ad.smart_path || ad.platformPath;
      const parsed = parseCityDistrictFromSmartPathLocal(smartPath);
      const rawCity = ad.city || ad.locationDetails?.city || ad.location?.city || parsed.city || 'غير محدد';
      const rawDistrict = ad.district || ad.locationDetails?.district || ad.location?.district || parsed.district || 'غير محدد';
      const city = rawCity === 'غير محدد' && parsed.city ? parsed.city : rawCity;
      const district = rawDistrict === 'غير محدد' && parsed.district ? parsed.district : rawDistrict;
      
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
        title: ad.title || `${ad.purpose === 'للإيجار' ? 'للإيجار' : 'للبيع'} - ${ad.propertyType || ''} - ${ad.area || ''}م`,
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

    // تسجيل المشاهدة عند فتح التفاصيل - يستخدم نظام الأحداث الموحد
    const handleViewDetailsWithTracking = async () => {
      // تسجيل الحدث في قاعدة البيانات باستخدام القناة المناسبة
      track({
        eventName: 'offer_view',
        channel: trackingChannel,
        entityType: 'offer',
        entityId: listing.id,
        metadata: {
          offerTitle: listing.title,
          city: listing.city,
          district: listing.district,
          propertyType: listing.propertyType,
          price: listing.price,
        },
      });
      
      // تسجيل الحضور للمشاهدين المباشرين
      trackViewing(listing.id, { city: listing.city });
      
      // إطلاق حدث لتحديث الإحصائيات في الصفحات الأخرى (للتوافقية)
      window.dispatchEvent(new CustomEvent('offerViewed', { detail: { offerId: listing.id } }));
      
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

    // عدد المشاهدين المباشرين لهذا العرض
    const liveViewerCount = getLiveViewers(listing.id);

    return (
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
        onClick={handleViewDetailsWithTracking}
      >
        <div className="relative h-48">
          <img 
            src={listing.image || listing.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'} 
            alt={listing.title || 'عقار'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* عداد الصور */}
          {listing.imageCount > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
              📷 {listing.imageCount}
            </div>
          )}
          {/* شارة المشاهدين المباشرين */}
          {liveViewerCount > 0 && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-lg animate-pulse">
              <div className="relative">
                <Eye className="w-3 h-3" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <span className="font-bold">{liveViewerCount}</span>
              <span className="text-green-100 hidden sm:inline">يشاهدون الآن</span>
            </div>
          )}
          {/* أزرار الفيديو و 3D */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className="bg-[#D4AF37] text-[#01411C] text-xs">
              {listing.propertyType}
            </Badge>
            {listing.videoUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(listing.videoUrl, '_blank');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                🎬 فيديو
              </button>
            )}
            {listing.tour3DUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(listing.tour3DUrl, '_blank');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                🏠 جولة 3D
              </button>
            )}
          </div>
          <div className="absolute bottom-2 left-2 bg-[#01411C] text-white px-3 py-1 rounded-lg font-bold text-sm">
            {formatPrice(listing.price)}
          </div>
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

  // إنشاء رابط المنصة العامة (بدون أي prefix)
  const getPlatformUrl = () => {
    const origin = window.location.origin;

    const slugFromProps = typeof platformSlug === 'string' ? platformSlug.trim() : '';
    const slugFromOverride = typeof (businessCardOverride as any)?.slug === 'string'
      ? String((businessCardOverride as any).slug).trim()
      : '';

    const effectiveSlug = (slugFromProps || slugFromOverride).toLowerCase();
    if (!effectiveSlug) return origin;

    return `${origin}/${effectiveSlug}`;
  };

  // مشاركة رابط المنصة
  const sharePlatformLink = async () => {
    const platformLink = getPlatformUrl();
    const effectiveData = businessCardOverride || businessCardData;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منصة ${effectiveData?.userName || currentUser?.name || 'الوسيط'}`,
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
  // استخدام البيانات من قاعدة البيانات للصفحة العامة أو من localStorage للمالك
  const effectiveBusinessCardData = businessCardOverride || businessCardData;
  const mainImage = isSwapped ? effectiveBusinessCardData?.logoImage : effectiveBusinessCardData?.profileImage;

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
        style={effectiveBusinessCardData?.coverImage ? {
          backgroundImage: `url(${effectiveBusinessCardData.coverImage})`,
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(1, 65, 28, 0.85)'
        } : undefined}
      >
        {/* Pattern overlay - only when no cover image */}
        {!effectiveBusinessCardData?.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>
        )}

        {/* أزرار المشاركة أعلى اليمين */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1">
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
          
          {/* زر نسخ الرابط */}
          <Button
            onClick={() => {
              const platformUrl = getPlatformUrl();
              navigator.clipboard.writeText(platformUrl);
              toast.success("تم نسخ الرابط!");
            }}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            title="نسخ الرابط"
          >
            <Copy className="w-5 h-5" />
          </Button>
          
          {/* زر مشاركة واتساب */}
          <Button
            onClick={() => {
              const platformUrl = getPlatformUrl();
              const text = `تفضل بزيارة منصتي العقارية: ${platformUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            title="مشاركة عبر واتساب"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          
          {/* زر مشاركة تويتر */}
          <Button
            onClick={() => {
              const platformUrl = getPlatformUrl();
              const text = `تفضل بزيارة منصتي العقارية`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(platformUrl)}`, '_blank');
            }}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            title="مشاركة عبر تويتر"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </Button>
          
          {/* زر مشاركة عام */}
          <Button
            onClick={sharePlatformLink}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            title="مشاركة"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* شريط الرابط مع زر النسخ - مطابق لبطاقة الأعمال */}
        <div className="relative z-10 mx-4 mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg className="w-4 h-4 text-[#D4AF37] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className="text-xs text-white/70">الرابط:</span>
              <span className="text-sm font-medium text-white truncate" dir="ltr">
                {getPlatformUrl()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(getPlatformUrl());
                toast.success("تم نسخ الرابط!");
              }}
              className="text-white hover:bg-white/20 px-2 py-1 h-auto flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Profile Image - نفس الحجم والتنسيق في بطاقة الأعمال مع دعم التبديل */}
          <div className="flex justify-center pt-6">
            <div 
              className="relative cursor-pointer group select-none"
              onClick={() => {
                if (effectiveBusinessCardData?.profileImage && effectiveBusinessCardData?.logoImage) {
                  setIsSwapped(!isSwapped);
                }
              }}
            >
              {/* Main Image - الصورة الكبيرة حسب حالة التبديل */}
              <div className="w-36 h-36 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden bg-gradient-to-br from-white/20 to-white/10 transition-all duration-300 ease-out transform hover:scale-105">
                {mainImage ? (
                  <img 
                    src={mainImage} 
                    alt="Main"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-[#D4AF37]">
                    {effectiveBusinessCardData?.userName?.charAt(0) || currentUser?.name?.charAt(0) || 'و'}
                  </div>
                )}
              </div>
              
              {/* Small Logo/Profile Badge - الصورة الصغيرة للتبديل */}
              <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg bg-[#D4AF37] flex items-center justify-center text-white text-sm overflow-hidden transition-all duration-300 ease-out transform hover:scale-110">
                {(isSwapped ? effectiveBusinessCardData?.profileImage : effectiveBusinessCardData?.logoImage) ? (
                  <img 
                    src={isSwapped ? effectiveBusinessCardData?.profileImage : effectiveBusinessCardData?.logoImage} 
                    alt={isSwapped ? "Profile" : "Logo"} 
                    className="w-full h-full object-cover transition-opacity duration-300" 
                  />
                ) : (
                  <span className="transition-all duration-300">
                    {isSwapped ? (effectiveBusinessCardData?.userName?.charAt(0) || 'و') : "🏢"}
                  </span>
                )}
              </div>
              
              {/* Swap indicator - مؤشر التبديل */}
              {effectiveBusinessCardData?.profileImage && effectiveBusinessCardData?.logoImage && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white/90 text-[#01411C] text-xs px-2 py-0.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  اضغط للتبديل
                </div>
              )}
            </div>
          </div>

          {/* Profile Info - نفس التنسيق في بطاقة الأعمال */}
          <div className="pt-4 pb-8 px-4 text-center">
            {/* تحديد الاسم الرئيسي والفرعي بناءً على نوع الحساب وخيار العرض */}
            {(() => {
              const accountType = effectiveBusinessCardData?.accountType || (businessCardOverride as any)?.accountType || 'individual';
              const displayOptions = (effectiveBusinessCardData as any)?.displayOptions || {};
              const primaryDisplayName = displayOptions.primaryDisplayName || 'company'; // الافتراضي: اسم الشركة بالأعلى
              
              const isOfficeOrCompany = accountType === 'office' || accountType === 'company';
              
              let primaryName = effectiveBusinessCardData?.userName || currentUser?.name || 'مستخدم تجريبي';
              let secondaryName: string | null = null;
              
              if (isOfficeOrCompany && effectiveBusinessCardData?.companyName) {
                if (primaryDisplayName === 'company') {
                  primaryName = effectiveBusinessCardData.companyName;
                  secondaryName = effectiveBusinessCardData.userName || null;
                } else {
                  primaryName = effectiveBusinessCardData.userName || currentUser?.name || 'مستخدم تجريبي';
                  secondaryName = effectiveBusinessCardData.companyName;
                }
              }
              
              return (
                <>
                  {/* Primary Name - الاسم الرئيسي حسب الاختيار */}
                  <h1 className="text-2xl font-bold text-white">{primaryName}</h1>
                  
                  {/* Secondary Name - الاسم الثانوي */}
                  {secondaryName && (
                    <p className="text-lg text-white/90 mt-1">{secondaryName}</p>
                  )}
                </>
              );
            })()}
            
            {/* User Title - المسمى الوظيفي */}
            <p className="text-white/80 mt-1">
              {(effectiveBusinessCardData as any)?.userTitle && (effectiveBusinessCardData as any).userTitle !== currentSlug 
                ? (effectiveBusinessCardData as any).userTitle 
                : 'وسيط عقاري معتمد'}
            </p>
            
            {/* Badge */}
            <div className="mt-2 inline-flex items-center gap-2 flex-wrap justify-center">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm"
                title={`${badge.name} - ${effectiveBusinessCardData?.achievements?.totalDeals || 0} صفقة - ${effectiveBusinessCardData?.achievements?.yearsOfExperience || 0} سنوات خبرة`}
              >
                {badge.icon} {badge.name}
              </span>
              {effectiveBusinessCardData?.achievements?.verified && (
                <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  ✅ موثق
                </span>
              )}
              {effectiveBusinessCardData?.achievements?.topPerformer && (
                <span className="px-2 py-1 rounded-full text-xs bg-[#D4AF37] text-white">
                  ⭐ أفضل أداء
                </span>
              )}
            </div>

            {/* Company - يُعرض فقط للأفراد (لأن الشركات تظهر الاسم أعلى) */}
            {effectiveBusinessCardData?.companyName && 
             effectiveBusinessCardData?.accountType !== 'office' && 
             effectiveBusinessCardData?.accountType !== 'company' && (
              <p className="mt-2 text-white/90 flex items-center justify-center gap-1">
                <Building2 className="w-4 h-4" />
                {effectiveBusinessCardData.companyName}
              </p>
            )}

            {/* Licenses */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {effectiveBusinessCardData?.falLicense && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  📜 رخصة فال: {effectiveBusinessCardData.falLicense}
                </span>
              )}
              {effectiveBusinessCardData?.commercialRegistration && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  📋 السجل: {effectiveBusinessCardData.commercialRegistration}
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-white/90">
              {effectiveBusinessCardData?.primaryPhone && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  {effectiveBusinessCardData.primaryPhone}
                </span>
              )}
              {effectiveBusinessCardData?.email && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                  {effectiveBusinessCardData.email}
                </span>
              )}
              {effectiveBusinessCardData?.location && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  {effectiveBusinessCardData.location}
                </span>
              )}
            </div>

            {/* Website/Domain */}
            {effectiveBusinessCardData?.domain && (
              <div className="mt-3">
                <a 
                  href={effectiveBusinessCardData.domain} 
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
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => window.open(`https://wa.me/${effectiveBusinessCardData?.primaryPhone?.replace(/\D/g, '') || '966501234567'}`, '_blank')}
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                واتساب
              </Button>
              <Button 
                size="sm" 
                className="bg-[#D4AF37] hover:bg-[#c9a030] text-[#01411C]"
                onClick={() => window.open(`tel:${effectiveBusinessCardData?.primaryPhone || '+966501234567'}`, '_blank')}
              >
                <Phone className="w-4 h-4 ml-2" />
                اتصال
              </Button>
              <Button 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                onClick={() => {
                  // إنشاء vCard للوسيط
                  const brokerName = effectiveBusinessCardData?.userName || 'وسيط عقاري';
                  const companyName = effectiveBusinessCardData?.companyName || '';
                  const phone = effectiveBusinessCardData?.primaryPhone || '';
                  const email = effectiveBusinessCardData?.email || '';
                  const domain = effectiveBusinessCardData?.domain || effectiveBusinessCardData?.officialPlatform || '';
                  const location = effectiveBusinessCardData?.location || '';
                  const jobTitle = 'وسيط ومسوق عقاري';
                  const falLicense = effectiveBusinessCardData?.falLicense || '';
                  
                  // بناء نص vCard
                  const vCardLines = [
                    'BEGIN:VCARD',
                    'VERSION:3.0',
                    `FN:${brokerName}`,
                    `N:${brokerName};;;`,
                  ];
                  
                  if (companyName) vCardLines.push(`ORG:${companyName}`);
                  vCardLines.push(`TITLE:${jobTitle}`);
                  if (phone) vCardLines.push(`TEL;TYPE=CELL:${phone}`);
                  if (phone) vCardLines.push(`TEL;TYPE=WORK:${phone}`);
                  if (email) vCardLines.push(`EMAIL:${email}`);
                  if (domain) vCardLines.push(`URL:${domain}`);
                  if (location) vCardLines.push(`ADR;TYPE=WORK:;;${location};;;`);
                  if (falLicense) vCardLines.push(`NOTE:رخصة فال: ${falLicense}${companyName ? ' | ' + companyName : ''}`);
                  if (currentSlug) vCardLines.push(`X-PLATFORM-SLUG:${currentSlug}`);
                  vCardLines.push('END:VCARD');
                  
                  const vCard = vCardLines.join('\n');
                  
                  // تحميل الملف
                  const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${brokerName}.vcf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  
                  toast.success('تم تحميل بطاقة الوسيط بنجاح!');
                }}
              >
                <Download className="w-4 h-4 ml-2" />
                حفظ جهة الاتصال
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
