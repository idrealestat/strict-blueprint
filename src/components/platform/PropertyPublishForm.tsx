/**
 * PropertyPublishForm.tsx
 * نموذج نشر الإعلان الكامل - 12 قسم
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Navigation,
  Plus,
  DollarSign,
  Calendar,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { usePublishedAdsManager, PublishedAdData, findCustomerByPhone } from "@/hooks/usePublishedAdsManager";
import PublishSuccessActions from "./PublishSuccessActions";

// ===================== Types =====================

interface PropertyData {
  // 1. معلومات المالك
  ownerName: string;
  ownerBirthDate: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerCity: string;
  ownerDistrict: string;

  // 2. معلومات الصك
  deedNumber: string;
  deedDate: string;
  deedCity: string;

  // 3. معلومات العقار
  propertyType: string;
  category: string;
  area: string;
  purpose: string;

  // 4. الموقع
  locationDetails: {
    city: string;
    district: string;
    street: string;
    buildingNumber: string;
    postalCode: string;
    additionalNumber: string;
    latitude: number;
    longitude: number;
  };

  // 5. المسار الذكي (تلقائي)
  smartPath: string;

  // 6. المواصفات التفصيلية
  floors: string;
  livingRooms: string;
  councils: string;
  bedrooms: string;
  bathrooms: string;
  streetWidth: string;
  facade: string;
  furnishing: string;
  propertyAge: string;

  // 7. معلومات إضافية
  entrances: string;
  warehouses: string;
  hasLaundryRoom: boolean;
  balconies: string;
  acUnits: string;
  curtains: string;
  hasExtraKitchen: boolean;
  extraKitchenAppliances: string;

  // 8. المميزات المخصصة
  features: string[];
  customFeatures: string[];

  // 9. الضمانات والكفالات
  warranties: {
    type: string;
    duration: string;
  }[];

  // 10. مولد الأسعار الذكي
  price: string;
  priceSource: string;
  priceStatus: string; // أقل من السوق / مناسب / مبالغ فيه
  paymentOption: string; // للإيجار فقط
  paymentPrices: {
    onePayment: string;
    twoPayments: string;
    fourPayments: string;
    monthly: string;
  };
  collaborateWithCompany: string; // رايز / أقساط

  // 11. الهاشتاقات التلقائية
  hashtags: string[];
  customHashtags: string[];

  // 12. مولد الوصف
  brokerPhone: string;
  adLicense: string;
  descriptionLength: string;
  descriptionLanguage: string;
  descriptionStyle: string;
  aiDescription: string;
}

interface PropertyPublishFormProps {
  onPublish: (data: PropertyData) => void;
  onCancel: () => void;
  user?: {
    name?: string;
    phone?: string;
  };
}

// ===================== Constants =====================

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "أرض زراعية", "استراحة"];
const categories = ["سكني", "تجاري", "صناعي", "زراعي"];
const purposes = ["للبيع", "للإيجار"];

const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف", "نجران", "القصيم", "حائل", "جازان", "ينبع", "الأحساء", "الجبيل", "خميس مشيط", "الباحة", "عرعر", "سكاكا"];

const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "مطبخ مؤثث", "غير مؤثث"];
const facadeOptions = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];
const entranceOptions = ["مدخل", "مدخلين", "ثلاث مداخل أو أكثر"];

const warrantyTypes = [
  "ضمان التكييف",
  "الهيكل الإنشائي",
  "العيوب الخفية",
  "الكهرباء",
  "السباكة",
  "شبابيك الألمنيوم",
  "الأبواب",
  "الأدوات الصحية لدورات المياه",
  "الصنابير",
  "السخانات",
  "مقابس التيار الكهربائي والتشغيل والإغلاق",
  "الأنوار",
  "العوازل",
];

const defaultFeatures = [
  "مسبح خاص", "حديقة", "مصعد", "موقف سيارات", "غرفة خادمة",
  "غرفة سائق", "مجلس", "صالة", "مطبخ مجهز", "تكييف مركزي",
  "تدفئة مركزية", "نظام أمان", "كاميرات مراقبة", "انتركم", "قبو",
  "ملحق خارجي", "شرفة", "تراس", "إطلالة بحرية", "إطلالة حديقة"
];

// ===================== Component =====================

export default function PropertyPublishForm({ onPublish, onCancel, user }: PropertyPublishFormProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingPrices, setIsGeneratingPrices] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCustomFeature, setNewCustomFeature] = useState('');
  const [newCustomHashtag, setNewCustomHashtag] = useState('');
  const [newWarrantyType, setNewWarrantyType] = useState('');
  const [newWarrantyDuration, setNewWarrantyDuration] = useState('');
  const [customWarrantyType, setCustomWarrantyType] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [suggestedPrices, setSuggestedPrices] = useState<{source: string; price: string}[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [propertyData, setPropertyData] = useState<PropertyData>({
    // 1. معلومات المالك
    ownerName: '',
    ownerBirthDate: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerCity: '',
    ownerDistrict: '',
    
    // 2. معلومات الصك
    deedNumber: '',
    deedDate: '',
    deedCity: '',
    
    // 3. معلومات العقار
    propertyType: '',
    category: '',
    area: '',
    purpose: '',
    
    // 4. الموقع
    locationDetails: {
      city: '',
      district: '',
      street: '',
      buildingNumber: '',
      postalCode: '',
      additionalNumber: '',
      latitude: 24.7136,
      longitude: 46.6753,
    },
    
    // 5. المسار الذكي
    smartPath: '',
    
    // 6. المواصفات التفصيلية
    floors: '',
    livingRooms: '',
    councils: '',
    bedrooms: '',
    bathrooms: '',
    streetWidth: '',
    facade: '',
    furnishing: '',
    propertyAge: '',
    
    // 7. معلومات إضافية
    entrances: '',
    warehouses: '',
    hasLaundryRoom: false,
    balconies: '',
    acUnits: '',
    curtains: '',
    hasExtraKitchen: false,
    extraKitchenAppliances: '',
    
    // 8. المميزات المخصصة
    features: [],
    customFeatures: [],
    
    // 9. الضمانات والكفالات
    warranties: [],
    
    // 10. مولد الأسعار الذكي
    price: '',
    priceSource: '',
    priceStatus: '',
    paymentOption: '',
    paymentPrices: {
      onePayment: '',
      twoPayments: '',
      fourPayments: '',
      monthly: '',
    },
    collaborateWithCompany: '',
    
    // 11. الهاشتاقات
    hashtags: [],
    customHashtags: [],
    
    // 12. مولد الوصف
    brokerPhone: user?.phone || '',
    adLicense: '',
    descriptionLength: 'متوسط',
    descriptionLanguage: 'عربي',
    descriptionStyle: 'احترافي',
    aiDescription: '',
  });

  // المسار الذكي التلقائي
  const smartPath = useMemo(() => {
    const parts = [];
    if (propertyData.category) parts.push(propertyData.category);
    if (propertyData.purpose) parts.push(propertyData.purpose);
    if (propertyData.locationDetails.city) parts.push(propertyData.locationDetails.city);
    if (propertyData.locationDetails.district) parts.push(`حي ${propertyData.locationDetails.district}`);
    return parts.join(' / ');
  }, [propertyData.category, propertyData.purpose, propertyData.locationDetails.city, propertyData.locationDetails.district]);

  // تحديث المسار الذكي تلقائياً
  useEffect(() => {
    setPropertyData(prev => ({ ...prev, smartPath }));
  }, [smartPath]);

  // الهاشتاقات التلقائية
  const autoHashtags = useMemo(() => {
    const tags: string[] = [];
    if (propertyData.propertyType) tags.push(`#${propertyData.propertyType}`);
    if (propertyData.category) tags.push(`#${propertyData.category}`);
    if (propertyData.purpose) tags.push(`#${propertyData.purpose.replace('لل', '')}`);
    if (propertyData.locationDetails.city) tags.push(`#${propertyData.locationDetails.city}`);
    if (propertyData.locationDetails.district) tags.push(`#${propertyData.locationDetails.district}`);
    if (propertyData.area) tags.push(`#مساحة_${propertyData.area}م`);
    if (propertyData.bedrooms) tags.push(`#${propertyData.bedrooms}_غرف`);
    if (propertyData.furnishing) tags.push(`#${propertyData.furnishing.replace(/\s/g, '_')}`);
    tags.push('#عقارات', '#عقار', '#السعودية');
    return tags;
  }, [propertyData]);

  // جلب تفاصيل العنوان من الإحداثيات
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        setPropertyData(prev => ({
          ...prev,
          locationDetails: {
            ...prev.locationDetails,
            city: addr.city || addr.town || addr.village || addr.state || '',
            district: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
            street: addr.road || addr.street || '',
            postalCode: addr.postcode || '',
            buildingNumber: addr.house_number || '',
            additionalNumber: Math.floor(1000 + Math.random() * 9000).toString(),
            latitude: lat,
            longitude: lng,
          }
        }));
        toast.success('تم تحديد الموقع بنجاح');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('فشل في جلب تفاصيل العنوان');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const L = (window as any).L;
        
        const map = L.map(mapRef.current).setView([propertyData.locationDetails.latitude, propertyData.locationDetails.longitude], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        const marker = L.marker([propertyData.locationDetails.latitude, propertyData.locationDetails.longitude], {
          draggable: true
        }).addTo(map);
        
        marker.on('dragend', function(e: any) {
          const position = marker.getLatLng();
          fetchAddressFromCoordinates(position.lat, position.lng);
        });
        
        map.on('click', function(e: any) {
          marker.setLatLng(e.latlng);
          fetchAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
        });
        
        mapInstanceRef.current = map;
        markerRef.current = marker;
      };
      document.head.appendChild(script);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap]);

  // الحصول على الموقع الحالي
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
          }
          
          fetchAddressFromCoordinates(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('فشل في الحصول على الموقع الحالي');
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error('المتصفح لا يدعم خدمة تحديد الموقع');
    }
  };

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

  // Add Warranty
  const addWarranty = () => {
    const warrantyType = newWarrantyType === 'أخرى' ? customWarrantyType : newWarrantyType;
    if (warrantyType && newWarrantyDuration) {
      setPropertyData(prev => ({
        ...prev,
        warranties: [...prev.warranties, { type: warrantyType, duration: newWarrantyDuration }]
      }));
      setNewWarrantyType('');
      setNewWarrantyDuration('');
      setCustomWarrantyType('');
    }
  };

  // Remove Warranty
  const removeWarranty = (index: number) => {
    setPropertyData(prev => ({
      ...prev,
      warranties: prev.warranties.filter((_, i) => i !== index)
    }));
  };

  // مولد الأسعار الذكي
  const generateSmartPrices = async () => {
    setIsGeneratingPrices(true);
    
    // محاكاة البحث عن الأسعار
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const basePrice = parseInt(propertyData.area) * (propertyData.purpose === 'للإيجار' ? 50 : 3000);
    const variation = basePrice * 0.15;
    
    setSuggestedPrices([
      { source: 'موقع عقار', price: Math.round(basePrice + variation * 0.1).toLocaleString() },
      { source: 'عقار ساس', price: Math.round(basePrice - variation * 0.05).toLocaleString() },
      { source: 'المؤشرات العقارية', price: Math.round(basePrice).toLocaleString() },
    ]);
    
    setIsGeneratingPrices(false);
    toast.success('تم توليد الأسعار المقترحة');
  };

  // Generate AI Description
  const generateAIDescription = async () => {
    setIsGeneratingDescription(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const purposeText = propertyData.purpose;
    const typeText = propertyData.propertyType;
    const areaText = propertyData.area;
    const districtText = propertyData.locationDetails.district;
    const cityText = propertyData.locationDetails.city;
    
    let description = `${purposeText} ${typeText} ${areaText ? `بمساحة ${areaText} م²` : ''} في ${districtText ? `حي ${districtText}،` : ''} ${cityText}.\n\n`;
    
    if (propertyData.bedrooms) description += `عدد غرف النوم: ${propertyData.bedrooms}\n`;
    if (propertyData.bathrooms) description += `عدد دورات المياه: ${propertyData.bathrooms}\n`;
    if (propertyData.livingRooms) description += `عدد الصالات: ${propertyData.livingRooms}\n`;
    if (propertyData.councils) description += `عدد المجالس: ${propertyData.councils}\n`;
    if (propertyData.floors) description += `عدد الأدوار: ${propertyData.floors}\n`;
    if (propertyData.furnishing) description += `التأثيث: ${propertyData.furnishing}\n`;
    if (propertyData.propertyAge) description += `عمر العقار: ${propertyData.propertyAge} سنوات\n`;
    
    if (propertyData.features.length > 0) {
      description += `\nالمميزات: ${propertyData.features.join('، ')}\n`;
    }
    
    if (propertyData.warranties.length > 0) {
      description += `\nالضمانات: ${propertyData.warranties.map(w => `${w.type} (${w.duration})`).join('، ')}\n`;
    }
    
    if (propertyData.adLicense) {
      description += `\nترخيص إعلاني: ${propertyData.adLicense}\n`;
    }
    
    if (propertyData.brokerPhone) {
      description += `للتواصل والاستفسار: ${propertyData.brokerPhone}`;
    }
    
    setPropertyData(prev => ({ ...prev, aiDescription: description }));
    setIsGeneratingDescription(false);
    toast.success('تم توليد الوصف بنجاح');
  };

  // Published ad manager
  const { publishAdWithCustomerLink } = usePublishedAdsManager();
  const [publishedAd, setPublishedAd] = useState<PublishedAdData | null>(null);
  const [showSuccessActions, setShowSuccessActions] = useState(false);

  // Handle Publish
  const handlePublish = async () => {
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
      const adData: PublishedAdData = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...propertyData,
        publishedAt: new Date().toISOString(),
        status: 'published',
      };

      const result = await publishAdWithCustomerLink(adData);
      
      if (result.success) {
        setPublishedAd({ ...adData, linkedCustomerId: result.customerId || undefined });
        setShowSuccessActions(true);
        onPublish(propertyData);
        
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

  const handleRepublish = () => {
    setShowSuccessActions(false);
    setPublishedAd(null);
  };

  const handleNavigateToOwner = (customerId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToPage', { 
      detail: { page: 'crm', customerId } 
    }));
  };

  return (
    <ScrollArea className="h-[80vh]">
      <div className="space-y-6 p-1" dir="rtl">
        
        {/* ===================== 1. معلومات المالك ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات المالك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">الاسم كاملاً *</Label>
                <Input
                  value={propertyData.ownerName}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="اسم المالك الرباعي"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={propertyData.ownerBirthDate}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, ownerBirthDate: e.target.value }))}
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">رقم الجوال *</Label>
                <Input
                  value={propertyData.ownerPhone}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={propertyData.ownerEmail}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  placeholder="example@email.com"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">المدينة (عنوان السكن)</Label>
                <Select 
                  value={propertyData.ownerCity} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, ownerCity: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
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
                  value={propertyData.ownerDistrict}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, ownerDistrict: e.target.value }))}
                  placeholder="اسم الحي"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 2. معلومات الصك ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              معلومات الصك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#01411C]">رقم الصك</Label>
                <Input
                  value={propertyData.deedNumber}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, deedNumber: e.target.value }))}
                  placeholder="رقم الصك"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">تاريخ الصك</Label>
                <Input
                  type="date"
                  value={propertyData.deedDate}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, deedDate: e.target.value }))}
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">مدينة الصك</Label>
                <Select 
                  value={propertyData.deedCity} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, deedCity: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 3. معلومات العقار ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Building className="w-5 h-5" />
              معلومات العقار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-[#01411C]">نوع العقار *</Label>
                <Select 
                  value={propertyData.propertyType} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, propertyType: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">الفئة *</Label>
                <Select 
                  value={propertyData.category} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">مساحة العقار (م²) *</Label>
                <Input
                  type="number"
                  value={propertyData.area}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="المساحة"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الغرض *</Label>
                <Select 
                  value={propertyData.purpose} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, purpose: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر الغرض" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 4. الموقع ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              الموقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">حدد الموقع على الخريطة للتعبئة التلقائية</span>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                onClick={() => setShowMap(!showMap)}
              >
                <MapPin className="w-4 h-4" />
                {showMap ? 'إخفاء الخريطة' : 'فتح الخريطة'}
              </Button>
            </div>

            {showMap && (
              <div className="space-y-4">
                <div 
                  ref={mapRef}
                  className="w-full h-64 rounded-lg border border-gray-200 bg-gray-100"
                />
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  تحديد موقعي الحالي
                </Button>
              </div>
            )}

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
                  <SelectTrigger className="border-[#D4AF37]">
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
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الشارع</Label>
                <Input
                  value={propertyData.locationDetails.street}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    locationDetails: { ...prev.locationDetails, street: e.target.value } 
                  }))}
                  placeholder="اسم الشارع"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الرمز البريدي</Label>
                <Input
                  value={propertyData.locationDetails.postalCode}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    locationDetails: { ...prev.locationDetails, postalCode: e.target.value } 
                  }))}
                  placeholder="12345"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">رقم المبنى</Label>
                <Input
                  value={propertyData.locationDetails.buildingNumber}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    locationDetails: { ...prev.locationDetails, buildingNumber: e.target.value } 
                  }))}
                  placeholder="1234"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الرقم الإضافي</Label>
                <Input
                  value={propertyData.locationDetails.additionalNumber}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    locationDetails: { ...prev.locationDetails, additionalNumber: e.target.value } 
                  }))}
                  placeholder="5678"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 5. المسار الذكي ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              تحديد المسار الذكي
              <Badge className="bg-purple-100 text-purple-700 text-xs">تلقائي</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-purple-700" />
                <h4 className="font-bold text-purple-900">المسار الحالي:</h4>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {smartPath ? (
                  smartPath.split(' / ').map((part, index) => (
                    <span key={index} className="flex items-center">
                      <Badge className="bg-white text-purple-800 border border-purple-300">
                        {part}
                      </Badge>
                      {index < smartPath.split(' / ').length - 1 && (
                        <span className="mx-1 text-purple-400">/</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-purple-600 text-sm">يتم بناء المسار تلقائياً من البيانات المدخلة</span>
                )}
              </div>
              <p className="text-xs text-purple-600 mt-3">
                💡 المسار يُبنى من: الفئة ← الغرض ← المدينة ← الحي
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 6. المواصفات التفصيلية ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Settings className="w-5 h-5" />
              المواصفات التفصيلية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[#01411C]">عدد الأدوار</Label>
                <Input
                  type="number"
                  value={propertyData.floors}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, floors: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد الصالات</Label>
                <Input
                  type="number"
                  value={propertyData.livingRooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, livingRooms: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد المجالس</Label>
                <Input
                  type="number"
                  value={propertyData.councils}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, councils: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد غرف النوم</Label>
                <Input
                  type="number"
                  value={propertyData.bedrooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد دورات المياه</Label>
                <Input
                  type="number"
                  value={propertyData.bathrooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عرض الشارع (م)</Label>
                <Input
                  type="number"
                  value={propertyData.streetWidth}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, streetWidth: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الواجهة</Label>
                <Select 
                  value={propertyData.facade} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, facade: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
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
                <Label className="text-[#01411C]">التأثيث</Label>
                <Select 
                  value={propertyData.furnishing} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, furnishing: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
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
                <Label className="text-[#01411C]">عمر العقار (سنوات)</Label>
                <Input
                  type="number"
                  value={propertyData.propertyAge}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, propertyAge: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 7. معلومات إضافية ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Info className="w-5 h-5" />
              معلومات إضافية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[#01411C]">عدد المداخل</Label>
                <Select 
                  value={propertyData.entrances} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, entrances: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {entranceOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">عدد المستودعات</Label>
                <Input
                  type="number"
                  value={propertyData.warehouses}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, warehouses: e.target.value }))}
                  className="border-[#D4AF37]"
                  placeholder="إن وجد"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Checkbox
                  id="hasLaundryRoom"
                  checked={propertyData.hasLaundryRoom}
                  onCheckedChange={(checked) => setPropertyData(prev => ({ ...prev, hasLaundryRoom: checked as boolean }))}
                />
                <Label htmlFor="hasLaundryRoom" className="text-[#01411C]">يوجد غرفة غسيل</Label>
              </div>
              <div>
                <Label className="text-[#01411C]">عدد البلكونات</Label>
                <Input
                  type="number"
                  value={propertyData.balconies}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, balconies: e.target.value }))}
                  className="border-[#D4AF37]"
                  placeholder="إن وجد"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد المكيفات</Label>
                <Input
                  type="number"
                  value={propertyData.acUnits}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, acUnits: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">عدد الستائر</Label>
                <Input
                  type="number"
                  value={propertyData.curtains}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, curtains: e.target.value }))}
                  className="border-[#D4AF37]"
                />
              </div>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="hasExtraKitchen"
                  checked={propertyData.hasExtraKitchen}
                  onCheckedChange={(checked) => setPropertyData(prev => ({ ...prev, hasExtraKitchen: checked as boolean }))}
                />
                <Label htmlFor="hasExtraKitchen" className="text-[#01411C]">يوجد مطبخ داخلي آخر</Label>
              </div>
              {propertyData.hasExtraKitchen && (
                <div>
                  <Label className="text-[#01411C]">الأجهزة الراكبة بالمطبخ</Label>
                  <Textarea
                    value={propertyData.extraKitchenAppliances}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, extraKitchenAppliances: e.target.value }))}
                    placeholder="اذكر الأجهزة الموجودة (فرن، ثلاجة، غسالة صحون...)"
                    className="border-[#D4AF37] mt-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===================== 8. المميزات المخصصة ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Star className="w-5 h-5" />
              المميزات المخصصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
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
                  {propertyData.features.includes(feature) && <CheckCircle className="w-3 h-3 ml-1" />}
                  {feature}
                </Badge>
              ))}
            </div>

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

            <div className="flex gap-2">
              <Input
                value={newCustomFeature}
                onChange={(e) => setNewCustomFeature(e.target.value)}
                placeholder="أضف ميزة مخصصة..."
                className="border-[#D4AF37]"
                onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
              />
              <Button onClick={addCustomFeature} variant="outline" className="border-[#01411C] text-[#01411C]">
                إضافة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 9. الضمانات والكفالات ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              الضمانات والكفالات
              <Button size="sm" variant="ghost" className="mr-auto" onClick={() => {
                if (newWarrantyType && newWarrantyDuration) {
                  addWarranty();
                }
              }}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[#01411C]">نوع الضمان</Label>
                <Select 
                  value={newWarrantyType} 
                  onValueChange={(value) => setNewWarrantyType(value)}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر نوع الضمان" />
                  </SelectTrigger>
                  <SelectContent>
                    {warrantyTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newWarrantyType === 'أخرى' && (
                <div>
                  <Label className="text-[#01411C]">اكتب نوع الضمان</Label>
                  <Input
                    value={customWarrantyType}
                    onChange={(e) => setCustomWarrantyType(e.target.value)}
                    placeholder="نوع الضمان"
                    className="border-[#D4AF37]"
                  />
                </div>
              )}
              <div>
                <Label className="text-[#01411C]">مدة الضمان</Label>
                <Input
                  value={newWarrantyDuration}
                  onChange={(e) => setNewWarrantyDuration(e.target.value)}
                  placeholder="مثال: سنة، سنتين، 5 سنوات"
                  className="border-[#D4AF37]"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addWarranty} 
                  className="bg-[#01411C] hover:bg-[#01411C]/90 text-white w-full"
                  disabled={!newWarrantyType || !newWarrantyDuration}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة ضمان
                </Button>
              </div>
            </div>

            {propertyData.warranties.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <Label className="text-[#01411C] font-bold">الضمانات المضافة:</Label>
                {propertyData.warranties.map((warranty, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{warranty.type}</span>
                      <Badge variant="outline" className="bg-white">{warranty.duration}</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeWarranty(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================== 10. مولد الأسعار الذكي ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              مولد الأسعار الذكي
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs">AI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                مصادر التسعير: موقع عقار، عقار ساس، المؤشرات العقارية
              </p>
              <Button
                onClick={generateSmartPrices}
                disabled={isGeneratingPrices || !propertyData.area || !propertyData.locationDetails.city}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingPrices ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري البحث عن الأسعار...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 ml-2" />
                    توليد الأسعار المقترحة
                  </>
                )}
              </Button>
            </div>

            {suggestedPrices.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[#01411C] font-bold">الأسعار المقترحة:</Label>
                <RadioGroup 
                  value={propertyData.priceSource}
                  onValueChange={(value) => {
                    const selected = suggestedPrices.find(p => p.source === value);
                    if (selected) {
                      setPropertyData(prev => ({ 
                        ...prev, 
                        priceSource: value,
                        price: selected.price.replace(/,/g, '')
                      }));
                    }
                  }}
                >
                  {suggestedPrices.map((suggestion, idx) => (
                    <div key={idx} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={suggestion.source} id={`price-${idx}`} />
                      <Label htmlFor={`price-${idx}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{suggestion.source}:</span>
                        <span className="text-emerald-600 font-bold mr-2">{suggestion.price} ريال</span>
                      </Label>
                      <a 
                        href={suggestion.source === 'موقع عقار' ? 'https://sa.aqar.fm/' : 
                              suggestion.source === 'عقار ساس' ? 'https://aqarsas.sa/' : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">السعر المختار (ريال)</Label>
                <Input
                  type="number"
                  value={propertyData.price}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="أدخل السعر"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">تقييم السعر</Label>
                <Select 
                  value={propertyData.priceStatus} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, priceStatus: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أقل من السوق">أقل من سعر السوق</SelectItem>
                    <SelectItem value="مناسب">مناسب لسعر السوق</SelectItem>
                    <SelectItem value="مبالغ فيه">مبالغ فيه وأعلى من السوق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* خيارات الإيجار */}
            {propertyData.purpose === 'للإيجار' && (
              <div className="border-t pt-4 space-y-4">
                <Label className="text-[#01411C] font-bold">الدفعات المطلوبة:</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">دفعة واحدة</Label>
                    <Input
                      type="number"
                      value={propertyData.paymentPrices.onePayment}
                      onChange={(e) => setPropertyData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, onePayment: e.target.value }
                      }))}
                      placeholder="السعر"
                      className="border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">دفعتين</Label>
                    <Input
                      type="number"
                      value={propertyData.paymentPrices.twoPayments}
                      onChange={(e) => setPropertyData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, twoPayments: e.target.value }
                      }))}
                      placeholder="السعر"
                      className="border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">أربع دفعات</Label>
                    <Input
                      type="number"
                      value={propertyData.paymentPrices.fourPayments}
                      onChange={(e) => setPropertyData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, fourPayments: e.target.value }
                      }))}
                      placeholder="السعر"
                      className="border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">شهري</Label>
                    <Input
                      type="number"
                      value={propertyData.paymentPrices.monthly}
                      onChange={(e) => setPropertyData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, monthly: e.target.value }
                      }))}
                      placeholder="السعر"
                      className="border-[#D4AF37]"
                    />
                  </div>
                </div>

                {propertyData.paymentPrices.monthly && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Label className="text-[#01411C] font-bold">هل تريد التعاون مع إحدى هاتين الشركتين؟</Label>
                    <RadioGroup 
                      value={propertyData.collaborateWithCompany}
                      onValueChange={(value) => setPropertyData(prev => ({ ...prev, collaborateWithCompany: value }))}
                      className="mt-3"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="رايز" id="rize" />
                        <Label htmlFor="rize" className="cursor-pointer">
                          رايز
                          <a href="https://rize.sa" target="_blank" rel="noopener noreferrer" className="text-blue-500 mr-2">
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="أقساط" id="aqsat" />
                        <Label htmlFor="aqsat" className="cursor-pointer">
                          أقساط
                          <a href="https://aqsat.sa" target="_blank" rel="noopener noreferrer" className="text-blue-500 mr-2">
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="لا" id="no-company" />
                        <Label htmlFor="no-company" className="cursor-pointer">لا أريد التعاون</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-amber-700 mt-3">
                      💡 هذا الخيار يعني: سيتم الدفع لك كاش ويتم استقطاع الأقساط الشهرية من العميل لاحقاً
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================== 11. الهاشتاقات التلقائية ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Hash className="w-5 h-5" />
              الهاشتاقات التلقائية
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">تلقائي</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {autoHashtags.map((hashtag, idx) => (
                <Badge
                  key={idx}
                  variant={propertyData.hashtags.includes(hashtag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    propertyData.hashtags.includes(hashtag) 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                  }`}
                  onClick={() => toggleHashtag(hashtag)}
                >
                  {propertyData.hashtags.includes(hashtag) && <CheckCircle className="w-3 h-3 ml-1" />}
                  {hashtag}
                </Badge>
              ))}
            </div>

            {propertyData.customHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {propertyData.customHashtags.map((hashtag, idx) => (
                  <Badge
                    key={idx}
                    className="bg-purple-500 text-white cursor-pointer"
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

            <div className="flex gap-2">
              <Input
                value={newCustomHashtag}
                onChange={(e) => setNewCustomHashtag(e.target.value)}
                placeholder="أضف هاشتاق مخصص..."
                className="border-[#D4AF37]"
                onKeyPress={(e) => e.key === 'Enter' && addCustomHashtag()}
              />
              <Button onClick={addCustomHashtag} variant="outline" className="border-indigo-500 text-indigo-600">
                إضافة
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              الهاشتاقات المحددة: {propertyData.hashtags.length + propertyData.customHashtags.length}
            </p>
          </CardContent>
        </Card>

        {/* ===================== 12. مولد الوصف ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              مولد الوصف
              <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs">AI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">رقم جوال الوسيط</Label>
                <Input
                  value={propertyData.brokerPhone}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, brokerPhone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  className="border-[#D4AF37]"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-[#01411C]">الترخيص الإعلاني</Label>
                <Input
                  value={propertyData.adLicense}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, adLicense: e.target.value }))}
                  placeholder="رقم الترخيص الإعلاني"
                  className="border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#01411C]">طول الوصف</Label>
                <Select 
                  value={propertyData.descriptionLength} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, descriptionLength: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="قصير">قصير</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="طويل">طويل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C]">اللغة</Label>
                <Select 
                  value={propertyData.descriptionLanguage} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, descriptionLanguage: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عربي">عربي</SelectItem>
                    <SelectItem value="انجليزي">انجليزي</SelectItem>
                    <SelectItem value="عربي انجليزي">عربي وانجليزي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#01411C] mb-2 block">أسلوب الوصف</Label>
              <div className="flex gap-2">
                {['احترافي', 'تسويقي', 'فاخر'].map((style) => (
                  <Button
                    key={style}
                    variant={propertyData.descriptionStyle === style ? "default" : "outline"}
                    className={propertyData.descriptionStyle === style 
                      ? "bg-[#01411C] text-white" 
                      : "border-[#D4AF37] text-[#01411C]"}
                    onClick={() => setPropertyData(prev => ({ ...prev, descriptionStyle: style }))}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateAIDescription}
              disabled={isGeneratingDescription || !propertyData.propertyType}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
            >
              {isGeneratingDescription ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 ml-2" />
                  توليد الوصف
                </>
              )}
            </Button>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#01411C]">الوصف</Label>
                {propertyData.aiDescription && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(propertyData.aiDescription);
                        toast.success('تم نسخ الوصف');
                      }}
                    >
                      <Copy className="w-3 h-3 ml-1" />
                      نسخ
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={generateAIDescription}
                    >
                      <RefreshCw className="w-3 h-3 ml-1" />
                      إعادة
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                value={propertyData.aiDescription}
                onChange={(e) => setPropertyData(prev => ({ ...prev, aiDescription: e.target.value }))}
                placeholder="اضغط على زر التوليد لإنشاء وصف تلقائي للعقار..."
                className="border-[#D4AF37] min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* ===================== زر نشر الإعلان ===================== */}
        <Card className="border-2 border-[#01411C] bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
          <CardContent className="p-6">
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
                <div>
                  <span className="text-gray-500">المالك:</span>{' '}
                  <span className="font-medium">{propertyData.ownerName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">السعر:</span>{' '}
                  <span className="font-medium text-emerald-600">{propertyData.price ? `${parseInt(propertyData.price).toLocaleString()} ريال` : '-'}</span>
                </div>
              </div>
              {smartPath && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-500 text-sm">المسار:</span>{' '}
                  <span className="font-medium text-purple-600">{smartPath}</span>
                </div>
              )}
            </div>

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
                disabled={isPublishing || !propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city || !propertyData.ownerName || !propertyData.ownerPhone}
                className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90 text-[#D4AF37] font-bold text-lg py-6"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 ml-2" />
                    نشر الإعلان
                  </>
                )}
              </Button>
            </div>

            {(!propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city || !propertyData.ownerName || !propertyData.ownerPhone) && (
              <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                يرجى ملء الحقول المطلوبة: نوع العقار، الغرض، المدينة، اسم المالك، جوال المالك
              </div>
            )}

            {showSuccessActions && publishedAd && (
              <PublishSuccessActions
                publishedAd={publishedAd}
                onRepublish={handleRepublish}
                onNavigateToOwner={handleNavigateToOwner}
                brokerInfo={user ? {
                  name: user.name || 'الوسيط العقاري',
                  phone: user.phone || '',
                } : undefined}
              />
            )}
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}
