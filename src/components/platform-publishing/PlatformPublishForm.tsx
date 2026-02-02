/**
 * PlatformPublishForm.tsx
 * نموذج النشر على المنصات - يستخدم نفس تصميم PropertyPublishForm حرفياً
 * مع إضافة قسم اختيار المنصات للنشر عليها
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Check,
  X,
  Image,
  Video,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublishedAdsManager, PublishedAdData, findCustomerByPhone, checkDuplicateAd } from '@/hooks/usePublishedAdsManager';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import PropertyMediaUpload, { MediaFile } from '@/components/platform/PropertyMediaUpload';
import AIDescription from '@/components/platform/AIDescription';
import PublishSuccessActions from '@/components/platform/PublishSuccessActions';
import { supabase } from '@/integrations/supabase/client';
import { 
  ExternalPlatform, 
  PlatformPublishedOffer, 
  PlatformPublishResult,
  AVAILABLE_PLATFORMS 
} from './types';

// ===================== Storage Keys =====================
const STORAGE_KEY = 'platform_publish_draft';
const SESSION_STORAGE_KEY = 'platform_publish_session_draft';

// ===================== Types =====================
interface PropertyData {
  // 1. معلومات المالك
  ownerName: string;
  ownerBirthDate: string;
  ownerIdNumber: string;
  ownerPhone: string;
  ownerNationalAddress: string;
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

  // 5. المسار الذكي
  smartPath: string;

  // 6. المواصفات التفصيلية
  floors: string;
  floorNumber: string;
  cornerType: string;
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
  warranties: { type: string; duration: string }[];

  // 10. مولد الأسعار الذكي
  price: string;
  priceSource: string;
  priceStatus: string;
  paymentOption: string;
  paymentPrices: {
    onePayment: string;
    twoPayments: string;
    fourPayments: string;
    monthly: string;
  };
  collaborateWithCompany: string;

  // 11. الهاشتاقات التلقائية
  hashtags: string[];
  customHashtags: string[];

  // 12. مولد الوصف
  brokerPhone: string;
  adLicense: string;
  adLicenseDate: string;
  adLicenseDuration: string;
  descriptionLength: string;
  descriptionLanguage: string;
  descriptionStyle: string;
  aiDescription: string;
  aiTitle: string;

  // 13. الوسائط
  media: MediaFile[];
  tour3DUrl: string;

  // 14. معلومات الإيجار
  isCurrentlyRented: boolean;
  contractDuration: string;
  contractStartDate: string;
  contractEndDate: string;
  rentalContractFile: string;

  // منصات النشر المختارة
  selectedPlatforms: string[];
}

interface PlatformPublishFormProps {
  connectedPlatforms: ExternalPlatform[];
  onPublishComplete: (offer: PlatformPublishedOffer) => void;
  onCancel: () => void;
}

// ===================== Constants =====================
const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "أرض زراعية", "استراحة"];
const categories = ["سكني", "تجاري", "صناعي", "زراعي"];
const purposes = ["للبيع", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف", "نجران", "القصيم", "حائل", "جازان", "ينبع", "الأحساء", "الجبيل", "خميس مشيط", "الباحة", "عرعر", "سكاكا"];
const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "مطبخ مؤثث", "غير مؤثث"];
const facadeOptions = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];
const entranceOptions = ["مدخل", "مدخلين", "ثلاث مداخل أو أكثر"];
const warrantyTypes = ["ضمان التكييف", "الهيكل الإنشائي", "العيوب الخفية", "الكهرباء", "السباكة", "شبابيك الألمنيوم", "الأبواب", "الأدوات الصحية", "الصنابير", "السخانات", "الأنوار", "العوازل"];
const defaultFeatures = ["مسبح خاص", "حديقة", "مصعد", "موقف سيارات", "غرفة خادمة", "غرفة سائق", "مجلس", "صالة", "مطبخ مجهز", "تكييف مركزي", "نظام أمان", "كاميرات مراقبة", "إطلالة بحرية", "إطلالة حديقة"];

const getDefaultPropertyData = (): PropertyData => ({
  ownerName: '', ownerBirthDate: '', ownerIdNumber: '', ownerPhone: '', ownerNationalAddress: '', ownerCity: '', ownerDistrict: '',
  deedNumber: '', deedDate: '', deedCity: '',
  propertyType: '', category: '', area: '', purpose: '',
  locationDetails: { city: '', district: '', street: '', buildingNumber: '', postalCode: '', additionalNumber: '', latitude: 24.7136, longitude: 46.6753 },
  smartPath: '',
  floors: '', floorNumber: '', cornerType: '', livingRooms: '', councils: '', bedrooms: '', bathrooms: '', streetWidth: '', facade: '', furnishing: '', propertyAge: '',
  entrances: '', warehouses: '', hasLaundryRoom: false, balconies: '', acUnits: '', curtains: '', hasExtraKitchen: false, extraKitchenAppliances: '',
  features: [], customFeatures: [],
  warranties: [],
  price: '', priceSource: '', priceStatus: '', paymentOption: '', paymentPrices: { onePayment: '', twoPayments: '', fourPayments: '', monthly: '' }, collaborateWithCompany: '',
  hashtags: [], customHashtags: [],
  brokerPhone: '', adLicense: '', adLicenseDate: '', adLicenseDuration: '30', descriptionLength: 'متوسط', descriptionLanguage: 'عربي', descriptionStyle: 'احترافي', aiDescription: '', aiTitle: '',
  media: [], tour3DUrl: '',
  isCurrentlyRented: false, contractDuration: '', contractStartDate: '', contractEndDate: '', rentalContractFile: '',
  selectedPlatforms: [],
});

export default function PlatformPublishForm({ connectedPlatforms, onPublishComplete, onCancel }: PlatformPublishFormProps) {
  const [propertyData, setPropertyData] = useState<PropertyData>(getDefaultPropertyData);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishResults, setPublishResults] = useState<PlatformPublishResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isGeneratingPrices, setIsGeneratingPrices] = useState(false);
  const [suggestedPrices, setSuggestedPrices] = useState<{source: string; price: string}[]>([]);
  const [priceEvaluation, setPriceEvaluation] = useState<any>(null);
  const [marketAverage, setMarketAverage] = useState(0);
  const [newCustomFeature, setNewCustomFeature] = useState('');
  const [newCustomHashtag, setNewCustomHashtag] = useState('');
  const [newWarrantyType, setNewWarrantyType] = useState('');
  const [newWarrantyDuration, setNewWarrantyDuration] = useState('');
  const [customWarrantyType, setCustomWarrantyType] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('satellite');
  
  // حالات الإشعارات والتنبيهات
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [publishedAd, setPublishedAd] = useState<PublishedAdData | null>(null);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);

  const { data: businessCardData } = useBusinessCardData();
  const { publishAdWithCustomerLink } = usePublishedAdsManager();

  // التحقق من المسودة المحفوظة عند التحميل
  useEffect(() => {
    // التحقق من sessionStorage أولاً (للتعافي من إغلاق معرض الصور)
    const sessionDraft = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionDraft) {
      try {
        const parsed = JSON.parse(sessionDraft);
        setPropertyData(parsed);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        toast.success('✅ تم استرداد البيانات', { description: 'تم استعادة بياناتك تلقائياً' });
        return;
      } catch {}
    }

    // التحقق من localStorage
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        const hasData = parsed.ownerName || parsed.ownerPhone || parsed.propertyType || 
                       parsed.locationDetails?.city || (parsed.media && parsed.media.length > 0);
        if (hasData) {
          setHasSavedDraft(true);
          setShowRecoveryDialog(true);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // حفظ تلقائي للمسودة
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const hasData = propertyData.ownerName || propertyData.ownerPhone || propertyData.propertyType;
      if (hasData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(propertyData));
      }
    }, 2000);
    return () => clearTimeout(saveTimeout);
  }, [propertyData]);

  // استرداد المسودة
  const handleRecoverDraft = () => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        setPropertyData(JSON.parse(savedDraft));
        toast.success('✅ تم استرداد المسودة بنجاح');
      } catch {
        toast.error('فشل في استرداد المسودة');
      }
    }
    setShowRecoveryDialog(false);
  };

  // تجاهل المسودة
  const handleDiscardDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowRecoveryDialog(false);
    setHasSavedDraft(false);
  };

  // تحميل رقم الواتساب من بطاقة العمل
  useEffect(() => {
    if (businessCardData && !propertyData.brokerPhone) {
      const whatsappNumber = businessCardData.whatsapp || businessCardData.phone;
      if (whatsappNumber) {
        setPropertyData(prev => ({ ...prev, brokerPhone: whatsappNumber }));
      }
    }
  }, [businessCardData]);

  // المسار الذكي التلقائي
  const smartPath = useMemo(() => {
    const parts = [];
    if (propertyData.category) parts.push(propertyData.category);
    if (propertyData.purpose) parts.push(propertyData.purpose);
    if (propertyData.locationDetails.city) parts.push(propertyData.locationDetails.city);
    if (propertyData.locationDetails.district) parts.push(`حي ${propertyData.locationDetails.district}`);
    return parts.join(' / ');
  }, [propertyData.category, propertyData.purpose, propertyData.locationDetails.city, propertyData.locationDetails.district]);

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
    tags.push('#عقارات', '#عقار', '#السعودية');
    return tags;
  }, [propertyData]);

  // خريطة المدن السعودية للكشف الدقيق
  const saudiCitiesMap: Record<string, string> = {
    'الرياض': 'الرياض', 'riyadh': 'الرياض',
    'جدة': 'جدة', 'jeddah': 'جدة', 'جده': 'جدة',
    'مكة': 'مكة', 'makkah': 'مكة', 'mecca': 'مكة', 'مكة المكرمة': 'مكة',
    'المدينة': 'المدينة', 'medina': 'المدينة', 'المدينة المنورة': 'المدينة',
    'الدمام': 'الدمام', 'dammam': 'الدمام',
    'الخبر': 'الخبر', 'khobar': 'الخبر', 'al khobar': 'الخبر', 'الخُبر': 'الخبر',
    'الظهران': 'الظهران', 'dhahran': 'الظهران',
    'الأحساء': 'الأحساء', 'الاحساء': 'الأحساء', 'ahsa': 'الأحساء',
    'القطيف': 'القطيف', 'qatif': 'القطيف',
    'الجبيل': 'الجبيل', 'jubail': 'الجبيل',
    'تبوك': 'تبوك', 'tabuk': 'تبوك',
    'أبها': 'أبها', 'abha': 'أبها',
    'الطائف': 'الطائف', 'taif': 'الطائف',
    'نجران': 'نجران', 'najran': 'نجران',
    'القصيم': 'القصيم', 'qassim': 'القصيم', 'بريدة': 'القصيم',
    'حائل': 'حائل', 'hail': 'حائل',
    'جازان': 'جازان', 'jazan': 'جازان', 'jizan': 'جازان',
    'ينبع': 'ينبع', 'yanbu': 'ينبع',
    'خميس مشيط': 'خميس مشيط', 'khamis mushait': 'خميس مشيط',
    'الباحة': 'الباحة', 'baha': 'الباحة',
    'عرعر': 'عرعر', 'arar': 'عرعر',
    'سكاكا': 'سكاكا', 'sakaka': 'سكاكا',
  };

  // كشف المدينة من الحي أو العنوان
  const detectCityFromAddress = (addr: any): string => {
    // أولاً: التحقق من المدينة المباشرة
    const directCity = addr.city || addr.town || addr.village || '';
    const normalizedDirect = directCity.toLowerCase().replace(/[\s-]/g, '');
    if (saudiCitiesMap[normalizedDirect] || saudiCitiesMap[directCity]) {
      return saudiCitiesMap[normalizedDirect] || saudiCitiesMap[directCity] || directCity;
    }

    // ثانياً: التحقق من الولاية/المنطقة
    const state = addr.state || addr.region || '';
    const normalizedState = state.toLowerCase().replace(/[\s-]/g, '');
    if (saudiCitiesMap[normalizedState] || saudiCitiesMap[state]) {
      return saudiCitiesMap[normalizedState] || saudiCitiesMap[state] || state;
    }

    // ثالثاً: البحث في الحي لتحديد المدينة (مثل الثقبة = الخبر)
    const suburb = (addr.suburb || addr.neighbourhood || '').toLowerCase();
    const easternProvinceCities = ['الخبر', 'الدمام', 'الظهران', 'القطيف', 'الجبيل', 'الأحساء'];
    
    // قائمة الأحياء المعروفة ومدنها
    const districtCityMap: Record<string, string> = {
      'الثقبة': 'الخبر', 'العزيزية': 'الخبر', 'الراكة': 'الخبر', 'الكورنيش': 'الخبر',
      'الحمراء': 'الدمام', 'الفيصلية': 'الدمام', 'العنود': 'الدمام',
      'الدوحة': 'الظهران', 'القشلة': 'الظهران',
    };

    for (const [district, city] of Object.entries(districtCityMap)) {
      if (suburb.includes(district.toLowerCase())) {
        return city;
      }
    }

    return directCity || state || '';
  };

  // جلب العنوان من الإحداثيات
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      // Nominatim (OSM) مجاني لكن بياناته ليست دقيقة 100% مثل Google Maps
      // خصوصاً أرقام المباني وأسماء الشوارع الفرعية في السعودية
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1&namedetails=1&extratags=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data?.address) {
        const addr = data.address;
        const displayName = data.display_name || '';
        
        // استخدام الكشف الذكي للمدينة
        const detectedCity = detectCityFromAddress(addr);
        
        // استخراج اسم الشارع - نبحث في عدة حقول
        let streetName = addr.road || addr.street || addr.pedestrian || addr.path || addr.footway || '';
        
        // إذا لم نجد شارع، نحاول استخراجه من display_name
        if (!streetName && displayName) {
          const displayParts = displayName.split(',').map((p: string) => p.trim());
          // عادة الشارع يكون في الجزء الثاني أو الثالث من display_name
          for (const part of displayParts) {
            if (part.includes('Street') || part.includes('شارع') || part.includes('طريق') || /^\d+/.test(part)) {
              streetName = part;
              break;
            }
          }
        }
        
        // استخراج رقم المبنى
        const buildingNum = addr.house_number || '';
        
        // الحي والرمز البريدي
        const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || '';
        const postalCode = addr.postcode || '';
        
        // اسم المكان (مطعم، محل، إلخ) للمساعدة في التعرف
        const placeName = data.name || addr.amenity || addr.shop || addr.building || '';
        
        setPropertyData(prev => ({
          ...prev,
          locationDetails: {
            ...prev.locationDetails,
            city: detectedCity,
            district: district,
            street: streetName,
            postalCode: postalCode,
            buildingNumber: buildingNum,
            // الرقم الإضافي دائماً يدوي - لا يتوفر في OSM
            additionalNumber: prev.locationDetails.additionalNumber || '',
            latitude: lat,
            longitude: lng,
          },
          ownerNationalAddress: [buildingNum, streetName, district, detectedCity, postalCode]
            .filter(Boolean)
            .join('، '),
        }));
        
        // رسائل واضحة للمستخدم
        const missingFields: string[] = [];
        if (!streetName) missingFields.push('اسم الشارع');
        if (!buildingNum) missingFields.push('رقم المبنى');
        
        if (missingFields.length > 0) {
          const placeHint = placeName ? ` (بالقرب من: ${placeName})` : '';
          toast.warning(
            `⚠️ ${missingFields.join(' و ')} غير متوفر في قاعدة البيانات${placeHint} - أدخله يدوياً`,
            { duration: 5000 }
          );
        } else {
          toast.success(`✅ تم تحديد العنوان: ${streetName}، ${district}`);
        }
        
        // طباعة للتصحيح (يمكن إزالتها لاحقاً)
        console.log('📍 Nominatim Response:', { addr, displayName, streetName, buildingNum, placeName });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
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
        const map = L.map(mapRef.current).setView([propertyData.locationDetails.latitude, propertyData.locationDetails.longitude], 17);
        
        streetLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 });
        satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© ESRI', maxZoom: 19 });
        satelliteLayerRef.current.addTo(map);
        
        const marker = L.marker([propertyData.locationDetails.latitude, propertyData.locationDetails.longitude], { draggable: true }).addTo(map);
        marker.on('dragend', (e: any) => fetchAddressFromCoordinates(marker.getLatLng().lat, marker.getLatLng().lng));
        map.on('click', (e: any) => { marker.setLatLng(e.latlng); fetchAddressFromCoordinates(e.latlng.lat, e.latlng.lng); });
        
        mapInstanceRef.current = map;
        markerRef.current = marker;
      };
      document.head.appendChild(script);
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [showMap]);

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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
          }
          fetchAddressFromCoordinates(lat, lng);
        },
        () => { toast.error('فشل في الحصول على الموقع'); setIsLoadingLocation(false); }
      );
    }
  };

  // دوال المميزات والضمانات والهاشتاقات
  const toggleFeature = (f: string) => setPropertyData(prev => ({ ...prev, features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f] }));
  const addCustomFeature = () => { if (newCustomFeature.trim()) { setPropertyData(prev => ({ ...prev, customFeatures: [...prev.customFeatures, newCustomFeature.trim()] })); setNewCustomFeature(''); } };
  const toggleHashtag = (h: string) => setPropertyData(prev => ({ ...prev, hashtags: prev.hashtags.includes(h) ? prev.hashtags.filter(x => x !== h) : [...prev.hashtags, h] }));
  const addCustomHashtag = () => { if (newCustomHashtag.trim()) { setPropertyData(prev => ({ ...prev, customHashtags: [...prev.customHashtags, newCustomHashtag.startsWith('#') ? newCustomHashtag : `#${newCustomHashtag}`] })); setNewCustomHashtag(''); } };
  const addWarranty = () => { const t = newWarrantyType === 'أخرى' ? customWarrantyType : newWarrantyType; if (t && newWarrantyDuration) { setPropertyData(prev => ({ ...prev, warranties: [...prev.warranties, { type: t, duration: newWarrantyDuration }] })); setNewWarrantyType(''); setNewWarrantyDuration(''); setCustomWarrantyType(''); } };
  const removeWarranty = (i: number) => setPropertyData(prev => ({ ...prev, warranties: prev.warranties.filter((_, idx) => idx !== i) }));

  // مولد الأسعار الذكي
  const generateSmartPrices = async () => {
    if (!propertyData.area || !propertyData.purpose) { toast.error('يرجى تحديد المساحة والغرض أولاً'); return; }
    setIsGeneratingPrices(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error('يرجى تسجيل الدخول أولاً'); return; }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smart-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ propertyData: { propertyType: propertyData.propertyType, category: propertyData.category, purpose: propertyData.purpose, area: propertyData.area, city: propertyData.locationDetails.city, district: propertyData.locationDetails.district, bedrooms: propertyData.bedrooms, propertyAge: propertyData.propertyAge, furnishing: propertyData.furnishing, userPrice: propertyData.price } }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSuggestedPrices(data.prices.map((p: any) => ({ source: p.source, price: p.price.toLocaleString() })));
      setMarketAverage(data.marketAverage);
      if (data.priceEvaluation) { setPriceEvaluation(data.priceEvaluation); setPropertyData(prev => ({ ...prev, priceStatus: data.priceEvaluation.status })); }
      if (data.paymentBreakdown) { setPropertyData(prev => ({ ...prev, paymentPrices: { onePayment: data.paymentBreakdown.onePayment.toLocaleString(), twoPayments: data.paymentBreakdown.twoPayments.toLocaleString(), fourPayments: data.paymentBreakdown.fourPayments.toLocaleString(), monthly: data.paymentBreakdown.monthly.toLocaleString() } })); }
      toast.success('تم توليد الأسعار المقترحة');
    } catch { toast.error('فشل في توليد الأسعار'); }
    finally { setIsGeneratingPrices(false); }
  };

  // تحديد/إلغاء تحديد منصة
  const togglePlatform = (platformId: string) => {
    setPropertyData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(id => id !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }));
  };

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

  // النشر على المنصات
  const handlePublish = async () => {
    if (!propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city) {
      toast.error('يرجى ملء الحقول المطلوبة'); return;
    }
    if (!propertyData.ownerName || !propertyData.ownerPhone) {
      toast.error('يرجى ملء معلومات المالك'); return;
    }
    if (!propertyData.adLicense) {
      toast.error('يرجى إدخال رقم الترخيص الإعلاني'); return;
    }
    if (propertyData.selectedPlatforms.length === 0) {
      toast.error('يرجى اختيار منصة واحدة على الأقل للنشر'); return;
    }

    // التحقق من التكرار
    if (checkForDuplicates()) {
      return; // سيتم عرض AlertDialog
    }

    await executePublish();
  };

  // تنفيذ النشر الفعلي
  const executePublish = async () => {
    setShowDuplicateWarning(false);

    setIsPublishing(true);
    setPublishProgress(0);
    setPublishResults([]);

    const results: PlatformPublishResult[] = [];
    const totalPlatforms = propertyData.selectedPlatforms.length;

    try {
      // النشر على منصتي أولاً
      const adData: PublishedAdData = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: propertyData.aiTitle || `${propertyData.purpose} - ${propertyData.propertyType} - ${propertyData.area}م`,
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
          customWarranties: [],
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
        ownerCity: propertyData.ownerCity,
        ownerDistrict: propertyData.ownerDistrict,
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
        source: 'platform_publishing',
      };

      // النشر مع الربط بإدارة العملاء
      const linkResult = await publishAdWithCustomerLink(adData);

      // محاكاة النشر على المنصات الخارجية
      for (let i = 0; i < totalPlatforms; i++) {
        const platformId = propertyData.selectedPlatforms[i];
        const platform = connectedPlatforms.find(p => p.id === platformId);
        
        setPublishProgress(Math.round(((i + 1) / totalPlatforms) * 100));
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const success = Math.random() > 0.2;
        results.push({
          platformId,
          platformName: platform?.nameAr || platformId,
          status: success ? 'success' : 'failed',
          externalId: success ? `ext_${Date.now()}_${i}` : undefined,
          publishedAt: success ? new Date().toISOString() : undefined,
          error: success ? undefined : 'فشل الاتصال بالمنصة',
        });
      }

      setPublishResults(results);
      setShowResults(true);

      // حفظ العرض مع نتائج المنصات
      const platformOffer: PlatformPublishedOffer = {
        id: adData.id,
        title: adData.title,
        propertyType: adData.propertyType,
        purpose: adData.purpose,
        price: adData.price || '',
        area: adData.area || '',
        city: propertyData.locationDetails.city,
        district: propertyData.locationDetails.district,
        ownerName: adData.ownerName || '',
        ownerPhone: adData.ownerPhone || '',
        ownerIdNumber: adData.ownerIdNumber,
        ownerBirthDate: adData.ownerBirthDate,
        ownerNationalAddress: adData.ownerNationalAddress,
        ownerCity: adData.ownerCity,
        ownerDistrict: adData.ownerDistrict,
        deedNumber: adData.deedNumber,
        deedDate: adData.deedDate,
        deedCity: adData.deedCity,
        isCurrentlyRented: propertyData.isCurrentlyRented,
        contractDuration: propertyData.contractDuration ? parseInt(propertyData.contractDuration) : undefined,
        contractStartDate: propertyData.contractStartDate,
        contractEndDate: propertyData.contractEndDate,
        adLicense: adData.adLicense || '',
        adLicenseDate: adData.adLicenseDate,
        adLicenseDuration: adData.adLicenseDuration,
        images: adData.images,
        videos: adData.videos,
        tour3DUrl: adData.tour3DUrl,
        bedrooms: adData.bedrooms,
        bathrooms: adData.bathrooms,
        livingRooms: adData.livingRooms,
        floors: adData.floors,
        propertyAge: adData.propertyAge,
        furnishing: adData.furnishing,
        features: adData.features,
        customFeatures: adData.customFeatures,
        hashtags: adData.hashtags,
        customHashtags: adData.customHashtags,
        aiDescription: adData.aiDescription,
        publishedPlatforms: results,
        source: 'platform_publishing',
        linkedCustomerId: linkResult.customerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // حفظ في localStorage
      const existingOffers = JSON.parse(localStorage.getItem('platform_published_offers') || '[]');
      existingOffers.push(platformOffer);
      localStorage.setItem('platform_published_offers', JSON.stringify(existingOffers));

      // إرسال حدث للتحديث
      window.dispatchEvent(new CustomEvent('platformOfferPublished', { detail: platformOffer }));

      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount === totalPlatforms) {
        toast.success(`تم النشر بنجاح على ${successCount} منصة + منصتي`);
      } else {
        toast.warning(`تم النشر على ${successCount} من ${totalPlatforms} منصة`);
      }

      // حفظ الإعلان لعرض أزرار النجاح
      setPublishedAd(adData);
      setShowSuccessActions(true);
      
      // حذف المسودة بعد النشر الناجح
      localStorage.removeItem(STORAGE_KEY);

      onPublishComplete(platformOffer);

    } catch (error) {
      toast.error('حدث خطأ أثناء النشر');
    } finally {
      setIsPublishing(false);
    }
  };

  // إعادة النشر
  const handleRepublish = () => {
    setShowSuccessActions(false);
    setPublishedAd(null);
    setShowResults(false);
    setPublishResults([]);
    // احتفاظ ببيانات المالك فقط
    setPropertyData(prev => ({
      ...getDefaultPropertyData(),
      ownerName: prev.ownerName,
      ownerPhone: prev.ownerPhone,
      ownerIdNumber: prev.ownerIdNumber,
      ownerBirthDate: prev.ownerBirthDate,
      ownerNationalAddress: prev.ownerNationalAddress,
      ownerCity: prev.ownerCity,
      ownerDistrict: prev.ownerDistrict,
      brokerPhone: prev.brokerPhone,
    }));
    toast.info('يمكنك الآن إضافة عرض جديد بنفس بيانات المالك');
  };

  // الانتقال لبطاقة المالك
  const handleNavigateToOwner = (customerId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToCustomer', { detail: { customerId } }));
    onCancel();
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-clip">
      {/* ✅ تجاوب الجوال: منع أي عنصر داخلي من دفع عرض الصفحة أفقياً */}
      <div
        className="space-y-2 sm:space-y-3 p-2 sm:p-3 pb-24 w-full max-w-full overflow-x-clip box-border min-w-0 [&_*]:max-w-full [&_*]:min-w-0"
        dir="rtl"
      >
        
        {/* نافذة استرداد المسودة */}
        {showRecoveryDialog && (
          <Card className="border-2 border-[hsl(var(--gold))] bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg">
            <CardContent className="py-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))]/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-[hsl(var(--gold))]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#01411C]">لديك مسودة محفوظة</h3>
                  <p className="text-sm text-gray-600 mt-1">هل تريد استرداد البيانات المحفوظة سابقاً؟</p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button onClick={handleRecoverDraft} className="flex-1 bg-[#01411C] text-white">
                    <RefreshCw className="w-4 h-4 ml-2" />استرداد
                  </Button>
                  <Button onClick={handleDiscardDraft} variant="outline" className="flex-1 border-red-300 text-red-600">
                    <Trash2 className="w-4 h-4 ml-2" />تجاهل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* أزرار النجاح بعد النشر */}
        {showSuccessActions && publishedAd && (
          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="py-6">
              <div className="flex flex-col items-center gap-4 text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-green-700">تم النشر بنجاح! 🎉</h3>
                  <p className="text-sm text-gray-600 mt-1">تم نشر إعلانك على المنصات المحددة ومنصتي</p>
                </div>
              </div>
              <PublishSuccessActions
                publishedAd={publishedAd}
                onRepublish={handleRepublish}
                onNavigateToOwner={handleNavigateToOwner}
                brokerInfo={{
                  name: businessCardData?.name || '',
                  phone: businessCardData?.phone || '',
                  company: (businessCardData as any)?.company,
                  licenseNumber: (businessCardData as any)?.falLicenseNumber || (businessCardData as any)?.license_number,
                  city: businessCardData?.city,
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* العنوان - متجاوب مع الجوال */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-[hsl(var(--forest-green))]">نشر إعلان على المنصات</h2>
          <Button variant="outline" size="sm" onClick={() => { setPropertyData(getDefaultPropertyData()); localStorage.removeItem(STORAGE_KEY); }} className="text-red-600 border-red-300 text-xs sm:text-sm">
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />مسح
          </Button>
        </div>

        {/* ===================== 1. معلومات المالك - متجاوب مع الجوال ===================== */}
        <Card className="border border-[#D4AF37] sm:border-2">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 py-2 sm:py-4 px-3 sm:px-6">
            <CardTitle className="text-[#01411C] flex items-center gap-2 text-sm sm:text-base">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />معلومات المالك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 px-2 sm:px-6 sm:space-y-4 sm:pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">الاسم كاملاً *</Label>
                <Input value={propertyData.ownerName} onChange={(e) => setPropertyData(prev => ({ ...prev, ownerName: e.target.value }))} placeholder="اسم المالك" className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" />
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">تاريخ الميلاد</Label>
                <Input type="date" value={propertyData.ownerBirthDate} onChange={(e) => setPropertyData(prev => ({ ...prev, ownerBirthDate: e.target.value }))} className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" />
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">رقم الهوية *</Label>
                <Input value={propertyData.ownerIdNumber} onChange={(e) => setPropertyData(prev => ({ ...prev, ownerIdNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))} placeholder="10 أرقام" className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" dir="ltr" />
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">رقم الجوال *</Label>
                <Input value={propertyData.ownerPhone} onChange={(e) => setPropertyData(prev => ({ ...prev, ownerPhone: e.target.value }))} placeholder="05xxxxxxxx" className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" dir="ltr" />
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">المدينة</Label>
                <Select value={propertyData.ownerCity} onValueChange={(v) => setPropertyData(prev => ({ ...prev, ownerCity: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">الحي</Label>
                <Input value={propertyData.ownerDistrict} onChange={(e) => setPropertyData(prev => ({ ...prev, ownerDistrict: e.target.value }))} placeholder="اسم الحي" className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 2. معلومات الصك - متجاوب مع الجوال ===================== */}
        <Card className="border border-[#D4AF37] sm:border-2">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 py-2 sm:py-4 px-3 sm:px-6">
            <CardTitle className="text-[#01411C] flex items-center gap-2 text-sm sm:text-base"><FileText className="w-4 h-4 sm:w-5 sm:h-5" />معلومات الصك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 px-2 sm:px-6 sm:space-y-4 sm:pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">رقم الصك</Label>
                <Input value={propertyData.deedNumber} onChange={(e) => setPropertyData(prev => ({ ...prev, deedNumber: e.target.value }))} className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" />
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">تاريخ الصك</Label>
                <Input type="date" value={propertyData.deedDate} onChange={(e) => setPropertyData(prev => ({ ...prev, deedDate: e.target.value }))} className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" />
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">مدينة الصك</Label>
                <Select value={propertyData.deedCity} onValueChange={(v) => setPropertyData(prev => ({ ...prev, deedCity: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 3. معلومات العقار - متجاوب مع الجوال ===================== */}
        <Card className="border border-[#D4AF37] sm:border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-2 sm:py-4 px-3 sm:px-6">
            <CardTitle className="text-[#01411C] flex items-center gap-2 text-sm sm:text-base"><Building className="w-4 h-4 sm:w-5 sm:h-5" />معلومات العقار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 px-2 sm:px-6 sm:space-y-4 sm:pt-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">نوع العقار *</Label>
                <Select value={propertyData.propertyType} onValueChange={(v) => setPropertyData(prev => ({ ...prev, propertyType: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{propertyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">الفئة</Label>
                <Select value={propertyData.category} onValueChange={(v) => setPropertyData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">الغرض *</Label>
                <Select value={propertyData.purpose} onValueChange={(v) => setPropertyData(prev => ({ ...prev, purpose: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{purposes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-xs sm:text-sm">المساحة (م²)</Label>
                <Input type="number" value={propertyData.area} onChange={(e) => setPropertyData(prev => ({ ...prev, area: e.target.value }))} className="border-[#D4AF37] text-xs sm:text-sm h-9 sm:h-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 4. الموقع مع الخريطة ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><MapPin className="w-5 h-5" />الموقع والعنوان الوطني</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button onClick={() => setShowMap(!showMap)} variant="outline" className="w-full border-[#01411C] text-[#01411C]">
              <MapPin className="w-4 h-4 ml-2" />{showMap ? 'إخفاء الخريطة' : 'فتح الخريطة'}
            </Button>
            
            {showMap && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={toggleMapLayer} size="sm" variant="outline">{mapLayer === 'satellite' ? '🗺️ شارع' : '🛰️ قمر صناعي'}</Button>
                  <Button onClick={getCurrentLocation} size="sm" variant="outline" disabled={isLoadingLocation}>
                    {isLoadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 ml-1" />}موقعي
                  </Button>
                </div>
                <div ref={mapRef} className="h-64 rounded-lg border-2 border-[#D4AF37]" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#01411C] text-sm">المدينة *</Label>
                <Select value={propertyData.locationDetails.city} onValueChange={(v) => setPropertyData(prev => ({ ...prev, locationDetails: { ...prev.locationDetails, city: v } }))}>
                  <SelectTrigger className="border-[#D4AF37] text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-sm">الحي</Label>
                <Input value={propertyData.locationDetails.district} onChange={(e) => setPropertyData(prev => ({ ...prev, locationDetails: { ...prev.locationDetails, district: e.target.value } }))} className="border-[#D4AF37] text-sm" />
              </div>
              <div>
                <Label className="text-[#01411C] text-sm">الشارع</Label>
                <Input value={propertyData.locationDetails.street} onChange={(e) => setPropertyData(prev => ({ ...prev, locationDetails: { ...prev.locationDetails, street: e.target.value } }))} className="border-[#D4AF37] text-sm" />
              </div>
              <div>
                <Label className="text-[#01411C] text-sm">الرمز البريدي</Label>
                <Input value={propertyData.locationDetails.postalCode} onChange={(e) => setPropertyData(prev => ({ ...prev, locationDetails: { ...prev.locationDetails, postalCode: e.target.value } }))} className="border-[#D4AF37] text-sm" dir="ltr" />
              </div>
              <div>
                <Label className="text-[#01411C] text-sm">رقم المبنى</Label>
                <Input value={propertyData.locationDetails.buildingNumber} onChange={(e) => setPropertyData(prev => ({ ...prev, locationDetails: { ...prev.locationDetails, buildingNumber: e.target.value } }))} className="border-[#D4AF37] text-sm" dir="ltr" />
              </div>
              <div>
                <Label className="text-[#01411C] text-sm">الرقم الإضافي</Label>
                <Input value={propertyData.locationDetails.additionalNumber} onChange={(e) => setPropertyData(prev => ({ ...prev, locationDetails: { ...prev.locationDetails, additionalNumber: e.target.value } }))} className="border-[#D4AF37] text-sm" dir="ltr" />
              </div>
            </div>
            
            {/* العنوان الوطني */}
            <div>
              <Label className="text-[#01411C]">العنوان الوطني الكامل</Label>
              <Input value={propertyData.ownerNationalAddress} onChange={(e) => setPropertyData(prev => ({ ...prev, ownerNationalAddress: e.target.value }))} placeholder="يتم تعبئته تلقائياً من الخريطة" className="border-[#D4AF37] bg-green-50" />
            </div>
          </CardContent>
        </Card>

        {/* ===================== الوسائط ===================== */}
        <PropertyMediaUpload
          media={propertyData.media}
          onMediaChange={(media) => setPropertyData(prev => ({ ...prev, media }))}
          tour3DUrl={propertyData.tour3DUrl}
          onTour3DChange={(url) => setPropertyData(prev => ({ ...prev, tour3DUrl: url }))}
        />

        {/* ===================== المسار الذكي ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><Sparkles className="w-5 h-5" />المسار الذكي <Badge className="bg-purple-100 text-purple-700 text-xs">تلقائي</Badge></CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300">
              <div className="flex items-center gap-2 flex-wrap">
                {smartPath ? smartPath.split(' / ').map((part, i) => (
                  <span key={i} className="flex items-center">
                    <Badge className="bg-white text-purple-800 border border-purple-300">{part}</Badge>
                    {i < smartPath.split(' / ').length - 1 && <span className="mx-1 text-purple-400">/</span>}
                  </span>
                )) : <span className="text-purple-600 text-sm">يتم بناء المسار تلقائياً</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== المواصفات التفصيلية ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><Settings className="w-5 h-5" />المواصفات التفصيلية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-[#01411C] text-xs">غرف النوم</Label><Input type="number" value={propertyData.bedrooms} onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))} className="border-[#D4AF37] text-sm h-9" /></div>
              <div><Label className="text-[#01411C] text-xs">دورات المياه</Label><Input type="number" value={propertyData.bathrooms} onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))} className="border-[#D4AF37] text-sm h-9" /></div>
              <div><Label className="text-[#01411C] text-xs">الصالات</Label><Input type="number" value={propertyData.livingRooms} onChange={(e) => setPropertyData(prev => ({ ...prev, livingRooms: e.target.value }))} className="border-[#D4AF37] text-sm h-9" /></div>
              <div><Label className="text-[#01411C] text-xs">الأدوار</Label><Input type="number" value={propertyData.floors} onChange={(e) => setPropertyData(prev => ({ ...prev, floors: e.target.value }))} className="border-[#D4AF37] text-sm h-9" /></div>
              <div><Label className="text-[#01411C] text-xs">عمر العقار</Label><Input type="number" value={propertyData.propertyAge} onChange={(e) => setPropertyData(prev => ({ ...prev, propertyAge: e.target.value }))} className="border-[#D4AF37] text-sm h-9" /></div>
              <div><Label className="text-[#01411C] text-xs">عرض الشارع</Label><Input type="number" value={propertyData.streetWidth} onChange={(e) => setPropertyData(prev => ({ ...prev, streetWidth: e.target.value }))} className="border-[#D4AF37] text-sm h-9" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label className="text-[#01411C] text-xs">الواجهة</Label>
                <Select value={propertyData.facade} onValueChange={(v) => setPropertyData(prev => ({ ...prev, facade: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-sm h-9"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{facadeOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-xs">التأثيث</Label>
                <Select value={propertyData.furnishing} onValueChange={(v) => setPropertyData(prev => ({ ...prev, furnishing: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-sm h-9"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-60">{furnishingOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== معلومات الإيجار ===================== */}
        {propertyData.purpose === 'للإيجار' && (
          <Card className="border-2 border-orange-400">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-orange-700 flex items-center gap-2"><Home className="w-5 h-5" />معلومات الإيجار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Checkbox id="isRented" checked={propertyData.isCurrentlyRented} onCheckedChange={(c) => setPropertyData(prev => ({ ...prev, isCurrentlyRented: c as boolean }))} />
                <Label htmlFor="isRented" className="text-orange-700 font-medium">العقار مؤجر حالياً</Label>
              </div>
              {propertyData.isCurrentlyRented && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <Label className="text-orange-700 text-sm">مدة العقد (شهور)</Label>
                    <Input type="number" value={propertyData.contractDuration} onChange={(e) => setPropertyData(prev => ({ ...prev, contractDuration: e.target.value }))} className="border-orange-300 text-sm" />
                  </div>
                  <div>
                    <Label className="text-orange-700 text-sm">تاريخ بداية العقد</Label>
                    <Input type="date" value={propertyData.contractStartDate} onChange={(e) => setPropertyData(prev => ({ ...prev, contractStartDate: e.target.value }))} className="border-orange-300 text-sm" />
                  </div>
                  <div>
                    <Label className="text-orange-700 text-sm">تاريخ نهاية العقد</Label>
                    <Input type="date" value={propertyData.contractEndDate} onChange={(e) => setPropertyData(prev => ({ ...prev, contractEndDate: e.target.value }))} className="border-orange-300 text-sm" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================== المميزات ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><Star className="w-5 h-5" />المميزات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {defaultFeatures.map(f => (
                <Badge key={f} variant={propertyData.features.includes(f) ? "default" : "outline"} className={`cursor-pointer ${propertyData.features.includes(f) ? 'bg-[#01411C] text-white' : 'border-[#D4AF37] text-[#01411C]'}`} onClick={() => toggleFeature(f)}>
                  {propertyData.features.includes(f) && <CheckCircle className="w-3 h-3 ml-1" />}{f}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCustomFeature} onChange={(e) => setNewCustomFeature(e.target.value)} placeholder="أضف ميزة..." className="border-[#D4AF37] text-sm flex-1" onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()} />
              <Button onClick={addCustomFeature} variant="outline" size="sm" className="border-[#01411C] shrink-0">إضافة</Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== الضمانات ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><Shield className="w-5 h-5" />الضمانات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={newWarrantyType} onValueChange={setNewWarrantyType}>
                <SelectTrigger className="border-[#D4AF37] text-sm"><SelectValue placeholder="نوع الضمان" /></SelectTrigger>
                <SelectContent className="bg-white z-50 max-h-60">{warrantyTypes.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}<SelectItem value="أخرى">أخرى</SelectItem></SelectContent>
              </Select>
              {newWarrantyType === 'أخرى' && <Input value={customWarrantyType} onChange={(e) => setCustomWarrantyType(e.target.value)} placeholder="اكتب نوع الضمان" className="border-[#D4AF37] text-sm" />}
              <Input value={newWarrantyDuration} onChange={(e) => setNewWarrantyDuration(e.target.value)} placeholder="المدة (سنة، سنتين...)" className="border-[#D4AF37] text-sm" />
              <Button onClick={addWarranty} className="bg-[#01411C] text-white text-sm" disabled={!newWarrantyType || !newWarrantyDuration}><Plus className="w-4 h-4 ml-1" />إضافة</Button>
            </div>
            {propertyData.warranties.length > 0 && (
              <div className="space-y-2">
                {propertyData.warranties.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /><span>{w.type}</span><Badge variant="outline">{w.duration}</Badge></div>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeWarranty(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================== مولد الأسعار الذكي ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><DollarSign className="w-5 h-5" />مولد الأسعار الذكي <Badge className="bg-emerald-500 text-white text-xs">AI</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button onClick={generateSmartPrices} disabled={isGeneratingPrices || !propertyData.area} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {isGeneratingPrices ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري البحث...</> : <><Zap className="w-4 h-4 ml-2" />توليد الأسعار</>}
            </Button>
            {suggestedPrices.length > 0 && (
              <RadioGroup value={propertyData.priceSource} onValueChange={(v) => { const s = suggestedPrices.find(p => p.source === v); if (s) setPropertyData(prev => ({ ...prev, priceSource: v, price: s.price.replace(/,/g, '') })); }}>
                {suggestedPrices.map((s, i) => (
                  <div key={i} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={s.source} id={`p-${i}`} />
                    <Label htmlFor={`p-${i}`} className="flex-1 mr-2 cursor-pointer"><span className="font-medium">{s.source}:</span> <span className="text-emerald-600 font-bold">{s.price} ريال</span></Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            <div>
              <Label className="text-[#01411C]">السعر المطلوب (ريال)</Label>
              <Input type="number" value={propertyData.price} onChange={(e) => setPropertyData(prev => ({ ...prev, price: e.target.value }))} className="border-[#D4AF37]" />
            </div>
            {priceEvaluation && (
              <div className={`p-3 rounded-lg border-2 ${priceEvaluation.color === 'green' ? 'bg-green-50 border-green-300' : priceEvaluation.color === 'blue' ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'}`}>
                <div className={`font-bold ${priceEvaluation.color === 'green' ? 'text-green-700' : priceEvaluation.color === 'blue' ? 'text-blue-700' : 'text-red-700'}`}>{priceEvaluation.status}</div>
                <p className="text-sm mt-1">{priceEvaluation.message}</p>
              </div>
            )}
            {propertyData.purpose === 'للإيجار' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div><Label className="text-amber-700 text-xs">دفعة واحدة</Label><Input type="number" value={propertyData.paymentPrices.onePayment} onChange={(e) => setPropertyData(prev => ({ ...prev, paymentPrices: { ...prev.paymentPrices, onePayment: e.target.value } }))} className="border-amber-300 text-sm h-9" /></div>
                <div><Label className="text-amber-700 text-xs">دفعتين</Label><Input type="number" value={propertyData.paymentPrices.twoPayments} onChange={(e) => setPropertyData(prev => ({ ...prev, paymentPrices: { ...prev.paymentPrices, twoPayments: e.target.value } }))} className="border-amber-300 text-sm h-9" /></div>
                <div><Label className="text-amber-700 text-xs">أربع دفعات</Label><Input type="number" value={propertyData.paymentPrices.fourPayments} onChange={(e) => setPropertyData(prev => ({ ...prev, paymentPrices: { ...prev.paymentPrices, fourPayments: e.target.value } }))} className="border-amber-300 text-sm h-9" /></div>
                <div><Label className="text-amber-700 text-xs">شهري</Label><Input type="number" value={propertyData.paymentPrices.monthly} onChange={(e) => setPropertyData(prev => ({ ...prev, paymentPrices: { ...prev.paymentPrices, monthly: e.target.value } }))} className="border-amber-300 text-sm h-9" /></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================== الهاشتاقات ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><Hash className="w-5 h-5" />الهاشتاقات التلقائية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {autoHashtags.map(h => (
                <Badge key={h} variant={propertyData.hashtags.includes(h) ? "default" : "outline"} className={`cursor-pointer ${propertyData.hashtags.includes(h) ? 'bg-indigo-600 text-white' : 'border-indigo-300 text-indigo-600'}`} onClick={() => toggleHashtag(h)}>{h}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCustomHashtag} onChange={(e) => setNewCustomHashtag(e.target.value)} placeholder="أضف هاشتاق..." className="border-[#D4AF37] text-sm flex-1" onKeyPress={(e) => e.key === 'Enter' && addCustomHashtag()} />
              <Button onClick={addCustomHashtag} variant="outline" size="sm" className="border-indigo-500 text-indigo-600 shrink-0">إضافة</Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== مولد الوصف ===================== */}
        <Card className="border-2 border-[#D4AF37]">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
            <CardTitle className="text-[#01411C] flex items-center gap-2"><Wand2 className="w-5 h-5" />مولد الوصف <Badge className="bg-pink-500 text-white text-xs">AI</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[#01411C] text-sm">رقم الوسيط</Label><Input value={propertyData.brokerPhone} onChange={(e) => setPropertyData(prev => ({ ...prev, brokerPhone: e.target.value }))} className="border-[#D4AF37] text-sm" dir="ltr" /></div>
              <div><Label className="text-[#01411C] text-sm">الترخيص الإعلاني *</Label><Input value={propertyData.adLicense} onChange={(e) => setPropertyData(prev => ({ ...prev, adLicense: e.target.value }))} className="border-[#D4AF37] text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[#01411C] text-sm">تاريخ الترخيص</Label><Input type="date" value={propertyData.adLicenseDate} onChange={(e) => setPropertyData(prev => ({ ...prev, adLicenseDate: e.target.value }))} className="border-[#D4AF37] text-sm" /></div>
              <div>
                <Label className="text-[#01411C] text-sm">مدة الترخيص</Label>
                <Select value={propertyData.adLicenseDuration} onValueChange={(v) => setPropertyData(prev => ({ ...prev, adLicenseDuration: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white z-50"><SelectItem value="30">30 يوم</SelectItem><SelectItem value="60">60 يوم</SelectItem><SelectItem value="90">90 يوم</SelectItem><SelectItem value="180">180 يوم</SelectItem><SelectItem value="365">سنة</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#01411C] text-sm">طول الوصف</Label>
                <Select value={propertyData.descriptionLength} onValueChange={(v) => setPropertyData(prev => ({ ...prev, descriptionLength: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white z-50"><SelectItem value="قصير">قصير</SelectItem><SelectItem value="متوسط">متوسط</SelectItem><SelectItem value="طويل">طويل</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#01411C] text-sm">اللغة</Label>
                <Select value={propertyData.descriptionLanguage} onValueChange={(v) => setPropertyData(prev => ({ ...prev, descriptionLanguage: v }))}>
                  <SelectTrigger className="border-[#D4AF37] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white z-50"><SelectItem value="عربي">عربي</SelectItem><SelectItem value="انجليزي">انجليزي</SelectItem><SelectItem value="عربي انجليزي">عربي وانجليزي</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[#01411C] text-sm mb-2 block">أسلوب الوصف</Label>
              <div className="flex flex-wrap gap-2">
                {['احترافي', 'تسويقي', 'فاخر'].map(s => (
                  <Button key={s} size="sm" variant={propertyData.descriptionStyle === s ? "default" : "outline"} className={propertyData.descriptionStyle === s ? "bg-[#01411C] text-white" : "border-[#D4AF37]"} onClick={() => setPropertyData(prev => ({ ...prev, descriptionStyle: s }))}>{s}</Button>
                ))}
              </div>
            </div>

            <AIDescription
              mode={propertyData.purpose === 'للبيع' ? 'sale' : 'rent'}
              city={propertyData.locationDetails.city}
              district={propertyData.locationDetails.district}
              propertyType={propertyData.propertyType}
              features={{ category: propertyData.category, area: propertyData.area ? parseInt(propertyData.area) : undefined, bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : undefined, bathrooms: propertyData.bathrooms ? parseInt(propertyData.bathrooms) : undefined, livingRooms: propertyData.livingRooms ? parseInt(propertyData.livingRooms) : undefined, floors: propertyData.floors ? parseInt(propertyData.floors) : undefined, furnishing: propertyData.furnishing, propertyAge: propertyData.propertyAge ? parseInt(propertyData.propertyAge) : undefined, streetWidth: propertyData.streetWidth ? parseInt(propertyData.streetWidth) : undefined, facade: propertyData.facade, customFeatures: [...propertyData.features, ...propertyData.customFeatures], warranties: propertyData.warranties }}
              price={propertyData.price ? parseInt(propertyData.price) : undefined}
              currentDescription={propertyData.aiDescription}
              currentTitle={propertyData.aiTitle}
              onDescriptionSelect={(d) => setPropertyData(prev => ({ ...prev, aiDescription: d }))}
              onTitleSelect={(t) => setPropertyData(prev => ({ ...prev, aiTitle: t }))}
              style={propertyData.descriptionStyle as any}
              length={propertyData.descriptionLength as any}
              language={propertyData.descriptionLanguage as any}
              brokerPhone={propertyData.brokerPhone}
              adLicense={propertyData.adLicense}
            />

            <div>
              <Label className="text-[#01411C] text-sm">عنوان الإعلان</Label>
              <Input value={propertyData.aiTitle} onChange={(e) => setPropertyData(prev => ({ ...prev, aiTitle: e.target.value }))} placeholder="اضغط توليد للعنوان الذكي" className="border-[#D4AF37] bg-green-50 font-medium text-sm" />
            </div>
            <div>
              <Label className="text-[#01411C] text-sm">الوصف</Label>
              <Textarea value={propertyData.aiDescription} onChange={(e) => setPropertyData(prev => ({ ...prev, aiDescription: e.target.value }))} placeholder="اضغط توليد للوصف الذكي" className="border-[#D4AF37] min-h-[100px] bg-green-50 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* ===================== اختيار المنصات ===================== */}
        <Card className="border-2 border-purple-400">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="text-purple-700 flex items-center gap-2"><Globe className="w-5 h-5" />اختر المنصات للنشر *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">اختر المنصات التي تريد نشر الإعلان عليها (بالإضافة لمنصتي الخاصة)</p>
            <div className="grid grid-cols-2 gap-2">
              {connectedPlatforms.map(platform => (
                <motion.div
                  key={platform.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => platform.status === 'connected' && togglePlatform(platform.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    propertyData.selectedPlatforms.includes(platform.id)
                      ? 'border-purple-500 bg-purple-50'
                      : platform.status === 'connected'
                        ? 'border-gray-200 hover:border-purple-300'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: platform.bgColor }}>{platform.logo}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{platform.nameAr}</p>
                      {platform.status !== 'connected' && <p className="text-xs text-red-500">غير متصل</p>}
                    </div>
                    {propertyData.selectedPlatforms.includes(platform.id) && <Check className="w-5 h-5 text-purple-600" />}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-purple-600"><Badge variant="outline" className="border-purple-300">✓</Badge> سيتم النشر أيضاً على <strong>منصتي</strong> تلقائياً مع ربط بإدارة العملاء</p>
          </CardContent>
        </Card>

        {/* ===================== زر النشر ===================== */}
        <Card className="border-2 border-[#01411C] bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
          <CardContent className="p-4">
            {/* ملخص */}
            <div className="mb-3 p-3 bg-white rounded-lg border">
              <h4 className="font-bold text-[#01411C] mb-2 text-sm">ملخص الإعلان:</h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div><span className="text-gray-500">النوع:</span> <span className="font-medium">{propertyData.propertyType || '-'}</span></div>
                <div><span className="text-gray-500">الغرض:</span> <span className="font-medium">{propertyData.purpose || '-'}</span></div>
                <div><span className="text-gray-500">المدينة:</span> <span className="font-medium">{propertyData.locationDetails.city || '-'}</span></div>
                <div><span className="text-gray-500">المساحة:</span> <span className="font-medium">{propertyData.area ? `${propertyData.area} م²` : '-'}</span></div>
                <div><span className="text-gray-500">المالك:</span> <span className="font-medium">{propertyData.ownerName || '-'}</span></div>
                <div><span className="text-gray-500">السعر:</span> <span className="font-medium text-emerald-600">{propertyData.price ? `${parseInt(propertyData.price).toLocaleString()} ر` : '-'}</span></div>
                <div className="col-span-2"><span className="text-gray-500">المنصات:</span> <span className="font-medium text-purple-600">{propertyData.selectedPlatforms.length} + منصتي</span></div>
              </div>
              {smartPath && <div className="mt-2 pt-2 border-t text-xs"><span className="text-gray-500">المسار:</span> <span className="font-medium text-purple-600">{smartPath}</span></div>}
            </div>

            {/* شريط التقدم */}
            {isPublishing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2"><span>جاري النشر...</span><span>{publishProgress}%</span></div>
                <Progress value={publishProgress} className="h-2" />
              </div>
            )}

            {/* نتائج النشر */}
            {showResults && publishResults.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="font-bold text-[#01411C]">نتائج النشر:</h4>
                {publishResults.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${r.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {r.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
                      <span className="font-medium">{r.platformName}</span>
                    </div>
                    <span className={`text-sm ${r.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{r.status === 'success' ? 'تم النشر' : r.error}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1 border-gray-300 text-sm">إلغاء</Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city || !propertyData.ownerName || !propertyData.ownerPhone || propertyData.selectedPlatforms.length === 0}
                className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90 text-[#D4AF37] font-bold text-sm py-5"
              >
                {isPublishing ? <><Loader2 className="w-4 h-4 ml-1 animate-spin" />جاري النشر...</> : <><Send className="w-4 h-4 ml-1" />نشر الإعلان</>}
              </Button>
            </div>

            {(!propertyData.propertyType || !propertyData.purpose || !propertyData.locationDetails.city || !propertyData.ownerName || !propertyData.ownerPhone || propertyData.selectedPlatforms.length === 0) && (
              <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                يرجى ملء الحقول المطلوبة واختيار منصة واحدة على الأقل
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* AlertDialog للتكرار */}
      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              تحذير: عرض مكرر
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {duplicateMessage}
              <br /><br />
              <span className="text-sm text-gray-500">
                هل تريد المتابعة والنشر على أي حال؟
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction 
              onClick={() => executePublish()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              نشر على أي حال
            </AlertDialogAction>
            <AlertDialogCancel className="border-gray-300">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
