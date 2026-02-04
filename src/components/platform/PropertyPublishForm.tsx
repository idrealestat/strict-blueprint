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
  Clock,
  Trash2,
  ExternalLink,
  Info,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usePublishedAdsManager, PublishedAdData, findCustomerByPhone, updateOriginalOfferStatus, checkDuplicateAd } from "@/hooks/usePublishedAdsManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PublishSuccessActions from "./PublishSuccessActions";
import AIDescription from "./AIDescription";
import PropertyMediaUpload, { MediaFile } from "./PropertyMediaUpload";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessCardData } from "@/hooks/useBusinessCardData";

// ===================== Types =====================

interface PropertyData {
  // 1. معلومات المالك
  ownerName: string;
  ownerBirthDate: string;
  ownerIdNumber: string; // رقم الهوية
  ownerPhone: string; // رقم الجوال
  ownerNationalAddress: string; // العنوان الوطني
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
  floorNumber: string; // في أي دور (للشقق)
  cornerType: string; // زاوية / بطن
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
  hasPool: boolean;
  hasGarden: boolean;
  hasElevator: boolean;
  hasParking: boolean;

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

  // 12. مولد الوصف والعنوان
  brokerPhone: string;
  adLicense: string;
  adLicenseDate: string; // تاريخ الترخيص الإعلاني
  adLicenseDuration: string; // مدة الترخيص بالأيام
  descriptionLength: string;
  descriptionLanguage: string;
  descriptionStyle: string;
  aiDescription: string;
  aiTitle: string; // العنوان المولد بالذكاء الاصطناعي

  // 13. الوسائط (صور وفيديو)
  media: MediaFile[];
  tour3DUrl: string;
  
  // 14. معلومات التتبع (للعروض المعاد نشرها)
  source?: string;
  originalTabId?: string;
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

// ===================== Constants =====================

const STORAGE_KEY = 'wasata_property_draft';
const SESSION_STORAGE_KEY = 'wasata_property_session_draft'; // للحفاظ على البيانات عند فتح معرض الصور على الهواتف

// Default empty property data
const getDefaultPropertyData = (userPhone?: string): PropertyData => ({
  ownerName: '',
  ownerBirthDate: '',
  ownerIdNumber: '',
  ownerPhone: '',
  ownerNationalAddress: '',
  ownerCity: '',
  ownerDistrict: '',
  deedNumber: '',
  deedDate: '',
  deedCity: '',
  propertyType: '',
  category: '',
  area: '',
  purpose: '',
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
  smartPath: '',
  floors: '',
  floorNumber: '',
  cornerType: '',
  livingRooms: '',
  councils: '',
  bedrooms: '',
  bathrooms: '',
  streetWidth: '',
  facade: '',
  furnishing: '',
  propertyAge: '',
  entrances: '',
  warehouses: '',
  hasLaundryRoom: false,
  balconies: '',
  acUnits: '',
  curtains: '',
  hasExtraKitchen: false,
  extraKitchenAppliances: '',
  hasPool: false,
  hasGarden: false,
  hasElevator: false,
  hasParking: false,
  features: [],
  customFeatures: [],
  warranties: [],
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
  hashtags: [],
  customHashtags: [],
  brokerPhone: userPhone || '',
  adLicense: '',
  adLicenseDate: '', // تاريخ الترخيص الإعلاني
  adLicenseDuration: '30', // مدة الترخيص بالأيام (افتراضي 30 يوم)
  descriptionLength: 'متوسط',
  descriptionLanguage: 'عربي',
  descriptionStyle: 'احترافي',
  aiDescription: '',
  aiTitle: '', // العنوان المولد
  media: [],
  tour3DUrl: '',
});

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
  const [priceEvaluation, setPriceEvaluation] = useState<{
    status: string;
    color: 'green' | 'blue' | 'red';
    message: string;
    percentage: number;
    userPrice: number;
    marketAverage: number;
    difference: number;
    isWarning: boolean;
  } | null>(null);
  const [marketAverage, setMarketAverage] = useState<number>(0);
  
  // Recovery dialog state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // ✅ جلب بيانات بطاقة العمل لاستخدام رقم الواتساب
  const { data: businessCardData, loading: businessCardLoading } = useBusinessCardData();

  // استعادة البيانات من sessionStorage أولاً (للتعامل مع فقدان البيانات عند فتح المعرض على الهواتف)
  const getInitialPropertyData = (): PropertyData => {
    try {
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return {
          ...getDefaultPropertyData(user?.phone),
          ...parsed,
          brokerPhone: parsed.brokerPhone || user?.phone || '',
        };
      }
    } catch (e) {
      console.warn('Failed to restore session data:', e);
    }
    return getDefaultPropertyData(user?.phone);
  };

  const [propertyData, setPropertyData] = useState<PropertyData>(getInitialPropertyData);

  // ✅ جلب رقم الواتساب من بطاقة العمل تلقائياً
  useEffect(() => {
    if (!businessCardLoading && businessCardData && !propertyData.brokerPhone) {
      const whatsappNumber = businessCardData.whatsapp || businessCardData.phone;
      if (whatsappNumber) {
        setPropertyData(prev => ({
          ...prev,
          brokerPhone: prev.brokerPhone || whatsappNumber,
        }));
      }
    }
  }, [businessCardData, businessCardLoading, propertyData.brokerPhone]);

  // Check for republish data first (higher priority), then saved draft
  useEffect(() => {
    // أولاً: التحقق من بيانات إعادة النشر
    const republishData = localStorage.getItem('wasata_republish_data');
    if (republishData) {
      try {
        const parsed = JSON.parse(republishData);
        // تحميل بيانات إعادة النشر
        setPropertyData(prev => ({
          ...getDefaultPropertyData(user?.phone),
          ...parsed,
          brokerPhone: parsed.brokerPhone || user?.phone || '',
          // إعادة تعيين الحقول التي لا يجب نسخها
          id: undefined,
          publishedAt: undefined,
        }));
        // حذف بيانات إعادة النشر بعد استخدامها
        localStorage.removeItem('wasata_republish_data');
        
        // إشعار تفصيلي بنجاح نقل البيانات
        const mediaCount = parsed.media?.length || 0;
        const imageCount = parsed.media?.filter((m: any) => m.type === 'image').length || 0;
        const videoCount = parsed.media?.filter((m: any) => m.type === 'video').length || 0;
        const has3DTour = parsed.tour3DUrl ? true : false;
        
        let successMessage = '✅ تم نقل جميع بيانات العرض بنجاح!';
        const details: string[] = [];
        
        if (parsed.ownerName) details.push(`المالك: ${parsed.ownerName}`);
        if (parsed.propertyType) details.push(`${parsed.propertyType}`);
        if (parsed.purpose) details.push(`${parsed.purpose}`);
        if (imageCount > 0) details.push(`${imageCount} صورة`);
        if (videoCount > 0) details.push(`${videoCount} فيديو`);
        if (has3DTour) details.push('جولة 3D');
        
        if (details.length > 0) {
          successMessage = `✅ تم نقل البيانات: ${details.join(' • ')}`;
        }
        
        toast.success(successMessage, {
          duration: 5000,
          description: 'راجع البيانات وأكمل النشر',
        });
        
        return; // لا تتحقق من المسودة إذا كان هناك بيانات إعادة نشر
      } catch (e) {
        console.error('Error parsing republish data:', e);
        localStorage.removeItem('wasata_republish_data');
        toast.error('حدث خطأ في تحميل بيانات العرض');
      }
    }

    // ثانياً: التحقق من المسودة المحفوظة
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Check if there's meaningful data saved (at least one important field filled)
        const hasData = parsed.ownerName || parsed.ownerPhone || parsed.propertyType || 
                       parsed.locationDetails?.city || (parsed.media && parsed.media.length > 0);
        if (hasData) {
          setHasSavedDraft(true);
          setShowRecoveryDialog(true);
        }
      } catch (e) {
        console.error('Error parsing saved draft:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [user?.phone]);

  // Auto-save to localStorage AND sessionStorage on changes (debounced)
  // sessionStorage مهم لمنع فقدان البيانات عند فتح معرض الصور على iOS/Android
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only save if there's meaningful data
      const hasData =
        propertyData.ownerName ||
        propertyData.ownerPhone ||
        propertyData.ownerIdNumber ||
        propertyData.ownerBirthDate ||
        propertyData.ownerNationalAddress ||
        propertyData.ownerCity ||
        propertyData.ownerDistrict ||
        propertyData.propertyType ||
        propertyData.locationDetails.city ||
        propertyData.media.length > 0;
      if (hasData) {
        // حفظ في localStorage للاستمرارية بين الجلسات
        localStorage.setItem(STORAGE_KEY, JSON.stringify(propertyData));
        // حفظ في sessionStorage لمنع فقدان البيانات عند فتح المعرض على الهواتف
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(propertyData));
        } catch (e) {
          console.warn('Failed to save to sessionStorage:', e);
        }
      }
    }, 500); // تسريع الحفظ إلى 500ms للتعامل مع الهواتف
    
    return () => clearTimeout(timeoutId);
  }, [propertyData]);

  // Restore saved data
  const restoreSavedData = () => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setPropertyData(prev => ({
          ...getDefaultPropertyData(user?.phone),
          ...parsed,
          brokerPhone: parsed.brokerPhone || user?.phone || '',
        }));
        toast.success('تم استعادة البيانات المحفوظة');
      } catch (e) {
        console.error('Error restoring draft:', e);
        toast.error('فشل في استعادة البيانات');
      }
    }
    setShowRecoveryDialog(false);
  };

  // Clear saved data and start fresh
  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    // مسح sessionStorage أيضاً
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }
    setPropertyData(getDefaultPropertyData(user?.phone));
    setHasSavedDraft(false);
    setShowRecoveryDialog(false);
    toast.success('تم مسح البيانات السابقة');
  };

  // Dismiss recovery dialog without action
  const dismissRecoveryDialog = () => {
    setShowRecoveryDialog(false);
  };

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

  // State for map layer
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('satellite');
  const satelliteLayerRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);

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
        
        const map = L.map(mapRef.current).setView([propertyData.locationDetails.latitude, propertyData.locationDetails.longitude], 17);
        
        // Street layer (OpenStreetMap)
        streetLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        });
        
        // Satellite layer (ESRI)
        satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© ESRI',
          maxZoom: 19,
        });
        
        // Add satellite layer by default
        satelliteLayerRef.current.addTo(map);
        
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

  // Toggle map layer
  const toggleMapLayer = () => {
    if (!mapInstanceRef.current) return;
    
    if (mapLayer === 'satellite') {
      mapInstanceRef.current.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(mapInstanceRef.current);
      setMapLayer('street');
    } else {
      mapInstanceRef.current.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(mapInstanceRef.current);
      setMapLayer('satellite');
    }
  };

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

  // مولد الأسعار الذكي مع تقييم تلقائي
  const generateSmartPrices = async () => {
    if (!propertyData.area || !propertyData.purpose) {
      toast.error('يرجى تحديد المساحة والغرض أولاً');
      return;
    }
    
    setIsGeneratingPrices(true);
    
    try {
      // الحصول على توكن المستخدم الحالي
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('يرجى تسجيل الدخول أولاً');
        setIsGeneratingPrices(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smart-prices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            propertyData: {
              propertyType: propertyData.propertyType,
              category: propertyData.category,
              purpose: propertyData.purpose,
              area: propertyData.area,
              city: propertyData.locationDetails.city,
              district: propertyData.locationDetails.district,
              bedrooms: propertyData.bedrooms,
              propertyAge: propertyData.propertyAge,
              furnishing: propertyData.furnishing,
              userPrice: propertyData.price,
            }
          }),
        }
      );
      
      if (!response.ok) throw new Error('فشل في توليد الأسعار');
      
      const data = await response.json();
      
      setSuggestedPrices(data.prices.map((p: any) => ({
        source: p.source,
        price: p.price.toLocaleString(),
        url: p.url,
      })));
      
      setMarketAverage(data.marketAverage);
      
      // تقييم السعر التلقائي
      if (data.priceEvaluation) {
        setPriceEvaluation(data.priceEvaluation);
        setPropertyData(prev => ({ ...prev, priceStatus: data.priceEvaluation.status }));
      }
      
      // تحديث الدفعات إذا كان للإيجار
      if (data.paymentBreakdown) {
        setPropertyData(prev => ({
          ...prev,
          paymentPrices: {
            onePayment: data.paymentBreakdown.onePayment.toLocaleString(),
            twoPayments: data.paymentBreakdown.twoPayments.toLocaleString(),
            fourPayments: data.paymentBreakdown.fourPayments.toLocaleString(),
            monthly: data.paymentBreakdown.monthly.toLocaleString(),
          }
        }));
      }
      
      toast.success(`تم توليد الأسعار المقترحة (${data.priceUnit})`);
    } catch (error) {
      console.error('Error generating prices:', error);
      toast.error('فشل في توليد الأسعار');
    } finally {
      setIsGeneratingPrices(false);
    }
  };

  // Generate AI Description
  const generateAIDescription = async () => {
    if (!propertyData.propertyType || !propertyData.purpose) {
      toast.error('يرجى تحديد نوع العقار والغرض أولاً');
      return;
    }
    
    setIsGeneratingDescription(true);
    
    try {
      // استخدام توكن الجلسة بدلاً من publishable key للأمان
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('يرجى تسجيل الدخول أولاً');
        setIsGeneratingDescription(false);
        return;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-property-description`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            propertyData: {
              propertyType: propertyData.propertyType,
              category: propertyData.category,
              purpose: propertyData.purpose,
              area: propertyData.area,
              city: propertyData.locationDetails.city,
              district: propertyData.locationDetails.district,
              bedrooms: propertyData.bedrooms,
              bathrooms: propertyData.bathrooms,
              livingRooms: propertyData.livingRooms,
              councils: propertyData.councils,
              floors: propertyData.floors,
              furnishing: propertyData.furnishing,
              propertyAge: propertyData.propertyAge,
              features: propertyData.features,
              warranties: propertyData.warranties,
              adLicense: propertyData.adLicense,
              brokerPhone: propertyData.brokerPhone,
              descriptionStyle: propertyData.descriptionStyle,
              descriptionLength: propertyData.descriptionLength,
              descriptionLanguage: propertyData.descriptionLanguage,
              streetWidth: propertyData.streetWidth,
              facade: propertyData.facade,
              acUnits: propertyData.acUnits,
              balconies: propertyData.balconies,
              entrances: propertyData.entrances,
            }
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في توليد الوصف');
      }
      
      const data = await response.json();
      setPropertyData(prev => ({ ...prev, aiDescription: data.description }));
      toast.success('تم توليد الوصف بنجاح');
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في توليد الوصف');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Published ad manager
  const { publishAdWithCustomerLink } = usePublishedAdsManager();
  const [publishedAd, setPublishedAd] = useState<PublishedAdData | null>(null);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  
  // حالة التحذير من التكرار
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [pendingPublish, setPendingPublish] = useState(false);

  // التحقق من التكرار قبل النشر
  const checkForDuplicates = () => {
    const duplicateResult = checkDuplicateAd({
      ownerPhone: propertyData.ownerPhone,
      ownerIdNumber: propertyData.ownerIdNumber,
      deedNumber: propertyData.deedNumber,
      propertyType: propertyData.propertyType,
      city: propertyData.locationDetails.city,
      district: propertyData.locationDetails.district,
      area: propertyData.area,
    });

    if (duplicateResult.existsInOffers && duplicateResult.existsInCustomers) {
      setDuplicateMessage(`⚠️ العرض مضاف سابقاً في العروض وإدارة العملاء (${duplicateResult.customerName})`);
      setShowDuplicateWarning(true);
      return true;
    } else if (duplicateResult.existsInOffers) {
      setDuplicateMessage('⚠️ العرض مضاف سابقاً في العروض');
      setShowDuplicateWarning(true);
      return true;
    } else if (duplicateResult.existsInCustomers) {
      setDuplicateMessage(`⚠️ العرض مضاف سابقاً في إدارة العملاء (${duplicateResult.customerName})`);
      setShowDuplicateWarning(true);
      return true;
    }
    return false;
  };

  // Handle Publish
  const handlePublish = async () => {
    console.log('🚀 بدء عملية النشر...');
    
    if (!propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city) {
      toast.error('يرجى ملء الحقول المطلوبة: نوع العقار، الغرض، المدينة');
      console.log('❌ حقول مطلوبة ناقصة');
      return;
    }

    if (!propertyData.ownerName || !propertyData.ownerIdNumber || !propertyData.ownerPhone) {
      toast.error('يرجى ملء معلومات المالك: الاسم ورقم الهوية ورقم الجوال');
      return;
    }

    // التحقق من رقم الترخيص الإعلاني - إلزامي
    if (!propertyData.adLicense || propertyData.adLicense.trim() === '') {
      toast.error('يرجى إدخال رقم الترخيص الإعلاني - حقل إلزامي للنشر');
      return;
    }

    // التحقق من التكرار إذا لم يكن هناك تأكيد مسبق
    if (!pendingPublish && checkForDuplicates()) {
      return;
    }

    setPendingPublish(false);
    setIsPublishing(true);
    
    // ✅ التأكد من حفظ الـ slug قبل النشر للمزامنة التلقائية
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: cardData } = await supabase
          .from('business_cards')
          .select('slug')
          .eq('user_id', authUser.id)
          .single();
        if (cardData?.slug) {
          localStorage.setItem('public_platform_slug', cardData.slug);
          console.log('✅ Slug saved for sync:', cardData.slug);
        }
      }
    } catch (e) {
      console.warn('Could not fetch slug before publish:', e);
    }
    try {
      console.log('📦 تجهيز بيانات الإعلان...');
      const adData: PublishedAdData = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // استخدام العنوان المولد بالذكاء الاصطناعي إن وجد، وإلا توليد عنوان تلقائي
        title: propertyData.aiTitle || 
          `${propertyData.purpose || ''} - ${propertyData.propertyType || ''} - ${propertyData.area || ''}م`.replace(/^\s*-\s*/,'').trim(),
        propertyType: propertyData.propertyType,
        category: propertyData.category,
        purpose: propertyData.purpose,
        area: propertyData.area,
        propertyCategory: propertyData.category,
        platformPath: propertyData.smartPath,
        locationDetails: propertyData.locationDetails,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        livingRooms: propertyData.livingRooms,
        floors: propertyData.floors,
        propertyAge: propertyData.propertyAge,
        furnishing: propertyData.furnishing,
        facade: propertyData.facade,
        streetWidth: propertyData.streetWidth,
        features: propertyData.features,
        customFeatures: propertyData.customFeatures,
        warranties: {
          structuralWarranty: propertyData.warranties.some(w => w.type === 'الهيكل الإنشائي'),
          structuralYears: propertyData.warranties.find(w => w.type === 'الهيكل الإنشائي')?.duration || '',
          acWarranty: propertyData.warranties.some(w => w.type === 'ضمان التكييف'),
          acYears: propertyData.warranties.find(w => w.type === 'ضمان التكييف')?.duration || '',
          plumbingWarranty: propertyData.warranties.some(w => w.type === 'السباكة'),
          plumbingYears: propertyData.warranties.find(w => w.type === 'السباكة')?.duration || '',
          electricalWarranty: propertyData.warranties.some(w => w.type === 'الكهرباء'),
          electricalYears: propertyData.warranties.find(w => w.type === 'الكهرباء')?.duration || '',
          customWarranties: propertyData.warranties.filter(w => !warrantyTypes.includes(w.type)).map(w => `${w.type} (${w.duration})`),
        },
        hashtags: propertyData.hashtags,
        customHashtags: propertyData.customHashtags,
        aiDescription: propertyData.aiDescription,
        descriptionTone: propertyData.descriptionStyle,
        descriptionLength: propertyData.descriptionLength,
        price: propertyData.price,
        priceType: propertyData.priceStatus,
        ownerName: propertyData.ownerName,
        ownerPhone: propertyData.ownerPhone,
        ownerIdNumber: propertyData.ownerIdNumber,
        ownerBirthDate: propertyData.ownerBirthDate,
        ownerNationalAddress: propertyData.ownerNationalAddress,
        ownerCity: propertyData.ownerCity || propertyData.locationDetails.city,
        ownerDistrict: propertyData.ownerDistrict || propertyData.locationDetails.district,
        deedNumber: propertyData.deedNumber,
        deedDate: propertyData.deedDate,
        deedCity: propertyData.deedCity,
        adLicense: propertyData.adLicense,
        adLicenseDate: propertyData.adLicenseDate,
        adLicenseDuration: propertyData.adLicenseDuration,
        images: propertyData.media.filter(m => m.type === 'image').map(m => m.url),
        videos: propertyData.media.filter(m => m.type === 'video').map(m => m.url),
        tour3DUrl: propertyData.tour3DUrl,
        publishedAt: new Date().toISOString(),
        status: 'published',
        // معلومات التتبع
        source: propertyData.source,
        originalTabId: propertyData.originalTabId,
      };

      // ✅ ضمان عدم علق الواجهة: إذا انتظرت المزامنة الخارجية أكثر من 10 ثوانٍ، نعتبرها نجاح جزئي ونُنهي الـ loading
      let result: { success: boolean; customerId: string | null; isNewCustomer: boolean; message: string };
      try {
        result = await Promise.race([
          publishAdWithCustomerLink(adData),
          new Promise<{ success: false; customerId: null; isNewCustomer: false; message: string }>((resolve) =>
            setTimeout(() => resolve({ success: false, customerId: null, isNewCustomer: false, message: 'timeout' }), 10000)
          ),
        ]);
      } catch (e) {
        console.error('❌ Exception in publishAdWithCustomerLink:', e);
        result = { success: false, customerId: null, isNewCustomer: false, message: String(e) };
      }

      // حتى لو timeout — البيانات محفوظة فعلياً في localStorage (publishAdWithCustomerLink حفظها أولاً)
      // لذلك نعتبرها نجاح جزئي ونعرض الإجراءات
      const partialSuccess = result.message === 'timeout';
      
      if (result.success || partialSuccess) {
        setPublishedAd({ ...adData, linkedCustomerId: result.customerId || undefined });
        setShowSuccessActions(true);
        onPublish(propertyData);
        
        // مسح البيانات المحفوظة بعد النشر الناجح
        localStorage.removeItem(STORAGE_KEY);
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } catch (e) {
          console.warn('Failed to clear sessionStorage:', e);
        }
        
        // تحديث حالة العرض الأصلي في بطاقة العميل
        if (propertyData.originalTabId && propertyData.source === 'customer_tab') {
          const updated = updateOriginalOfferStatus(propertyData.originalTabId, adData.id);
          if (updated) {
            toast.success('✅ تم تحديث حالة العرض في بطاقة العميل', {
              description: 'العرض الأصلي أصبح مرتبطاً بالإعلان المنشور',
              duration: 4000,
            });
          }
        }
        
        window.dispatchEvent(new CustomEvent('analyticsEvent', {
          detail: { eventType: 'property_published', propertyType: propertyData.propertyType, city: propertyData.locationDetails.city }
        }));

        if (partialSuccess) {
          toast.info('⏳ تم حفظ الإعلان محلياً - المزامنة الكاملة قد تستغرق لحظات', { duration: 6000 });
        }
      } else {
        console.error('❌ فشل النشر:', result.message);
        toast.error(result.message || 'فشل في نشر الإعلان');
      }
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء النشر:', error);
      toast.error('حدث خطأ أثناء نشر الإعلان - يرجى المحاولة مرة أخرى');
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
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="space-y-4 md:space-y-6 p-3 md:p-4 pb-24 md:pb-6 max-w-full" dir="rtl">
        
        {/* Recovery Dialog */}
        {showRecoveryDialog && (
          <Card className="border-2 border-[hsl(var(--gold))] bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg">
            <CardContent className="py-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))]/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-[hsl(var(--gold))]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[hsl(var(--forest-green))]">
                    توجد بيانات محفوظة مسبقاً
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    هل تريد استعادة المعلومات المدخلة سابقاً؟
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={restoreSavedData}
                    className="border-[hsl(var(--forest-green))] text-[hsl(var(--forest-green))] bg-white hover:bg-[hsl(var(--forest-green))]/10"
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    نعم، استعد البيانات
                  </Button>
                  <Button
                    variant="outline"
                    onClick={dismissRecoveryDialog}
                    className="border-[hsl(var(--gold))]"
                  >
                    لا، ابدأ من جديد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header with Clear Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[hsl(var(--forest-green))]">
            نشر إعلان عقاري
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSavedData}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            مسح ومن جديد
          </Button>
        </div>
        
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
                <Label className="text-[#01411C]">رقم الهوية *</Label>
                <Input
                  value={propertyData.ownerIdNumber}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, ownerIdNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                  placeholder="10 أرقام"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                  dir="ltr"
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
                {/* Map Layer Toggle */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMapLayer}
                    className="gap-2 text-sm"
                  >
                    {mapLayer === 'satellite' ? '🛰️ أقمار صناعية' : '🗺️ خريطة شوارع'}
                    <span className="text-xs text-muted-foreground">(اضغط للتبديل)</span>
                  </Button>
                </div>
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
                <Label className="text-[#01411C]">الرقم الإضافي</Label>
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
                <Label className="text-[#01411C]">رقم المبنى</Label>
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

        {/* ===================== قسم الوسائط - صور وفيديو ===================== */}
        <PropertyMediaUpload
          media={propertyData.media}
          onMediaChange={(media) => setPropertyData(prev => ({ ...prev, media }))}
          tour3DUrl={propertyData.tour3DUrl}
          onTour3DChange={(url) => setPropertyData(prev => ({ ...prev, tour3DUrl: url }))}
        />

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
              
              {/* في أي دور - يظهر فقط للشقق */}
              {propertyData.propertyType === 'شقة' && (
                <div>
                  <Label className="text-[#01411C]">في أي دور</Label>
                  <Select 
                    value={propertyData.floorNumber} 
                    onValueChange={(value) => setPropertyData(prev => ({ ...prev, floorNumber: value }))}
                  >
                    <SelectTrigger className="border-[#D4AF37]">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أرضي">أرضي</SelectItem>
                      <SelectItem value="الأول">الأول</SelectItem>
                      <SelectItem value="الثاني">الثاني</SelectItem>
                      <SelectItem value="الثالث">الثالث</SelectItem>
                      <SelectItem value="الرابع">الرابع</SelectItem>
                      <SelectItem value="الخامس">الخامس</SelectItem>
                      <SelectItem value="السادس">السادس</SelectItem>
                      <SelectItem value="السابع أو أعلى">السابع أو أعلى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* زاوية / بطن */}
              <div>
                <Label className="text-[#01411C]">الموقع</Label>
                <Select 
                  value={propertyData.cornerType} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, cornerType: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="زاوية / بطن" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="زاوية">زاوية</SelectItem>
                    <SelectItem value="بطن">بطن</SelectItem>
                    <SelectItem value="ثلاث شوارع">ثلاث شوارع</SelectItem>
                    <SelectItem value="رأس بلك">رأس بلك</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label className="text-[#01411C]">السعر المطلوب من المالك (ريال)</Label>
                <Input
                  type="number"
                  value={propertyData.price}
                  onChange={(e) => {
                    setPropertyData(prev => ({ ...prev, price: e.target.value }));
                    setPriceEvaluation(null); // Reset evaluation when price changes
                  }}
                  placeholder="أدخل السعر المطلوب"
                  className="border-[#D4AF37] focus:border-[#01411C]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  أدخل السعر ثم اضغط "توليد الأسعار" للحصول على تقييم تلقائي
                </p>
              </div>
              <div>
                <Label className="text-[#01411C]">تقييم السعر بالذكاء الاصطناعي</Label>
                {priceEvaluation ? (
                  <div className={`p-3 rounded-lg border-2 ${
                    priceEvaluation.color === 'green' ? 'bg-green-50 border-green-300' :
                    priceEvaluation.color === 'blue' ? 'bg-blue-50 border-blue-300' :
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className={`font-bold text-lg ${
                      priceEvaluation.color === 'green' ? 'text-green-700' :
                      priceEvaluation.color === 'blue' ? 'text-blue-700' :
                      'text-red-700'
                    }`}>
                      {priceEvaluation.status}
                    </div>
                    <p className={`text-sm mt-1 ${
                      priceEvaluation.color === 'green' ? 'text-green-600' :
                      priceEvaluation.color === 'blue' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {priceEvaluation.message}
                    </p>
                    {marketAverage > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        متوسط السوق: {marketAverage.toLocaleString()} ريال
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border rounded-lg text-gray-500 text-sm">
                    أدخل السعر واضغط على زر توليد الأسعار للحصول على التقييم التلقائي
                  </div>
                )}
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

            {/* حقول تاريخ ومدة الترخيص الإعلاني */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <Label className="text-[#01411C] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  تاريخ الترخيص الإعلاني
                </Label>
                <Input
                  type="date"
                  value={propertyData.adLicenseDate}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, adLicenseDate: e.target.value }))}
                  className="border-[#D4AF37]"
                />
                <p className="text-xs text-amber-700 mt-1">تاريخ بداية سريان الترخيص</p>
              </div>
              <div>
                <Label className="text-[#01411C] flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  مدة الترخيص (بالأيام)
                </Label>
                <Select 
                  value={propertyData.adLicenseDuration} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, adLicenseDuration: value }))}
                >
                  <SelectTrigger className="border-[#D4AF37]">
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 يوم</SelectItem>
                    <SelectItem value="60">60 يوم</SelectItem>
                    <SelectItem value="90">90 يوم (3 أشهر)</SelectItem>
                    <SelectItem value="180">180 يوم (6 أشهر)</SelectItem>
                    <SelectItem value="365">365 يوم (سنة)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-amber-700 mt-1">
                  {propertyData.adLicenseDate && propertyData.adLicenseDuration ? (
                    <>
                      ينتهي في: {new Date(new Date(propertyData.adLicenseDate).getTime() + parseInt(propertyData.adLicenseDuration) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}
                    </>
                  ) : (
                    'حدد التاريخ والمدة لحساب تاريخ الانتهاء'
                  )}
                </p>
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

            {/* زر توليد العنوان والوصف الذكي */}
            <AIDescription
              mode={propertyData.purpose === 'للبيع' ? 'sale' : 'rent'}
              city={propertyData.locationDetails.city}
              district={propertyData.locationDetails.district}
              propertyType={propertyData.propertyType}
              features={{
                category: propertyData.category,
                area: propertyData.area ? parseInt(propertyData.area) : undefined,
                bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : undefined,
                bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined,
                livingRooms: propertyData.livingRooms ? parseInt(propertyData.livingRooms) : undefined,
                councils: propertyData.councils ? parseInt(propertyData.councils) : undefined,
                floors: propertyData.floors ? parseInt(propertyData.floors) : undefined,
                floorNumber: propertyData.floorNumber ? parseInt(propertyData.floorNumber) : undefined,
                cornerType: propertyData.cornerType,
                furnishing: propertyData.furnishing,
                propertyAge: propertyData.propertyAge ? parseInt(propertyData.propertyAge) : undefined,
                streetWidth: propertyData.streetWidth ? parseInt(propertyData.streetWidth) : undefined,
                facade: propertyData.facade,
                airConditioners: propertyData.acUnits ? parseInt(propertyData.acUnits) : undefined,
                balconies: propertyData.balconies ? parseInt(propertyData.balconies) : undefined,
                entrances: propertyData.entrances,
                warehouses: propertyData.warehouses ? parseInt(propertyData.warehouses) : undefined,
                curtains: propertyData.curtains ? parseInt(propertyData.curtains) : undefined,
                hasLaundryRoom: propertyData.hasLaundryRoom,
                hasExtraKitchen: propertyData.hasExtraKitchen,
                extraKitchenAppliances: propertyData.extraKitchenAppliances,
                customFeatures: [...propertyData.features, ...propertyData.customFeatures],
                warranties: propertyData.warranties,
              }}
              price={propertyData.price ? parseInt(propertyData.price) : undefined}
              currentDescription={propertyData.aiDescription}
              currentTitle={propertyData.aiTitle}
              onDescriptionSelect={(description) => setPropertyData(prev => ({ ...prev, aiDescription: description }))}
              onTitleSelect={(title) => setPropertyData(prev => ({ ...prev, aiTitle: title }))}
              style={propertyData.descriptionStyle as 'احترافي' | 'تسويقي' | 'فاخر'}
              length={propertyData.descriptionLength as 'قصير' | 'متوسط' | 'طويل'}
              language={propertyData.descriptionLanguage as 'عربي' | 'انجليزي' | 'عربي انجليزي'}
              brokerPhone={propertyData.brokerPhone}
              adLicense={propertyData.adLicense}
            />

            {/* حقل العنوان المولد */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#01411C] flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-[#D4AF37]" />
                  عنوان الإعلان
                  <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37]">
                    يظهر في المنصة العامة
                  </Badge>
                </Label>
                {propertyData.aiTitle && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(propertyData.aiTitle);
                      toast.success('تم نسخ العنوان');
                    }}
                    className="text-[#01411C] hover:text-[#D4AF37]"
                  >
                    <Copy className="w-3 h-3 ml-1" />
                    نسخ
                  </Button>
                )}
              </div>
              <Input
                value={propertyData.aiTitle}
                onChange={(e) => setPropertyData(prev => ({ ...prev, aiTitle: e.target.value }))}
                placeholder="اضغط على زر التوليد لإنشاء عنوان جذاب للإعلان..."
                className="border-[#D4AF37] bg-[#f0fdf4]/50 font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                هذا العنوان سيظهر للعملاء في المنصة العامة
              </p>
            </div>

            {/* حقل الوصف */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#01411C] flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-[#D4AF37]" />
                  الوصف
                </Label>
                {propertyData.aiDescription && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(propertyData.aiDescription);
                      toast.success('تم نسخ الوصف');
                    }}
                    className="text-[#01411C] hover:text-[#D4AF37]"
                  >
                    <Copy className="w-3 h-3 ml-1" />
                    نسخ
                  </Button>
                )}
              </div>
              <Textarea
                value={propertyData.aiDescription}
                onChange={(e) => setPropertyData(prev => ({ ...prev, aiDescription: e.target.value }))}
                placeholder="اضغط على زر التوليد لإنشاء وصف تلقائي للعقار باستخدام الذكاء الاصطناعي..."
                className="border-[#D4AF37] min-h-[150px] bg-[#f0fdf4]/50"
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

        {/* تحذير التكرار المنبثق */}
        <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <AlertDialogContent className="max-w-md" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                تنبيه: العرض موجود مسبقاً
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg text-gray-700 py-4">
                {duplicateMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-3 sm:gap-3">
              <AlertDialogCancel 
                onClick={() => setShowDuplicateWarning(false)}
                className="flex-1"
              >
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setPendingPublish(true);
                  // تأخير بسيط ثم نشر
                  setTimeout(() => handlePublish(), 100);
                }}
                className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90 text-[#D4AF37]"
              >
                نشر على أي حال
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
