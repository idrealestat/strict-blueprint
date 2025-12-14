/**
 * MyPlatform.tsx
 * منصتي - لوحة التحكم في العروض
 * My Platform - Offers Control Dashboard - Literal Implementation
 */

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  MoreVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building,
  Clock,
  Target,
  Download,
  BarChart3,
  Smartphone,
  Monitor,
  MessageSquare,
  Phone,
  Bed,
  Bath,
  Maximize,
  Star,
  Calendar,
  DollarSign,
  EyeOff,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PropertyPublishForm from "./PropertyPublishForm";
import { ShareOfferModal } from "@/components/offers/ShareOfferModal";

// Types
interface SubOffer {
  id: string;
  title: string;
  price: string;
  adNumber: string;
  image: string;
  imageCount: number;
  ownerName?: string;
  ownerPhone?: string;
}

interface Owner {
  name: string;
  phone: string;
  email?: string;
}

interface Offer {
  id: string;
  title: string;
  location: string;
  price: string;
  adNumber: string;
  images: string[];
  views: number;
  requests: number;
  isPinned: boolean;
  lastOpened: string;
  date: Date;
  subOffers: SubOffer[];
  isExpanded: boolean;
  owner: Owner;
  purpose?: 'sale' | 'rent';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  status: 'published' | 'draft';
}

interface PropertyEngagement {
  id: string;
  title: string;
  location: string;
  views: number;
  clicks: number;
  whatsappMessages: number;
  phoneCalls: number;
  bookings: number;
  shares: number;
  favorites: number;
  engagementScore: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  currentViewers?: number;
  averageTimeOnPage?: number;
  conversionRate: number;
}

interface LiveViewData {
  offerId: string;
  totalCount: number;
  peakCount: number;
  peakTime: Date;
  averageDuration: number;
  conversionRate: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

type TimeRange = '1h' | '24h' | '7d' | '30d';

interface MyPlatformProps {
  onBack: () => void;
  onNavigate?: (page: string, params?: any) => void;
  user?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

// Mock Data
const mockOffers: Offer[] = [
  {
    id: '1',
    title: 'فيلا فاخرة في حي النرجس',
    location: 'الرياض - حي النرجس',
    price: '2,500,000 ريال',
    adNumber: 'AD-001',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'],
    views: 1250,
    requests: 45,
    isPinned: true,
    lastOpened: 'منذ 2 ساعة',
    date: new Date(),
    subOffers: [],
    isExpanded: false,
    owner: { name: 'محمد أحمد', phone: '0501234567' },
    purpose: 'sale',
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    status: 'published',
  },
  {
    id: '2',
    title: 'شقة مفروشة للإيجار',
    location: 'جدة - حي الروضة',
    price: '5,000 ريال/شهرياً',
    adNumber: 'AD-002',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
    views: 890,
    requests: 32,
    isPinned: false,
    lastOpened: 'منذ 5 ساعات',
    date: new Date(),
    subOffers: [],
    isExpanded: false,
    owner: { name: 'سارة محمد', phone: '0559876543' },
    purpose: 'rent',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    status: 'published',
  },
  {
    id: '3',
    title: 'أرض تجارية على طريق الملك فهد',
    location: 'الرياض - طريق الملك فهد',
    price: '15,000,000 ريال',
    adNumber: 'AD-003',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'],
    views: 2100,
    requests: 78,
    isPinned: true,
    lastOpened: 'منذ 30 دقيقة',
    date: new Date(),
    subOffers: [],
    isExpanded: false,
    owner: { name: 'عبدالله خالد', phone: '0541112233' },
    purpose: 'sale',
    area: 5000,
    status: 'draft',
  },
  {
    id: '4',
    title: 'عمارة سكنية للاستثمار',
    location: 'الدمام - حي الفيصلية',
    price: '8,500,000 ريال',
    adNumber: 'AD-004',
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'],
    views: 650,
    requests: 25,
    isPinned: false,
    lastOpened: 'منذ يوم',
    date: new Date(Date.now() - 86400000),
    subOffers: [],
    isExpanded: false,
    owner: { name: 'فهد سعود', phone: '0533334444' },
    purpose: 'sale',
    bedrooms: 12,
    bathrooms: 12,
    area: 1200,
    status: 'published',
  },
];

const cities = ['الكل', 'الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'الطائف'];

// Helper Functions
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const generateMockEngagement = (views: number): PropertyEngagement => {
  const clicks = Math.floor(views * (Math.random() * 0.3 + 0.1));
  const whatsappMessages = Math.floor(views * (Math.random() * 0.05 + 0.02));
  const phoneCalls = Math.floor(views * (Math.random() * 0.02 + 0.01));
  const bookings = Math.floor(views * (Math.random() * 0.01 + 0.005));
  const shares = Math.floor(views * (Math.random() * 0.03 + 0.01));
  const favorites = Math.floor(views * (Math.random() * 0.05 + 0.02));
  
  const engagementScore = Math.floor(
    views * 1 + clicks * 2 + whatsappMessages * 5 + phoneCalls * 10 + bookings * 20 + shares * 3 + favorites * 2
  ) / 100;

  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
  
  return {
    id: '',
    title: '',
    location: '',
    views,
    clicks,
    whatsappMessages,
    phoneCalls,
    bookings,
    shares,
    favorites,
    engagementScore: Math.round(engagementScore),
    trend: trends[Math.floor(Math.random() * 3)],
    percentageChange: Math.floor(Math.random() * 30 + 5),
    currentViewers: Math.floor(Math.random() * 5) + 1,
    averageTimeOnPage: Math.floor(Math.random() * 180 + 60),
    conversionRate: parseFloat((Math.random() * 15 + 5).toFixed(1)),
  };
};

// مفتاح localStorage
const OFFERS_STORAGE_KEY = 'wasata_my_platform_offers';

// تحميل العروض من localStorage
const loadOffersFromStorage = (): Offer[] => {
  try {
    const saved = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((o: any) => ({
        ...o,
        date: new Date(o.date)
      }));
    }
  } catch (error) {
    console.error('خطأ في تحميل العروض:', error);
  }
  return mockOffers;
};

// حفظ العروض في localStorage
const saveOffersToStorage = (offers: Offer[]) => {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (error) {
    console.error('خطأ في حفظ العروض:', error);
  }
};

export default function MyPlatform({ onBack, onNavigate, user }: MyPlatformProps) {
  const [offers, setOffers] = useState<Offer[]>(() => loadOffersFromStorage());
  const [activeTimeFilter, setActiveTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [activeCity, setActiveCity] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [heatMapTimeRange, setHeatMapTimeRange] = useState<TimeRange>('24h');
  const [liveViewersData, setLiveViewersData] = useState<Map<string, LiveViewData>>(new Map());
  const [topViewedProperties, setTopViewedProperties] = useState<PropertyEngagement[]>([]);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedOfferForShare, setSelectedOfferForShare] = useState<Offer | null>(null);
  // Handle Publish from PropertyPublishForm
  const handlePublishOffer = (data: any) => {
    const newOffer: Offer = {
      id: `offer-${Date.now()}`,
      title: `${data.propertyType} ${data.purpose} في ${data.locationDetails?.city || 'غير محدد'}`,
      location: `${data.locationDetails?.city || ''} - ${data.locationDetails?.district || ''}`,
      price: data.price ? `${data.price} ريال` : 'السعر عند الطلب',
      adNumber: `AD-${String(offers.length + 1).padStart(3, '0')}`,
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'],
      views: 0,
      requests: 0,
      isPinned: false,
      lastOpened: 'الآن',
      date: new Date(),
      subOffers: [],
      isExpanded: false,
      owner: { name: user?.name || 'المالك', phone: user?.phone || '' },
      purpose: data.purpose?.includes('بيع') ? 'sale' : 'rent',
      bedrooms: parseInt(data.bedrooms) || undefined,
      bathrooms: parseInt(data.bathrooms) || undefined,
      area: parseInt(data.area) || undefined,
      status: 'published',
    };
    
    setOffers(prev => {
      const updated = [newOffer, ...prev];
      saveOffersToStorage(updated);
      return updated;
    });
    
    setIsPublishDialogOpen(false);
    toast.success('تم إضافة العرض بنجاح!');
  };

  // Filtered Offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          offer.title.toLowerCase().includes(query) ||
          offer.location.toLowerCase().includes(query) ||
          offer.adNumber.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // City filter
      if (activeCity !== 'الكل') {
        if (!offer.location.includes(activeCity)) return false;
      }
      
      // Time filter
      if (activeTimeFilter !== 'all') {
        const now = new Date();
        const offerDate = new Date(offer.date);
        const diffDays = Math.floor((now.getTime() - offerDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (activeTimeFilter === 'today' && diffDays > 0) return false;
        if (activeTimeFilter === 'week' && diffDays > 7) return false;
        if (activeTimeFilter === 'month' && diffDays > 30) return false;
      }
      
      return true;
    });
  }, [offers, searchQuery, activeCity, activeTimeFilter]);

  // Stats
  const filteredStats = useMemo(() => {
    const total = filteredOffers.length;
    const active = filteredOffers.filter(o => o.views > 50 || o.requests > 5).length;
    const expired = Math.max(0, total - active);
    const totalRequests = filteredOffers.reduce((sum, o) => sum + o.requests, 0);
    const totalViews = filteredOffers.reduce((sum, o) => sum + o.views, 0);
    const conversionRate = totalViews > 0 ? ((totalRequests / totalViews) * 100).toFixed(1) : '0.0';
    
    return {
      total,
      active,
      expired,
      conversionRate: parseFloat(conversionRate)
    };
  }, [filteredOffers]);

  // Live View Simulation (Update every 5 seconds)
  useEffect(() => {
    const simulateLiveViewers = () => {
      if (filteredOffers.length === 0) return;
      
      const newViewersData = new Map<string, LiveViewData>();
      
      filteredOffers.forEach(offer => {
        const viewerCount = Math.floor(Math.random() * 5) + 1;
        
        const liveViewData: LiveViewData = {
          offerId: offer.id,
          totalCount: viewerCount,
          peakCount: Math.floor(Math.random() * 3) + viewerCount,
          peakTime: new Date(Date.now() - Math.random() * 3600000 * 6),
          averageDuration: Math.floor(Math.random() * 180 + 60),
          conversionRate: Math.random() * 15 + 5,
          deviceBreakdown: {
            mobile: Math.floor(viewerCount * 0.6),
            desktop: Math.floor(viewerCount * 0.3),
            tablet: Math.floor(viewerCount * 0.1) || 1,
          }
        };
        
        newViewersData.set(offer.id, liveViewData);
      });
      
      setLiveViewersData(newViewersData);
    };
    
    simulateLiveViewers();
    const interval = setInterval(simulateLiveViewers, 5000);
    
    return () => clearInterval(interval);
  }, [filteredOffers]);

  // Top Viewed Properties (Heat Map)
  useEffect(() => {
    if (filteredOffers.length === 0) {
      setTopViewedProperties([]);
      return;
    }
    
    const propertiesWithEngagement: PropertyEngagement[] = filteredOffers.map(offer => {
      const mockData = generateMockEngagement(offer.views);
      
      return {
        ...mockData,
        id: offer.id,
        title: offer.title,
        location: offer.location,
        views: offer.views,
      };
    });
    
    const sorted = [...propertiesWithEngagement]
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5);
    
    setTopViewedProperties(sorted);
  }, [filteredOffers, heatMapTimeRange]);

  // Toggle Pin
  const togglePin = (offerId: string) => {
    setOffers(prev => {
      const updated = prev.map(o => 
        o.id === offerId ? { ...o, isPinned: !o.isPinned } : o
      );
      saveOffersToStorage(updated);
      return updated;
    });
    toast.success('تم تحديث حالة التثبيت');
  };

  // Delete Offer
  const deleteOffer = (offerId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      setOffers(prev => {
        const updated = prev.filter(o => o.id !== offerId);
        saveOffersToStorage(updated);
        return updated;
      });
      toast.success('تم حذف العرض');
    }
  };

  // Toggle Publish Status (نشر/إخفاء)
  const togglePublishStatus = (offerId: string) => {
    setOffers(prev => {
      const updated = prev.map(o => {
        if (o.id === offerId) {
          const newStatus = o.status === 'published' ? 'draft' : 'published';
          if (newStatus === 'published') {
            toast.success('تم نشر العرض بنجاح');
            // تسجيل حدث Analytics
            window.dispatchEvent(new CustomEvent('analyticsEvent', {
              detail: { eventType: 'offer_published', offerId, timestamp: new Date().toISOString() }
            }));
          } else {
            toast.success('تم إخفاء العرض من منصتي');
            // تسجيل حدث Analytics
            window.dispatchEvent(new CustomEvent('analyticsEvent', {
              detail: { eventType: 'offer_hidden', offerId, timestamp: new Date().toISOString() }
            }));
          }
          return { ...o, status: newStatus as 'published' | 'draft' };
        }
        return o;
      });
      saveOffersToStorage(updated);
      return updated;
    });
  };

  // Handle WhatsApp Contact
  const handleWhatsApp = (phone: string, title: string) => {
    const message = encodeURIComponent(`مرحباً، أنا مهتم بـ: ${title}`);
    window.open(`https://wa.me/${phone.replace(/^0/, '966')}?text=${message}`, '_blank');
    toast.success('جاري فتح واتساب...');
  };

  // Handle Phone Call
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    toast.success('جاري الاتصال...');
  };

  // Handle Appointment
  const handleAppointment = (offerId: string, title: string) => {
    // إرسال حدث للتقويم
    window.dispatchEvent(new CustomEvent('addAppointment', {
      detail: {
        title: `معاينة: ${title}`,
        propertyId: offerId,
        type: 'معاينة'
      }
    }));
    toast.success('سيتم فتح نافذة تحديد الموعد');
  };

  // Handle Deposit (عربون)
  const handleDeposit = (offerId: string, title: string) => {
    toast.info(`سيتم فتح نافذة دفع العربون لـ: ${title}`);
    // تسجيل حدث Analytics
    window.dispatchEvent(new CustomEvent('analyticsEvent', {
      detail: { eventType: 'deposit_requested', offerId, title }
    }));
    // TODO: فتح نافذة الدفع
  };

  // Handle CSV Export - تصدير CSV
  const handleExportCSV = () => {
    const csvHeader = 'العنوان,الموقع,السعر,المشاهدات,الطلبات,الحالة\n';
    const csvData = filteredOffers.map(o => 
      `"${o.title}","${o.location}","${o.price}",${o.views},${o.requests},"${o.status === 'published' ? 'منشور' : 'مسودة'}"`
    ).join('\n');
    
    const blob = new Blob(['\ufeff' + csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `my-platform-offers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('تم تصدير البيانات بنجاح');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-4 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Home className="w-6 h-6" />
              منصتي
            </h1>
            
            <Button
              onClick={() => setIsPublishDialogOpen(true)}
              className="bg-[#D4AF37] text-[#01411C] hover:bg-[#b8941f] border-2 border-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة عرض
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards (4 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. إجمالي العروض */}
          <Card className="border-2 border-[#D4AF37] bg-gradient-to-br from-white to-[#fffef7] hover:shadow-xl transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">إجمالي العروض</p>
                  <p className="text-3xl font-bold text-[#01411C]">{filteredStats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#01411C] flex items-center justify-center">
                  <Home className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. العروض النشطة */}
          <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-green-700 mb-1">العروض النشطة</p>
                  <p className="text-3xl font-bold text-green-800">{filteredStats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. العروض المنتهية */}
          <Card className="border-2 border-red-400 bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-red-700 mb-1">العروض المنتهية</p>
                  <p className="text-3xl font-bold text-red-800">{filteredStats.expired}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. معدل التحويل */}
          <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-blue-700 mb-1">معدل التحويل</p>
                  <p className="text-3xl font-bold text-blue-800">{filteredStats.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="border-2 border-[#D4AF37]">
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="ابحث في العروض (العنوان، الموقع، رقم الإعلان...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 border-2 border-gray-300 focus:border-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Time Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { key: 'today', label: 'اليوم' },
                { key: 'week', label: 'هذا الأسبوع' },
                { key: 'month', label: 'هذا الشهر' },
                { key: 'all', label: 'كل الوقت' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveTimeFilter(filter.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    activeTimeFilter === filter.key
                      ? 'bg-[#01411C] text-white border-2 border-[#D4AF37] shadow-md'
                      : 'bg-white text-[#01411C] hover:bg-gray-100 border-2 border-gray-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* City Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeCity === city
                      ? 'bg-[#D4AF37] text-[#01411C] shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Heat Map - الأكثر نشاطاً */}
        {topViewedProperties.length > 0 && (
          <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#01411C]">🔥 الأكثر نشاطاً</h3>
                    <p className="text-xs text-gray-600">تحديث مباشر كل 5 ثوان</p>
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1">
                  {(['1h', '24h', '7d', '30d'] as TimeRange[]).map(range => (
                    <button
                      key={range}
                      onClick={() => setHeatMapTimeRange(range)}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        heatMapTimeRange === range
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-orange-100 border border-orange-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                {topViewedProperties.map((property, index) => (
                  <div key={property.id} className="bg-white rounded-lg p-3 border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      {/* الترقيم + المعلومات */}
                      <div className="flex items-start gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                          index === 1 ? 'bg-gradient-to-br from-orange-400 to-red-400' :
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {property.title}
                          </p>
                          <p className="text-xs text-gray-500">{property.location}</p>
                        </div>
                      </div>

                      {/* Trend Indicator */}
                      <div className="flex items-center gap-1">
                        {property.trend === 'up' && (
                          <div className="flex items-center gap-0.5 text-green-600">
                            <ChevronUp className="w-4 h-4" />
                            <span className="text-xs font-bold">+{property.percentageChange}%</span>
                          </div>
                        )}
                        {property.trend === 'down' && (
                          <div className="flex items-center gap-0.5 text-red-600">
                            <ChevronDown className="w-4 h-4" />
                            <span className="text-xs font-bold">-{property.percentageChange}%</span>
                          </div>
                        )}
                        {property.trend === 'stable' && (
                          <div className="flex items-center gap-0.5 text-gray-600">
                            <span className="text-xs">مستقر</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">مشاهدات</div>
                        <div className="text-sm font-bold text-orange-600">{property.views}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">نقرات</div>
                        <div className="text-sm font-bold text-blue-600">{property.clicks}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">رسائل</div>
                        <div className="text-sm font-bold text-green-600">{property.whatsappMessages}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">حجوزات</div>
                        <div className="text-sm font-bold text-purple-600">{property.bookings}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${(property.engagementScore / (topViewedProperties[0]?.engagementScore || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">نقاط التفاعل</span>
                        <span className="text-xs font-bold text-orange-600">{property.engagementScore}</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Eye className="w-3 h-3" />
                        <span>{property.currentViewers} الآن</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{Math.floor((property.averageTimeOnPage || 0) / 60)} د</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Target className="w-3 h-3" />
                        <span>{property.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Export + Info */}
              <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-between">
                <button className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 px-2 py-1 rounded flex items-center gap-1 transition-all">
                  <Download className="w-3 h-3" />
                  تصدير CSV
                </button>

                <button className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 px-2 py-1 rounded flex items-center gap-1 transition-all">
                  <BarChart3 className="w-3 h-3" />
                  مقارنة بالأمس
                </button>
                
                <p className="text-xs text-gray-600">
                  💡 تحديث كل 5 ثوان
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => {
            const liveData = liveViewersData.get(offer.id);
            
            return (
              <Card 
                key={offer.id}
                className={`border-2 ${offer.isPinned ? 'border-[#D4AF37]' : 'border-gray-200'} overflow-hidden hover:shadow-xl transition-all cursor-pointer group relative`}
              >
                {/* Live View Indicator */}
                {liveData && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="absolute -top-2 -left-2 z-10 cursor-help">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-400 rounded-full blur-md animate-pulse" />
                            <div className="relative bg-green-500 rounded-full p-2 border-2 border-white shadow-lg">
                              <Eye className="w-4 h-4 text-white animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                              {liveData.totalCount}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="p-4 bg-white rounded-lg shadow-2xl border-2 border-green-500 max-w-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="font-bold text-green-600 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {liveData.totalCount} مشاهد نشط
                            </span>
                            <Badge className="bg-green-500 text-white">مباشر</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-gray-500 mb-1">متوسط المدة</div>
                              <div className="font-bold text-gray-800">{formatDuration(liveData.averageDuration)}</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-gray-500 mb-1">أعلى عدد</div>
                              <div className="font-bold text-gray-800">{liveData.peakCount} مشاهد</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-gray-500 mb-1">معدل التحويل</div>
                              <div className="font-bold text-green-600">{liveData.conversionRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-gray-500 mb-1">الأجهزة</div>
                              <div className="flex gap-1">
                                <Smartphone className="w-3 h-3 text-blue-500" />
                                <span>{liveData.deviceBreakdown.mobile}</span>
                                <Monitor className="w-3 h-3 text-green-500 ml-1" />
                                <span>{liveData.deviceBreakdown.desktop}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Status Badge (منشور/مسودة) */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                  {offer.status === 'published' ? (
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      منشور
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-black">
                      مسودة
                    </Badge>
                  )}
                  
                  {/* Pin Badge */}
                  {offer.isPinned && (
                    <Badge className="bg-[#D4AF37] text-[#01411C]">
                      <Pin className="w-3 h-3 ml-1" />
                      مثبت
                    </Badge>
                  )}
                </div>

                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {offer.images && offer.images.length > 0 ? (
                    <img 
                      src={offer.images[0]} 
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Building className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Purpose Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`${offer.purpose === 'sale' ? 'bg-green-500' : 'bg-blue-500'} text-white font-bold`}>
                      {offer.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
                    </Badge>
                  </div>
                  
                  {/* Price */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full">
                    <span className="font-bold">{offer.price}</span>
                  </div>

                  {/* Views Badge */}
                  <div className="absolute bottom-2 left-2 bg-white/90 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {offer.views}
                  </div>
                </div>
                
                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-[#01411C] mb-2 line-clamp-1">
                    {offer.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{offer.location}</span>
                  </div>
                  
                  {/* Specs */}
                  {(offer.bedrooms || offer.bathrooms || offer.area) && (
                    <div className="flex items-center justify-between text-sm mb-3">
                      {offer.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4 text-gray-500" />
                          <span>{offer.bedrooms}</span>
                        </div>
                      )}
                      {offer.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4 text-gray-500" />
                          <span>{offer.bathrooms}</span>
                        </div>
                      )}
                      {offer.area && (
                        <div className="flex items-center gap-1">
                          <Maximize className="w-4 h-4 text-gray-500" />
                          <span>{offer.area} م²</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {offer.views} مشاهدة
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {offer.requests} طلب
                    </span>
                    <span>{offer.lastOpened}</span>
                  </div>
                  
                  {/* Communication Buttons - أزرار التواصل */}
                  <div className="flex gap-2 mb-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(offer.owner.phone, offer.title);
                      }}
                    >
                      <MessageSquare className="w-3 h-3 ml-1" />
                      واتساب
                    </Button>
                    
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(offer.owner.phone);
                      }}
                    >
                      <Phone className="w-3 h-3 ml-1" />
                      اتصال
                    </Button>
                    
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointment(offer.id, offer.title);
                      }}
                    >
                      <Calendar className="w-3 h-3 ml-1" />
                      موعد
                    </Button>
                    
                    <Button
                      size="sm"
                      className="flex-1 bg-[#D4AF37] hover:bg-[#b8941f] text-[#01411C] text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeposit(offer.id, offer.title);
                      }}
                    >
                      <DollarSign className="w-3 h-3 ml-1" />
                      عربون
                    </Button>
                  </div>

                  {/* Actions - أزرار التحكم */}
                  <div className="flex gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#D4AF37] text-[#01411C] hover:bg-[#f0fdf4]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOfferForShare(offer);
                        setShareModalOpen(true);
                      }}
                    >
                      <Share2 className="w-4 h-4 ml-1" />
                      مشاركة
                    </Button>
                    
                    <Button
                      size="sm"
                      className="flex-1 bg-[#01411C] hover:bg-[#065f41] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.('property-edit', { offerId: offer.id });
                        toast.info('جاري فتح التعديل...');
                      }}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className={offer.isPinned ? 'text-[#D4AF37]' : 'text-gray-400'}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(offer.id);
                      }}
                    >
                      <Pin className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOffer(offer.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Publish/Hide Button - زر النشر/الإخفاء */}
                  {offer.status === 'published' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-red-500 text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublishStatus(offer.id);
                      }}
                    >
                      <EyeOff className="w-4 h-4 ml-2" />
                      إخفاء من منصتي
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublishStatus(offer.id);
                      }}
                    >
                      <Globe className="w-4 h-4 ml-2" />
                      نشر على منصتي
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredOffers.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد عروض</h3>
              <p className="text-gray-500 mb-4">لم يتم العثور على عروض تطابق معايير البحث</p>
              <Button
                onClick={() => onNavigate?.('property-upload-complete')}
                className="bg-[#01411C] hover:bg-[#065f41]"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة عرض جديد
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[#01411C] text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              نشر إعلان جديد
            </DialogTitle>
          </DialogHeader>
          <PropertyPublishForm 
            onPublish={handlePublishOffer}
            onCancel={() => setIsPublishDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Share Offer Modal */}
      {selectedOfferForShare && (
        <ShareOfferModal
          offer={{
            id: selectedOfferForShare.id,
            title: selectedOfferForShare.title,
            description: `${selectedOfferForShare.location} - ${selectedOfferForShare.price}`,
          }}
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedOfferForShare(null);
          }}
        />
      )}
    </div>
  );
}
