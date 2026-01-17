/**
 * PublicRequestForm.tsx
 * صفحة إرسال طلب عقار من العميل - نموذج شامل مع أقسام ملونة
 * يحفظ البيانات في قاعدة البيانات مع الإشعارات والدوائر النابضة
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Loader2, CheckCircle, Search, User, Phone, MapPin, DollarSign,
  CreditCard, Building, Home, Calendar, Ruler, BedDouble, Bath, Sparkles, Zap,
  Navigation, Satellite, Map as MapIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Mock broker data
const getMockBroker = (brokerId: string): BrokerInfo => ({
  id: brokerId,
  name: 'أحمد محمد',
  company: 'شركة الوساطة العقارية',
  phone: '0512345678',
  email: 'ahmed@example.com',
  location: 'الرياض',
  licenseNumber: 'FAL-12345678',
  rating: 4.8,
  verified: true,
  profileImage: '',
  coverImage: '',
  logoImage: '',
});

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "استراحة"];
const purposes = ["للشراء", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف", "نجران", "القصيم", "حائل"];
const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "مطبخ مؤثث", "غير مؤثث", "لا يهم"];

// ===================== Section Wrapper Component =====================
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'rose' | 'cyan' | 'orange';
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, color, children }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
    rose: 'bg-rose-50 border-rose-200',
    cyan: 'bg-cyan-50 border-cyan-200',
    orange: 'bg-orange-50 border-orange-200',
  };
  
  const headerColors = {
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    amber: 'bg-amber-100 text-amber-800 border-amber-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    rose: 'bg-rose-100 text-rose-800 border-rose-300',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${colorClasses[color]}`}>
      <div className={`px-4 py-3 border-b-2 flex items-center gap-2 font-bold ${headerColors[color]}`}>
        {icon}
        {title}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

interface FormData {
  // معلومات العميل
  clientName: string;
  clientPhone: string;
  clientIdNumber: string;
  clientBirthDate: string;
  clientCity: string;
  clientDistrict: string;
  
  // معلومات العقار المطلوب
  propertyType: string;
  purpose: string;
  preferredCity: string;
  preferredDistricts: string;
  
  // معلومات الموقع من الخريطة
  street: string;
  buildingNumber: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  
  // المساحة والمواصفات
  minArea: string;
  maxArea: string;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  floors: string;
  furnishing: string;
  
  // الميزانية
  minBudget: string;
  maxBudget: string;
  requestedPrice: string; // السعر المطلوب للمولد الذكي
  
  // خيارات الدفعات للإيجار
  paymentPrices: {
    onePayment: string;
    twoPayments: string;
    fourPayments: string;
    monthly: string;
  };
  
  // الميزات المطلوبة
  hasPool: boolean;
  hasGarden: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  hasMaidRoom: boolean;
  hasDriverRoom: boolean;
  
  // متطلبات إضافية
  additionalRequirements: string;
  urgency: string;
  
  // موافقة
  agreeToTerms: boolean;
}

// أنواع تقييم السعر
interface PriceEvaluation {
  status: 'أقل من السوق' | 'مناسب' | 'مبالغ فيه';
  message: string;
  color: 'green' | 'blue' | 'red';
  percentage: number;
}

interface SuggestedPrice {
  source: string;
  price: string;
  url?: string;
}

export default function PublicRequestForm() {
  // دعم كلا المعاملين: slug (من الصفحة العامة) و brokerId (قديم)
  const { slug, brokerId } = useParams<{ slug?: string; brokerId?: string }>();
  const brokerSlug = slug || brokerId;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [broker, setBroker] = useState<BrokerInfo>(getMockBroker(brokerSlug || '1'));

  // تحميل بيانات الوسيط من قاعدة البيانات
  useEffect(() => {
    const loadBrokerData = async () => {
      if (!brokerSlug) return;
      
      try {
        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('data, user_id')
          .eq('slug', brokerSlug)
          .eq('published', true)
          .single();

        if (businessCard?.data) {
          const cardData = businessCard.data as Record<string, any>;
          setBroker({
            id: brokerSlug,
            name: cardData.name || cardData.userName || 'وسيط عقاري',
            company: cardData.company || cardData.companyName || '',
            phone: cardData.phone || cardData.primaryPhone || '',
            email: cardData.email || '',
            location: cardData.city || cardData.location || '',
            licenseNumber: cardData.falLicenseNumber || cardData.falLicense || '',
            rating: 4.8,
            verified: true,
            profileImage: cardData.profileImage || '',
            coverImage: cardData.coverImage || '',
            logoImage: cardData.logoImage || '',
          });
        }
      } catch (error) {
        console.error('Error loading broker data:', error);
      }
    };
    
    loadBrokerData();
  }, [brokerSlug]);

  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    clientIdNumber: '',
    clientBirthDate: '',
    clientCity: '',
    clientDistrict: '',
    propertyType: '',
    purpose: '',
    preferredCity: '',
    preferredDistricts: '',
    street: '',
    buildingNumber: '',
    postalCode: '',
    lat: null,
    lng: null,
    minArea: '',
    maxArea: '',
    bedrooms: '',
    bathrooms: '',
    livingRooms: '',
    floors: '',
    furnishing: '',
    minBudget: '',
    maxBudget: '',
    requestedPrice: '',
    paymentPrices: {
      onePayment: '',
      twoPayments: '',
      fourPayments: '',
      monthly: '',
    },
    hasPool: false,
    hasGarden: false,
    hasElevator: false,
    hasParking: false,
    hasMaidRoom: false,
    hasDriverRoom: false,
    additionalRequirements: '',
    urgency: 'normal',
    agreeToTerms: false,
  });

  // متغيرات الخريطة
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street'>('satellite');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // متغيرات مولد الأسعار الذكي
  const [isGeneratingPrices, setIsGeneratingPrices] = useState(false);
  const [suggestedPrices, setSuggestedPrices] = useState<SuggestedPrice[]>([]);
  const [priceEvaluation, setPriceEvaluation] = useState<PriceEvaluation | null>(null);
  const [marketAverage, setMarketAverage] = useState<number | null>(null);

  // دالة جلب العنوان من الإحداثيات
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        setFormData(prev => ({
          ...prev,
          preferredCity: addr.city || addr.town || addr.village || addr.state || prev.preferredCity,
          preferredDistricts: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || prev.preferredDistricts,
          street: addr.road || addr.street || '',
          buildingNumber: addr.house_number || '',
          postalCode: addr.postcode || '',
          lat,
          lng,
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
    if (!mapContainer.current || mapRef.current) return;

    const centerLat = 24.7136;
    const centerLng = 46.6753;

    mapRef.current = L.map(mapContainer.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
    });

    // Street layer
    streetLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    // Satellite layer
    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© ESRI',
      maxZoom: 19,
    });

    satelliteLayerRef.current.addTo(mapRef.current);

    // إضافة حدث النقر على الخريطة
    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (mapRef.current) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        
        markerRef.current.on('dragend', (ev) => {
          const position = ev.target.getLatLng();
          fetchAddressFromCoordinates(position.lat, position.lng);
        });
      }
      
      fetchAddressFromCoordinates(lat, lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // تبديل طبقة الخريطة
  const toggleMapLayer = () => {
    if (!mapRef.current) return;
    
    if (mapLayer === 'satellite') {
      if (satelliteLayerRef.current) mapRef.current.removeLayer(satelliteLayerRef.current);
      if (streetLayerRef.current) streetLayerRef.current.addTo(mapRef.current);
      setMapLayer('street');
    } else {
      if (streetLayerRef.current) mapRef.current.removeLayer(streetLayerRef.current);
      if (satelliteLayerRef.current) satelliteLayerRef.current.addTo(mapRef.current);
      setMapLayer('satellite');
    }
  };

  // الذهاب لموقعي الحالي
  const goToMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
            
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
              
              markerRef.current.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                fetchAddressFromCoordinates(pos.lat, pos.lng);
              });
            }
            
            fetchAddressFromCoordinates(latitude, longitude);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('فشل في تحديد موقعك');
        }
      );
    }
  };

  // مولد الأسعار الذكي
  const generateSmartPrices = async () => {
    if (!formData.minArea && !formData.maxArea) {
      toast.error('يرجى تحديد المساحة أولاً');
      return;
    }
    if (!formData.purpose) {
      toast.error('يرجى تحديد الغرض (شراء/إيجار) أولاً');
      return;
    }
    
    setIsGeneratingPrices(true);
    
    try {
      // استخدام المتوسط أو الأقصى للمساحة
      const area = formData.maxArea || formData.minArea;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smart-prices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            propertyData: {
              propertyType: formData.propertyType || 'شقة',
              category: 'سكني',
              purpose: formData.purpose,
              area: area,
              city: formData.preferredCity,
              district: formData.preferredDistricts,
              bedrooms: formData.bedrooms,
              propertyAge: '0',
              furnishing: formData.furnishing,
              userPrice: formData.requestedPrice || undefined,
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
      }
      
      // تحديث الميزانية من متوسط السوق
      if (data.marketAverage) {
        const minPrice = Math.round(data.marketAverage * 0.85);
        const maxPrice = Math.round(data.marketAverage * 1.15);
        setFormData(prev => ({
          ...prev,
          minBudget: minPrice.toLocaleString(),
          maxBudget: maxPrice.toLocaleString(),
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

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePaymentPrice = (field: keyof FormData['paymentPrices'], value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentPrices: { ...prev.paymentPrices, [field]: value }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientPhone) {
      toast.error('يرجى إدخال الاسم ورقم الجوال');
      return;
    }
    if (!formData.propertyType || !formData.purpose) {
      toast.error('يرجى تحديد نوع العقار والغرض');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return;
    }

    setIsSubmitting(true);

    try {
      // إنشاء بيانات الطلب
      const requestId = `request_${Date.now()}`;
      const submissionData = {
        id: requestId,
        type: 'property_request',
        brokerId: broker.id,
        brokerName: broker.name,
        // معلومات العميل - بأسماء موحدة مع backend
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        ownerIdNumber: formData.clientIdNumber,
        ownerBirthDate: formData.clientBirthDate,
        ownerCity: formData.clientCity,
        ownerDistrict: formData.clientDistrict,
        // معلومات العقار المطلوب
        propertyType: formData.propertyType,
        purpose: formData.purpose,
        locationCity: formData.preferredCity,
        locationDistrict: formData.preferredDistricts,
        // معلومات الموقع من الخريطة
        street: formData.street,
        buildingNumber: formData.buildingNumber,
        postalCode: formData.postalCode,
        lat: formData.lat,
        lng: formData.lng,
        // السعر المطلوب والتقييم
        requestedPrice: formData.requestedPrice,
        priceEvaluation: priceEvaluation,
        marketAverage: marketAverage,
        // المساحة والمواصفات
        minArea: formData.minArea,
        maxArea: formData.maxArea,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        livingRooms: formData.livingRooms,
        floors: formData.floors,
        furnishing: formData.furnishing,
        // الميزانية
        minBudget: formData.minBudget,
        maxBudget: formData.maxBudget,
        paymentPrices: formData.paymentPrices,
        // الميزات
        hasPool: formData.hasPool,
        hasGarden: formData.hasGarden,
        hasElevator: formData.hasElevator,
        hasParking: formData.hasParking,
        hasMaidRoom: formData.hasMaidRoom,
        hasDriverRoom: formData.hasDriverRoom,
        // إضافي
        additionalRequirements: formData.additionalRequirements,
        urgency: formData.urgency,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        isNew: true,
        isViewed: false,
      };

      // إرسال البيانات للخلفية (يعمل حتى لو العميل غير مسجل دخول)
      const { data: submitResult, error: submitError } = await supabase.functions.invoke('public-form-submit', {
        body: {
          slug: brokerSlug,
          formType: 'request',
          data: submissionData,
        },
      });

      if (submitError) {
        console.error('Public request submit error:', submitError);
        toast.error('حدث خطأ أثناء الإرسال');
        setIsSubmitting(false);
        return;
      }

      const customerId = (submitResult as any)?.customerId as string | undefined;

      // حفظ نسخة محلية احتياطية
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // تحديث localStorage للعملاء للتوافق
      const localCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingLocalCustomer = localCustomers.find((c: any) => c.phone === formData.clientPhone);
      
      const tabData = {
        id: `tab_${Date.now()}`,
        name: 'طلب عقار',
        type: 'property_request',
        data: submissionData,
        isNew: true,
        isViewed: false,
        createdAt: new Date().toISOString(),
      };

      if (existingLocalCustomer) {
        existingLocalCustomer.tabs = existingLocalCustomer.tabs || [];
        existingLocalCustomer.tabs.push(tabData);
        existingLocalCustomer.hasUnreadRequest = true;
        existingLocalCustomer.name = formData.clientName;
        existingLocalCustomer.idNumber = formData.clientIdNumber;
        existingLocalCustomer.district = formData.clientDistrict;
      } else {
        localCustomers.push({
          id: customerId || `cust_${Date.now()}`,
          name: formData.clientName,
          phone: formData.clientPhone,
          idNumber: formData.clientIdNumber,
          district: formData.clientDistrict,
          type: formData.purpose === 'للشراء' ? 'buyer' : 'renter',
          source: 'public_form',
          status: 'new',
          hasUnreadRequest: true,
          isNewCard: true,
          createdAt: new Date().toISOString(),
          tabs: [tabData],
        });
      }
      localStorage.setItem('crm_customers', JSON.stringify(localCustomers));

      // إطلاق حدث UI محلي
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: {
          title: '🔍 طلب عقاري جديد',
          message: `تم استلام طلب من ${formData.clientName}`,
          type: 'success',
          category: 'customer',
          isPulsing: true,
        }
      }));

      window.dispatchEvent(new CustomEvent('newRequestReceived', {
        detail: submissionData
      }));

      setIsSubmitted(true);
      toast.success('تم إرسال الطلب بنجاح');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PublicFormLayout broker={broker} title="إرسال طلب عقار">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الإرسال بنجاح!</h3>
          <p className="text-gray-600 mb-6">
            شكراً لك، تم استلام طلبك وسيتواصل معك الوسيط قريباً بالعروض المناسبة
          </p>
          <Button
            onClick={() => window.close()}
            className="bg-[#01411C] hover:bg-[#065f41] text-white"
          >
            إغلاق الصفحة
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout broker={broker} title="إرسال طلب عقار">
      <div className="p-6 space-y-6">
        {/* عنوان المستند */}
        <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
          <Search className="w-8 h-8 text-blue-600 mx-auto mb-1" />
          <h2 className="text-xl font-bold text-[#01411C]">إرسال طلب</h2>
          <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        
        {/* القسم 1: معلومات العميل */}
        <Section title="معلوماتك" icon={<User className="w-5 h-5" />} color="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="bg-white"
              />
            </div>
            <div>
              <Label>رقم الجوال *</Label>
              <Input
                value={formData.clientPhone}
                onChange={(e) => updateField('clientPhone', e.target.value)}
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="bg-white"
              />
            </div>
            <div>
              <Label>رقم الهوية (اختياري)</Label>
              <Input
                value={formData.clientIdNumber}
                onChange={(e) => updateField('clientIdNumber', e.target.value)}
                placeholder="رقم الهوية الوطنية"
                className="bg-white"
              />
            </div>
            <div>
              <Label>تاريخ الميلاد (اختياري)</Label>
              <Input
                type="date"
                value={formData.clientBirthDate}
                onChange={(e) => updateField('clientBirthDate', e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Select value={formData.clientCity} onValueChange={(v) => updateField('clientCity', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="اختر مدينتك" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحي</Label>
              <Input
                value={formData.clientDistrict}
                onChange={(e) => updateField('clientDistrict', e.target.value)}
                placeholder="اسم الحي"
                className="bg-white"
              />
            </div>
          </div>
        </Section>

        {/* القسم 2: متطلبات العقار */}
        <Section title="متطلبات العقار المطلوب" icon={<Search className="w-5 h-5" />} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>نوع العقار *</Label>
              <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
                <SelectTrigger className="bg-white">
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
              <Label>الغرض *</Label>
              <Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="للشراء / للإيجار" />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المدينة المفضلة</Label>
              <Select value={formData.preferredCity} onValueChange={(v) => updateField('preferredCity', v)}>
                <SelectTrigger className="bg-white">
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
                value={formData.preferredDistricts}
                onChange={(e) => updateField('preferredDistricts', e.target.value)}
                placeholder="حي النخيل، حي الياسمين..."
                className="bg-white"
              />
            </div>
          </div>

          {/* الخريطة لتحديد الموقع */}
          <div className="mt-4 space-y-3">
            <Label className="flex items-center gap-2 font-semibold text-blue-700">
              <MapPin className="w-4 h-4" />
              حدد الموقع المفضل على الخريطة (اختياري)
            </Label>
            <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-blue-200">
              <div ref={mapContainer} className="w-full h-full" />
              
              <div className="absolute top-2 right-2 z-[1000] flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={goToMyLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 ml-1" />
                      موقعي
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={toggleMapLayer}
                  className="gap-1"
                >
                  {mapLayer === 'satellite' ? (
                    <>
                      <Satellite className="w-4 h-4" />
                      <span className="text-xs">أقمار</span>
                    </>
                  ) : (
                    <>
                      <MapIcon className="w-4 h-4" />
                      <span className="text-xs">خريطة</span>
                    </>
                  )}
                </Button>
              </div>
              
              {formData.lat && formData.lng && (
                <div className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span>{formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}</span>
                </div>
              )}
            </div>

            {/* معلومات الموقع المستخرجة */}
            {(formData.street || formData.buildingNumber || formData.postalCode) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <Label className="text-xs text-blue-600">اسم الشارع</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    placeholder="الشارع"
                    className="bg-white text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-blue-600">رقم المبنى</Label>
                  <Input
                    value={formData.buildingNumber}
                    onChange={(e) => updateField('buildingNumber', e.target.value)}
                    placeholder="رقم المبنى"
                    className="bg-white text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-blue-600">الرمز البريدي</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="الرمز البريدي"
                    className="bg-white text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-blue-600">المدينة / الحي</Label>
                  <div className="text-sm font-medium text-blue-800 mt-1">
                    {formData.preferredCity} - {formData.preferredDistricts}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* القسم 3: المواصفات التفصيلية */}
        <Section title="المواصفات المطلوبة" icon={<Building className="w-5 h-5" />} color="purple">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Ruler className="w-4 h-4" />
                الحد الأدنى للمساحة
              </Label>
              <Input
                type="number"
                value={formData.minArea}
                onChange={(e) => updateField('minArea', e.target.value)}
                placeholder="م²"
                className="bg-white"
              />
            </div>
            <div>
              <Label>الحد الأقصى للمساحة</Label>
              <Input
                type="number"
                value={formData.maxArea}
                onChange={(e) => updateField('maxArea', e.target.value)}
                placeholder="م²"
                className="bg-white"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <BedDouble className="w-4 h-4" />
                غرف النوم
              </Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                placeholder="العدد"
                className="bg-white"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                دورات المياه
              </Label>
              <Input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
                placeholder="العدد"
                className="bg-white"
              />
            </div>
            <div>
              <Label>الصالات</Label>
              <Input
                type="number"
                value={formData.livingRooms}
                onChange={(e) => updateField('livingRooms', e.target.value)}
                placeholder="العدد"
                className="bg-white"
              />
            </div>
            <div>
              <Label>الأدوار</Label>
              <Input
                type="number"
                value={formData.floors}
                onChange={(e) => updateField('floors', e.target.value)}
                placeholder="العدد"
                className="bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label>الأثاث</Label>
              <Select value={formData.furnishing} onValueChange={(v) => updateField('furnishing', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="حالة الأثاث المطلوبة" />
                </SelectTrigger>
                <SelectContent>
                  {furnishingOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* القسم 4: مولد الأسعار الذكي والميزانية */}
        <Section title="الميزانية ومولد الأسعار" icon={<DollarSign className="w-5 h-5" />} color="amber">
          {/* مولد الأسعار الذكي */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Sparkles className="w-5 h-5 text-blue-600" />
                مولد الأسعار الذكي
                <Badge className="bg-blue-600 text-white text-xs">AI</Badge>
              </CardTitle>
              <p className="text-xs text-blue-600">
                مصادر التسعير: موقع عقار، عقار ساس، المؤشرات العقارية
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* زر التوليد */}
              <Button
                type="button"
                onClick={generateSmartPrices}
                disabled={isGeneratingPrices || (!formData.minArea && !formData.maxArea) || !formData.purpose}
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

              {/* الأسعار المقترحة */}
              {suggestedPrices.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-blue-800 font-bold text-sm">الأسعار المقترحة:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedPrices.map((p, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200"
                      >
                        <span className="text-sm text-gray-600">{p.source}</span>
                        <span className="font-bold text-blue-700">{p.price} ريال</span>
                      </div>
                    ))}
                  </div>
                  {marketAverage && (
                    <div className="text-center p-2 bg-blue-100 rounded-lg">
                      <span className="text-sm text-blue-700">متوسط السوق: </span>
                      <span className="font-bold text-blue-800">{marketAverage.toLocaleString()} ريال</span>
                    </div>
                  )}
                </div>
              )}

              {/* السعر المطلوب للتقييم */}
              <div>
                <Label className="text-sm text-gray-700">السعر المطلوب من البائع (اختياري للتقييم)</Label>
                <Input
                  type="number"
                  value={formData.requestedPrice}
                  onChange={(e) => {
                    updateField('requestedPrice', e.target.value);
                    // إعادة التقييم إذا كانت الأسعار موجودة
                    if (suggestedPrices.length > 0 && marketAverage) {
                      const userPrice = parseFloat(e.target.value);
                      if (userPrice > 0) {
                        const lowerBound = marketAverage * 0.85;
                        const upperBound = marketAverage * 1.15;
                        
                        if (userPrice < lowerBound) {
                          const percentage = Math.round(((marketAverage - userPrice) / marketAverage) * 100);
                          setPriceEvaluation({
                            status: 'أقل من السوق',
                            color: 'green',
                            percentage,
                            message: `السعر أقل من متوسط السوق بنسبة ${percentage}% - فرصة جيدة`
                          });
                        } else if (userPrice <= upperBound) {
                          const percentage = Math.abs(Math.round(((userPrice - marketAverage) / marketAverage) * 100));
                          setPriceEvaluation({
                            status: 'مناسب',
                            color: 'blue',
                            percentage,
                            message: `السعر مناسب ومتوافق مع أسعار السوق`
                          });
                        } else {
                          const percentage = Math.round(((userPrice - marketAverage) / marketAverage) * 100);
                          setPriceEvaluation({
                            status: 'مبالغ فيه',
                            color: 'red',
                            percentage,
                            message: `السعر أعلى من متوسط السوق بنسبة ${percentage}%`
                          });
                        }
                      }
                    }
                  }}
                  placeholder="أدخل السعر ثم اضغط توليد الأسعار للتقييم"
                  className="bg-white mt-1"
                />
              </div>

              {/* تقييم السعر بالذكاء الاصطناعي */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <Label className="text-sm text-gray-600 mb-2 block">تقييم السعر بالذكاء الاصطناعي</Label>
                {priceEvaluation ? (
                  <div className={`p-3 rounded-lg border-2 ${
                    priceEvaluation.color === 'green' ? 'bg-green-50 border-green-300' :
                    priceEvaluation.color === 'blue' ? 'bg-blue-50 border-blue-300' :
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${
                        priceEvaluation.color === 'green' ? 'bg-green-600' :
                        priceEvaluation.color === 'blue' ? 'bg-blue-600' :
                        'bg-red-600'
                      } text-white`}>
                        {priceEvaluation.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {priceEvaluation.percentage}%
                      </span>
                    </div>
                    <p className={`text-sm ${
                      priceEvaluation.color === 'green' ? 'text-green-700' :
                      priceEvaluation.color === 'blue' ? 'text-blue-700' :
                      'text-red-700'
                    }`}>
                      {priceEvaluation.message}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    أدخل السعر واضغط على زر توليد الأسعار للحصول على التقييم التلقائي
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* حقول الميزانية من وإلى */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>الميزانية من (ريال)</Label>
              <Input
                type="text"
                value={formData.minBudget}
                onChange={(e) => updateField('minBudget', e.target.value)}
                placeholder="الحد الأدنى"
                className="bg-white"
              />
            </div>
            <div>
              <Label>الميزانية إلى (ريال)</Label>
              <Input
                type="text"
                value={formData.maxBudget}
                onChange={(e) => updateField('maxBudget', e.target.value)}
                placeholder="الحد الأقصى"
                className="bg-white"
              />
            </div>
          </div>

          {/* خيارات الدفعات للإيجار */}
          {formData.purpose === 'للإيجار' && (
            <div className="mt-4 p-4 bg-amber-100 rounded-lg border border-amber-300">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                خيارات الدفعات المناسبة لك
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-amber-700">دفعة واحدة</Label>
                  <Input
                    type="number"
                    value={formData.paymentPrices.onePayment}
                    onChange={(e) => updatePaymentPrice('onePayment', e.target.value)}
                    placeholder="ريال"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-amber-700">دفعتين</Label>
                  <Input
                    type="number"
                    value={formData.paymentPrices.twoPayments}
                    onChange={(e) => updatePaymentPrice('twoPayments', e.target.value)}
                    placeholder="ريال"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-amber-700">4 دفعات</Label>
                  <Input
                    type="number"
                    value={formData.paymentPrices.fourPayments}
                    onChange={(e) => updatePaymentPrice('fourPayments', e.target.value)}
                    placeholder="ريال"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-amber-700">شهري</Label>
                  <Input
                    type="number"
                    value={formData.paymentPrices.monthly}
                    onChange={(e) => updatePaymentPrice('monthly', e.target.value)}
                    placeholder="ريال"
                    className="bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* القسم 5: الميزات المطلوبة */}
        <Section title="ميزات مطلوبة" icon={<Home className="w-5 h-5" />} color="cyan">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasPool"
                checked={formData.hasPool}
                onCheckedChange={(checked) => updateField('hasPool', checked === true)}
              />
              <Label htmlFor="hasPool" className="cursor-pointer">🏊 مسبح</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasGarden"
                checked={formData.hasGarden}
                onCheckedChange={(checked) => updateField('hasGarden', checked === true)}
              />
              <Label htmlFor="hasGarden" className="cursor-pointer">🌳 حديقة</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasElevator"
                checked={formData.hasElevator}
                onCheckedChange={(checked) => updateField('hasElevator', checked === true)}
              />
              <Label htmlFor="hasElevator" className="cursor-pointer">🛗 مصعد</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasParking"
                checked={formData.hasParking}
                onCheckedChange={(checked) => updateField('hasParking', checked === true)}
              />
              <Label htmlFor="hasParking" className="cursor-pointer">🚗 موقف سيارات</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasMaidRoom"
                checked={formData.hasMaidRoom}
                onCheckedChange={(checked) => updateField('hasMaidRoom', checked === true)}
              />
              <Label htmlFor="hasMaidRoom" className="cursor-pointer">🏠 غرفة خادمة</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasDriverRoom"
                checked={formData.hasDriverRoom}
                onCheckedChange={(checked) => updateField('hasDriverRoom', checked === true)}
              />
              <Label htmlFor="hasDriverRoom" className="cursor-pointer">🚐 غرفة سائق</Label>
            </div>
          </div>
        </Section>

        {/* القسم 6: متطلبات إضافية */}
        <Section title="متطلبات إضافية" icon={<Calendar className="w-5 h-5" />} color="orange">
          <div className="space-y-4">
            <div>
              <Label>درجة الاستعجال</Label>
              <Select value={formData.urgency} onValueChange={(v) => updateField('urgency', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 عاجل جداً</SelectItem>
                  <SelectItem value="soon">🟠 قريباً (خلال شهر)</SelectItem>
                  <SelectItem value="normal">🟡 عادي (خلال 3 أشهر)</SelectItem>
                  <SelectItem value="exploring">🟢 أتصفح فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>متطلبات إضافية</Label>
              <Textarea
                value={formData.additionalRequirements}
                onChange={(e) => updateField('additionalRequirements', e.target.value)}
                placeholder="أي متطلبات خاصة مثل: قريب من مدرسة، إطلالة بحرية، شارعين..."
                rows={4}
                className="bg-white"
              />
            </div>
          </div>
        </Section>

        {/* الموافقة */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => updateField('agreeToTerms', checked === true)}
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
            أوافق على الشروط والأحكام وسياسة الخصوصية
          </Label>
        </div>

        {/* زر الإرسال */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#01411C] hover:bg-[#065f41] text-white py-6 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 ml-2" />
              إرسال الطلب
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
