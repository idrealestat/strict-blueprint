/**
 * MyPlatformComplete.tsx
 * منصتي - النسخة الكاملة مع 4 تبويبات + نظام العروض الهرمي
 * حسب البرومبت الأصلي: منصتي / العروض / الطلبات / نشر عقار
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePulsingDot, markAsViewed, isNew } from "@/hooks/usePublishedAdsManager";
import PulsingDot from "@/components/ui/PulsingDot";
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
import OfferEditPage from "./OfferEditPage";
import { 
  CollapsibleStatsSection, 
  CollapsibleNotificationSettings, 
  SmartAlertsPanel 
} from "@/components/offers";
import { useOfferViewNotifications } from "@/hooks/useOfferViewNotifications";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { syncPlatformCompleteFromPublishedAds } from "@/utils/platformStorage";
import { OffersStatsPDFReport, OffersPerformanceComparison } from "@/components/analytics";

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
  price: string;
  image: string;
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
const mockCityHierarchy: CityLevel[] = [
  {
    cityName: 'جدة',
    isExpanded: false,
    isHidden: false,
    liveViewers: 12,
    directOffers: [],
    districts: [
      {
        districtName: 'حي الروضة',
        isExpanded: false,
        isHidden: false,
        liveViewers: 5,
        offers: [
          { id: 'jed-1', title: 'شقة فاخرة للإيجار', price: '3,000 ريال/شهرياً', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', status: 'published', views: 1250, requests: 45, propertyType: 'شقة', bedrooms: 3, bathrooms: 2, area: 180, owner: { name: 'أحمد محمد', phone: '0501234567' }, isHidden: false, liveViewers: 2 },
          { id: 'jed-2', title: 'شقة عائلية مميزة', price: '4,500 ريال/شهرياً', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', status: 'published', views: 890, requests: 32, propertyType: 'شقة', bedrooms: 4, bathrooms: 3, area: 220, owner: { name: 'خالد علي', phone: '0551234567' }, isHidden: false, liveViewers: 1 },
          { id: 'jed-3', title: 'استوديو مؤثث', price: '2,000 ريال/شهرياً', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', status: 'draft', views: 340, requests: 12, propertyType: 'استوديو', bedrooms: 1, bathrooms: 1, area: 45, owner: { name: 'سعد الحربي', phone: '0561234567' }, isHidden: false, liveViewers: 0 },
        ]
      },
      {
        districtName: 'حي الحمراء',
        isExpanded: false,
        isHidden: false,
        liveViewers: 3,
        offers: [
          { id: 'jed-4', title: 'فيلا للبيع', price: '2,500,000 ريال', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', status: 'published', views: 2100, requests: 78, propertyType: 'فيلا', bedrooms: 6, bathrooms: 5, area: 500, owner: { name: 'عبدالله السعيد', phone: '0571234567' }, isHidden: false, liveViewers: 3 },
        ]
      },
      {
        districtName: 'حي المروة',
        isExpanded: false,
        isHidden: false,
        liveViewers: 2,
        offers: [
          { id: 'jed-5', title: 'دوبلكس فاخر', price: '1,800,000 ريال', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', status: 'published', views: 1560, requests: 56, propertyType: 'دوبلكس', bedrooms: 5, bathrooms: 4, area: 350, owner: { name: 'محمد الشهري', phone: '0581234567' }, isHidden: false, liveViewers: 1 },
        ]
      }
    ]
  },
  {
    cityName: 'الرياض',
    isExpanded: false,
    isHidden: false,
    liveViewers: 18,
    directOffers: [],
    districts: [
      {
        districtName: 'حي النرجس',
        isExpanded: false,
        isHidden: false,
        liveViewers: 8,
        offers: [
          { id: 'riy-1', title: 'فيلا فاخرة جديدة', price: '3,200,000 ريال', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', status: 'published', views: 3450, requests: 156, propertyType: 'فيلا', bedrooms: 7, bathrooms: 6, area: 600, owner: { name: 'فهد العتيبي', phone: '0591234567' }, isHidden: false, liveViewers: 4 },
          { id: 'riy-2', title: 'فيلا مودرن', price: '2,800,000 ريال', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400', status: 'published', views: 2890, requests: 123, propertyType: 'فيلا', bedrooms: 5, bathrooms: 4, area: 450, owner: { name: 'سلطان المطيري', phone: '0501234568' }, isHidden: false, liveViewers: 2 },
        ]
      },
      {
        districtName: 'حي الياسمين',
        isExpanded: false,
        isHidden: false,
        liveViewers: 4,
        offers: [
          { id: 'riy-3', title: 'شقة فاخرة للبيع', price: '850,000 ريال', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', status: 'published', views: 1200, requests: 67, propertyType: 'شقة', bedrooms: 3, bathrooms: 2, area: 200, owner: { name: 'عمر الدوسري', phone: '0511234567' }, isHidden: false, liveViewers: 1 },
        ]
      }
    ]
  },
  {
    cityName: 'الدمام',
    isExpanded: false,
    isHidden: false,
    liveViewers: 6,
    directOffers: [
      { id: 'dam-direct-1', title: 'أرض تجارية', price: '5,000,000 ريال', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', status: 'published', views: 890, requests: 34, propertyType: 'أرض', area: 2000, owner: { name: 'ناصر الغامدي', phone: '0521234567' }, isHidden: false, liveViewers: 2 },
    ],
    districts: [
      {
        districtName: 'حي الفيصلية',
        isExpanded: false,
        isHidden: false,
        liveViewers: 2,
        offers: [
          { id: 'dam-1', title: 'مكتب تجاري', price: '8,000 ريال/شهرياً', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', status: 'published', views: 560, requests: 23, propertyType: 'مكتب', area: 150, owner: { name: 'حسن القحطاني', phone: '0531234567' }, isHidden: false, liveViewers: 1 },
        ]
      }
    ]
  }
];

// ===================== Legacy Mock Data (للتوافق مع الكود القديم) =====================

const mockHierarchicalOffers: HierarchicalOffer[] = [
  {
    id: '1',
    title: 'شقق الروضة للإيجار',
    location: 'جدة - حي الروضة',
    city: 'جدة',
    district: 'حي الروضة',
    price: '3,000 - 8,000 ريال/شهرياً',
    adNumber: 'AD-001',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
    views: 2890,
    requests: 132,
    isPinned: true,
    lastOpened: 'منذ 2 ساعة',
    date: new Date(),
    status: 'published',
    purpose: 'rent',
    propertyType: 'شقة',
    category: 'residential',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    owner: { name: 'أحمد محمد', phone: '0501234567' },
    subOffers: [
      { id: '1-1', title: 'شقة 3 غرف - الدور الثاني', price: '3,500 ريال/شهرياً', adNumber: 'AD-001-A', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', imageCount: 12, status: 'published', views: 1200, requests: 45 },
      { id: '1-2', title: 'شقة 4 غرف - الدور الثالث', price: '4,500 ريال/شهرياً', adNumber: 'AD-001-B', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', imageCount: 8, status: 'published', views: 890, requests: 32 },
    ],
    rootOffers: [],
    isExpanded: false,
  },
  {
    id: '2',
    title: 'شقق الروضة للإيجار',
    location: 'جدة - حي الروضة',
    city: 'جدة',
    district: 'حي الروضة',
    price: '3,000 - 8,000 ريال/شهرياً',
    adNumber: 'AD-002',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
    views: 2890,
    requests: 132,
    isPinned: false,
    lastOpened: 'منذ 5 ساعات',
    date: new Date(),
    status: 'published',
    purpose: 'rent',
    propertyType: 'شقة',
    category: 'residential',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    owner: { name: 'سارة محمد', phone: '0559876543' },
    subOffers: [
      { id: '2-1', title: 'شقة 3 غرف - الدور الأول', price: '5,000 ريال/شهرياً', adNumber: 'AD-002-A', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', imageCount: 6, status: 'published', views: 980, requests: 42 },
      { id: '2-2', title: 'شقة 4 غرف - الدور الثاني', price: '8,000 ريال/شهرياً', adNumber: 'AD-002-B', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', imageCount: 8, status: 'published', views: 756, requests: 38 },
    ],
    rootOffers: [],
    isExpanded: false,
  },
  {
    id: '3',
    title: 'أرض تجارية على طريق الملك فهد',
    location: 'الرياض - طريق الملك فهد',
    city: 'الرياض',
    district: 'طريق الملك فهد',
    price: '15,000,000 ريال',
    adNumber: 'AD-003',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'],
    views: 2100,
    requests: 78,
    isPinned: true,
    lastOpened: 'منذ 30 دقيقة',
    date: new Date(),
    status: 'draft',
    purpose: 'sale',
    propertyType: 'أرض',
    category: 'commercial',
    area: 5000,
    owner: { name: 'عبدالله خالد', phone: '0541112233' },
    subOffers: [],
    rootOffers: [],
    isExpanded: false,
  },
];

const mockRequests: Request[] = [
  {
    id: 'R-001',
    title: 'طلب فيلا في حي النرجس',
    customerName: 'خالد السعيد',
    customerPhone: '0551234567',
    propertyType: 'فيلا',
    purpose: 'sale',
    city: 'الرياض',
    district: 'حي النرجس',
    budget: { min: 2000000, max: 3500000 },
    bedrooms: 5,
    status: 'new',
    createdAt: new Date(),
    notes: 'يفضل واجهة شمالية',
  },
  {
    id: 'R-002',
    title: 'طلب شقة للإيجار في جدة',
    customerName: 'أحمد محمود',
    customerPhone: '0559876543',
    propertyType: 'شقة',
    purpose: 'rent',
    city: 'جدة',
    budget: { min: 4000, max: 7000 },
    bedrooms: 3,
    status: 'inProgress',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'R-003',
    title: 'طلب أرض تجارية',
    customerName: 'فهد العتيبي',
    customerPhone: '0544445555',
    propertyType: 'أرض',
    purpose: 'sale',
    city: 'الرياض',
    budget: { min: 5000000, max: 20000000 },
    status: 'matched',
    createdAt: new Date(Date.now() - 172800000),
  },
];

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
  return mockHierarchicalOffers;
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
  const [activeMainTab, setActiveMainTab] = useState<'platform' | 'offers' | 'requests'>('platform');
  const [offers, setOffers] = useState<HierarchicalOffer[]>(() => loadFromStorage());
  const [requests] = useState<Request[]>(mockRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCity, setActiveCity] = useState<string>('الكل');
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // Hook إشعارات المشاهدات
  const { stats: viewStats, notificationsEnabled, soundEnabled, saveSettings } = useOfferViewNotifications();
  
  // Hierarchical State (مدينة ← حي ← عروض)
  const [cityHierarchy, setCityHierarchy] = useState<CityLevel[]>(() => {
    try {
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      const visibilityState = JSON.parse(localStorage.getItem('platform_visibility_state') || '{}');
      
      if (!Array.isArray(publishedAds) || publishedAds.length === 0) return mockCityHierarchy;

      const toSingleOffer = (ad: any): SingleOffer => ({
        id: ad.id,
        title: ad.title || `${ad.purpose === 'للإيجار' ? 'للإيجار' : 'للبيع'} - ${ad.propertyType} - ${ad.area || ''}م`,
        price: ad.price ? `${ad.price} ريال` : 'السعر عند التواصل',
        image: ad.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
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
      });

      const updated: CityLevel[] = [];

      publishedAds.forEach((ad: any) => {
        const city = ad.locationDetails?.city || 'أخرى';
        const districtRaw = ad.locationDetails?.district || 'عروض مباشرة';
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
  }, [cityHierarchy]);

  // ✅ مزامنة المنصة العامة مع قائمة العروض المنشورة حتى لا تختفي العروض من «منصتي»
  useEffect(() => {
    syncPlatformCompleteFromPublishedAds();
  }, []);

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

  // Platform URL
  const platformUrl = useMemo(() => {
    const appTitle = user?.appTitle || 'wasata';
    const userTitle = user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user';
    return `https://${appTitle}-${userTitle}.wasata.ai`;
  }, [user]);

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
    const handleAdPublished = (event: Event) => {
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
        price: newAd.price ? `${newAd.price} ريال` : 'السعر عند التواصل',
        image: newAd.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
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
    };
    
    window.addEventListener('adPublished', handleAdPublished);
    return () => window.removeEventListener('adPublished', handleAdPublished);
  }, []);

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

  // إخفاء/إظهار العرض الفردي
  const toggleOfferVisibility = (cityName: string, districtName: string, offerId: string) => {
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
                    const newHidden = !o.isHidden;
                    toast.success(newHidden ? 'تم إخفاء العرض من منصتي' : 'تم إظهار العرض على منصتي');
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
              const newHidden = !o.isHidden;
              toast.success(newHidden ? 'تم إخفاء العرض من منصتي' : 'تم إظهار العرض على منصتي');
              return { ...o, isHidden: newHidden };
            }
            return o;
          })
        };
      }
      return c;
    }));
  };

  // مشاركة عبر واتساب (للهيكل الهرمي)
  const shareItemWhatsApp = (title: string, id: string, cityName?: string, districtName?: string) => {
    // جلب بيانات العرض الكاملة
    const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
    const ad = publishedAds.find((a: any) => a.id === id);
    
    // إنشاء رابط حقيقي للعرض
    const baseUrl = window.location.origin;
    const slug = localStorage.getItem('public_platform_slug') || 'default';
    const shareUrl = `${baseUrl}/platform/${slug}?offer=${id}`;
    
    let text = `🏠 *${title}*\n\n`;
    
    if (ad) {
      text += `📍 الموقع: ${ad.locationDetails?.city || cityName || ''} - ${ad.locationDetails?.district || districtName || ''}\n`;
      if (ad.area) text += `📐 المساحة: ${ad.area} م²\n`;
      if (ad.price) text += `💰 السعر: ${parseInt(ad.price).toLocaleString()} ريال\n`;
      if (ad.bedrooms) text += `🛏️ الغرف: ${ad.bedrooms}\n`;
      if (ad.aiDescription) text += `\n📝 ${ad.aiDescription.slice(0, 150)}${ad.aiDescription.length > 150 ? '...' : ''}\n`;
    }
    
    text += `\n🔗 شاهد العرض:\n${shareUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('تم فتح واتساب للمشاركة');
  };

  // مشاركة رابط
  const shareItemLink = async (title: string, id: string) => {
    const baseUrl = window.location.origin;
    const slug = localStorage.getItem('public_platform_slug') || 'default';
    const shareUrl = `${baseUrl}/platform/${slug}?offer=${id}`;
    
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

  // تصدير PDF احترافي للعرض
  const exportOfferToPDF = async (offer: SingleOffer, cityName: string, districtName?: string) => {
    toast.info('جاري إنشاء ملف PDF...');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // خلفية متدرجة
    pdf.setFillColor(1, 65, 28); // Wasata Green
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // شريط ذهبي
    pdf.setFillColor(212, 175, 55); // Wasata Gold
    pdf.rect(0, 50, pageWidth, 3, 'F');
    
    // العنوان الرئيسي
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('منصة وساطه العقارية', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text('Wasata Real Estate Platform', pageWidth / 2, 35, { align: 'center' });
    
    // معلومات العرض
    pdf.setTextColor(1, 65, 28);
    pdf.setFontSize(18);
    pdf.text(offer.title, pageWidth / 2, 70, { align: 'center' });
    
    // السعر
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(22);
    pdf.text(offer.price, pageWidth / 2, 85, { align: 'center' });
    
    // الموقع
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(14);
    pdf.text(`${cityName}${districtName ? ` - ${districtName}` : ''}`, pageWidth / 2, 98, { align: 'center' });
    
    // صندوق معلومات
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(15, 110, pageWidth - 30, 60, 5, 5, 'F');
    
    pdf.setTextColor(1, 65, 28);
    pdf.setFontSize(12);
    
    let yPos = 125;
    const infoItems = [
      { label: 'نوع العقار:', value: offer.propertyType },
      { label: 'المساحة:', value: offer.area ? `${offer.area} م²` : 'غير محدد' },
      { label: 'غرف النوم:', value: offer.bedrooms ? `${offer.bedrooms} غرف` : 'غير محدد' },
      { label: 'دورات المياه:', value: offer.bathrooms ? `${offer.bathrooms} حمامات` : 'غير محدد' },
    ];
    
    infoItems.forEach(item => {
      pdf.setTextColor(100, 100, 100);
      pdf.text(item.label, pageWidth - 25, yPos, { align: 'right' });
      pdf.setTextColor(1, 65, 28);
      pdf.text(item.value, pageWidth - 60, yPos, { align: 'right' });
      yPos += 12;
    });
    
    // إحصائيات
    pdf.setFillColor(1, 65, 28);
    pdf.roundedRect(15, 180, (pageWidth - 40) / 2, 35, 5, 5, 'F');
    pdf.roundedRect((pageWidth / 2) + 5, 180, (pageWidth - 40) / 2, 35, 5, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('المشاهدات', 15 + (pageWidth - 40) / 4, 192, { align: 'center' });
    pdf.text('الطلبات', (pageWidth / 2) + 5 + (pageWidth - 40) / 4, 192, { align: 'center' });
    
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(18);
    pdf.text(offer.views.toLocaleString(), 15 + (pageWidth - 40) / 4, 207, { align: 'center' });
    pdf.text(offer.requests.toString(), (pageWidth / 2) + 5 + (pageWidth - 40) / 4, 207, { align: 'center' });
    
    // معلومات المالك
    pdf.setFillColor(212, 175, 55);
    pdf.roundedRect(15, 225, pageWidth - 30, 40, 5, 5, 'F');
    
    pdf.setTextColor(1, 65, 28);
    pdf.setFontSize(14);
    pdf.text('معلومات التواصل', pageWidth / 2, 240, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`${offer.owner.name} | ${offer.owner.phone}`, pageWidth / 2, 255, { align: 'center' });
    
    // التذييل
    pdf.setFillColor(1, 65, 28);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(10);
    pdf.text(`تم الإنشاء بتاريخ: ${new Date().toLocaleDateString('ar-SA')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    // حفظ الملف
    pdf.save(`عرض_${offer.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('تم تصدير ملف PDF بنجاح');
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
    const shareUrl = `${platformUrl}/offers/${selectedOfferForShare.id}`;
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
    const shareUrl = `${platformUrl}/offers/${selectedOfferForShare.id}`;
    const message = encodeURIComponent(`${selectedOfferForShare.title}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    window.dispatchEvent(new CustomEvent('analyticsEvent', {
      detail: { eventType: 'share_whatsapp', offerId: selectedOfferForShare.id }
    }));
  };

  // Share via Email
  const shareViaEmail = () => {
    if (!selectedOfferForShare) return;
    const shareUrl = `${platformUrl}/offers/${selectedOfferForShare.id}`;
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
      {/* Header - مرتبط بالبطاقة الرقمية */}
      <header 
        className="sticky top-0 z-40 border-b-4 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${digitalCardHeader?.primaryColor || '#01411C'} 0%, ${digitalCardHeader?.primaryColor || '#01411C'}dd 100%)`,
          borderColor: digitalCardHeader?.secondaryColor || '#D4AF37',
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 bg-white/10 text-white hover:bg-white/20"
              style={{ borderColor: digitalCardHeader?.secondaryColor || '#D4AF37' }}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <div className="flex items-center gap-3">
              {digitalCardHeader?.logo && (
                <img src={digitalCardHeader.logo} alt="Logo" className="w-10 h-10 rounded-full" />
              )}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Home className="w-6 h-6" />
                  منصتي
                </h1>
                <p className="text-xs text-white/80">{platformUrl}</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowPublishDialog(true)}
              className="text-white"
              style={{ 
                backgroundColor: digitalCardHeader?.secondaryColor || '#D4AF37',
                color: digitalCardHeader?.primaryColor || '#01411C',
              }}
            >
              <Plus className="w-4 h-4 ml-2" />
              نشر عقار
            </Button>
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

              {/* 2. إعدادات الإشعارات - مستطيل قابل للطي */}
              <CollapsibleNotificationSettings
                notificationsEnabled={notificationsEnabled}
                soundEnabled={soundEnabled}
                onSettingsChange={saveSettings}
              />

              {/* 3. التنبيهات الذكية - مستطيل قابل للطي */}
              <SmartAlertsPanel
                offers={getAllOffersFlat().map(o => ({
                  id: o.id,
                  title: o.title,
                  views: o.views,
                  requests: o.requests || 0,
                  city: cityHierarchy.find(c => c.districts.some(d => d.offers.some(of => of.id === o.id)) || c.directOffers.some(of => of.id === o.id))?.cityName,
                }))}
                onAlertClick={(offerId) => {
                  // يمكن التوسع لفتح العرض المحدد
                  toast.info(`تم النقر على العرض: ${offerId}`);
                }}
              />
            </div>

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
                </div>
              </CardContent>
            </Card>

            {/* مقارنة أداء العروض */}
            <OffersPerformanceComparison
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
            />

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
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${isCityExpanded ? 'bg-[#D4AF37]' : 'bg-[#01411C]'}`}>
                            <MapPin className={`w-5 h-5 md:w-6 md:h-6 ${isCityExpanded ? 'text-[#01411C]' : 'text-[#D4AF37]'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-bold text-base md:text-lg ${isCityExpanded ? 'text-white' : 'text-[#01411C]'}`}>{city.cityName}</h3>
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
                        {/* علامة المشاهدة الحمراء */}
                        {city.liveViewers > 0 && (
                          <Badge className="bg-red-500 text-white text-xs animate-pulse flex items-center gap-1">
                            <Eye className="w-3 h-3 text-red-200" />
                            <span>{city.liveViewers} يشاهدون</span>
                          </Badge>
                        )}
                        {city.liveViewers === 0 && <div />}

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
                            onClick={(e) => { e.stopPropagation(); shareItemWhatsApp(city.cityName, `city-${city.cityName}`); }}
                            className="h-8 px-2 md:px-3 bg-green-500 text-white hover:bg-green-600"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden md:inline mr-1">واتساب</span>
                          </Button>

                          {/* نسخ الرابط */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); shareItemLink(city.cityName, `city-${city.cityName}`); }}
                            className={`h-8 px-2 md:px-3 ${isCityExpanded ? 'text-white hover:bg-white/20' : 'hover:bg-gray-100'}`}
                          >
                            <Link className="w-4 h-4" />
                            <span className="hidden md:inline mr-1">رابط</span>
                          </Button>

                          {/* مشاركة عامة */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (navigator.share) {
                                navigator.share({ title: city.cityName, url: `${platformUrl}/city/${city.cityName}` });
                              } else {
                                shareItemLink(city.cityName, `city-${city.cityName}`);
                              }
                            }}
                            className={`h-8 px-2 md:px-3 ${isCityExpanded ? 'text-white hover:bg-white/20' : 'hover:bg-gray-100'}`}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>

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
                                    {offer.liveViewers > 0 && (
                                      <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs animate-pulse">
                                        <Eye className="w-3 h-3 ml-1" />{offer.liveViewers}
                                      </Badge>
                                    )}
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
                                      <Button size="sm" className="flex-1 text-xs bg-green-500 text-white" onClick={() => shareItemWhatsApp(offer.title, offer.id)}>
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
                                    {/* علامة المشاهدة الحمراء */}
                                    {district.liveViewers > 0 && (
                                      <Badge className="bg-red-500 text-white text-xs animate-pulse flex items-center gap-1">
                                        <Eye className="w-3 h-3 text-red-200" />
                                        <span>{district.liveViewers} يشاهدون</span>
                                      </Badge>
                                    )}
                                    {district.liveViewers === 0 && <div />}

                                    {/* أزرار الإجراءات */}
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {/* إخفاء/إظهار */}
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); toggleDistrictVisibility(city.cityName, district.districtName); }}>
                                        {district.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        <span className="hidden md:inline mr-1">{district.isHidden ? 'إظهار' : 'إخفاء'}</span>
                                      </Button>

                                      {/* واتساب */}
                                      <Button size="sm" className="h-7 px-2 text-xs bg-green-500 text-white" onClick={(e) => { e.stopPropagation(); shareItemWhatsApp(district.districtName, `district-${districtKey}`); }}>
                                        <MessageSquare className="w-3 h-3" />
                                      </Button>

                                      {/* نسخ الرابط */}
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); shareItemLink(district.districtName, `district-${districtKey}`); }}>
                                        <Link className="w-3 h-3" />
                                      </Button>

                                      {/* مشاركة */}
                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (navigator.share) {
                                          navigator.share({ title: district.districtName, url: `${platformUrl}/district/${districtKey}` });
                                        } else {
                                          shareItemLink(district.districtName, `district-${districtKey}`);
                                        }
                                      }}>
                                        <Share2 className="w-3 h-3" />
                                      </Button>

                                      {/* نقل لمدينة أخرى */}
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); openMoveDialog('district', district, city.cityName); }}>
                                        <Move className="w-3 h-3" />
                                        <span className="hidden md:inline mr-1">نقل</span>
                                      </Button>

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
                                              ownerBirthDate: fullAd?.ownerBirthDate || '',
                                              ownerCity: fullAd?.ownerCity || '',
                                              ownerDistrict: fullAd?.ownerDistrict || '',
                                              deedNumber: fullAd?.deedNumber || '',
                                              deedDate: fullAd?.deedDate || '',
                                              deedCity: fullAd?.deedCity || '',
                                              images,
                                              videos,
                                              tour3DUrl: fullAd?.tour3DUrl || '',
                                              linkedCustomerId: fullAd?.linkedCustomerId || undefined,
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
                                            {/* عين المشاهدة الحمراء */}
                                            {offer.liveViewers > 0 && (
                                              <Badge className="absolute bottom-2 right-2 bg-red-500 text-white text-xs animate-pulse flex items-center gap-1">
                                                <Eye className="w-3 h-3 text-red-200" />
                                                <span>{offer.liveViewers}</span>
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* محتوى الكارت */}
                                          <CardContent className="p-3">
                                            <h5 className="font-bold text-[#01411C] line-clamp-1 text-sm md:text-base">{offer.title}</h5>
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
                                              <Button size="sm" className="h-7 px-2 text-xs bg-green-500 text-white flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); shareItemWhatsApp(offer.title, offer.id, city.cityName, district.districtName); }}>
                                                <MessageSquare className="w-3 h-3" />
                                              </Button>
                                              {/* PDF */}
                                              <Button size="sm" className="h-7 px-2 text-xs bg-red-500 text-white flex-1 min-w-0" onClick={() => exportOfferToPDF(offer, city.cityName, district.districtName)}>
                                                <FileDown className="w-3 h-3" />
                                              </Button>
                                              {/* رابط */}
                                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs flex-1 min-w-0" onClick={() => shareItemLink(offer.title, offer.id)}>
                                                <Link className="w-3 h-3" />
                                              </Button>
                                              {/* نقل */}
                                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs flex-1 min-w-0" onClick={() => openMoveDialog('offer', offer, city.cityName, district.districtName)}>
                                                <Move className="w-3 h-3" />
                                              </Button>
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
                      {request.notes && (
                        <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">{request.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-500 text-white" onClick={() => handleWhatsApp(request.customerPhone, request.title)}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-500 text-white" onClick={() => handleCall(request.customerPhone)}>
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    readOnly
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

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0" dir="rtl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-6 h-6 text-[#01411C]" />
              نشر عقار جديد
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
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
          onSave={(updatedListing) => {
            toast.success('تم حفظ التعديلات بنجاح');
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
    </div>
  );
}
