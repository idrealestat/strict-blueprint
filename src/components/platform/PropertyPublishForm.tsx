/**
 * PropertyPublishForm.tsx
 * نموذج نشر الإعلان الكامل - 8 أقسام حرفية
 * حسب الملف: PUBLISH_AD_SECTIONS_COMPLETE_PROMPT.md
 */

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building,
  MapPin,
  Globe,
  Link,
  Sparkles,
  Home,
  Settings,
  Shield,
  Hash,
  Wand2,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Copy,
  RefreshCw,
  User,
  Phone,
  Mail,
  FileText,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { usePublishedAdsManager, PublishedAdData, findCustomerByPhone } from "@/hooks/usePublishedAdsManager";
import PublishSuccessActions from "./PublishSuccessActions";

// ===================== Types =====================

interface PropertyData {
  // تفاصيل العقار (256)
  propertyType: string;
  category: string;
  purpose: string;
  area: string;
  propertyCategory: 'سكني' | 'تجاري' | '';
  
  // المسار على المنصة
  platformPath: string;
  
  // الموقع
  locationDetails: {
    city: string;
    district: string;
    street: string;
    buildingNumber: string;
    postalCode: string;
    additionalNumber: string;
  };
  
  // المواصفات التفصيلية
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  floors: string;
  propertyAge: string;
  furnishing: string;
  facade: string;
  streetWidth: string;
  
  // المميزات المخصصة (266)
  features: string[];
  customFeatures: string[];
  
  // الضمانات والكفالات
  warranties: {
    structuralWarranty: boolean;
    structuralYears: string;
    acWarranty: boolean;
    acYears: string;
    plumbingWarranty: boolean;
    plumbingYears: string;
    electricalWarranty: boolean;
    electricalYears: string;
    customWarranties: string[];
  };
  
  // الهاشتاقات
  hashtags: string[];
  customHashtags: string[];
  
  // الوصف AI
  aiDescription: string;
  descriptionTone: string;
  descriptionLength: string;
  
  // السعر
  price: string;
  priceType: string;

  // معلومات المالك
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerIdNumber: string;

  // معلومات الصك
  deedNumber: string;
  deedDate: string;
  deedCity: string;
}

interface PropertyPublishFormProps {
  onPublish: (data: PropertyData) => void;
  onCancel: () => void;
}

// ===================== Constants =====================

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "محل تجاري", "مكتب", "مستودع"];
const categories = ["🏠 سكني", "🏢 تجاري"];
const purposes = ["💰 للبيع", "🏡 للإيجار"];

const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف", "نجران", "القصيم", "حائل", "جازان", "ينبع", "الأحساء", "الجبيل", "خميس مشيط", "الباحة", "عرعر", "سكاكا"];

const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "غير مفروشة"];
const facadeOptions = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];

const defaultFeatures = [
  "مسبح خاص", "حديقة", "مصعد", "موقف سيارات", "غرفة خادمة",
  "غرفة سائق", "مجلس", "صالة", "مطبخ مجهز", "تكييف مركزي",
  "تدفئة مركزية", "نظام أمان", "كاميرات مراقبة", "انتركم", "قبو",
  "ملحق خارجي", "شرفة", "تراس", "إطلالة بحرية", "إطلالة حديقة"
];

const defaultHashtags = [
  "#عقارات", "#للبيع", "#للإيجار", "#فيلا", "#شقة", "#أرض",
  "#الرياض", "#جدة", "#استثمار", "#عقار_فاخر", "#تملك",
  "#سكني", "#تجاري", "#مكتب", "#محل"
];

const descriptionTones = ["احترافي", "ودي", "فاخر", "عصري", "تقليدي"];
const descriptionLengths = ["قصير (50 كلمة)", "متوسط (100 كلمة)", "طويل (200 كلمة)"];

// ===================== Component =====================

export default function PropertyPublishForm({ onPublish, onCancel }: PropertyPublishFormProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCustomFeature, setNewCustomFeature] = useState('');
  const [newCustomHashtag, setNewCustomHashtag] = useState('');
  const [newCustomWarranty, setNewCustomWarranty] = useState('');

  const [propertyData, setPropertyData] = useState<PropertyData>({
    propertyType: '',
    category: '',
    purpose: '',
    area: '',
    propertyCategory: '',
    platformPath: '',
    locationDetails: {
      city: '',
      district: '',
      street: '',
      buildingNumber: '',
      postalCode: '',
      additionalNumber: '',
    },
    bedrooms: '',
    bathrooms: '',
    livingRooms: '',
    floors: '',
    propertyAge: '',
    furnishing: '',
    facade: '',
    streetWidth: '',
    features: [],
    customFeatures: [],
    warranties: {
      structuralWarranty: false,
      structuralYears: '',
      acWarranty: false,
      acYears: '',
      plumbingWarranty: false,
      plumbingYears: '',
      electricalWarranty: false,
      electricalYears: '',
      customWarranties: [],
    },
    hashtags: [],
    customHashtags: [],
    aiDescription: '',
    descriptionTone: 'احترافي',
    descriptionLength: 'متوسط (100 كلمة)',
    price: '',
    priceType: 'ريال',
    // معلومات المالك
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerIdNumber: '',
    // معلومات الصك
    deedNumber: '',
    deedDate: '',
    deedCity: '',
  });

  // المسار التلقائي المقترح
  const suggestedPath = useMemo(() => {
    const parts = [];
    if (propertyData.locationDetails.city) parts.push(propertyData.locationDetails.city.replace(/\s+/g, '-'));
    if (propertyData.locationDetails.district) parts.push(propertyData.locationDetails.district.replace(/\s+/g, '-'));
    if (propertyData.propertyType) parts.push(propertyData.propertyType.replace(/\s+/g, '-'));
    if (propertyData.purpose) {
      const purpose = propertyData.purpose.replace('💰 ', '').replace('🏡 ', '').replace(/\s+/g, '-');
      parts.push(purpose);
    }
    return parts.join('/');
  }, [propertyData.locationDetails.city, propertyData.locationDetails.district, propertyData.propertyType, propertyData.purpose]);

  // Toggle Feature
  const toggleFeature = (feature: string) => {
    setPropertyData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  // Add Custom Feature
  const addCustomFeature = () => {
    if (newCustomFeature.trim()) {
      setPropertyData(prev => ({
        ...prev,
        customFeatures: [...prev.customFeatures, newCustomFeature.trim()]
      }));
      setNewCustomFeature('');
    }
  };

  // Toggle Hashtag
  const toggleHashtag = (hashtag: string) => {
    setPropertyData(prev => ({
      ...prev,
      hashtags: prev.hashtags.includes(hashtag)
        ? prev.hashtags.filter(h => h !== hashtag)
        : [...prev.hashtags, hashtag]
    }));
  };

  // Add Custom Hashtag
  const addCustomHashtag = () => {
    if (newCustomHashtag.trim()) {
      const tag = newCustomHashtag.startsWith('#') ? newCustomHashtag.trim() : `#${newCustomHashtag.trim()}`;
      setPropertyData(prev => ({
        ...prev,
        customHashtags: [...prev.customHashtags, tag]
      }));
      setNewCustomHashtag('');
    }
  };

  // Add Custom Warranty
  const addCustomWarranty = () => {
    if (newCustomWarranty.trim()) {
      setPropertyData(prev => ({
        ...prev,
        warranties: {
          ...prev.warranties,
          customWarranties: [...prev.warranties.customWarranties, newCustomWarranty.trim()]
        }
      }));
      setNewCustomWarranty('');
    }
  };

  // Generate AI Description
  const generateAIDescription = async () => {
    setIsGeneratingDescription(true);
    
    // TODO: استدعاء API الذكاء الاصطناعي لتوليد الوصف
    // هذا placeholder حتى يتم ربط Lovable AI
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockDescription = `${propertyData.propertyType} ${propertyData.purpose} في ${propertyData.locationDetails.city}${propertyData.locationDetails.district ? ` - ${propertyData.locationDetails.district}` : ''}. ${propertyData.area ? `المساحة: ${propertyData.area} م².` : ''} ${propertyData.bedrooms ? `${propertyData.bedrooms} غرف نوم.` : ''} ${propertyData.features.length > 0 ? `المميزات: ${propertyData.features.slice(0, 3).join('، ')}.` : ''} عقار مميز بموقع استراتيجي يناسب العائلات والمستثمرين.`;
    
    setPropertyData(prev => ({ ...prev, aiDescription: mockDescription }));
    setIsGeneratingDescription(false);
    toast.success('تم توليد الوصف بنجاح');
  };

  // Published ad manager
  const { publishAdWithCustomerLink } = usePublishedAdsManager();
  const [publishedAd, setPublishedAd] = useState<PublishedAdData | null>(null);
  const [showSuccessActions, setShowSuccessActions] = useState(false);

  // Handle Publish
  const handlePublish = async () => {
    // Validation
    if (!propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city) {
      toast.error('يرجى ملء الحقول المطلوبة: نوع العقار، الغرض، المدينة');
      return;
    }

    if (!propertyData.ownerName || !propertyData.ownerPhone) {
      toast.error('يرجى ملء معلومات المالك: الاسم ورقم الجوال');
      return;
    }

    setIsPublishing(true);
    
    try {
      // Create published ad data
      const adData: PublishedAdData = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...propertyData,
        publishedAt: new Date().toISOString(),
        status: 'published',
      };

      // Publish with customer linking
      const result = await publishAdWithCustomerLink(adData);
      
      if (result.success) {
        setPublishedAd({ ...adData, linkedCustomerId: result.customerId || undefined });
        setShowSuccessActions(true);
        onPublish(propertyData);
        
        // إرسال حدث للتحليلات
        window.dispatchEvent(new CustomEvent('analyticsEvent', {
          detail: { eventType: 'property_published', propertyType: propertyData.propertyType, city: propertyData.locationDetails.city }
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء نشر الإعلان');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle republish
  const handleRepublish = () => {
    setShowSuccessActions(false);
    setPublishedAd(null);
  };

  // Navigate to owner
  const handleNavigateToOwner = (customerId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToPage', { 
      detail: { page: 'crm', customerId } 
    }));
  };

  return (
    <ScrollArea className="h-[80vh]">
      <div className="space-y-6 p-1">
        
        {/* ===================== 1. تفاصيل العقار (256) ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2 text-right">
              <Building className="w-5 h-5" />
              تفاصيل العقار (256)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* نوع العقار */}
            <div>
              <Label className="text-[#01411C] text-right">نوع العقار *</Label>
              <Select 
                value={propertyData.propertyType} 
                onValueChange={(value) => setPropertyData(prev => ({ ...prev, propertyType: value }))}
              >
                <SelectTrigger className="border-[#D4AF37] focus:border-[#01411C] text-right" dir="rtl">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الفئة */}
            <div>
              <Label className="text-[#01411C] text-right">الفئة *</Label>
              <Select 
                value={propertyData.category} 
                onValueChange={(value) => setPropertyData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="border-[#D4AF37] focus:border-[#01411C] text-right" dir="rtl">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الغرض */}
            <div>
              <Label className="text-[#01411C] text-right">الغرض *</Label>
              <Select 
                value={propertyData.purpose} 
                onValueChange={(value) => setPropertyData(prev => ({ ...prev, purpose: value }))}
              >
                <SelectTrigger className="border-[#D4AF37] focus:border-[#01411C] text-right" dir="rtl">
                  <SelectValue placeholder="اختر الغرض" />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* مساحة العقار */}
            <div>
              <Label className="text-[#01411C] text-right">مساحة العقار (م²) *</Label>
              <Input 
                type="number"
                value={propertyData.area}
                onChange={(e) => setPropertyData(prev => ({ ...prev, area: e.target.value }))}
                className="border-[#D4AF37] focus:border-[#01411C] text-right"
                dir="rtl"
              />
            </div>

            {/* التصنيف الذكي */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-5 h-5 text-amber-700" />
                <Label className="text-amber-900 font-bold text-right">التصنيف الذكي *</Label>
                <Badge className="bg-amber-200 text-amber-900 text-xs">جديد</Badge>
              </div>
              <Select 
                value={propertyData.propertyCategory} 
                onValueChange={(value: 'سكني' | 'تجاري') => setPropertyData(prev => ({ ...prev, propertyCategory: value }))}
              >
                <SelectTrigger className="border-amber-400 focus:border-amber-600 text-right bg-white" dir="rtl">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="سكني">🏠 سكني</SelectItem>
                  <SelectItem value="تجاري">🏢 تجاري</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-700 mt-2 text-right">
                💡 هذا التصنيف سيساعد في تنظيم العروض في منصتي بشكل ذكي
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 2. تحديد مسار العرض على المنصة الخاصة ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              تحديد مسار العرض على المنصة الخاصة
            </CardTitle>
            <p className="text-sm text-gray-600">
              نظام تصنيف ديناميكي ذكي يربط الموقع والنوع بالمسار الهرمي الداخلي
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* المسار المحدد حالياً */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-green-700" />
                <h4 className="font-bold text-green-900">المسار المحدد حالياً:</h4>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-white rounded border-2 border-green-400 text-green-800 font-mono text-sm flex-1">
                  apptitie-usertitile.com/
                  <span className="font-bold text-blue-600">
                    {propertyData.platformPath || '(لم يتم التحديد)'}
                  </span>
                </code>
                {propertyData.platformPath && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-700 hover:bg-green-100"
                    onClick={() => window.open(`https://apptitie-usertitile.com/${propertyData.platformPath.replace(/\s*\/\s*/g, '/')}`, '_blank')}
                  >
                    <Link className="w-3 h-3 mr-1" />
                    فتح الرابط
                  </Button>
                )}
              </div>
            </div>

            {/* حقل الإدخال اليدوي */}
            <div>
              <Label className="text-[#01411C] font-bold">إدخال المسار يدوياً</Label>
              <div className="flex gap-2">
                <Input
                  value={propertyData.platformPath}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, platformPath: e.target.value }))}
                  placeholder="city/district/property-type/purpose"
                  className="flex-1 border-[#D4AF37] focus:border-[#01411C] font-mono text-sm"
                  dir="ltr"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPropertyData(prev => ({ ...prev, platformPath: '' }))}
                >
                  مسح
                </Button>
              </div>
            </div>

            {/* المسار التلقائي المقترح */}
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h5 className="font-bold text-blue-900">المسار التلقائي المقترح:</h5>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-white rounded border-2 border-blue-400 text-blue-800 font-mono text-sm flex-1">
                  {suggestedPath || '(أدخل البيانات أعلاه لتوليد المسار)'}
                </code>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setPropertyData(prev => ({ ...prev, platformPath: suggestedPath }))}
                  disabled={!suggestedPath}
                >
                  استخدام
                </Button>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 يتم إنشاؤه تلقائياً من: {propertyData.locationDetails.city || 'المدينة'} / {propertyData.locationDetails.district || 'الحي'} / {propertyData.propertyType || 'النوع'} / {propertyData.purpose || 'الغرض'}
              </p>
            </div>

            {/* حقول الموقع */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">المدينة *</Label>
                <Select 
                  value={propertyData.locationDetails.city} 
                  onValueChange={(value) => setPropertyData(prev => ({ 
                    ...prev, 
                    locationDetails: { ...prev.locationDetails, city: value } 
                  }))}
                >
                  <SelectTrigger className="border-[#D4AF37]" dir="rtl">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">الحي</Label>
                <Input
                  value={propertyData.locationDetails.district}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    locationDetails: { ...prev.locationDetails, district: e.target.value } 
                  }))}
                  placeholder="اسم الحي"
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 3. المواصفات التفصيلية ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Settings className="w-5 h-5" />
              المواصفات التفصيلية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-[#01411C]">غرف النوم</Label>
                <Input
                  type="number"
                  value={propertyData.bedrooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">دورات المياه</Label>
                <Input
                  type="number"
                  value={propertyData.bathrooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الصالات</Label>
                <Input
                  type="number"
                  value={propertyData.livingRooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, livingRooms: e.target.value }))}
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد الأدوار</Label>
                <Input
                  type="number"
                  value={propertyData.floors}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, floors: e.target.value }))}
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-[#01411C]">عمر العقار (سنوات)</Label>
                <Input
                  type="number"
                  value={propertyData.propertyAge}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, propertyAge: e.target.value }))}
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">التأثيث</Label>
                <Select 
                  value={propertyData.furnishing} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, furnishing: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]" dir="rtl">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {furnishingOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">الواجهة</Label>
                <Select 
                  value={propertyData.facade} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, facade: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]" dir="rtl">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {facadeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">عرض الشارع (م)</Label>
                <Input
                  type="number"
                  value={propertyData.streetWidth}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, streetWidth: e.target.value }))}
                  className="border-[#D4AF37]"
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 4. المميزات المخصصة (266) ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Star className="w-5 h-5" />
              المميزات المخصصة (266)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* المميزات الافتراضية */}
            <div className="flex flex-wrap gap-2">
              {defaultFeatures.map((feature) => (
                <Badge
                  key={feature}
                  variant={propertyData.features.includes(feature) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    propertyData.features.includes(feature) 
                      ? 'bg-[#01411C] text-white hover:bg-[#01411C]/90' 
                      : 'border-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/10'
                  }`}
                  onClick={() => toggleFeature(feature)}
                >
                  {propertyData.features.includes(feature) && <CheckCircle className="w-3 h-3 mr-1" />}
                  {feature}
                </Badge>
              ))}
            </div>

            {/* المميزات المخصصة */}
            {propertyData.customFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {propertyData.customFeatures.map((feature, idx) => (
                  <Badge
                    key={idx}
                    className="bg-[#D4AF37] text-[#01411C] cursor-pointer"
                    onClick={() => setPropertyData(prev => ({
                      ...prev,
                      customFeatures: prev.customFeatures.filter((_, i) => i !== idx)
                    }))}
                  >
                    {feature}
                    <span className="mr-1">×</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* إضافة ميزة مخصصة */}
            <div className="flex gap-2">
              <Input
                value={newCustomFeature}
                onChange={(e) => setNewCustomFeature(e.target.value)}
                placeholder="أضف ميزة مخصصة..."
                className="border-[#D4AF37]"
                dir="rtl"
                onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
              />
              <Button onClick={addCustomFeature} variant="outline" className="border-[#01411C] text-[#01411C]">
                إضافة
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              المميزات المحددة: {propertyData.features.length + propertyData.customFeatures.length}
            </p>
          </CardContent>
        </Card>

        {/* ===================== 5. الضمانات والكفالات ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              الضمانات والكفالات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* ضمان الهيكل */}
              <div className="flex items-center gap-3 p-3 border rounded-lg border-gray-200">
                <Checkbox
                  checked={propertyData.warranties.structuralWarranty}
                  onCheckedChange={(checked) => setPropertyData(prev => ({
                    ...prev,
                    warranties: { ...prev.warranties, structuralWarranty: checked as boolean }
                  }))}
                />
                <div className="flex-1">
                  <Label>ضمان الهيكل الإنشائي</Label>
                  {propertyData.warranties.structuralWarranty && (
                    <Input
                      type="number"
                      placeholder="عدد السنوات"
                      value={propertyData.warranties.structuralYears}
                      onChange={(e) => setPropertyData(prev => ({
                        ...prev,
                        warranties: { ...prev.warranties, structuralYears: e.target.value }
                      }))}
                      className="mt-2 h-8 text-sm"
                      dir="rtl"
                    />
                  )}
                </div>
              </div>

              {/* ضمان التكييف */}
              <div className="flex items-center gap-3 p-3 border rounded-lg border-gray-200">
                <Checkbox
                  checked={propertyData.warranties.acWarranty}
                  onCheckedChange={(checked) => setPropertyData(prev => ({
                    ...prev,
                    warranties: { ...prev.warranties, acWarranty: checked as boolean }
                  }))}
                />
                <div className="flex-1">
                  <Label>ضمان التكييف</Label>
                  {propertyData.warranties.acWarranty && (
                    <Input
                      type="number"
                      placeholder="عدد السنوات"
                      value={propertyData.warranties.acYears}
                      onChange={(e) => setPropertyData(prev => ({
                        ...prev,
                        warranties: { ...prev.warranties, acYears: e.target.value }
                      }))}
                      className="mt-2 h-8 text-sm"
                      dir="rtl"
                    />
                  )}
                </div>
              </div>

              {/* ضمان السباكة */}
              <div className="flex items-center gap-3 p-3 border rounded-lg border-gray-200">
                <Checkbox
                  checked={propertyData.warranties.plumbingWarranty}
                  onCheckedChange={(checked) => setPropertyData(prev => ({
                    ...prev,
                    warranties: { ...prev.warranties, plumbingWarranty: checked as boolean }
                  }))}
                />
                <div className="flex-1">
                  <Label>ضمان السباكة</Label>
                  {propertyData.warranties.plumbingWarranty && (
                    <Input
                      type="number"
                      placeholder="عدد السنوات"
                      value={propertyData.warranties.plumbingYears}
                      onChange={(e) => setPropertyData(prev => ({
                        ...prev,
                        warranties: { ...prev.warranties, plumbingYears: e.target.value }
                      }))}
                      className="mt-2 h-8 text-sm"
                      dir="rtl"
                    />
                  )}
                </div>
              </div>

              {/* ضمان الكهرباء */}
              <div className="flex items-center gap-3 p-3 border rounded-lg border-gray-200">
                <Checkbox
                  checked={propertyData.warranties.electricalWarranty}
                  onCheckedChange={(checked) => setPropertyData(prev => ({
                    ...prev,
                    warranties: { ...prev.warranties, electricalWarranty: checked as boolean }
                  }))}
                />
                <div className="flex-1">
                  <Label>ضمان الكهرباء</Label>
                  {propertyData.warranties.electricalWarranty && (
                    <Input
                      type="number"
                      placeholder="عدد السنوات"
                      value={propertyData.warranties.electricalYears}
                      onChange={(e) => setPropertyData(prev => ({
                        ...prev,
                        warranties: { ...prev.warranties, electricalYears: e.target.value }
                      }))}
                      className="mt-2 h-8 text-sm"
                      dir="rtl"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ضمانات مخصصة */}
            {propertyData.warranties.customWarranties.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {propertyData.warranties.customWarranties.map((warranty, idx) => (
                  <Badge
                    key={idx}
                    className="bg-green-100 text-green-800 cursor-pointer"
                    onClick={() => setPropertyData(prev => ({
                      ...prev,
                      warranties: {
                        ...prev.warranties,
                        customWarranties: prev.warranties.customWarranties.filter((_, i) => i !== idx)
                      }
                    }))}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {warranty}
                    <span className="mr-1">×</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* إضافة ضمان مخصص */}
            <div className="flex gap-2">
              <Input
                value={newCustomWarranty}
                onChange={(e) => setNewCustomWarranty(e.target.value)}
                placeholder="أضف ضمان مخصص..."
                className="border-[#D4AF37]"
                dir="rtl"
                onKeyPress={(e) => e.key === 'Enter' && addCustomWarranty()}
              />
              <Button onClick={addCustomWarranty} variant="outline" className="border-[#01411C] text-[#01411C]">
                إضافة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 6. الهاشتاقات التلقائية ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Hash className="w-5 h-5" />
              الهاشتاقات التلقائية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* الهاشتاقات الافتراضية */}
            <div className="flex flex-wrap gap-2">
              {defaultHashtags.map((hashtag) => (
                <Badge
                  key={hashtag}
                  variant={propertyData.hashtags.includes(hashtag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    propertyData.hashtags.includes(hashtag) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'border-blue-400 text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => toggleHashtag(hashtag)}
                >
                  {hashtag}
                </Badge>
              ))}
            </div>

            {/* الهاشتاقات المخصصة */}
            {propertyData.customHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {propertyData.customHashtags.map((hashtag, idx) => (
                  <Badge
                    key={idx}
                    className="bg-purple-100 text-purple-800 cursor-pointer"
                    onClick={() => setPropertyData(prev => ({
                      ...prev,
                      customHashtags: prev.customHashtags.filter((_, i) => i !== idx)
                    }))}
                  >
                    {hashtag}
                    <span className="mr-1">×</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* إضافة هاشتاق مخصص */}
            <div className="flex gap-2">
              <Input
                value={newCustomHashtag}
                onChange={(e) => setNewCustomHashtag(e.target.value)}
                placeholder="#أضف_هاشتاق"
                className="border-[#D4AF37]"
                dir="rtl"
                onKeyPress={(e) => e.key === 'Enter' && addCustomHashtag()}
              />
              <Button onClick={addCustomHashtag} variant="outline" className="border-blue-600 text-blue-600">
                إضافة
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              الهاشتاقات المحددة: {propertyData.hashtags.length + propertyData.customHashtags.length}
            </p>
          </CardContent>
        </Card>

        {/* ===================== 7. مولد الوصف AI (378) ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              مولد الوصف AI (378)
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">ذكاء اصطناعي</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* إعدادات الوصف */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">نبرة الوصف</Label>
                <Select 
                  value={propertyData.descriptionTone} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, descriptionTone: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {descriptionTones.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">طول الوصف</Label>
                <Select 
                  value={propertyData.descriptionLength} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, descriptionLength: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {descriptionLengths.map((length) => (
                      <SelectItem key={length} value={length}>{length}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* زر التوليد */}
            <Button
              onClick={generateAIDescription}
              disabled={isGeneratingDescription || !propertyData.propertyType}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isGeneratingDescription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  توليد الوصف بالذكاء الاصطناعي
                </>
              )}
            </Button>

            {/* الوصف المولد */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#01411C]">الوصف</Label>
                {propertyData.aiDescription && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(propertyData.aiDescription)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      نسخ
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={generateAIDescription}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      إعادة
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                value={propertyData.aiDescription}
                onChange={(e) => setPropertyData(prev => ({ ...prev, aiDescription: e.target.value }))}
                placeholder="اضغط على زر التوليد أعلاه لإنشاء وصف تلقائي للعقار..."
                className="border-[#D4AF37] min-h-[120px]"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        {/* ===================== 8. زر نشر الإعلان ===================== */}
        <Card className="border-2 border-[#01411C] bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
          <CardContent className="p-6">
            {/* ملخص سريع */}
            <div className="mb-4 p-4 bg-white rounded-lg border">
              <h4 className="font-bold text-[#01411C] mb-2">ملخص الإعلان:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">النوع:</span>{' '}
                  <span className="font-medium">{propertyData.propertyType || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">الغرض:</span>{' '}
                  <span className="font-medium">{propertyData.purpose || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">المدينة:</span>{' '}
                  <span className="font-medium">{propertyData.locationDetails.city || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">المساحة:</span>{' '}
                  <span className="font-medium">{propertyData.area ? `${propertyData.area} م²` : '-'}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {propertyData.features.slice(0, 5).map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
                {propertyData.features.length > 5 && (
                  <Badge variant="outline" className="text-xs">+{propertyData.features.length - 5}</Badge>
                )}
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-gray-300"
              >
                إلغاء
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city}
                className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90 text-[#D4AF37] font-bold text-lg py-6"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    نشر الإعلان
                  </>
                )}
              </Button>
            </div>

            {/* تحذير الحقول المطلوبة */}
            {(!propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city) && (
              <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                يرجى ملء الحقول المطلوبة: نوع العقار، الغرض، المدينة
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}
