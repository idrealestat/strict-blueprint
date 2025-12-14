/**
 * MyPlatformComplete.tsx
 * منصتي - النسخة الكاملة مع 4 تبويبات + نظام العروض الهرمي
 * حسب البرومبت الأصلي: منصتي / العروض / الطلبات / نشر عقار
 */

import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

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

const mockHierarchicalOffers: HierarchicalOffer[] = [
  {
    id: '1',
    title: 'فلل النرجس - مجموعة استثمارية',
    location: 'الرياض - حي النرجس',
    city: 'الرياض',
    district: 'حي النرجس',
    price: '2,500,000 - 4,500,000 ريال',
    adNumber: 'AD-001',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'],
    views: 3250,
    requests: 145,
    isPinned: true,
    lastOpened: 'منذ 2 ساعة',
    date: new Date(),
    status: 'published',
    purpose: 'sale',
    propertyType: 'فيلا',
    category: 'residential',
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    owner: { name: 'محمد أحمد', phone: '0501234567' },
    subOffers: [
      { id: '1-1', title: 'فيلا A - الواجهة الشمالية', price: '2,500,000 ريال', adNumber: 'AD-001-A', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', imageCount: 12, status: 'published', views: 1200, requests: 45 },
      { id: '1-2', title: 'فيلا B - الواجهة الجنوبية', price: '3,200,000 ريال', adNumber: 'AD-001-B', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', imageCount: 8, status: 'published', views: 890, requests: 32 },
      { id: '1-3', title: 'فيلا C - زاوية', price: '4,500,000 ريال', adNumber: 'AD-001-C', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400', imageCount: 15, status: 'draft', views: 560, requests: 28 },
    ],
    rootOffers: [
      { id: '1-1-1', title: 'الدور الأرضي', price: '1,200,000 ريال', image: '', status: 'published' },
      { id: '1-1-2', title: 'الدور العلوي', price: '1,300,000 ريال', image: '', status: 'published' },
    ],
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
  
  // Dialogs
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedOfferForShare, setSelectedOfferForShare] = useState<HierarchicalOffer | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // Toggle Expand
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
              منصتي
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

          {/* Tab: منصتي */}
          <TabsContent value="platform" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-2 border-[#D4AF37]">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#01411C]">{stats.total}</div>
                  <div className="text-sm text-gray-600">إجمالي العروض</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                  <div className="text-sm text-gray-600">منشور</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-yellow-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
                  <div className="text-sm text-gray-600">مسودة</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">المشاهدات</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-400">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalRequests}</div>
                  <div className="text-sm text-gray-600">الطلبات</div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Info */}
            <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#01411C]">رابط منصتك العامة</h3>
                    <p className="text-sm text-gray-600">هذا الرابط يظهر للجمهور لمشاهدة عروضك المنشورة</p>
                    <code className="mt-2 block bg-white px-3 py-2 rounded border text-sm">
                      {platformUrl}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(platformUrl, '_blank')}>
                      <Eye className="w-4 h-4 ml-2" />
                      معاينة
                    </Button>
                    <Button 
                      className="bg-[#01411C] text-[#D4AF37]"
                      onClick={async () => {
                        await navigator.clipboard.writeText(platformUrl);
                        toast.success('تم نسخ الرابط');
                      }}
                    >
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ الرابط
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Published Offers Preview */}
            <div>
              <h3 className="text-lg font-bold text-[#01411C] mb-4">العروض المنشورة على منصتك</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.filter(o => o.status === 'published').slice(0, 6).map(offer => (
                  <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative h-40">
                      <img 
                        src={offer.images[0] || 'https://via.placeholder.com/400x300?text=عقار'} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />
                        منشور
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-bold text-[#01411C] line-clamp-1">{offer.title}</h4>
                      <p className="text-sm text-gray-500">{offer.location}</p>
                      <p className="text-sm font-bold text-[#D4AF37] mt-1">{offer.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab: العروض (الهرمي) */}
          <TabsContent value="offers" className="space-y-6">
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
                </div>
              </CardContent>
            </Card>

            {/* Hierarchical Offers List */}
            <div className="space-y-4">
              {filteredOffers.map(offer => (
                <Card 
                  key={offer.id} 
                  className={`border-2 transition-all ${offer.isPinned ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-200'}`}
                >
                  {/* Main Offer Row */}
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={offer.images[0] || 'https://via.placeholder.com/200x150?text=عقار'} 
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                        {offer.subOffers.length > 0 && (
                          <Badge className="absolute bottom-1 right-1 bg-[#01411C] text-[#D4AF37] text-xs">
                            {offer.subOffers.length} فرع
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-[#01411C]">{offer.title}</h3>
                              {offer.isPinned && <Pin className="w-4 h-4 text-[#D4AF37]" />}
                              {/* Status Badge */}
                              {offer.status === 'published' ? (
                                <Badge className="bg-green-500 text-white">
                                  <span className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />
                                  منشور
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-500 text-white">مسودة</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {offer.location}
                            </p>
                            <p className="text-lg font-bold text-[#D4AF37] mt-1">{offer.price}</p>
                          </div>

                          {/* Stats */}
                          <div className="text-left text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {offer.views.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {offer.requests}
                            </div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* 6 Required Buttons */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => togglePin(offer.id)}>
                                  <Pin className={`w-4 h-4 ${offer.isPinned ? 'text-[#D4AF37]' : ''}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{offer.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => openShareModal(offer)}>
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>مشاركة</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>تعديل</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteOffer(offer.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>حذف</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Publish/Hide Button */}
                          {offer.status === 'published' ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-300 text-red-600"
                              onClick={() => togglePublishStatus(offer.id)}
                            >
                              <EyeOff className="w-4 h-4 ml-1" />
                              إخفاء
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-green-500 text-white hover:bg-green-600"
                              onClick={() => togglePublishStatus(offer.id)}
                            >
                              <Globe className="w-4 h-4 ml-1" />
                              نشر
                            </Button>
                          )}

                          {/* Communication Buttons */}
                          <div className="flex gap-1 mr-auto">
                            <Button size="sm" className="bg-green-500 text-white" onClick={() => handleWhatsApp(offer.owner.phone, offer.title)}>
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-blue-500 text-white" onClick={() => handleCall(offer.owner.phone)}>
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAppointment(offer.id, offer.title)}>
                              <Calendar className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-[#D4AF37] text-[#01411C]" onClick={() => handleDeposit(offer.id, offer.title)}>
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Expand Button for Sub-Offers */}
                          {offer.subOffers.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => toggleExpand(offer.id)}
                            >
                              {expandedOffers.has(offer.id) ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                              {offer.subOffers.length} فرع
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sub-Offers (Expandable) */}
                    {expandedOffers.has(offer.id) && offer.subOffers.length > 0 && (
                      <div className="mt-4 pr-8 border-r-4 border-[#D4AF37]/50 space-y-3">
                        <h4 className="text-sm font-bold text-gray-600">العروض الفرعية:</h4>
                        {offer.subOffers.map(sub => (
                          <div key={sub.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <img 
                              src={sub.image || 'https://via.placeholder.com/80x60'} 
                              alt={sub.title}
                              className="w-20 h-14 rounded object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sub.title}</span>
                                <Badge variant={sub.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                                  {sub.status === 'published' ? 'منشور' : 'مسودة'}
                                </Badge>
                              </div>
                              <p className="text-sm text-[#D4AF37] font-bold">{sub.price}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{sub.views}</span>
                              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{sub.requests}</span>
                            </div>
                          </div>
                        ))}

                        {/* Root Offers */}
                        {offer.rootOffers.length > 0 && (
                          <div className="pr-8 border-r-4 border-[#01411C]/30 space-y-2 mt-3">
                            <h5 className="text-xs font-bold text-gray-500">العروض الجذرية:</h5>
                            {offer.rootOffers.map(root => (
                              <div key={root.id} className="flex items-center gap-2 bg-white p-2 rounded text-sm">
                                <span className="font-medium">{root.title}</span>
                                <span className="text-[#D4AF37] font-bold">{root.price}</span>
                                <Badge variant={root.status === 'published' ? 'default' : 'secondary'} className="text-xs mr-auto">
                                  {root.status === 'published' ? 'منشور' : 'مسودة'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredOffers.length === 0 && (
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
              {/* Offer Preview */}
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

              {/* Share Link */}
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

              {/* QR Code */}
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

              {/* Share Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  className="flex-col h-auto py-3 bg-green-500 hover:bg-green-600"
                  onClick={shareViaWhatsApp}
                >
                  <MessageSquare className="w-5 h-5 mb-1" />
                  <span className="text-xs">واتساب</span>
                </Button>
                <Button 
                  className="flex-col h-auto py-3 bg-blue-500 hover:bg-blue-600"
                  onClick={shareViaEmail}
                >
                  <Mail className="w-5 h-5 mb-1" />
                  <span className="text-xs">إيميل</span>
                </Button>
                <Button 
                  className="flex-col h-auto py-3 bg-purple-500 hover:bg-purple-600"
                  onClick={copyShareLink}
                >
                  <Link className="w-5 h-5 mb-1" />
                  <span className="text-xs">نسخ</span>
                </Button>
                <Button 
                  className="flex-col h-auto py-3 bg-gray-700 hover:bg-gray-800"
                  onClick={() => {
                    // SMS Share
                    const shareUrl = `${platformUrl}/offers/${selectedOfferForShare.id}`;
                    window.location.href = `sms:?body=${encodeURIComponent(`${selectedOfferForShare.title}\n${shareUrl}`)}`;
                  }}
                >
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#01411C]" />
              نشر عقار جديد
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2">
              <Label>العنوان *</Label>
              <Input 
                value={publishForm.title}
                onChange={(e) => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: فيلا فاخرة في حي النرجس"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <Label>الوصف</Label>
              <Textarea 
                value={publishForm.description}
                onChange={(e) => setPublishForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف تفصيلي للعقار..."
                rows={3}
              />
            </div>

            {/* Property Type */}
            <div>
              <Label>نوع العقار *</Label>
              <Select 
                value={publishForm.propertyType}
                onValueChange={(v) => setPublishForm(prev => ({ ...prev, propertyType: v }))}
              >
                <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div>
              <Label>الغرض *</Label>
              <Select 
                value={publishForm.purpose}
                onValueChange={(v) => setPublishForm(prev => ({ ...prev, purpose: v as 'sale' | 'rent' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">بيع</SelectItem>
                  <SelectItem value="rent">إيجار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label>التصنيف</Label>
              <Select 
                value={publishForm.category}
                onValueChange={(v) => setPublishForm(prev => ({ ...prev, category: v as 'residential' | 'commercial' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">سكني</SelectItem>
                  <SelectItem value="commercial">تجاري</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div>
              <Label>المدينة *</Label>
              <Select 
                value={publishForm.city}
                onValueChange={(v) => setPublishForm(prev => ({ ...prev, city: v }))}
              >
                <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div>
              <Label>الحي</Label>
              <Input 
                value={publishForm.district}
                onChange={(e) => setPublishForm(prev => ({ ...prev, district: e.target.value }))}
                placeholder="اسم الحي"
              />
            </div>

            {/* Price */}
            <div>
              <Label>السعر *</Label>
              <Input 
                type="number"
                value={publishForm.price || ''}
                onChange={(e) => setPublishForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            {/* Area */}
            <div>
              <Label>المساحة (م²)</Label>
              <Input 
                type="number"
                value={publishForm.area || ''}
                onChange={(e) => setPublishForm(prev => ({ ...prev, area: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <Label>غرف النوم</Label>
              <Input 
                type="number"
                value={publishForm.bedrooms || ''}
                onChange={(e) => setPublishForm(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            {/* Bathrooms */}
            <div>
              <Label>دورات المياه</Label>
              <Input 
                type="number"
                value={publishForm.bathrooms || ''}
                onChange={(e) => setPublishForm(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            {/* Owner Info */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <h4 className="font-bold text-sm mb-3">معلومات المالك</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>اسم المالك</Label>
                  <Input 
                    value={publishForm.ownerName}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, ownerName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>هاتف المالك</Label>
                  <Input 
                    value={publishForm.ownerPhone}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, ownerPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>إيميل المالك</Label>
                  <Input 
                    value={publishForm.ownerEmail}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              إلغاء
            </Button>
            <Button 
              className="bg-[#01411C] text-[#D4AF37]"
              onClick={handlePublishSubmit}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة العرض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
