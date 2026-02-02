/**
 * MyPlatformComplete.tsx
 * منصتي - النسخة الكاملة مع 3 تبويبات + نظام العروض الهرمي
 * التبويبات: المنصة (in-app preview) / العروض / الطلبات
 * "نشر إعلان" هو زر في الـ header يفتح صفحة كاملة
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePulsingDot, markAsViewed, isNew } from "@/hooks/usePublishedAdsManager";
import { buildCityUrl, buildDistrictUrl, buildOfferUrl, getFullUrl } from "@/utils/slugify";
import PulsingDot from "@/components/ui/PulsingDot";
import LiveViewerIndicator from "@/components/ui/LiveViewerIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Search,
  Home,
  Eye,
  TrendingUp,
  Plus,
  Share2,
  Edit,
  Pin,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building,
  Clock,
  Download,
  MessageSquare,
  Phone,
  Bed,
  Bath,
  Maximize,
  Calendar,
  DollarSign,
  EyeOff,
  Globe,
  Copy,
  QrCode,
  Mail,
  Link,
  Check,
  Image,
  FileText,
  X,
  GripVertical,
  Move,
  FileDown,
  PlusCircle,
  User,
  Bell,
  Settings,
} from "lucide-react";
import PropertyPublishForm from "./PropertyPublishForm";
import MyPublicPlatformContent from "./MyPublicPlatformContent";
import CreateRequestForm from "./CreateRequestForm";
import OfferEditPage from "./OfferEditPage";
import DeletedOffersPage, { addToDeletedOffers, restoreFromDeletedOffers } from "./DeletedOffersPage";
import OfferActionsMenu from "@/components/offers/OfferActionsMenu";
import { useLiveViewersRealtime } from "@/hooks/useLiveViewersRealtime";
import { 
  CollapsibleStatsSection, 
  CollapsiblePerformanceComparison
} from "@/components/offers";
import { useOfferViewNotifications } from "@/hooks/useOfferViewNotifications";
import { toast } from "sonner";
import { generatePropertyPDF } from "@/utils/generatePropertyPDF";
import { syncPlatformCompleteFromPublishedAds } from "@/utils/platformStorage";
import { OffersStatsPDFReport } from "@/components/analytics";
import { usePlatformListings } from "@/hooks/usePlatformListings";

// ===================== Types =====================

interface SubOffer {
  id: string;
  title: string;
  price: string;
  adNumber: string;
  image: string;
  imageCount: number;
  status: 'published' | 'draft';
  views: number;
  requests: number;
}

interface RootOffer {
  id: string;
  title: string;
  price: string;
  image: string;
  status: 'published' | 'draft';
}

interface HierarchicalOffer {
  id: string;
  title: string;
  location: string;
  city: string;
  district: string;
  price: string;
  adNumber: string;
  images: string[];
  views: number;
  requests: number;
  isPinned: boolean;
  lastOpened: string;
  date: Date;
  status: 'published' | 'draft';
  purpose: 'sale' | 'rent';
  propertyType: string;
  category: 'residential' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  owner: {
    name: string;
    phone: string;
    email?: string;
  };
  // العروض الفرعية
  subOffers: SubOffer[];
  // العروض الجذرية (داخل الفرعية)
  rootOffers: RootOffer[];
  isExpanded: boolean;
}

interface Request {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  propertyType: string;
  purpose: 'sale' | 'rent';
  city: string;
  district?: string;
  budget: { min: number; max: number };
  bedrooms?: number;
  status: 'new' | 'inProgress' | 'matched' | 'closed';
  createdAt: Date;
  notes?: string;
}

interface PublishFormData {
  title: string;
  description: string;
  propertyType: string;
  purpose: 'sale' | 'rent';
  category: 'residential' | 'commercial';
  city: string;
  district: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

interface MyPlatformCompleteProps {
  onBack: () => void;
  onNavigate?: (page: string, params?: any) => void;
  user?: {
    id: string;
    name: string;
    phone: string;
    appTitle?: string;
  } | null;
  digitalCardHeader?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// ===================== Mock Data =====================

// ===================== Hierarchical Structure Types =====================

// نوع العرض الفردي (أصغر وحدة)
interface SingleOffer {
  id: string;
  title: string;
  description?: string;
  price: string;
  image: string;
  images?: string[];
  status: 'published' | 'draft';
  views: number;
  requests: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  owner: { name: string; phone: string };
  ownerName?: string;
  isHidden: boolean;
  liveViewers: number;
  // حقول المالك الإضافية
  ownerIdNumber?: string;
  ownerBirthDate?: string;
  ownerCity?: string;
  ownerDistrict?: string;
  ownerNationalAddress?: string;
  // حقول الصك
  deedNumber?: string;
  deedDate?: string;
  deedCity?: string;
  // حقول التأجير
  contractDuration?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  isCurrentlyRented?: boolean;
  // حقول إضافية
  city?: string;
  district?: string;
  street?: string;
  tour3DUrl?: string;
  linkedCustomerId?: string;
  // الترخيص الإعلاني
  adLicense?: string;
}

// مستوى الحي (يحتوي على عروض)
interface DistrictLevel {
  districtName: string;
  offers: SingleOffer[];
  isExpanded: boolean;
  isHidden: boolean;
  liveViewers: number;
}

// مستوى المدينة (يحتوي على أحياء)
interface CityLevel {
  cityName: string;
  districts: DistrictLevel[];
  directOffers: SingleOffer[]; // عروض مباشرة بدون حي
  isExpanded: boolean;
  isHidden: boolean;
  liveViewers: number;
}

// بيانات تجريبية بالهيكل الجديد
// ✅ تم إزالة البيانات الوهمية - التطبيق يعمل بحالة "أول استخدام"
const mockCityHierarchy: CityLevel[] = [];

// ✅ تم إزالة البيانات الوهمية - التطبيق يعمل بحالة "أول استخدام"
const mockHierarchicalOffers: HierarchicalOffer[] = [];
const mockRequests: Request[] = [];

const cities = ['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'الطائف'];
const propertyTypes = ['فيلا', 'شقة', 'أرض', 'عمارة', 'دوبلكس', 'استراحة', 'مكتب', 'محل تجاري'];

// ===================== Storage Functions =====================

const STORAGE_KEY = 'wasata_platform_complete';

const loadFromStorage = (): HierarchicalOffer[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((o: any) => ({ ...o, date: new Date(o.date) }));
    }
  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
  }

  // ✅ وضع "أول استخدام": لا نعرض أي بيانات تجريبية إطلاقاً
  return [];
};

const saveToStorage = (offers: HierarchicalOffer[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  } catch (error) {
    console.error('خطأ في حفظ البيانات:', error);
  }
};

// ===================== Component =====================

export default function MyPlatformComplete({ 
  onBack, 
  onNavigate, 
  user,
  digitalCardHeader 
}: MyPlatformCompleteProps) {
  // State
  const [activeMainTab, setActiveMainTab] = useState<'platform' | 'offers' | 'requests'>('offers');
  const [offers, setOffers] = useState<HierarchicalOffer[]>(() => loadFromStorage());
  const [requests, setRequests] = useState<Request[]>([]);
  const [publishedRequests, setPublishedRequests] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wasata_published_requests') || '[]');
    } catch { return []; }
  });
  const [showCreateRequestForm, setShowCreateRequestForm] = useState(false);
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [showDeleteRequestConfirm, setShowDeleteRequestConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCity, setActiveCity] = useState<string>('الكل');
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showDeletedOffersPage, setShowDeletedOffersPage] = useState(false);
  
  // ✅ نافذة خيارات PDF للعروض
  const [showOfferPdfOptionsDialog, setShowOfferPdfOptionsDialog] = useState(false);
  const [selectedOfferForPdf, setSelectedOfferForPdf] = useState<{ offer: SingleOffer; cityName: string; districtName?: string } | null>(null);
  const [offerPdfOptions, setOfferPdfOptions] = useState({
    includeOwner: true,
    includeDeed: true,
    includeProperty: true,
    includeDescription: true,
    includeImages: true,
  });
  
  // ✅ نافذة خيارات PDF للطلبات
  const [showRequestPdfOptionsDialog, setShowRequestPdfOptionsDialog] = useState(false);
  const [selectedRequestForPdf, setSelectedRequestForPdf] = useState<any | null>(null);
  const [requestPdfOptions, setRequestPdfOptions] = useState({
    includeOwner: true,
    includeFeatures: true,
    includeBudget: true,
  });

  // ✅ جلب بيانات بطاقة العمل لتوحيد الهيدر
  const [businessCardData, setBusinessCardData] = useState<{
    profileImage?: string;
    coverImage?: string;
    logoImage?: string;
    userName?: string;
    companyName?: string;
  } | null>(null);

  // دالة تحميل بيانات بطاقة العمل - من قاعدة البيانات فقط (مصدر الحقيقة الوحيد)
  const loadBusinessCardData = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('[MyPlatformComplete] No user ID, skipping DB fetch');
        return;
      }
      
      const { data: businessCard, error } = await supabase
        .from('business_cards')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('[MyPlatformComplete] Error fetching from DB:', error);
        return;
      }
      
      if (businessCard?.data) {
        const cardData = businessCard.data as Record<string, any>;
        console.log('[MyPlatformComplete] Loaded from DB:', {
          hasProfileImage: !!cardData.profileImage,
          hasCoverImage: !!cardData.coverImage,
          hasLogoImage: !!cardData.logoImage,
        });
        setBusinessCardData({
          profileImage: cardData.profileImage || '',
          coverImage: cardData.coverImage || '',
          logoImage: cardData.logoImage || '',
          userName: cardData.userName || cardData.name || '',
          companyName: cardData.companyName || '',
        });
      } else {
        console.log('[MyPlatformComplete] No business card found in DB for user:', user.id);
      }
    } catch (error) {
      console.error('[MyPlatformComplete] Error loading business card:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    // تحميل البيانات عند التركيب
    loadBusinessCardData();
    
    // الاستماع لتحديثات بطاقة العمل (من نفس التبويب أو تبويب آخر)
    const handleBusinessCardUpdate = () => {
      console.log('[MyPlatformComplete] businessCardUpdated event received, reloading...');
      loadBusinessCardData();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('business_card')) {
        loadBusinessCardData();
      }
    };
    
    window.addEventListener('businessCardUpdated', handleBusinessCardUpdate);
    window.addEventListener('businessCardSwapped', handleBusinessCardUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('businessCardUpdated', handleBusinessCardUpdate);
      window.removeEventListener('businessCardSwapped', handleBusinessCardUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadBusinessCardData]);

  // slug المستخدم للمنصة العامة + مزامنة تلقائية مع قاعدة البيانات
  // ملاحظة: لا نستخدم fallback مثل 'default' لأن ذلك يكسر قناة المشاهدين المباشرين.
  const [currentSlug, setCurrentSlug] = useState<string>(() => {
    return localStorage.getItem('public_platform_slug') || '';
  });

  // ✅ اجلب الـ slug من قاعدة البيانات دائماً (مصدر الحقيقة)
  useEffect(() => {
    const fetchSlugFromDB = async () => {
      if (!user?.id) return;

      try {
        const { data: cardData, error } = await supabase
          .from('business_cards')
          .select('slug')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching slug from DB:', error);
          return;
        }

        const dbSlug = (cardData?.slug || '').trim();
        if (!dbSlug) return;

        if (dbSlug !== currentSlug) {
          localStorage.setItem('public_platform_slug', dbSlug);
          setCurrentSlug(dbSlug);
          console.log('✅ Slug synced from DB:', dbSlug);
        }
      } catch (e) {
        console.error('Error fetching slug from DB:', e);
      }
    };

    fetchSlugFromDB();
  }, [user?.id, currentSlug]);
  
  const { syncFromLocalStorage, cleanupDuplicates, updateListing, fetchListings, deleteListing, listings: dbListings, loading: dbLoading } = usePlatformListings(currentSlug || undefined);
  
  // ✅ تتبع حالة جلب البيانات
  useEffect(() => {
    console.log('[MyPlatformComplete] dbListings updated:', dbListings?.length, 'loading:', dbLoading, 'slug:', currentSlug);
  }, [dbListings, dbLoading, currentSlug]);
  
  // Hook إشعارات المشاهدات
  const { stats: viewStats, notificationsEnabled, soundEnabled, saveSettings } = useOfferViewNotifications();

  // ✅ Hook المشاهدين المباشرين عبر Presence (الأساسي)
  // مهم: لازم يكون نفس الـ slug المستخدم في الصفحات العامة (/{slug}/...)
  // نعتمد على currentSlug (وسيتم مزامنته لاحقاً فور جلب slug الحقيقي من قاعدة البيانات)
  const effectiveSlug = (currentSlug || '').trim().toLowerCase() || undefined;
  const { getOfferViewers, getDistrictViewers, getCityViewers, getTotalViewers, liveViewers: realtimeLiveViewers } = useLiveViewersRealtime(effectiveSlug);

  // دالة موحدة للحصول على عدد المشاهدين (المصدر الوحيد: Presence)
  const getLiveViewers = useCallback((offerId: string): number => {
    return getOfferViewers(offerId);
  }, [getOfferViewers]);

  
  // Hierarchical State (مدينة ← حي ← عروض)
  const [cityHierarchy, setCityHierarchy] = useState<CityLevel[]>(() => {
    try {
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      const visibilityState = JSON.parse(localStorage.getItem('platform_visibility_state') || '{}');

      // ✅ وضع "أول استخدام": بدون أي fallback تجريبي
      if (!Array.isArray(publishedAds) || publishedAds.length === 0) return [];

      const toSingleOffer = (ad: any): SingleOffer => ({
        id: ad.id,
        title: ad.title || `${ad.purpose === 'للإيجار' ? 'للإيجار' : 'للبيع'} - ${ad.propertyType} - ${ad.area || ''}م`,
        description: ad.aiDescription || ad.description || '',
        price: ad.price ? `${ad.price} ريال` : 'السعر عند التواصل',
        images: Array.isArray(ad.images) ? ad.images : [],
        image: (Array.isArray(ad.images) && ad.images.length > 0)
          ? ad.images[0]
          : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        status: 'published',
        views: ad.views || 0,
        requests: ad.requests || 0,
        propertyType: ad.propertyType,
        bedrooms: parseInt(ad.bedrooms) || undefined,
        bathrooms: parseInt(ad.bathrooms) || undefined,
        area: parseInt(ad.area) || undefined,
        owner: { name: ad.ownerName, phone: ad.ownerPhone },
        ownerName: ad.ownerName,
        isHidden: visibilityState[`offer_${ad.id}`] ?? ad.isHidden ?? false,
        liveViewers: 0,
        // حقول المالك الإضافية
        ownerIdNumber: ad.ownerIdNumber || undefined,
        ownerBirthDate: ad.ownerBirthDate || undefined,
        ownerCity: ad.locationDetails?.city || ad.city || undefined,
        ownerDistrict: ad.locationDetails?.district || ad.district || undefined,
        ownerNationalAddress: ad.ownerNationalAddress || undefined,
        // حقول الصك
        deedNumber: ad.deedNumber || undefined,
        deedDate: ad.deedDate || undefined,
        deedCity: ad.deedCity || ad.locationDetails?.city || undefined,
        // حقول التأجير
        contractDuration: parseInt(ad.contractDuration) || undefined,
        contractStartDate: ad.contractStartDate || undefined,
        contractEndDate: ad.contractEndDate || undefined,
        isCurrentlyRented: ad.isCurrentlyRented ?? false,
        // حقول إضافية
        city: ad.locationDetails?.city || ad.city || undefined,
        district: ad.locationDetails?.district || ad.district || undefined,
        street: ad.locationDetails?.street || ad.street || undefined,
        tour3DUrl: ad.tour3DUrl || undefined,
        linkedCustomerId: ad.linkedCustomerId || undefined,
      });

      const updated: CityLevel[] = [];

      const parseCityDistrictFromSmartPath = (smartPath?: string): { city?: string; district?: string } => {
        if (!smartPath) return {};
        const parts = smartPath
          .split('/')
          .map((p) => p.trim())
          .filter(Boolean);

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

      publishedAds.forEach((ad: any) => {
        const smartPath = ad.smartPath || ad.platformPath || ad.smart_path;
        const parsed = parseCityDistrictFromSmartPath(typeof smartPath === 'string' ? smartPath : undefined);

        const city = ad.locationDetails?.city || ad.location?.city || ad.city || parsed.city || 'غير محدد';
        const districtRaw = ad.locationDetails?.district || ad.location?.district || ad.district || parsed.district || 'غير محدد';
        const offer = toSingleOffer(ad);

        let cityObj = updated.find(c => c.cityName === city);
        if (!cityObj) {
          cityObj = { 
            cityName: city, 
            isExpanded: false, 
            isHidden: visibilityState[`city_${city}`] ?? false, 
            liveViewers: 0, 
            directOffers: [], 
            districts: [] 
          } as any;
          updated.push(cityObj);
        }

        if (districtRaw && districtRaw !== 'عروض مباشرة') {
          const districtName = districtRaw.startsWith('حي ') ? districtRaw : `حي ${districtRaw}`;
          let districtObj = cityObj.districts.find((d: any) => d.districtName === districtName);
          if (!districtObj) {
            districtObj = { 
              districtName, 
              offers: [], 
              isExpanded: false, 
              isHidden: visibilityState[`district_${city}_${districtName}`] ?? false, 
              liveViewers: 0 
            } as any;
            cityObj.districts.push(districtObj);
          }
          if (!districtObj.offers.some((o: any) => o.id === offer.id)) districtObj.offers.push(offer);
        } else {
          if (!cityObj.directOffers.some((o: any) => o.id === offer.id)) cityObj.directOffers.push(offer);
        }
      });

      return updated.length > 0 ? updated : mockCityHierarchy;
    } catch {
      return mockCityHierarchy;
    }
  });

  // حفظ حالة الهيكل الهرمي (الإخفاء/الإظهار) في localStorage
  useEffect(() => {
    // حفظ حالة isHidden لكل عنصر
    const visibilityState: Record<string, boolean> = {};
    cityHierarchy.forEach(city => {
      visibilityState[`city_${city.cityName}`] = city.isHidden;
      city.districts.forEach(district => {
        visibilityState[`district_${city.cityName}_${district.districtName}`] = district.isHidden;
        district.offers.forEach(offer => {
          visibilityState[`offer_${offer.id}`] = offer.isHidden;
        });
      });
      city.directOffers.forEach(offer => {
        visibilityState[`offer_${offer.id}`] = offer.isHidden;
      });
    });
    localStorage.setItem('platform_visibility_state', JSON.stringify(visibilityState));

    // تحديث حالة isHidden في published_ads_list
    const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
    let updated = false;
    publishedAds.forEach((ad: any) => {
      const isHidden = visibilityState[`offer_${ad.id}`] ?? false;
      if (ad.isHidden !== isHidden) {
        ad.isHidden = isHidden;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('published_ads_list', JSON.stringify(publishedAds));
    }

    // ✅ مزامنة تلقائية: أي تغيير في الإظهار/الإخفاء ينعكس فوراً على صفحة المشاركة العامة
    // (بدون إشعارات متكررة)
    syncFromLocalStorage(currentSlug, { silent: true }).catch((e) => {
      console.error('Auto-sync to database failed:', e);
    });
  }, [cityHierarchy, currentSlug, syncFromLocalStorage]);

  // ✅ مزامنة المنصة العامة مع قائمة العروض المنشورة حتى لا تختفي العروض من «منصتي»
  useEffect(() => {
    syncPlatformCompleteFromPublishedAds();
  }, []);

  // ✅ مزامنة تلقائية عند فتح منصتي: يرفع كل العروض الحالية لقاعدة البيانات ليظهرها للزوار (بدون إشعارات)
  useEffect(() => {
    syncFromLocalStorage(currentSlug, { silent: true }).catch((e) => {
      console.error('Initial sync to database failed:', e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  // ✅ جلب العروض من قاعدة البيانات عند فتح الصفحة
  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  // ✅ قاعدة البيانات هي المصدر الأساسي - استبدال العروض المحلية بالعروض من قاعدة البيانات
  useEffect(() => {
    if (dbListings && dbListings.length > 0) {
      const visibilityState = JSON.parse(localStorage.getItem('platform_visibility_state') || '{}');
      
      const toSingleOfferFromDb = (listing: any): SingleOffer => ({
        id: listing.id,
        title: listing.title || `${listing.purpose === 'للإيجار' ? 'للإيجار' : 'للبيع'} - ${listing.propertyType} - ${listing.area || ''}م`,
        description: listing.description || '',
        price: listing.price ? `${listing.price} ريال` : 'السعر عند التواصل',
        images: Array.isArray(listing.images) ? listing.images : [],
        image: (Array.isArray(listing.images) && listing.images.length > 0)
          ? listing.images[0]
          : listing.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        status: listing.status === 'published' ? 'published' : 'draft',
        views: listing.views || 0,
        requests: 0,
        propertyType: listing.propertyType,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        area: listing.area,
        owner: { name: listing.ownerName || '', phone: listing.ownerPhone || '' },
        ownerName: listing.ownerName,
        isHidden: visibilityState[`offer_${listing.id}`] ?? listing.isHidden ?? false,
        liveViewers: 0,
        ownerIdNumber: listing.ownerIdNumber,
        ownerBirthDate: listing.ownerBirthDate,
        ownerCity: listing.ownerCity,
        ownerDistrict: listing.ownerDistrict,
        ownerNationalAddress: listing.ownerNationalAddress,
        deedNumber: listing.deedNumber,
        deedDate: listing.deedDate,
        deedCity: listing.deedCity,
        contractDuration: listing.contractDuration,
        contractStartDate: listing.contractStartDate,
        contractEndDate: listing.contractEndDate,
        isCurrentlyRented: listing.isCurrentlyRented,
        city: listing.city,
        district: listing.district,
        street: listing.street,
        tour3DUrl: listing.tour3DUrl,
        adLicense: listing.adLicense,
      });

      // بناء الهيكل الهرمي من قاعدة البيانات كمصدر أساسي
      const dbCityHierarchy: CityLevel[] = [];
      
      dbListings.forEach(listing => {
        const city = listing.city || 'غير محدد';
        const districtRaw = listing.district || 'غير محدد';
        const offer = toSingleOfferFromDb(listing);

        let cityObj = dbCityHierarchy.find(c => c.cityName === city);
        if (!cityObj) {
          cityObj = { 
            cityName: city, 
            isExpanded: false, 
            isHidden: visibilityState[`city_${city}`] ?? false, 
            liveViewers: 0, 
            directOffers: [], 
            districts: [] 
          };
          dbCityHierarchy.push(cityObj);
        }

        if (districtRaw && districtRaw !== 'عروض مباشرة' && districtRaw !== 'غير محدد') {
          const districtName = districtRaw.startsWith('حي ') ? districtRaw : `حي ${districtRaw}`;
          let districtObj = cityObj.districts.find(d => d.districtName === districtName);
          if (!districtObj) {
            districtObj = { 
              districtName, 
              offers: [], 
              isExpanded: false, 
              isHidden: visibilityState[`district_${city}_${districtName}`] ?? false, 
              liveViewers: 0 
            };
            cityObj.districts.push(districtObj);
          }
          // منع التكرار
          if (!districtObj.offers.some(o => o.id === offer.id)) {
            districtObj.offers.push(offer);
          }
        } else {
          // منع التكرار
          if (!cityObj.directOffers.some(o => o.id === offer.id)) {
            cityObj.directOffers.push(offer);
          }
        }
      });

      // تحديث الهيكل الهرمي فقط إذا كانت هناك عروض من قاعدة البيانات
      if (dbCityHierarchy.length > 0) {
        setCityHierarchy(dbCityHierarchy);
      }
    }
  }, [dbListings]);

  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
  
  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{type: 'offer' | 'district'; data: any; sourceCity: string; sourceDistrict?: string} | null>(null);
  const [dragOverCity, setDragOverCity] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [itemToMove, setItemToMove] = useState<{type: 'offer' | 'district'; data: any; sourceCity: string; sourceDistrict?: string} | null>(null);
  const [targetCityForMove, setTargetCityForMove] = useState<string>('');
  const [targetDistrictForMove, setTargetDistrictForMove] = useState<string>('');
  const [moveType, setMoveType] = useState<'existing' | 'new'>('existing');
  const [newCityName, setNewCityName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  
  // Dialogs
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedOfferForShare, setSelectedOfferForShare] = useState<HierarchicalOffer | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [selectedOfferForEdit, setSelectedOfferForEdit] = useState<any>(null);

  // Handle URL parameters (e.g., ?action=publish)
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const action = searchParams.get('action');

    if (action === 'publish') {
      setShowPublishDialog(true);
      // مسح البارامتر من URL بعد فتح النموذج
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (action === 'requests') {
      // الانتقال لتبويب الطلبات وإضافة الطلب الجديد
      setActiveMainTab('requests');

      // التحقق من وجود بيانات طلب محفوظة
      const savedRequest = localStorage.getItem('wasata_republish_request');
      if (savedRequest) {
        try {
          const requestData = JSON.parse(savedRequest);

          // إنشاء طلب جديد وإضافته للقائمة
          const newRequest: Request = {
            id: `R-${Date.now()}`,
            title: `طلب ${requestData.propertyType || 'عقار'} ${requestData.purpose || ''}`,
            customerName: requestData.clientName || 'عميل',
            customerPhone: requestData.clientPhone || '',
            propertyType: requestData.propertyType || '',
            purpose: requestData.purpose === 'للإيجار' ? 'rent' : 'sale',
            city: requestData.preferredCity || '',
            district: requestData.preferredDistricts || '',
            budget: {
              min: parseInt(requestData.minBudget) || 0,
              max: parseInt(requestData.maxBudget) || 0,
            },
            bedrooms: parseInt(requestData.bedrooms) || undefined,
            status: 'new',
            createdAt: new Date(),
            notes: requestData.additionalRequirements || '',
          };

          setRequests((prev) => [newRequest, ...prev]);

          // تحديث حالة الطلب الأصلي
          if (requestData.originalTabId && requestData.source === 'customer_tab') {
            const { updateOriginalRequestStatus } = require('@/hooks/usePublishedAdsManager');
            const updated = updateOriginalRequestStatus(requestData.originalTabId, newRequest.id);
            if (updated) {
              toast.success('✅ تم تحديث حالة الطلب في بطاقة العميل', {
                description: 'الطلب الأصلي أصبح مرتبطاً بالطلب المنشور',
                duration: 4000,
              });
            }
          }

          toast.success('✅ تم إضافة الطلب إلى قسم الطلبات بنجاح', {
            description: `طلب ${requestData.propertyType} ${requestData.purpose}`,
            duration: 5000,
          });

          // حذف البيانات المحفوظة
          localStorage.removeItem('wasata_republish_request');
        } catch (e) {
          console.error('Error parsing request data:', e);
          localStorage.removeItem('wasata_republish_request');
        }
      }

      // مسح البارامتر من URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // فتح نموذج النشر من أماكن خارج منصتي (مثل زر الفوتر)
  useEffect(() => {
    const handler = () => setShowPublishDialog(true);
    window.addEventListener('wasata:openPublishAd', handler as EventListener);
    return () => window.removeEventListener('wasata:openPublishAd', handler as EventListener);
  }, []);

  // PDF Report & Comparison Dialogs
  const [showPDFReport, setShowPDFReport] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'top5' | 'manual' | 'all'>('top5');

  // Publish Form
  const [publishForm, setPublishForm] = useState<PublishFormData>({
    title: '',
    description: '',
    propertyType: '',
    purpose: 'sale',
    category: 'residential',
    city: '',
    district: '',
    price: 0,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    ownerName: user?.name || '',
    ownerPhone: user?.phone || '',
    ownerEmail: '',
  });

  // Public slug (Source of Truth = DB)
  const [platformSlug, setPlatformSlug] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('business_cards')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (!error && data?.slug) {
        const dbSlug = String(data.slug).trim().toLowerCase();
        setPlatformSlug(dbSlug);
        // مزامنة slug المستخدم في القنوات/الروابط
        // هذا يمنع اختلاف القناة بين لوحة التحكم والصفحات العامة
        if (dbSlug) {
          localStorage.setItem('public_platform_slug', dbSlug);
          setCurrentSlug(dbSlug);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Platform URL (بدون /platform وبدون userId)
  const platformUrl = useMemo(() => {
    const origin = window.location.origin;
    const safeSlug = (platformSlug || '').trim().toLowerCase();
    return safeSlug ? `${origin}/${safeSlug}` : origin;
  }, [platformSlug]);

  // Filtered Offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          offer.title.toLowerCase().includes(query) ||
          offer.location.toLowerCase().includes(query) ||
          offer.adNumber.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (activeCity !== 'الكل' && offer.city !== activeCity) return false;
      return true;
    });
  }, [offers, searchQuery, activeCity]);

  // Stats
  const stats = useMemo(() => {
    const total = offers.length;
    const published = offers.filter(o => o.status === 'published').length;
    const draft = offers.filter(o => o.status === 'draft').length;
    const totalViews = offers.reduce((sum, o) => sum + o.views, 0);
    const totalRequests = offers.reduce((sum, o) => sum + o.requests, 0);
    
    return { total, published, draft, totalViews, totalRequests };
  }, [offers]);

  // Toggle Expand (للعروض الفرعية القديمة)
  const toggleExpand = (offerId: string) => {
    setExpandedOffers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(offerId)) {
        newSet.delete(offerId);
      } else {
        newSet.add(offerId);
      }
      return newSet;
    });
  };

  // Toggle City Expand (المستوى الأول: المدينة)
  const toggleCityExpand = (cityName: string) => {
    setExpandedCities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cityName)) {
        newSet.delete(cityName);
      } else {
        newSet.add(cityName);
      }
      return newSet;
    });
  };

  // Toggle District Expand (المستوى الثاني: الحي)
  const toggleDistrictExpand = (districtKey: string) => {
    setExpandedDistricts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(districtKey)) {
        newSet.delete(districtKey);
      } else {
        newSet.add(districtKey);
      }
      return newSet;
    });
  };

  // حساب إحصائيات المدينة
  const getCityStats = (city: CityLevel) => {
    let totalOffers = city.directOffers.length;
    let totalViews = city.directOffers.reduce((sum, o) => sum + o.views, 0);
    city.districts.forEach(d => {
      totalOffers += d.offers.length;
      totalViews += d.offers.reduce((sum, o) => sum + o.views, 0);
    });
    return { totalOffers, totalViews, districtsCount: city.districts.length };
  };

  // جلب جميع العروض بشكل مسطح (flat)
  const getAllOffersFlat = (): SingleOffer[] => {
    const all: SingleOffer[] = [];
    cityHierarchy.forEach(city => {
      all.push(...city.directOffers);
      city.districts.forEach(d => {
        all.push(...d.offers);
      });
    });
    return all;
  };

  // الاستماع لحدث نشر الإعلان وإضافته للهيكل الهرمي
  useEffect(() => {
    const handleAdPublished = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { adId } = customEvent.detail;
      
      // جلب بيانات الإعلان المنشور من localStorage
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      const newAd = publishedAds.find((ad: any) => ad.id === adId);
      
      if (!newAd) return;
      
      const city = newAd.locationDetails?.city || 'أخرى';
      const district = newAd.locationDetails?.district || 'عروض مباشرة';
      
      // إنشاء العرض بالشكل المطلوب
      const newOffer: SingleOffer = {
        id: newAd.id,
        title: `${newAd.purpose === 'للإيجار' ? 'للإيجار' : 'للبيع'} - ${newAd.propertyType} - ${newAd.area || ''}م`,
        description: newAd.aiDescription || newAd.description || '',
        price: newAd.price ? `${newAd.price} ريال` : 'السعر عند التواصل',
        image: newAd.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        images: newAd.images || [],
        status: 'published',
        views: 0,
        requests: 0,
        propertyType: newAd.propertyType,
        bedrooms: parseInt(newAd.bedrooms) || undefined,
        bathrooms: parseInt(newAd.bathrooms) || undefined,
        area: parseInt(newAd.area) || undefined,
        owner: { name: newAd.ownerName, phone: newAd.ownerPhone },
        ownerName: newAd.ownerName,
        isHidden: false,
        liveViewers: 0,
        city: city,
        district: district,
      };
      
      setCityHierarchy(prev => {
        let updated = [...prev];
        
        // البحث عن المدينة أو إنشاؤها
        let cityIndex = updated.findIndex(c => c.cityName === city);
        if (cityIndex === -1) {
          updated.push({
            cityName: city,
            isExpanded: false,
            isHidden: false,
            liveViewers: 0,
            directOffers: [],
            districts: []
          });
          cityIndex = updated.length - 1;
        }
        
        // البحث عن الحي أو إنشاؤه
        if (district && district !== 'عروض مباشرة') {
          let districtIndex = updated[cityIndex].districts.findIndex(d => d.districtName === district || d.districtName === `حي ${district}`);
          if (districtIndex === -1) {
            updated[cityIndex].districts.push({
              districtName: district.startsWith('حي ') ? district : `حي ${district}`,
              offers: [],
              isExpanded: false,
              isHidden: false,
              liveViewers: 0
            });
            districtIndex = updated[cityIndex].districts.length - 1;
          }
          // إضافة العرض للحي
          updated[cityIndex].districts[districtIndex].offers.push(newOffer);
        } else {
          // إضافة للعروض المباشرة
          updated[cityIndex].directOffers.push(newOffer);
        }
        
        return updated;
      });
      
      // توسيع المدينة لإظهار العرض الجديد
      setExpandedCities(prev => new Set([...prev, city]));
      
      // ✅ إعادة جلب العروض من قاعدة البيانات لتحديث تبويب المنصة أيضاً
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchListings();
    };
    
    window.addEventListener('adPublished', handleAdPublished);
    return () => window.removeEventListener('adPublished', handleAdPublished);
  }, [fetchListings]);

  // الاستماع لأحداث المشاهدات لتحديث الإحصائيات
  useEffect(() => {
    const handleOfferViewed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { offerId } = customEvent.detail;
      
      // تحديث عدد المشاهدات في cityHierarchy
      setCityHierarchy(prev => prev.map(city => ({
        ...city,
        districts: city.districts.map(district => ({
          ...district,
          offers: district.offers.map(offer => {
            if (offer.id === offerId) {
              return { ...offer, views: offer.views + 1 };
            }
            return offer;
          })
        })),
        directOffers: city.directOffers.map(offer => {
          if (offer.id === offerId) {
            return { ...offer, views: offer.views + 1 };
          }
          return offer;
        })
      })));
    };
    
    window.addEventListener('offerViewed', handleOfferViewed);
    return () => window.removeEventListener('offerViewed', handleOfferViewed);
  }, []);

  // حساب إحصائيات الحي
  const getDistrictStats = (district: DistrictLevel) => {
    return {
      offersCount: district.offers.length,
      totalViews: district.offers.reduce((sum, o) => sum + o.views, 0),
    };
  };

  // استخراج 4 صور معاينة من العروض
  const getPreviewImages = (offers: SingleOffer[], max: number = 4): string[] => {
    return offers.slice(0, max).map(o => o.image);
  };

  // إخفاء/إظهار المدينة
  const toggleCityVisibility = (cityName: string) => {
    setCityHierarchy(prev => prev.map(c => {
      if (c.cityName === cityName) {
        const newHidden = !c.isHidden;
        toast.success(newHidden ? `تم إخفاء ${cityName} من منصتي` : `تم إظهار ${cityName} على منصتي`);
        return { ...c, isHidden: newHidden };
      }
      return c;
    }));
  };

  // إخفاء/إظهار الحي
  const toggleDistrictVisibility = (cityName: string, districtName: string) => {
    setCityHierarchy(prev => prev.map(c => {
      if (c.cityName === cityName) {
        return {
          ...c,
          districts: c.districts.map(d => {
            if (d.districtName === districtName) {
              const newHidden = !d.isHidden;
              toast.success(newHidden ? `تم إخفاء ${districtName} من منصتي` : `تم إظهار ${districtName} على منصتي`);
              return { ...d, isHidden: newHidden };
            }
            return d;
          })
        };
      }
      return c;
    }));
  };

  // إخفاء/إظهار العرض الفردي - يحفظ مباشرة في قاعدة البيانات
  const toggleOfferVisibility = async (cityName: string, districtName: string, offerId: string) => {
    // البحث عن العرض وحالته الحالية
    let currentHiddenState = false;
    cityHierarchy.forEach(c => {
      if (c.cityName === cityName) {
        c.districts.forEach(d => {
          d.offers.forEach(o => {
            if (o.id === offerId) currentHiddenState = o.isHidden;
          });
        });
        c.directOffers.forEach(o => {
          if (o.id === offerId) currentHiddenState = o.isHidden;
        });
      }
    });

    const newHidden = !currentHiddenState;

    // تحديث الحالة المحلية فوراً
    setCityHierarchy(prev => prev.map(c => {
      if (c.cityName === cityName) {
        return {
          ...c,
          districts: c.districts.map(d => {
            if (d.districtName === districtName) {
              return {
                ...d,
                offers: d.offers.map(o => {
                  if (o.id === offerId) {
                    return { ...o, isHidden: newHidden };
                  }
                  return o;
                })
              };
            }
            return d;
          }),
          directOffers: c.directOffers.map(o => {
            if (o.id === offerId) {
              return { ...o, isHidden: newHidden };
            }
            return o;
          })
        };
      }
      return c;
    }));

    // ✅ حفظ التغيير مباشرة في قاعدة البيانات
    try {
      await updateListing(offerId, { isHidden: newHidden });
      toast.success(newHidden ? 'تم إخفاء العرض من المنصة العامة' : 'تم إظهار العرض على المنصة العامة');
    } catch (error) {
      console.error('Error updating visibility in database:', error);
      // إعادة الحالة السابقة في حالة الخطأ
      setCityHierarchy(prev => prev.map(c => {
        if (c.cityName === cityName) {
          return {
            ...c,
            districts: c.districts.map(d => ({
              ...d,
              offers: d.offers.map(o => o.id === offerId ? { ...o, isHidden: currentHiddenState } : o)
            })),
            directOffers: c.directOffers.map(o => o.id === offerId ? { ...o, isHidden: currentHiddenState } : o)
          };
        }
        return c;
      }));
      toast.error('فشل في تحديث حالة العرض');
    }
  };

  // ✅ حذف عرض (Soft Delete) - ينقل للمحذوفات
  const handleDeleteOffer = async (offer: SingleOffer, cityName: string, districtName?: string) => {
    try {
      // إضافة للمحذوفات المحلية
      addToDeletedOffers({
        id: offer.id,
        title: offer.title,
        city: cityName,
        district: districtName || '',
        price: offer.price,
        image: offer.image,
        propertyType: offer.propertyType,
      });

      // حذف من قاعدة البيانات (soft delete)
      await deleteListing(offer.id, false);

      // حذف من الحالة المحلية
      setCityHierarchy(prev => prev.map(c => {
        if (c.cityName === cityName) {
          return {
            ...c,
            districts: c.districts.map(d => ({
              ...d,
              offers: d.offers.filter(o => o.id !== offer.id)
            })),
            directOffers: c.directOffers.filter(o => o.id !== offer.id)
          };
        }
        return c;
      }));

      toast.success('تم نقل العرض إلى المحذوفات');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('فشل في حذف العرض');
    }
  };

  // ✅ استعادة عرض من المحذوفات
  const handleRestoreOffer = async (offerId: string) => {
    try {
      const restoredOffer = restoreFromDeletedOffers(offerId);
      if (restoredOffer) {
        // إعادة إضافته لقاعدة البيانات (إزالة deleted_at)
        const { error } = await supabase
          .from('platform_listings')
          .update({ deleted_at: null })
          .eq('id', offerId);

        if (error) throw error;

        // إعادة جلب البيانات
        await fetchListings();
        toast.success('تم استعادة العرض بنجاح');
      }
    } catch (error) {
      console.error('Error restoring offer:', error);
      toast.error('فشل في استعادة العرض');
    }
  };

  // مشاركة عبر واتساب (للهيكل الهرمي) - روابط هرمية جديدة
  // type: 'city' | 'district' | 'offer' لتحديد نوع العنصر
  const shareItemWhatsApp = (title: string, id: string, cityName?: string, districtName?: string, type: 'city' | 'district' | 'offer' = 'offer') => {
    // جلب بيانات العرض الكاملة
    const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
    const ad = publishedAds.find((a: any) => a.id === id);
    const safeSlug = (platformSlug || '').trim().toLowerCase();
    
    // بناء الرابط الهرمي حسب نوع العنصر (على الدومين المنشور)
    const publishedDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'wasataai.com';
    const publishedOrigin = `https://${publishedDomain}`;
    let shareUrl = publishedOrigin;
    if (type === 'offer' && safeSlug && cityName && districtName) {
      shareUrl = getFullUrl(buildOfferUrl(safeSlug, cityName, districtName, id));
    } else if (type === 'district' && safeSlug && cityName && districtName) {
      shareUrl = getFullUrl(buildDistrictUrl(safeSlug, cityName, districtName));
    } else if (type === 'city' && safeSlug && cityName) {
      shareUrl = getFullUrl(buildCityUrl(safeSlug, cityName));
    } else if (safeSlug) {
      // استخدم نفس util لتفادي اختلافات الدومين بين البيئات
      shareUrl = getFullUrl(`/${safeSlug}`);
    }

    let text = `🏠 *${title}*\n\n`;

    if (type === 'offer' && ad) {
      text += `📍 الموقع: ${ad.locationDetails?.city || cityName || ''} - ${ad.locationDetails?.district || districtName || ''}\n`;
      if (ad.area) text += `📐 المساحة: ${ad.area} م²\n`;
      if (ad.price) text += `💰 السعر: ${parseInt(ad.price).toLocaleString()} ريال\n`;
      if (ad.bedrooms) text += `🛏️ الغرف: ${ad.bedrooms}\n`;
      if (ad.aiDescription) text += `\n📝 ${ad.aiDescription.slice(0, 150)}${ad.aiDescription.length > 150 ? '...' : ''}\n`;
    } else if (type === 'city' && cityName) {
      text += `📍 عروض ${cityName}\n`;
    } else if (type === 'district' && cityName && districtName) {
      text += `📍 عروض ${districtName} - ${cityName}\n`;
    }

    text += `\n🔗 شاهد العروض:\n${shareUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('تم فتح واتساب للمشاركة');
  };

  // مشاركة رابط - روابط هرمية جديدة
  // type: 'city' | 'district' | 'offer' لتحديد نوع العنصر
  const shareItemLink = async (title: string, id: string, cityName?: string, districtName?: string, type: 'city' | 'district' | 'offer' = 'offer') => {
    const safeSlug = (platformSlug || '').trim().toLowerCase();
    
    // ✅ استخدام الدومين المنشور الصحيح (wasataai.com) دائماً
    const publishedDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'wasataai.com';
    const publishedOrigin = `https://${publishedDomain}`;
    
    // بناء الرابط الهرمي حسب نوع العنصر
    let shareUrl = publishedOrigin;
    if (type === 'offer' && safeSlug && cityName && districtName) {
      shareUrl = getFullUrl(buildOfferUrl(safeSlug, cityName, districtName, id));
    } else if (type === 'district' && safeSlug && cityName && districtName) {
      shareUrl = getFullUrl(buildDistrictUrl(safeSlug, cityName, districtName));
    } else if (type === 'city' && safeSlug && cityName) {
      shareUrl = getFullUrl(buildCityUrl(safeSlug, cityName));
    } else if (safeSlug) {
      shareUrl = `${publishedOrigin}/${safeSlug}`;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success('تم نسخ الرابط');
  };

  // ========== Drag & Drop Functions ==========
  
  // بدء السحب للعرض
  const handleDragStartOffer = (e: React.DragEvent, offer: SingleOffer, sourceCity: string, sourceDistrict: string) => {
    setDraggedItem({ type: 'offer', data: offer, sourceCity, sourceDistrict });
    e.dataTransfer.effectAllowed = 'move';
  };

  // بدء السحب للحي
  const handleDragStartDistrict = (e: React.DragEvent, district: DistrictLevel, sourceCity: string) => {
    setDraggedItem({ type: 'district', data: district, sourceCity });
    e.dataTransfer.effectAllowed = 'move';
  };

  // الإفلات على المدينة
  const handleDropOnCity = (targetCityName: string) => {
    if (!draggedItem) return;
    
    if (draggedItem.type === 'district' && draggedItem.sourceCity !== targetCityName) {
      // نقل حي كامل من مدينة لأخرى
      setCityHierarchy(prev => {
        const updated = prev.map(city => {
          // إزالة من المصدر
          if (city.cityName === draggedItem.sourceCity) {
            return {
              ...city,
              districts: city.districts.filter(d => d.districtName !== draggedItem.data.districtName)
            };
          }
          // إضافة للهدف
          if (city.cityName === targetCityName) {
            return {
              ...city,
              districts: [...city.districts, draggedItem.data]
            };
          }
          return city;
        });
        return updated;
      });
      toast.success(`تم نقل حي "${draggedItem.data.districtName}" إلى ${targetCityName}`);
    }
    
    if (draggedItem.type === 'offer' && draggedItem.sourceCity !== targetCityName) {
      // نقل عرض من مدينة لأخرى (كعرض مباشر)
      setCityHierarchy(prev => {
        const updated = prev.map(city => {
          // إزالة من المصدر
          if (city.cityName === draggedItem.sourceCity) {
            if (draggedItem.sourceDistrict) {
              return {
                ...city,
                districts: city.districts.map(d => {
                  if (d.districtName === draggedItem.sourceDistrict) {
                    return {
                      ...d,
                      offers: d.offers.filter(o => o.id !== draggedItem.data.id)
                    };
                  }
                  return d;
                })
              };
            } else {
              return {
                ...city,
                directOffers: city.directOffers.filter(o => o.id !== draggedItem.data.id)
              };
            }
          }
          // إضافة للهدف كعرض مباشر
          if (city.cityName === targetCityName) {
            return {
              ...city,
              directOffers: [...city.directOffers, draggedItem.data]
            };
          }
          return city;
        });
        return updated;
      });
      toast.success(`تم نقل العرض إلى ${targetCityName}`);
    }
    
    setDraggedItem(null);
    setDragOverCity(null);
  };

  // فتح نافذة النقل
  const openMoveDialog = (type: 'offer' | 'district', data: any, sourceCity: string, sourceDistrict?: string) => {
    setItemToMove({ type, data, sourceCity, sourceDistrict });
    setTargetCityForMove('');
    setTargetDistrictForMove('');
    setMoveType('existing');
    setNewCityName('');
    setNewDistrictName('');
    setShowMoveDialog(true);
  };

  // تنفيذ النقل من النافذة (محسّنة مع خيارات متعددة)
  const confirmMove = () => {
    if (!itemToMove) return;
    
    if (moveType === 'new') {
      // إنشاء مدينة/حي جديد ونقل العرض إليه
      if (!newCityName && !newDistrictName) {
        toast.error('أدخل اسم المدينة أو الحي الجديد');
        return;
      }
      
      setCityHierarchy(prev => {
        let updated = [...prev];
        const targetCity = newCityName || itemToMove.sourceCity;
        const targetDistrict = newDistrictName || 'عروض مباشرة';
        
        // التحقق من وجود المدينة أو إنشاؤها
        let cityIndex = updated.findIndex(c => c.cityName === targetCity);
        if (cityIndex === -1 && newCityName) {
          updated.push({
            cityName: newCityName,
            isExpanded: false,
            isHidden: false,
            liveViewers: 0,
            directOffers: [],
            districts: []
          });
          cityIndex = updated.length - 1;
        }
        
        if (cityIndex === -1) {
          toast.error('المدينة غير موجودة');
          return prev;
        }
        
        // إنشاء حي جديد إذا تم تحديده
        if (newDistrictName) {
          const districtExists = updated[cityIndex].districts.some(d => d.districtName === newDistrictName);
          if (!districtExists) {
            updated[cityIndex].districts.push({
              districtName: newDistrictName,
              offers: [],
              isExpanded: false,
              isHidden: false,
              liveViewers: 0
            });
          }
        }
        
        // نقل العرض
        if (itemToMove.type === 'offer') {
          // إزالة العرض من المصدر
          if (itemToMove.sourceDistrict) {
            updated = updated.map(c => {
              if (c.cityName === itemToMove.sourceCity) {
                return {
                  ...c,
                  districts: c.districts.map(d => {
                    if (d.districtName === itemToMove.sourceDistrict) {
                      return { ...d, offers: d.offers.filter(o => o.id !== itemToMove.data.id) };
                    }
                    return d;
                  })
                };
              }
              return c;
            });
          } else {
            updated = updated.map(c => {
              if (c.cityName === itemToMove.sourceCity) {
                return { ...c, directOffers: c.directOffers.filter(o => o.id !== itemToMove.data.id) };
              }
              return c;
            });
          }
          
          // إضافة العرض للهدف
          const targetCityIndex = updated.findIndex(c => c.cityName === targetCity);
          if (newDistrictName) {
            const targetDistrictIndex = updated[targetCityIndex].districts.findIndex(d => d.districtName === newDistrictName);
            updated[targetCityIndex].districts[targetDistrictIndex].offers.push(itemToMove.data);
          } else {
            updated[targetCityIndex].directOffers.push(itemToMove.data);
          }
        }
        
        toast.success(`تم نقل العرض إلى ${newCityName || itemToMove.sourceCity}${newDistrictName ? ` - ${newDistrictName}` : ''}`);
        return updated;
      });
    } else {
      // نقل لمدينة/حي موجود
      if (!targetCityForMove) {
        toast.error('اختر المدينة');
        return;
      }
      
      if (itemToMove.type === 'offer' && targetDistrictForMove) {
        // نقل العرض لحي محدد
        setCityHierarchy(prev => {
          let updated = [...prev];
          
          // إزالة من المصدر
          if (itemToMove.sourceDistrict) {
            updated = updated.map(c => {
              if (c.cityName === itemToMove.sourceCity) {
                return {
                  ...c,
                  districts: c.districts.map(d => {
                    if (d.districtName === itemToMove.sourceDistrict) {
                      return { ...d, offers: d.offers.filter(o => o.id !== itemToMove.data.id) };
                    }
                    return d;
                  })
                };
              }
              return c;
            });
          } else {
            updated = updated.map(c => {
              if (c.cityName === itemToMove.sourceCity) {
                return { ...c, directOffers: c.directOffers.filter(o => o.id !== itemToMove.data.id) };
              }
              return c;
            });
          }
          
          // إضافة للهدف
          updated = updated.map(c => {
            if (c.cityName === targetCityForMove) {
              return {
                ...c,
                districts: c.districts.map(d => {
                  if (d.districtName === targetDistrictForMove) {
                    return { ...d, offers: [...d.offers, itemToMove.data] };
                  }
                  return d;
                })
              };
            }
            return c;
          });
          
          toast.success(`تم نقل العرض إلى ${targetCityForMove} - ${targetDistrictForMove}`);
          return updated;
        });
      } else {
        handleDropOnCity(targetCityForMove);
      }
    }
    
    setShowMoveDialog(false);
    setItemToMove(null);
  };

  // تصدير PDF للعرض (يدعم العربية عبر تحويل HTML إلى صورة)
  const exportOfferToPDF = async (offer: SingleOffer, cityName: string, districtName?: string) => {
    toast.info('جاري إنشاء ملف PDF...');

    try {
      const category = offer.title?.includes('للإيجار') ? 'للإيجار' : 'للبيع';
      
      // إعداد معلومات الوسيط للهيدر والفوتر
      const brokerData = businessCardData ? {
        name: businessCardData.userName,
        company: businessCardData.companyName,
        phone: user?.phone || '',
        location: cityName,
        profileImage: businessCardData.profileImage,
        coverImage: businessCardData.coverImage,
        logoImage: businessCardData.logoImage,
      } : undefined;
      
      // إنشاء رابط العرض العام
      const offerUrl = currentSlug && cityName && districtName
        ? getFullUrl(`/${currentSlug}/${cityName}/${districtName}/${offer.id}`)
        : '';

      await generatePropertyPDF(
        {
          id: offer.id,
          slug: currentSlug,
          title: offer.title,
          category,
          propertyType: offer.propertyType,
          price: offer.price,
          area: offer.area?.toString(),
          bedrooms: offer.bedrooms?.toString(),
          bathrooms: offer.bathrooms?.toString(),
          ownerName: offer.ownerName ?? offer.owner?.name,
          ownerPhone: offer.owner?.phone,
          brokerPhone: user?.phone || businessCardData?.userName,
          image: offer.image,
          images: offer.images && offer.images.length > 0 ? offer.images : (offer.image ? [offer.image] : undefined),
          locationDetails: {
            city: cityName,
            district: districtName,
          },
          aiDescription: offer.description,
          offerUrl,
        },
        true,
        brokerData
      );

      toast.success('تم تحميل PDF بنجاح');
    } catch (error) {
      console.error('exportOfferToPDF error:', error);
      toast.error('تعذر إنشاء PDF');
    }
  };

  // Toggle Publish Status
  const togglePublishStatus = (offerId: string) => {
    setOffers(prev => {
      const updated = prev.map(o => {
        if (o.id === offerId) {
          const newStatus = o.status === 'published' ? 'draft' : 'published';
          toast.success(newStatus === 'published' ? 'تم نشر العرض بنجاح' : 'تم إخفاء العرض من منصتي');
          window.dispatchEvent(new CustomEvent('analyticsEvent', {
            detail: { eventType: newStatus === 'published' ? 'offer_published' : 'offer_hidden', offerId }
          }));
          return { ...o, status: newStatus as 'published' | 'draft' };
        }
        return o;
      });
      saveToStorage(updated);
      return updated;
    });
  };

  // Toggle Pin
  const togglePin = (offerId: string) => {
    setOffers(prev => {
      const updated = prev.map(o => o.id === offerId ? { ...o, isPinned: !o.isPinned } : o);
      saveToStorage(updated);
      toast.success('تم تحديث حالة التثبيت');
      return updated;
    });
  };

  // Delete Offer
  const deleteOffer = (offerId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      setOffers(prev => {
        const updated = prev.filter(o => o.id !== offerId);
        saveToStorage(updated);
        toast.success('تم حذف العرض');
        return updated;
      });
    }
  };

  // Open Share Modal
  const openShareModal = (offer: HierarchicalOffer) => {
    setSelectedOfferForShare(offer);
    setShowShareModal(true);
    window.dispatchEvent(new CustomEvent('analyticsEvent', {
      detail: { eventType: 'share_modal_opened', offerId: offer.id }
    }));
  };

  // Copy Share Link
  const copyShareLink = async () => {
    if (!selectedOfferForShare) return;
    const slug = localStorage.getItem('public_platform_slug') || 'default';
    const shareUrl = `https://wasataai.com/${slug}?offer=${selectedOfferForShare.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopiedLink(false), 2000);
      window.dispatchEvent(new CustomEvent('analyticsEvent', {
        detail: { eventType: 'share_link_copied', offerId: selectedOfferForShare.id, method: 'link' }
      }));
    } catch {
      toast.error('فشل نسخ الرابط');
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    if (!selectedOfferForShare) return;
    const slug = localStorage.getItem('public_platform_slug') || 'default';
    const shareUrl = `https://wasataai.com/${slug}?offer=${selectedOfferForShare.id}`;
    const message = encodeURIComponent(`${selectedOfferForShare.title}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    window.dispatchEvent(new CustomEvent('analyticsEvent', {
      detail: { eventType: 'share_whatsapp', offerId: selectedOfferForShare.id }
    }));
  };

  // Share via Email
  const shareViaEmail = () => {
    if (!selectedOfferForShare) return;
    const slug = localStorage.getItem('public_platform_slug') || 'default';
    const shareUrl = `https://wasataai.com/${slug}?offer=${selectedOfferForShare.id}`;
    const subject = encodeURIComponent(selectedOfferForShare.title);
    const body = encodeURIComponent(`${selectedOfferForShare.title}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    window.dispatchEvent(new CustomEvent('analyticsEvent', {
      detail: { eventType: 'share_email', offerId: selectedOfferForShare.id }
    }));
  };

  // Communication handlers
  const handleWhatsApp = (phone: string, title: string) => {
    const message = encodeURIComponent(`مرحباً، أنا مهتم بـ: ${title}`);
    window.open(`https://wa.me/${phone.replace(/^0/, '966')}?text=${message}`, '_blank');
    toast.success('جاري فتح واتساب...');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    toast.success('جاري الاتصال...');
  };

  const handleAppointment = (offerId: string, title: string) => {
    window.dispatchEvent(new CustomEvent('addAppointment', {
      detail: { title: `معاينة: ${title}`, propertyId: offerId, type: 'معاينة' }
    }));
    toast.success('سيتم فتح نافذة تحديد الموعد');
  };

  const handleDeposit = (offerId: string, title: string) => {
    toast.info(`سيتم فتح نافذة دفع العربون لـ: ${title}`);
    window.dispatchEvent(new CustomEvent('analyticsEvent', {
      detail: { eventType: 'deposit_requested', offerId }
    }));
  };

  // Submit Publish Form
  const handlePublishSubmit = () => {
    if (!publishForm.title || !publishForm.propertyType || !publishForm.city) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newOffer: HierarchicalOffer = {
      id: `NEW-${Date.now()}`,
      title: publishForm.title,
      location: `${publishForm.city} - ${publishForm.district}`,
      city: publishForm.city,
      district: publishForm.district,
      price: `${publishForm.price.toLocaleString()} ريال`,
      adNumber: `AD-${Date.now().toString().slice(-6)}`,
      images: [],
      views: 0,
      requests: 0,
      isPinned: false,
      lastOpened: 'الآن',
      date: new Date(),
      status: 'draft',
      purpose: publishForm.purpose,
      propertyType: publishForm.propertyType,
      category: publishForm.category,
      bedrooms: publishForm.bedrooms,
      bathrooms: publishForm.bathrooms,
      area: publishForm.area,
      owner: {
        name: publishForm.ownerName,
        phone: publishForm.ownerPhone,
        email: publishForm.ownerEmail,
      },
      subOffers: [],
      rootOffers: [],
      isExpanded: false,
    };

    setOffers(prev => {
      const updated = [newOffer, ...prev];
      saveToStorage(updated);
      return updated;
    });

    toast.success('تم إضافة العرض بنجاح');
    setShowPublishDialog(false);
    setPublishForm({
      title: '', description: '', propertyType: '', purpose: 'sale', category: 'residential',
      city: '', district: '', price: 0, area: 0, bedrooms: 0, bathrooms: 0,
      ownerName: user?.name || '', ownerPhone: user?.phone || '', ownerEmail: '',
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['العنوان', 'الموقع', 'السعر', 'الحالة', 'المشاهدات', 'الطلبات'];
    const rows = filteredOffers.map(o => [o.title, o.location, o.price, o.status === 'published' ? 'منشور' : 'مسودة', o.views, o.requests]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `my_platform_offers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير البيانات');
  };

  // ===================== Render =====================

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header - موحد مع بطاقة العمل الرقمية */}
      <header 
        className="sticky top-0 z-40 border-b-4 shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${digitalCardHeader?.primaryColor || '#01411C'} 0%, ${digitalCardHeader?.primaryColor || '#01411C'}dd 100%)`,
          borderColor: digitalCardHeader?.secondaryColor || '#D4AF37',
        }}
      >
        {/* صورة الخلفية من بطاقة العمل */}
        {businessCardData?.coverImage && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${businessCardData.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        <div className="container mx-auto px-4 py-3 relative z-10">
          {/* الهيدر للجوال: اسم الصفحة في سطر واحد + الأزرار أسفله */}
          <div className="flex flex-col gap-3">
            {/* اسم الصفحة في الأعلى */}
            <div className="flex items-center justify-center gap-3">
              {/* الشعار أو صورة البروفايل من بطاقة العمل */}
              {(businessCardData?.logoImage || businessCardData?.profileImage || digitalCardHeader?.logo) && (
                <img 
                  src={businessCardData?.logoImage || businessCardData?.profileImage || digitalCardHeader?.logo} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-full border-2 border-white/50 object-cover shadow-lg" 
                />
              )}
              <div className="text-center">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 whitespace-nowrap">
                  <Home className="w-5 h-5" />
                  {businessCardData?.companyName || 'منصتي'}
                </h1>
                <p className="text-xs text-white/80">{businessCardData?.userName || platformUrl}</p>
              </div>
            </div>
            
            {/* الأزرار في سطر منفصل */}
            <div className="flex items-center justify-between">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="border-2 bg-white/10 text-white hover:bg-white/20"
                style={{ borderColor: digitalCardHeader?.secondaryColor || '#D4AF37' }}
              >
                <ArrowRight className="w-4 h-4 ml-1" />
                العودة
              </Button>
              
              <Button
                onClick={() => setShowPublishDialog(true)}
                size="sm"
                className="text-white"
                style={{ 
                  backgroundColor: digitalCardHeader?.secondaryColor || '#D4AF37',
                  color: digitalCardHeader?.primaryColor || '#01411C',
                }}
              >
                <Plus className="w-4 h-4 ml-1" />
                نشر إعلان
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Main Tabs: منصتي / العروض / الطلبات */}
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as any)}>
          <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="platform" 
              className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white font-bold"
            >
              <Globe className="w-4 h-4 ml-2" />
              المنصه
            </TabsTrigger>
            <TabsTrigger 
              value="offers" 
              className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white font-bold"
            >
              <Building className="w-4 h-4 ml-2" />
              العروض ({stats.total})
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white font-bold"
            >
              <FileText className="w-4 h-4 ml-2" />
              الطلبات ({requests.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: المنصه - عرض المنصة العامة بأسلوب جديد */}
          <TabsContent value="platform" className="space-y-0 -mx-4 -mt-2">
            <MyPublicPlatformContent 
              currentUser={{
                name: user?.name || 'مستخدم تجريبي',
                title: 'وسيط عقاري معتمد',
                rating: 5.0,
                badge: 'ماسي',
                totalDeals: 156
              }}
              userId={user?.id || 'default'}
              platformSlug={currentSlug}
              ownerListingsFromParent={dbListings}
            />
          </TabsContent>

          {/* Tab: العروض (الهرمي) */}
          <TabsContent value="offers" className="space-y-4">
            {/* المستطيلات القابلة للطي */}
            <div className="space-y-3">
              {/* 1. إحصائيات المشاهدات - مستطيل قابل للطي */}
              <CollapsibleStatsSection
                currentViews={viewStats.current}
                monthlyViews={viewStats.thisMonth}
                yearlyViews={viewStats.thisYear}
                totalInteractions={viewStats.totalInteractions}
                history={viewStats.history}
              />

            </div>

            {/* 4. مقارنة أداء العروض - مستطيل قابل للطي */}
            <CollapsiblePerformanceComparison
              offers={getAllOffersFlat().map(o => ({
                id: o.id,
                title: o.title,
                city: cityHierarchy.find(c => c.districts.some(d => d.offers.some(of => of.id === o.id)) || c.directOffers.some(of => of.id === o.id))?.cityName || 'غير محدد',
                views: o.views,
                calls: Math.floor((o.requests || 0) * 0.3),
                whatsapp: Math.floor((o.requests || 0) * 0.5),
                shares: Math.floor((o.requests || 0) * 0.2),
                favorites: Math.floor(o.views * 0.05),
                conversionRate: o.views > 0 ? Math.round((o.requests || 0) / o.views * 100) : 0,
                avgTimeOnPage: 60 + Math.floor(Math.random() * 120),
              }))}
              mode={comparisonMode}
              onModeChange={(m) => setComparisonMode(m)}
              getOfferViewers={getOfferViewers}
            />

            {/* Search & Filters */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="ابحث في العروض..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    <Button
                      variant={activeCity === 'الكل' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCity('الكل')}
                      className={activeCity === 'الكل' ? 'bg-[#01411C] text-white' : ''}
                    >
                      الكل
                    </Button>
                    {cities.slice(0, 5).map(city => (
                      <Button
                        key={city}
                        variant={activeCity === city ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCity(city)}
                        className={activeCity === city ? 'bg-[#01411C] text-white' : ''}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 ml-2" />
                    تصدير CSV
                  </Button>
                  <Button variant="outline" onClick={() => setShowPDFReport(true)} className="text-[#01411C] border-[#01411C]">
                    <FileDown className="w-4 h-4 ml-2" />
                    تقرير PDF
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={async () => {
                            try {
                              await cleanupDuplicates();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          تنظيف التكرارات
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>حذف العروض المكررة من قاعدة البيانات (صفحة المشاركة العامة)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {/* ✅ زر المحذوفات */}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeletedOffersPage(true)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    المحذوفات
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* === الهيكل الهرمي الجديد: مدينة ← حي ← عروض === */}
            <div className="space-y-4" dir="rtl">
              {cityHierarchy.map((city) => {
                const cityStats = getCityStats(city);
                const isCityExpanded = expandedCities.has(city.cityName);
                const allCityOffers = [...city.directOffers, ...city.districts.flatMap(d => d.offers)];
                const previewImages = getPreviewImages(allCityOffers, 4);
                const isDragOver = dragOverCity === city.cityName;
                
                return (
                  <Card 
                    key={city.cityName} 
                    className={`border-2 overflow-hidden transition-all duration-300 ${city.isHidden ? 'border-gray-300 opacity-60' : 'border-[#01411C]/30'} ${isDragOver ? 'ring-4 ring-[#D4AF37] scale-[1.01]' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCity(city.cityName); }}
                    onDragLeave={() => setDragOverCity(null)}
                    onDrop={(e) => { e.preventDefault(); handleDropOnCity(city.cityName); }}
                  >
                    {/* === المستوى الأول: المدينة (الأساس) === */}
                    <div 
                      className={`p-4 md:p-5 transition-all duration-300 ${isCityExpanded ? 'bg-[#01411C] text-white' : 'bg-gradient-to-l from-[#01411C]/5 to-[#D4AF37]/5 hover:bg-[#01411C]/10'}`}
                    >
                      {/* الصف الأول: المعلومات والصور */}
                      <div className="flex flex-col md:flex-row md:items-center gap-3 cursor-pointer" onClick={() => toggleCityExpand(city.cityName)}>
                        {/* الأيقونة والعنوان */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 relative ${isCityExpanded ? 'bg-[#D4AF37]' : 'bg-[#01411C]'}`}>
                            <MapPin className={`w-5 h-5 md:w-6 md:h-6 ${isCityExpanded ? 'text-[#01411C]' : 'text-[#D4AF37]'}`} />
                            {/* النقطة الحمراء النابضة على المدينة عند وجود عرض جديد */}
                            <PulsingDot show={isNew('offer', `city_${city.cityName}`)} size="md" position="top-right" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-bold text-base md:text-lg ${isCityExpanded ? 'text-white' : 'text-[#01411C]'}`}>{city.cityName}</h3>
                              {/* 👁️ عين المشاهدات المباشرة للمدينة - محسوبة من مجموع كل العروض */}
                              <LiveViewerIndicator 
                                liveViewers={getCityViewers(city.cityName)}
                                size="sm"
                              />
                              {city.isHidden && <Badge variant="outline" className="text-xs bg-gray-100">مخفي</Badge>}
                              <Badge className={`text-xs ${isCityExpanded ? 'bg-[#D4AF37] text-[#01411C]' : 'bg-[#01411C] text-[#D4AF37]'}`}>
                                {cityStats.totalOffers} عرض
                              </Badge>
                            </div>
                            <p className={`text-xs md:text-sm ${isCityExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                              {cityStats.districtsCount} أحياء • {cityStats.totalViews.toLocaleString()} مشاهدة
                            </p>
                          </div>
                        </div>

                        {/* 4 صور معاينة */}
                        <div className="flex items-center gap-1 mr-auto md:mr-0">
                          {previewImages.map((img, idx) => (
                            <div key={idx} className="w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden border-2 border-white/50 shadow-sm shrink-0">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {allCityOffers.length > 4 && (
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-[#D4AF37] flex items-center justify-center text-[#01411C] font-bold text-xs md:text-sm shrink-0">
                              +{allCityOffers.length - 4}
                            </div>
                          )}
                        </div>

                        {/* سهم التوسيع */}
                        <div className="hidden md:flex">
                          {isCityExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </div>
                      </div>

                      {/* الصف الثاني: الأزرار (منفصلة في الأسفل) */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/20">
                        {/* مؤشر المشاهدات المباشرة للمدينة */}
                        <LiveViewerIndicator 
                          liveViewers={getCityViewers(city.cityName)}
                          size="sm"
                        />

                        {/* أزرار الإجراءات */}
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                          {/* إخفاء/إظهار */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); toggleCityVisibility(city.cityName); }}
                            className={`h-8 px-2 md:px-3 ${isCityExpanded ? 'text-white hover:bg-white/20' : 'hover:bg-gray-100'}`}
                          >
                            {city.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span className="hidden md:inline mr-1">{city.isHidden ? 'إظهار' : 'إخفاء'}</span>
                          </Button>

                          {/* واتساب */}
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); shareItemWhatsApp(city.cityName, `city-${city.cityName}`, city.cityName, undefined, 'city'); }}
                            className="h-8 px-2 md:px-3 bg-green-500 text-white hover:bg-green-600"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden md:inline mr-1">واتساب</span>
                          </Button>

                          {/* نسخ الرابط */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); shareItemLink(city.cityName, `city-${city.cityName}`, city.cityName, undefined, 'city'); }}
                            className={`h-8 px-2 md:px-3 ${isCityExpanded ? 'text-white hover:bg-white/20' : 'hover:bg-gray-100'}`}
                          >
                            <Link className="w-4 h-4" />
                            <span className="hidden md:inline mr-1">رابط</span>
                          </Button>

                          {/* ✅ قائمة الثلاث نقاط للمدينة */}
                          <OfferActionsMenu
                            type="city"
                            id={city.cityName}
                            title={city.cityName}
                            isHidden={city.isHidden}
                            onEdit={() => {
                              toast.info('ميزة تعديل المدينة قيد التطوير');
                            }}
                            onDelete={() => {
                              // حذف جميع العروض في المدينة
                              city.districts.forEach(d => {
                                d.offers.forEach(o => handleDeleteOffer(o, city.cityName, d.districtName));
                              });
                              city.directOffers.forEach(o => handleDeleteOffer(o, city.cityName, ''));
                              toast.success(`تم حذف جميع عروض ${city.cityName}`);
                            }}
                            onToggleVisibility={() => toggleCityVisibility(city.cityName)}
                            onShare={() => shareItemWhatsApp(city.cityName, `city-${city.cityName}`, city.cityName, undefined, 'city')}
                            onCopyLink={() => shareItemLink(city.cityName, `city-${city.cityName}`, city.cityName, undefined, 'city')}
                            className={isCityExpanded ? 'text-white hover:bg-white/20' : ''}
                          />

                          {/* سهم للجوال */}
                          <div className="md:hidden" onClick={() => toggleCityExpand(city.cityName)}>
                            {isCityExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* العروض المباشرة والأحياء (عند التوسيع) */}
                    {isCityExpanded && (
                      <div className="border-t-2 border-[#D4AF37]/30 animate-fade-in">
                        {/* العروض المباشرة (بدون حي) */}
                        {city.directOffers.length > 0 && (
                          <div className="p-4 bg-[#D4AF37]/5 border-b border-[#D4AF37]/20">
                            <h4 className="text-sm font-bold text-gray-600 mb-3">عروض مباشرة في {city.cityName}:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {city.directOffers.map((offer) => (
                                <Card key={offer.id} className={`overflow-hidden hover:shadow-lg transition-all border-2 ${offer.isHidden ? 'border-gray-300 opacity-60' : 'border-transparent hover:border-[#D4AF37]'} bg-white relative`}>
                                  {/* النقطة الحمراء للعرض الجديد */}
                                  {isNew('published_ad', offer.id) && (
                                    <PulsingDot show={true} size="md" position="top-right" />
                                  )}
                                  <div className="relative h-32">
                                    <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                                    <Badge className={`absolute top-2 left-2 ${offer.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                      <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-1" />
                                      {offer.status === 'published' ? 'منشور' : 'مسودة'}
                                    </Badge>
                                    {/* مؤشر المشاهدات المباشرة */}
                                    <div className="absolute top-2 right-2">
                                      <LiveViewerIndicator 
                                        liveViewers={getOfferViewers(offer.id)}
                                        totalViews={offer.views || 0}
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                  <CardContent className="p-3">
                                    <h5 className="font-bold text-[#01411C] line-clamp-1">{offer.title}</h5>
                                    <p className="text-[#D4AF37] font-bold text-sm mt-1">{offer.price}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{offer.views}</span>
                                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{offer.requests}</span>
                                    </div>
                                    {/* أزرار الإجراءات */}
                                    <div className="flex items-center gap-1 mt-3 border-t pt-2">
                                      <Button size="sm" variant="ghost" onClick={() => toggleOfferVisibility(city.cityName, '', offer.id)} className="flex-1 text-xs">
                                        {offer.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="flex-1 text-xs bg-green-500 text-white"
                                        onClick={() => shareItemWhatsApp(
                                          offer.title,
                                          offer.id,
                                          city.cityName,
                                          // مهم: لا ترسل undefined هنا لأن هذا يجعل الرابط يرجع لرابط المنصة فقط
                                          // ولو كان هذا العرض "مباشر" في واجهة الترتيب، غالباً لديه حي فعلي في البيانات
                                          offer.district || '',
                                          'offer'
                                        )}
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" className="flex-1 text-xs bg-red-500 text-white" onClick={() => exportOfferToPDF(offer, city.cityName)}>
                                        <FileDown className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => openMoveDialog('offer', offer, city.cityName)}>
                                        <Move className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* === المستوى الثاني: الأحياء (الفرع) - خلفية خضراء هادئة === */}
                        <div className="p-3 md:p-4 space-y-3">
                          {city.districts.map((district) => {
                            const districtKey = `${city.cityName}-${district.districtName}`;
                            const districtStats = getDistrictStats(district);
                            const isDistrictExpanded = expandedDistricts.has(districtKey);
                            const districtPreviewImages = getPreviewImages(district.offers, 4);
                            
                            return (
                              <div 
                                key={districtKey} 
                                className={`border-2 rounded-lg overflow-hidden transition-all duration-300 ${district.isHidden ? 'border-gray-300 opacity-60' : 'border-[#D4AF37]/30'}`}
                                draggable
                                onDragStart={(e) => handleDragStartDistrict(e, district, city.cityName)}
                                onDragEnd={() => setDraggedItem(null)}
                              >
                                {/* رأس الحي - خلفية خضراء هادئة + مساحة أوسع */}
                                <div 
                                  className={`p-3 md:p-4 transition-all duration-300 ${isDistrictExpanded ? 'bg-emerald-100' : 'bg-emerald-50 hover:bg-emerald-100'}`}
                                >
                                  {/* الصف الأول: المعلومات والصور */}
                                  <div className="flex flex-col md:flex-row md:items-center gap-3 cursor-pointer" onClick={() => toggleDistrictExpand(districtKey)}>
                                    {/* مقبض السحب + الأيقونة والعنوان */}
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-emerald-200 rounded" title="اسحب لنقل الحي">
                                        <GripVertical className="w-4 h-4 text-emerald-600" />
                                      </div>
                                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${isDistrictExpanded ? 'bg-[#01411C]' : 'bg-emerald-600'}`}>
                                        <Building className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="font-bold text-sm md:text-base text-[#01411C]">{district.districtName}</h4>
                                          {district.isHidden && <Badge variant="outline" className="text-xs bg-white">مخفي</Badge>}
                                          <Badge className="text-xs bg-emerald-600 text-white">
                                            {districtStats.offersCount} عرض
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-emerald-700">
                                          {districtStats.totalViews.toLocaleString()} مشاهدة
                                        </p>
                                      </div>
                                    </div>

                                    {/* 4 صور معاينة */}
                                    <div className="flex items-center gap-1 mr-auto md:mr-0">
                                      {districtPreviewImages.map((img, idx) => (
                                        <div key={idx} className="w-7 h-7 md:w-8 md:h-8 rounded overflow-hidden border border-white shadow-sm shrink-0">
                                          <img src={img} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                      {district.offers.length > 4 && (
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                          +{district.offers.length - 4}
                                        </div>
                                      )}
                                    </div>

                                    {/* سهم التوسيع للديسكتوب */}
                                    <div className="hidden md:flex">
                                      {isDistrictExpanded ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5 text-emerald-700" />}
                                    </div>
                                  </div>

                                  {/* الصف الثاني: الأزرار (في الأسفل منفصلة) */}
                                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-emerald-200">
                                  {/* مؤشر المشاهدات المباشرة للحي - محسوب من مجموع عروض الحي */}
                                    <LiveViewerIndicator 
                                      liveViewers={getDistrictViewers(city.cityName, district.districtName)}
                                      size="sm"
                                    />

                                    {/* أزرار الإجراءات */}
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {/* إخفاء/إظهار */}
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); toggleDistrictVisibility(city.cityName, district.districtName); }}>
                                        {district.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        <span className="hidden md:inline mr-1">{district.isHidden ? 'إظهار' : 'إخفاء'}</span>
                                      </Button>

                                      {/* واتساب */}
                                      <Button size="sm" className="h-7 px-2 text-xs bg-green-500 text-white" onClick={(e) => { e.stopPropagation(); shareItemWhatsApp(district.districtName, `district-${districtKey}`, city.cityName, district.districtName, 'district'); }}>
                                        <MessageSquare className="w-3 h-3" />
                                      </Button>

                                      {/* نسخ الرابط */}
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); shareItemLink(district.districtName, `district-${districtKey}`, city.cityName, district.districtName, 'district'); }}>
                                        <Link className="w-3 h-3" />
                                      </Button>

                                      {/* مشاركة */}
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { 
                                        e.stopPropagation(); 
                                        const safeSlug = (platformSlug || '').trim().toLowerCase();
                                        const shareUrl = getFullUrl(buildDistrictUrl(safeSlug, city.cityName, district.districtName), window.location.origin);
                                        if (navigator.share) {
                                          navigator.share({ title: `عروض ${district.districtName} - ${city.cityName}`, url: shareUrl });
                                        } else {
                                          shareItemLink(district.districtName, `district-${districtKey}`, city.cityName, district.districtName, 'district');
                                        }
                                      }}>
                                        <Share2 className="w-3 h-3" />
                                      </Button>

                                      {/* نقل لمدينة أخرى */}
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); openMoveDialog('district', district, city.cityName); }}>
                                        <Move className="w-3 h-3" />
                                        <span className="hidden md:inline mr-1">نقل</span>
                                      </Button>

                                      {/* ✅ قائمة الثلاث نقاط للحي */}
                                      <OfferActionsMenu
                                        type="district"
                                        id={districtKey}
                                        title={district.districtName}
                                        isHidden={district.isHidden}
                                        onEdit={() => {
                                          toast.info('ميزة تعديل الحي قيد التطوير');
                                        }}
                                        onDelete={() => {
                                          // حذف جميع العروض في الحي
                                          district.offers.forEach(o => handleDeleteOffer(o, city.cityName, district.districtName));
                                          toast.success(`تم حذف جميع عروض ${district.districtName}`);
                                        }}
                                        onToggleVisibility={() => toggleDistrictVisibility(city.cityName, district.districtName)}
                                        onShare={() => shareItemWhatsApp(district.districtName, `district-${districtKey}`, city.cityName, district.districtName, 'district')}
                                        onCopyLink={() => shareItemLink(district.districtName, `district-${districtKey}`, city.cityName, district.districtName, 'district')}
                                      />

                                      {/* سهم للجوال */}
                                      <div className="md:hidden" onClick={() => toggleDistrictExpand(districtKey)}>
                                        {isDistrictExpanded ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* === المستوى الثالث: العروض (الجذر) === */}
                                {isDistrictExpanded && (
                                  <div className="p-3 md:p-4 bg-gray-50 border-t border-emerald-200 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {district.offers.map((offer) => (
                                        <Card 
                                          key={offer.id} 
                                          className={`overflow-hidden hover:shadow-lg transition-all border-2 cursor-pointer ${offer.isHidden ? 'border-gray-300 opacity-60' : 'border-transparent hover:border-[#01411C]'} bg-white`}
                                          draggable
                                          onDragStart={(e) => handleDragStartOffer(e, offer, city.cityName, district.districtName)}
                                          onDragEnd={() => setDraggedItem(null)}
                                          onClick={() => {
                                            // عند فتح العرض: نقرأ بيانات الإعلان الكاملة من التخزين لضمان نقل كل الحقول للتبويبات
                                            const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
                                            const fullAd = publishedAds.find((ad: any) => ad.id === offer.id);

                                            // إزالة النقطة الحمراء عند فتح العرض
                                            markAsViewed('published_ad', offer.id);
                                            // إزالة النقطة من المدينة إذا لم يتبقَ عروض جديدة أخرى في نفس المدينة
                                            const remainingNewOffers = allCityOffers.filter(o => o.id !== offer.id && isNew('published_ad', o.id));
                                            if (remainingNewOffers.length === 0) {
                                              markAsViewed('offer', `city_${city.cityName}`);
                                            }

                                            const images = (fullAd?.images?.length ? fullAd.images : [offer.image]).filter(Boolean);
                                            const videos = (fullAd?.videos || []).filter(Boolean);

                                            setSelectedOfferForEdit({
                                              id: offer.id,
                                              title: fullAd?.title || offer.title,
                                              price: parseInt((fullAd?.price || offer.price || '').toString().replace(/[^\d]/g, '')) || 0,
                                              propertyType: fullAd?.propertyType || offer.propertyType || 'شقة',
                                              area: offer.area,
                                              bedrooms: offer.bedrooms,
                                              bathrooms: offer.bathrooms,
                                              image: images[0] || offer.image,
                                              imageCount: images.length || 1,
                                              city: fullAd?.locationDetails?.city || city.cityName,
                                              district: fullAd?.locationDetails?.district || district.districtName,
                                              description: fullAd?.aiDescription || '',
                                              ownerName: fullAd?.ownerName || offer.ownerName || '',
                                              ownerPhone: fullAd?.ownerPhone || offer.owner?.phone || '',
                                              ownerEmail: fullAd?.ownerEmail || '',
                                              ownerBirthDate: fullAd?.ownerBirthDate || offer.ownerBirthDate || '',
                                              ownerCity: fullAd?.ownerCity || offer.ownerCity || '',
                                              ownerDistrict: fullAd?.ownerDistrict || offer.ownerDistrict || '',
                                              ownerIdNumber: fullAd?.ownerIdNumber || offer.ownerIdNumber || '',
                                              ownerNationalAddress: fullAd?.ownerNationalAddress || offer.ownerNationalAddress || '',
                                              deedNumber: fullAd?.deedNumber || offer.deedNumber || '',
                                              deedDate: fullAd?.deedDate || offer.deedDate || '',
                                              deedCity: fullAd?.deedCity || offer.deedCity || '',
                                              contractDuration: fullAd?.contractDuration || offer.contractDuration,
                                              contractStartDate: fullAd?.contractStartDate || offer.contractStartDate || '',
                                              contractEndDate: fullAd?.contractEndDate || offer.contractEndDate || '',
                                              isCurrentlyRented: fullAd?.isCurrentlyRented ?? offer.isCurrentlyRented ?? false,
                                              images,
                                              videos,
                                              tour3DUrl: fullAd?.tour3DUrl || offer.tour3DUrl || '',
                                              linkedCustomerId: fullAd?.linkedCustomerId || offer.linkedCustomerId || undefined,
                                            });
                                            setShowEditPage(true);
                                          }}
                                        >
                                          {/* صورة العرض */}
                                          <div className="relative h-32 md:h-36">
                                            {/* مقبض السحب */}
                                            <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 bg-white/80 rounded shadow" title="اسحب لنقل العرض">
                                              <GripVertical className="w-4 h-4 text-gray-600" />
                                            </div>
                                            {/* النقطة الحمراء للعرض الجديد */}
                                            {isNew('published_ad', offer.id) && (
                                              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
                                                <PulsingDot show={true} size="md" position="top-right" className="relative" />
                                              </div>
                                            )}
                                            <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                                            <Badge className={`absolute top-2 right-2 ${offer.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                              <span className={`w-2 h-2 rounded-full ml-1 ${offer.status === 'published' ? 'bg-white animate-pulse' : 'bg-white'}`} />
                                              {offer.status === 'published' ? 'منشور' : 'مسودة'}
                                            </Badge>
                                            {offer.isHidden && (
                                              <Badge className="absolute bottom-2 left-2 bg-gray-500 text-white text-xs">مخفي</Badge>
                                            )}
                                            {/* مؤشر المشاهدات المباشرة */}
                                            <div className="absolute bottom-2 right-2">
                                              <LiveViewerIndicator 
                                                liveViewers={getOfferViewers(offer.id)}
                                                size="sm"
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* محتوى الكارت */}
                                          <CardContent className="p-3">
                                            <h5 className="font-bold text-[#01411C] line-clamp-1 text-sm md:text-base">{offer.title}</h5>
                                            {/* الموقع: المدينة - الحي */}
                                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                              <MapPin className="w-3 h-3 text-[#01411C]" />
                                              <span>{city.cityName}</span>
                                              {district.districtName && (
                                                <span className="text-gray-400"> - {district.districtName}</span>
                                              )}
                                            </p>
                                            {/* الوصف المختصر */}
                                            {offer.description && (
                                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.description}</p>
                                            )}
                                            <p className="text-[#D4AF37] font-bold text-sm mt-1">{offer.price}</p>
                                            {/* اسم المالك */}
                                            {offer.ownerName && (
                                              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {offer.ownerName}
                                              </p>
                                            )}
                                            <div className="flex items-center gap-2 md:gap-4 text-xs text-gray-500 mt-2 flex-wrap">
                                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{offer.views.toLocaleString()}</span>
                                              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{offer.requests}</span>
                                              {offer.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{offer.bedrooms}</span>}
                                              {offer.area && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{offer.area}م²</span>}
                                            </div>
                                            
                                            {/* أزرار الإجراءات (في الأسفل منفصلة) */}
                                            <div className="flex items-center gap-1 mt-3 pt-3 border-t flex-wrap">
                                              {/* إخفاء/إظهار */}
                                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs flex-1 min-w-0" onClick={() => toggleOfferVisibility(city.cityName, district.districtName, offer.id)}>
                                                {offer.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                              </Button>
                                              {/* واتساب */}
                                              <Button size="sm" className="h-7 px-2 text-xs bg-green-500 text-white flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); shareItemWhatsApp(offer.title, offer.id, city.cityName, district.districtName, 'offer'); }}>
                                                <MessageSquare className="w-3 h-3" />
                                              </Button>
                                              {/* PDF */}
                                              <Button size="sm" className="h-7 px-2 text-xs bg-red-500 text-white flex-1 min-w-0" onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setSelectedOfferForPdf({ offer, cityName: city.cityName, districtName: district.districtName });
                                                setShowOfferPdfOptionsDialog(true);
                                              }}>
                                                <FileDown className="w-3 h-3" />
                                              </Button>
                                              {/* رابط */}
                                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs flex-1 min-w-0" onClick={() => shareItemLink(offer.title, offer.id, city.cityName, district.districtName, 'offer')}>
                                                <Link className="w-3 h-3" />
                                              </Button>
                                              {/* ✅ قائمة الثلاث نقاط للعرض */}
                                              <OfferActionsMenu
                                                type="offer"
                                                id={offer.id}
                                                title={offer.title}
                                                isHidden={offer.isHidden}
                                                onEdit={() => {
                                                  // فتح صفحة التعديل
                                                  const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
                                                  const fullAd = publishedAds.find((ad: any) => ad.id === offer.id);
                                                  const images = (fullAd?.images?.length ? fullAd.images : [offer.image]).filter(Boolean);
                                                  const videos = (fullAd?.videos || []).filter(Boolean);
                                                  setSelectedOfferForEdit({
                                                    id: offer.id,
                                                    title: fullAd?.title || offer.title,
                                                    price: parseInt((fullAd?.price || offer.price || '').toString().replace(/[^\d]/g, '')) || 0,
                                                    propertyType: fullAd?.propertyType || offer.propertyType || 'شقة',
                                                    area: offer.area,
                                                    bedrooms: offer.bedrooms,
                                                    bathrooms: offer.bathrooms,
                                                    image: images[0] || offer.image,
                                                    imageCount: images.length || 1,
                                                    city: fullAd?.locationDetails?.city || city.cityName,
                                                    district: fullAd?.locationDetails?.district || district.districtName,
                                                    description: fullAd?.aiDescription || '',
                                                    ownerName: fullAd?.ownerName || offer.ownerName || '',
                                                    ownerPhone: fullAd?.ownerPhone || offer.owner?.phone || '',
                                                    images,
                                                    videos,
                                                  });
                                                  setShowEditPage(true);
                                                }}
                                                onDelete={() => handleDeleteOffer(offer, city.cityName, district.districtName)}
                                                onToggleVisibility={() => toggleOfferVisibility(city.cityName, district.districtName, offer.id)}
                                                onShare={() => shareItemWhatsApp(offer.title, offer.id, city.cityName, district.districtName, 'offer')}
                                                onCopyLink={() => shareItemLink(offer.title, offer.id, city.cityName, district.districtName, 'offer')}
                                              />
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              {cityHierarchy.length === 0 && (
                <Card className="p-12 text-center">
                  <Building className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-xl text-gray-500">لا توجد عروض</p>
                  <Button className="mt-4 bg-[#01411C] text-white" onClick={() => setShowPublishDialog(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    أضف عرض جديد
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: الطلبات */}
          <TabsContent value="requests" className="space-y-4">
            {/* زر إنشاء طلب جديد */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#01411C]">الطلبات المنشورة</h3>
              <Button 
                onClick={() => setShowCreateRequestForm(true)}
                className="bg-[#01411C] hover:bg-[#065f41] text-white"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء طلب
              </Button>
            </div>

            {publishedRequests.length === 0 && requests.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-500 mb-2">لا توجد طلبات</h3>
                <p className="text-gray-400 mb-4">قم بإنشاء طلب جديد ليظهر هنا</p>
                <Button 
                  onClick={() => setShowCreateRequestForm(true)}
                  className="bg-[#01411C] hover:bg-[#065f41] text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء طلب جديد
                </Button>
              </Card>
            ) : (
              <>
                {/* الطلبات المنشورة من النموذج الجديد */}
                {publishedRequests.map((req: any) => {
                  // التحقق من حالة الجديد
                  const newRequestIds = JSON.parse(localStorage.getItem('new_request_ids') || '[]');
                  const isNewRequest = newRequestIds.includes(req.id);
                  
                  const handleRequestClick = () => {
                    // إزالة من قائمة الجديد
                    const updatedIds = newRequestIds.filter((id: string) => id !== req.id);
                    localStorage.setItem('new_request_ids', JSON.stringify(updatedIds));
                    window.dispatchEvent(new CustomEvent('requestViewed', { detail: req.id }));
                  };
                  
                  return (
                    <Card 
                      key={req.id} 
                      className="border-2 border-blue-200 bg-blue-50/50 relative cursor-pointer"
                      onClick={handleRequestClick}
                    >
                      {/* نقطة حمراء نابضة للطلبات الجديدة */}
                      <PulsingDot show={isNewRequest} size="md" position="top-right" className="m-2" />
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-[#01411C]">
                                طلب {req.purpose} - {req.propertyType}
                              </h3>
                              <Badge className={req.status === 'fulfilled' ? 'bg-green-500' : 'bg-blue-500'}>
                                {req.status === 'fulfilled' ? 'تم التوفير' : 'منشور'}
                              </Badge>
                              {isNewRequest && (
                                <Badge className="bg-red-500 text-white animate-pulse">جديد</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">{req.ownerName}</span> - {req.ownerPhone}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {req.propertyType}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {req.preferredCity} {req.preferredDistricts && `- ${req.preferredDistricts}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {req.minBudget ? parseInt(req.minBudget).toLocaleString() : '-'} - {req.maxBudget ? parseInt(req.maxBudget).toLocaleString() : '-'} ريال
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {/* زر التعديل */}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-amber-500 text-amber-600 hover:bg-amber-50" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditingRequest(req);
                                setShowEditRequestDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {/* زر الحذف */}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setRequestToDelete(req);
                                setShowDeleteRequestConfirm(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-green-500 text-white" onClick={(e) => { e.stopPropagation(); handleWhatsApp(req.ownerPhone, `طلب ${req.purpose} - ${req.propertyType}`); }}>
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-blue-500 text-white" onClick={(e) => { e.stopPropagation(); handleCall(req.ownerPhone); }}>
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-red-500 text-white" onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedRequestForPdf(req);
                              setShowRequestPdfOptionsDialog(true);
                            }}>
                              <FileDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* الطلبات القديمة */}
                {requests.map(request => (
                  <Card key={request.id} className="border-2 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#01411C]">{request.title}</h3>
                            <Badge 
                              className={
                                request.status === 'new' ? 'bg-blue-500' :
                                request.status === 'inProgress' ? 'bg-yellow-500' :
                                request.status === 'matched' ? 'bg-green-500' : 'bg-gray-500'
                              }
                            >
                              {request.status === 'new' ? 'جديد' :
                               request.status === 'inProgress' ? 'قيد المعالجة' :
                               request.status === 'matched' ? 'تم المطابقة' : 'مغلق'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">{request.customerName}</span> - {request.customerPhone}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {request.propertyType}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {request.city} {request.district && `- ${request.district}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {request.budget.min.toLocaleString()} - {request.budget.max.toLocaleString()} ريال
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-500 text-white" onClick={() => handleWhatsApp(request.customerPhone, request.title)}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="bg-blue-500 text-white" onClick={() => handleCall(request.customerPhone)}>
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="bg-red-500 text-white" onClick={() => { 
                            // تحويل الطلب القديم لصيغة متوافقة مع النافذة
                            setSelectedRequestForPdf({
                              id: request.id,
                              purpose: request.purpose || 'شراء',
                              propertyType: request.propertyType,
                              preferredCity: request.city,
                              preferredDistricts: request.district || '',
                              minBudget: request.budget?.min?.toString(),
                              maxBudget: request.budget?.max?.toString(),
                              ownerName: request.customerName,
                              ownerPhone: request.customerPhone,
                              createdAt: typeof request.createdAt === 'string' ? request.createdAt : request.createdAt?.toISOString?.() || new Date().toISOString(),
                            });
                            setShowRequestPdfOptionsDialog(true);
                          }}>
                            <FileDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#01411C]" />
              مشاركة العرض
            </DialogTitle>
          </DialogHeader>
          
          {selectedOfferForShare && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <img 
                  src={selectedOfferForShare.images[0] || 'https://via.placeholder.com/80x60'} 
                  alt={selectedOfferForShare.title}
                  className="w-16 h-12 rounded object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm">{selectedOfferForShare.title}</h4>
                  <p className="text-xs text-gray-500">{selectedOfferForShare.location}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">رابط المشاركة</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={`${platformUrl}/offers/${selectedOfferForShare.id}`}
                    className="text-sm"
                  />
                  <Button onClick={copyShareLink} variant="outline">
                    {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Label className="text-sm font-medium">رمز QR للمشاركة السريعة</Label>
                <div className="mt-2 bg-white p-4 rounded-lg border inline-block">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${platformUrl}/offers/${selectedOfferForShare.id}`)}&color=01411C`}
                    alt="QR Code"
                    className="w-36 h-36 mx-auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button className="flex-col h-auto py-3 bg-green-500 hover:bg-green-600" onClick={shareViaWhatsApp}>
                  <MessageSquare className="w-5 h-5 mb-1" />
                  <span className="text-xs">واتساب</span>
                </Button>
                <Button className="flex-col h-auto py-3 bg-blue-500 hover:bg-blue-600" onClick={shareViaEmail}>
                  <Mail className="w-5 h-5 mb-1" />
                  <span className="text-xs">إيميل</span>
                </Button>
                <Button className="flex-col h-auto py-3 bg-purple-500 hover:bg-purple-600" onClick={copyShareLink}>
                  <Link className="w-5 h-5 mb-1" />
                  <span className="text-xs">نسخ</span>
                </Button>
                <Button className="flex-col h-auto py-3 bg-gray-700 hover:bg-gray-800" onClick={() => {
                  const shareUrl = `${platformUrl}/offers/${selectedOfferForShare.id}`;
                  window.location.href = `sms:?body=${encodeURIComponent(`${selectedOfferForShare.title}\n${shareUrl}`)}`;
                }}>
                  <Phone className="w-5 h-5 mb-1" />
                  <span className="text-xs">رسالة</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Dialog - صفحة كاملة في الجوال */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent 
          className="w-full h-[100dvh] max-w-full md:max-w-4xl md:h-auto md:max-h-[95vh] overflow-hidden p-0 m-0 md:m-auto rounded-none md:rounded-lg fixed inset-0 translate-x-0 translate-y-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex flex-col" 
          dir="rtl"
        >
          {/* مطلوب للوصولية (Radix): عنوان مخفي */}
          <DialogHeader className="sr-only">
            <DialogTitle>نشر إعلان جديد</DialogTitle>
          </DialogHeader>

          {/* Header مخصص للجوال */}
          <div className="shrink-0 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-3 md:p-4 md:bg-white md:text-[#01411C] md:border-b">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPublishDialog(false)}
                className="text-white md:text-gray-600 hover:bg-white/20 md:hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D4AF37] md:text-[#01411C]" />
                نشر إعلان جديد
              </h2>
              <div className="w-9" /> {/* spacer */}
            </div>
          </div>
          
          {/* المحتوى - يأخذ كل المساحة المتبقية */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <PropertyPublishForm
              onPublish={(data) => {
                toast.success('تم نشر العقار بنجاح');
                setShowPublishDialog(false);
              }}
              onCancel={() => setShowPublishDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Dialog - نقل العقار/الحي (محسّن مع خيارات متعددة) */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="w-5 h-5 text-[#01411C]" />
              نقل {itemToMove?.type === 'district' ? 'الحي' : 'العرض'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* العنصر المحدد */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-gray-600">العنصر المحدد:</Label>
              <p className="font-bold text-[#01411C] mt-1">
                {itemToMove?.type === 'district' ? itemToMove?.data?.districtName : itemToMove?.data?.title}
              </p>
              <p className="text-xs text-gray-500">من: {itemToMove?.sourceCity}{itemToMove?.sourceDistrict ? ` - ${itemToMove?.sourceDistrict}` : ''}</p>
            </div>

            {/* اختيار نوع النقل */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={moveType === 'existing' ? 'default' : 'outline'}
                className={moveType === 'existing' ? 'bg-[#01411C] text-white' : ''}
                onClick={() => setMoveType('existing')}
              >
                <MapPin className="w-4 h-4 ml-2" />
                موقع موجود
              </Button>
              <Button
                variant={moveType === 'new' ? 'default' : 'outline'}
                className={moveType === 'new' ? 'bg-[#D4AF37] text-[#01411C]' : ''}
                onClick={() => setMoveType('new')}
              >
                <PlusCircle className="w-4 h-4 ml-2" />
                موقع جديد
              </Button>
            </div>

            {moveType === 'existing' ? (
              <>
                {/* اختر المدينة */}
                <div>
                  <Label className="text-sm font-medium">المدينة:</Label>
                  <Select value={targetCityForMove} onValueChange={(v) => { setTargetCityForMove(v); setTargetDistrictForMove(''); }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر المدينة..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {cityHierarchy.map(c => (
                        <SelectItem key={c.cityName} value={c.cityName}>{c.cityName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* اختر الحي (للعروض فقط) */}
                {itemToMove?.type === 'offer' && targetCityForMove && (
                  <div>
                    <Label className="text-sm font-medium">الحي (اختياري):</Label>
                    <Select value={targetDistrictForMove} onValueChange={setTargetDistrictForMove}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر الحي أو اتركه فارغاً للنقل المباشر..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="">-- نقل مباشر للمدينة --</SelectItem>
                        {cityHierarchy
                          .find(c => c.cityName === targetCityForMove)
                          ?.districts.map(d => (
                            <SelectItem key={d.districtName} value={d.districtName}>{d.districtName}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* إنشاء موقع جديد */}
                <div>
                  <Label className="text-sm font-medium">اسم المدينة الجديدة (أو اتركه فارغاً للمدينة الحالية):</Label>
                  <Input
                    placeholder="مثال: مكة المكرمة"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">اسم الحي الجديد:</Label>
                  <Input
                    placeholder="مثال: حي العزيزية"
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                  💡 يمكنك إنشاء مدينة جديدة أو حي جديد أو كليهما. إذا تركت المدينة فارغة سيتم النقل للحي الجديد ضمن نفس المدينة.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>إلغاء</Button>
            <Button 
              className="bg-[#01411C] text-white" 
              onClick={confirmMove}
              disabled={moveType === 'existing' ? !targetCityForMove : (!newCityName && !newDistrictName)}
            >
              <Move className="w-4 h-4 ml-2" />
              نقل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* صفحة تعديل العرض */}
      {selectedOfferForEdit && (
        <OfferEditPage
          listing={selectedOfferForEdit}
          isOpen={showEditPage}
          onClose={() => {
            setShowEditPage(false);
            setSelectedOfferForEdit(null);
          }}
          onSave={async (updatedListing) => {
            try {
              // التحقق إذا كان الـ ID هو UUID صالح (موجود في قاعدة البيانات)
              const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(updatedListing.id);
              
              if (!isValidUUID) {
                // العرض محلي وليس في قاعدة البيانات
                toast.error('هذا العرض محلي فقط. يجب نشره أولاً من صفحة "نشر إعلان" لحفظ التعديلات.');
                setShowEditPage(false);
                setSelectedOfferForEdit(null);
                return;
              }
              
              // حفظ التعديلات في قاعدة البيانات
              await updateListing(updatedListing.id, {
                title: updatedListing.title,
                price: updatedListing.price,
                description: updatedListing.description,
                city: updatedListing.city,
                district: updatedListing.district,
                street: updatedListing.street,
                area: updatedListing.area,
                bedrooms: updatedListing.bedrooms,
                bathrooms: updatedListing.bathrooms,
                tour3DUrl: updatedListing.tour3DUrl,
                adLicense: updatedListing.adLicense,
                ownerName: updatedListing.ownerName,
                ownerPhone: updatedListing.ownerPhone,
                ownerIdNumber: updatedListing.ownerIdNumber,
                ownerBirthDate: updatedListing.ownerBirthDate,
                ownerNationalAddress: updatedListing.ownerNationalAddress,
                ownerCity: updatedListing.ownerCity,
                ownerDistrict: updatedListing.ownerDistrict,
                deedNumber: updatedListing.deedNumber,
                deedDate: updatedListing.deedDate,
                deedCity: updatedListing.deedCity,
                contractDuration: updatedListing.contractDuration,
                contractStartDate: updatedListing.contractStartDate,
                contractEndDate: updatedListing.contractEndDate,
                isCurrentlyRented: updatedListing.isCurrentlyRented,
                rentalContractFile: updatedListing.rentalContractFile,
              });
              toast.success('تم حفظ التعديلات بنجاح');
            } catch (error) {
              console.error('Error saving listing:', error);
              toast.error('فشل في حفظ التعديلات');
            }
            setShowEditPage(false);
            setSelectedOfferForEdit(null);
          }}
        />
      )}

      {/* تقرير PDF */}
      <OffersStatsPDFReport
        open={showPDFReport}
        onOpenChange={setShowPDFReport}
        statsData={{
          currentViews: viewStats.current,
          monthlyViews: viewStats.thisMonth,
          yearlyViews: viewStats.thisYear,
          totalInteractions: viewStats.totalInteractions,
          history: viewStats.history,
          offers: getAllOffersFlat().map(o => ({
            id: o.id,
            title: o.title,
            views: o.views,
            monthlyViews: Math.floor(o.views * 0.4),
            yearlyViews: o.views,
            interactions: o.requests || 0,
          })),
        }}
      />

      {/* نموذج إنشاء طلب جديد */}
      <CreateRequestForm
        isOpen={showCreateRequestForm}
        onClose={() => setShowCreateRequestForm(false)}
        onSuccess={(request) => {
          // تحديث قائمة الطلبات المنشورة
          setPublishedRequests(prev => [...prev, request]);
          setShowCreateRequestForm(false);
        }}
        user={user}
        brokerData={{
          name: businessCardData?.userName,
          company: businessCardData?.companyName,
          profileImage: businessCardData?.profileImage,
          coverImage: businessCardData?.coverImage,
          logoImage: businessCardData?.logoImage,
          phone: user?.phone,
        }}
      />

      {/* نافذة تعديل الطلب */}
      <Dialog open={showEditRequestDialog} onOpenChange={setShowEditRequestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <Edit className="w-5 h-5" />
              تعديل الطلب
            </DialogTitle>
          </DialogHeader>
          
          {editingRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم العميل</Label>
                  <Input
                    value={editingRequest.ownerName || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, ownerName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>رقم الجوال</Label>
                  <Input
                    value={editingRequest.ownerPhone || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, ownerPhone: e.target.value })}
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع العقار</Label>
                  <Select
                    value={editingRequest.propertyType || ''}
                    onValueChange={(value) => setEditingRequest({ ...editingRequest, propertyType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر نوع العقار" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الغرض</Label>
                  <Select
                    value={editingRequest.purpose || ''}
                    onValueChange={(value) => setEditingRequest({ ...editingRequest, purpose: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر الغرض" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شراء">شراء</SelectItem>
                      <SelectItem value="إيجار">إيجار</SelectItem>
                      <SelectItem value="للشراء">للشراء</SelectItem>
                      <SelectItem value="للإيجار">للإيجار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المدينة المفضلة</Label>
                  <Select
                    value={editingRequest.preferredCity || ''}
                    onValueChange={(value) => setEditingRequest({ ...editingRequest, preferredCity: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الأحياء المفضلة</Label>
                  <Input
                    value={editingRequest.preferredDistricts || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, preferredDistricts: e.target.value })}
                    className="mt-1"
                    placeholder="مثال: حي الملقا، حي النرجس"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الميزانية الدنيا</Label>
                  <Input
                    type="number"
                    value={editingRequest.minBudget || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, minBudget: e.target.value })}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>الميزانية القصوى</Label>
                  <Input
                    type="number"
                    value={editingRequest.maxBudget || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, maxBudget: e.target.value })}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>عدد الغرف</Label>
                  <Input
                    type="number"
                    value={editingRequest.bedrooms || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, bedrooms: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>عدد الحمامات</Label>
                  <Input
                    type="number"
                    value={editingRequest.bathrooms || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, bathrooms: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>التأثيث</Label>
                  <Select
                    value={editingRequest.furnishing || ''}
                    onValueChange={(value) => setEditingRequest({ ...editingRequest, furnishing: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مفروش">مفروش</SelectItem>
                      <SelectItem value="غير مفروش">غير مفروش</SelectItem>
                      <SelectItem value="شبه مفروش">شبه مفروش</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المساحة الدنيا (م²)</Label>
                  <Input
                    type="number"
                    value={editingRequest.minArea || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, minArea: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>المساحة القصوى (م²)</Label>
                  <Input
                    type="number"
                    value={editingRequest.maxArea || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, maxArea: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>متطلبات إضافية</Label>
                <Textarea
                  value={editingRequest.additionalRequirements || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, additionalRequirements: e.target.value })}
                  className="mt-1"
                  rows={3}
                  placeholder="أي متطلبات أخرى..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowEditRequestDialog(false);
              setEditingRequest(null);
            }}>
              إلغاء
            </Button>
            <Button 
              className="bg-[#01411C] text-white hover:bg-[#065f41]"
              onClick={() => {
                if (!editingRequest) return;
                
                // تحديث الطلب في localStorage
                const updatedRequests = publishedRequests.map(req => 
                  req.id === editingRequest.id ? { ...editingRequest, updatedAt: new Date().toISOString() } : req
                );
                
                setPublishedRequests(updatedRequests);
                localStorage.setItem('wasata_published_requests', JSON.stringify(updatedRequests));
                
                toast.success('تم تحديث الطلب بنجاح');
                setShowEditRequestDialog(false);
                setEditingRequest(null);
                
                // إرسال حدث لتحديث الواجهة
                window.dispatchEvent(new CustomEvent('requestUpdated'));
              }}
            >
              <Check className="w-4 h-4 ml-2" />
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد حذف الطلب */}
      <Dialog open={showDeleteRequestConfirm} onOpenChange={setShowDeleteRequestConfirm}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              تأكيد حذف الطلب
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              هل أنت متأكد من حذف هذا الطلب نهائياً؟
            </p>
            {requestToDelete && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="font-bold text-[#01411C]">
                  طلب {requestToDelete.purpose} - {requestToDelete.propertyType}
                </p>
                <p className="text-sm text-gray-600">
                  {requestToDelete.ownerName} - {requestToDelete.preferredCity}
                </p>
              </div>
            )}
            <p className="text-sm text-red-500 mt-3">
              ⚠️ لا يمكن التراجع عن هذا الإجراء
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowDeleteRequestConfirm(false);
              setRequestToDelete(null);
            }}>
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (!requestToDelete) return;
                
                // حذف الطلب من localStorage
                const updatedRequests = publishedRequests.filter(req => req.id !== requestToDelete.id);
                
                setPublishedRequests(updatedRequests);
                localStorage.setItem('wasata_published_requests', JSON.stringify(updatedRequests));
                
                // إزالة من قائمة الجديد أيضاً
                const newRequestIds = JSON.parse(localStorage.getItem('new_request_ids') || '[]');
                const updatedNewIds = newRequestIds.filter((id: string) => id !== requestToDelete.id);
                localStorage.setItem('new_request_ids', JSON.stringify(updatedNewIds));
                
                toast.success('تم حذف الطلب بنجاح');
                setShowDeleteRequestConfirm(false);
                setRequestToDelete(null);
                
                // إرسال حدث لتحديث الواجهة
                window.dispatchEvent(new CustomEvent('requestDeleted'));
              }}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ نافذة خيارات PDF للعروض */}
      <Dialog open={showOfferPdfOptionsDialog} onOpenChange={setShowOfferPdfOptionsDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <FileDown className="w-5 h-5" />
              خيارات تحميل PDF للعرض
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={offerPdfOptions.includeOwner}
                  onChange={(e) => setOfferPdfOptions({ ...offerPdfOptions, includeOwner: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">معلومات المالك</span>
                  <p className="text-xs text-gray-500">الاسم، الهاتف، رقم الهوية، تاريخ الميلاد</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={offerPdfOptions.includeDeed}
                  onChange={(e) => setOfferPdfOptions({ ...offerPdfOptions, includeDeed: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">معلومات الصك</span>
                  <p className="text-xs text-gray-500">رقم الصك، تاريخه، مدينة الإصدار</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={offerPdfOptions.includeProperty}
                  onChange={(e) => setOfferPdfOptions({ ...offerPdfOptions, includeProperty: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">تفاصيل العقار</span>
                  <p className="text-xs text-gray-500">النوع، المساحة، الغرف، السعر، المميزات</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={offerPdfOptions.includeDescription}
                  onChange={(e) => setOfferPdfOptions({ ...offerPdfOptions, includeDescription: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">الوصف</span>
                  <p className="text-xs text-gray-500">الوصف التفصيلي للعقار</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={offerPdfOptions.includeImages}
                  onChange={(e) => setOfferPdfOptions({ ...offerPdfOptions, includeImages: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">الصور</span>
                  <p className="text-xs text-gray-500">صور العقار ورابط الجولة الافتراضية</p>
                </div>
              </label>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowOfferPdfOptionsDialog(false);
              setSelectedOfferForPdf(null);
            }}>
              إلغاء
            </Button>
            <Button 
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                if (!selectedOfferForPdf) return;
                
                const { offer, cityName, districtName } = selectedOfferForPdf;
                toast.info('جاري إنشاء ملف PDF...');
                
                try {
                  const category = offer.title?.includes('للإيجار') ? 'للإيجار' : 'للبيع';
                  
                  const brokerData = businessCardData ? {
                    name: businessCardData.userName,
                    company: businessCardData.companyName,
                    phone: user?.phone || '',
                    location: cityName,
                    profileImage: businessCardData.profileImage,
                    coverImage: businessCardData.coverImage,
                    logoImage: businessCardData.logoImage,
                  } : undefined;
                  
                  const offerUrl = currentSlug && cityName && districtName
                    ? getFullUrl(`/${currentSlug}/${cityName}/${districtName}/${offer.id}`)
                    : '';

                  await generatePropertyPDF(
                    {
                      id: offer.id,
                      slug: currentSlug,
                      title: offer.title,
                      category,
                      propertyType: offerPdfOptions.includeProperty ? offer.propertyType : undefined,
                      price: offerPdfOptions.includeProperty ? offer.price : undefined,
                      area: offerPdfOptions.includeProperty ? offer.area?.toString() : undefined,
                      bedrooms: offerPdfOptions.includeProperty ? offer.bedrooms?.toString() : undefined,
                      bathrooms: offerPdfOptions.includeProperty ? offer.bathrooms?.toString() : undefined,
                      ownerName: offerPdfOptions.includeOwner ? (offer.ownerName ?? offer.owner?.name) : undefined,
                      ownerPhone: offerPdfOptions.includeOwner ? offer.owner?.phone : undefined,
                      ownerIdNumber: offerPdfOptions.includeOwner ? offer.ownerIdNumber : undefined,
                      ownerBirthDate: offerPdfOptions.includeOwner ? offer.ownerBirthDate : undefined,
                      deedNumber: offerPdfOptions.includeDeed ? offer.deedNumber : undefined,
                      deedDate: offerPdfOptions.includeDeed ? offer.deedDate : undefined,
                      deedCity: offerPdfOptions.includeDeed ? offer.deedCity : undefined,
                      brokerPhone: user?.phone || businessCardData?.userName,
                      image: offerPdfOptions.includeImages ? offer.image : undefined,
                      images: offerPdfOptions.includeImages && offer.images && offer.images.length > 0 ? offer.images : undefined,
                      locationDetails: {
                        city: cityName,
                        district: districtName,
                      },
                      aiDescription: offerPdfOptions.includeDescription ? offer.description : undefined,
                      tour3dUrl: offerPdfOptions.includeImages ? offer.tour3DUrl : undefined,
                      offerUrl,
                    },
                    offerPdfOptions.includeOwner,
                    brokerData
                  );

                  toast.success('تم تحميل PDF بنجاح');
                  setShowOfferPdfOptionsDialog(false);
                  setSelectedOfferForPdf(null);
                } catch (error) {
                  console.error('exportOfferToPDF error:', error);
                  toast.error('تعذر إنشاء PDF');
                }
              }}
            >
              <FileDown className="w-4 h-4 ml-2" />
              تحميل PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ نافذة خيارات PDF للطلبات */}
      <Dialog open={showRequestPdfOptionsDialog} onOpenChange={setShowRequestPdfOptionsDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01411C]">
              <FileDown className="w-5 h-5" />
              خيارات تحميل PDF للطلب
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={requestPdfOptions.includeOwner}
                  onChange={(e) => setRequestPdfOptions({ ...requestPdfOptions, includeOwner: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">معلومات العميل</span>
                  <p className="text-xs text-gray-500">الاسم، الهاتف، البيانات الشخصية</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={requestPdfOptions.includeFeatures}
                  onChange={(e) => setRequestPdfOptions({ ...requestPdfOptions, includeFeatures: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">المواصفات المطلوبة</span>
                  <p className="text-xs text-gray-500">نوع العقار، الغرف، المساحة، الميزات</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={requestPdfOptions.includeBudget}
                  onChange={(e) => setRequestPdfOptions({ ...requestPdfOptions, includeBudget: e.target.checked })}
                  className="w-5 h-5 accent-[#01411C]"
                />
                <div>
                  <span className="font-medium">الميزانية</span>
                  <p className="text-xs text-gray-500">الحد الأدنى والأقصى للميزانية</p>
                </div>
              </label>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowRequestPdfOptionsDialog(false);
              setSelectedRequestForPdf(null);
            }}>
              إلغاء
            </Button>
            <Button 
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                if (!selectedRequestForPdf) return;
                
                const req = selectedRequestForPdf;
                toast.info('جاري إنشاء ملف PDF...');
                
                try {
                  const { generateRequestPDF } = await import('@/utils/generateRequestPDF');
                  let brokerData: any = undefined;
                  try {
                    const businessCard = JSON.parse(localStorage.getItem('business_card_data') || '{}');
                    if (businessCard) {
                      brokerData = {
                        name: businessCard.userName || businessCard.name,
                        company: businessCard.companyName,
                        phone: businessCard.primaryPhone || businessCard.phone,
                        location: req.preferredCity,
                        licenseNumber: businessCard.falLicense,
                        profileImage: businessCard.profileImage,
                        coverImage: businessCard.coverImage,
                        logoImage: businessCard.logoImage,
                      };
                    }
                  } catch {}
                  
                  await generateRequestPDF({
                    id: req.id,
                    purpose: req.purpose,
                    propertyType: requestPdfOptions.includeFeatures ? req.propertyType : undefined,
                    preferredCity: req.preferredCity,
                    preferredDistricts: Array.isArray(req.preferredDistricts) ? req.preferredDistricts.join('، ') : req.preferredDistricts,
                    minBudget: requestPdfOptions.includeBudget ? req.minBudget : undefined,
                    maxBudget: requestPdfOptions.includeBudget ? req.maxBudget : undefined,
                    bedrooms: requestPdfOptions.includeFeatures ? req.bedrooms : undefined,
                    bathrooms: requestPdfOptions.includeFeatures ? req.bathrooms : undefined,
                    minArea: requestPdfOptions.includeFeatures ? req.minArea : undefined,
                    maxArea: requestPdfOptions.includeFeatures ? req.maxArea : undefined,
                    furnishing: requestPdfOptions.includeFeatures ? req.furnishing : undefined,
                    additionalRequirements: requestPdfOptions.includeFeatures ? req.additionalRequirements : undefined,
                    ownerName: requestPdfOptions.includeOwner ? req.ownerName : undefined,
                    ownerPhone: requestPdfOptions.includeOwner ? req.ownerPhone : undefined,
                    ownerIdNumber: requestPdfOptions.includeOwner ? req.ownerIdNumber : undefined,
                    ownerBirthDate: requestPdfOptions.includeOwner ? req.ownerBirthDate : undefined,
                    ownerCity: requestPdfOptions.includeOwner ? req.ownerCity : undefined,
                    ownerDistrict: requestPdfOptions.includeOwner ? req.ownerDistrict : undefined,
                    createdAt: req.createdAt,
                  }, requestPdfOptions.includeOwner, brokerData);
                  
                  toast.success('تم تحميل ملف PDF');
                  setShowRequestPdfOptionsDialog(false);
                  setSelectedRequestForPdf(null);
                } catch (e) {
                  console.error('PDF error', e);
                  toast.error('تعذر إنشاء PDF');
                }
              }}
            >
              <FileDown className="w-4 h-4 ml-2" />
              تحميل PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ صفحة المحذوفات */}
      {showDeletedOffersPage && (
        <div className="fixed inset-0 z-50 bg-white">
          <DeletedOffersPage
            onBack={() => setShowDeletedOffersPage(false)}
            onRestore={handleRestoreOffer}
          />
        </div>
      )}
    </div>
  );
}
