/**
 * PublicOfferForm.tsx
 * صفحة إرسال عرض عقاري من العميل - نموذج شامل مع أقسام ملونة
 * يحفظ البيانات في قاعدة البيانات مع الإشعارات والدوائر النابضة
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Loader2, CheckCircle, Upload, Home, MapPin, User, Phone, 
  FileText, Building, X, Image as ImageIcon, Video, Star, Shield,
  CreditCard, Calendar, Plus, Trash2, Ruler, DoorOpen, Car, Droplets,
  Sparkles, Zap, Navigation, Satellite, Map as MapIcon, AlertTriangle, Percent, ScrollText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';
import { triggerOfferNotification, createNotification } from '@/utils/notificationTriggers';
import { markAsNew } from '@/hooks/usePublishedAdsManager';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PhoneVerificationField from '@/components/PhoneVerificationField';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ⚠️ محمي: لا يُسمح بإعادة البيانات الوهمية - يجب استخدام البيانات الحقيقية فقط من قاعدة البيانات

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "استراحة"];
const purposes = ["للبيع", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف"];
const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "مطبخ مؤثث", "غير مؤثث"];
const facadeOptions = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];
const entranceOptions = ["مدخل", "مدخلين", "ثلاث مداخل أو أكثر"];
const warrantyTypes = [
  "ضمان التكييف", "الهيكل الإنشائي", "العيوب الخفية", "الكهرباء", "السباكة",
  "شبابيك الألمنيوم", "الأبواب", "الأدوات الصحية", "الصنابير", "السخانات",
  "مقابس الكهرباء", "الأنوار", "العوازل"
];

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  isMain: boolean;
  fileName: string;
}

interface Warranty {
  type: string;
  duration: string;
}

interface FormData {
  // معلومات المالك
  ownerName: string;
  ownerPhone: string;
  ownerIdNumber: string;
  ownerBirthDate: string;
  ownerCity: string;
  ownerDistrict: string;
  
  // معلومات الصك
  deedNumber: string;
  deedDate: string;
  deedCity: string;
  
  // رابط الجولة ثلاثية الأبعاد
  tour3dUrl: string;
  
  // معلومات العقار الأساسية
  propertyType: string;
  purpose: string;
  area: string;
  price: string;
  priceJustification: string;
  
  // بيانات الموقع من الخريطة
  locationLat: string;
  locationLng: string;
  locationCity: string;
  locationDistrict: string;
  locationStreet: string;
  locationBuilding: string;
  locationAdditionalNumber: string;
  locationPostalCode: string;
  googleMapsUrl: string;
  
  // خيارات الدفعات للإيجار
  paymentPrices: {
    onePayment: string;
    twoPayments: string;
    fourPayments: string;
    monthly: string;
  };
  
  // المواصفات التفصيلية
  floors: string;
  floorNumber: string;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  councils: string;
  streetWidth: string;
  facade: string;
  furnishing: string;
  propertyAge: string;
  
  // معلومات إضافية
  entrances: string;
  warehouses: string;
  hasLaundryRoom: boolean;
  balconies: string;
  acUnits: string;
  hasExtraKitchen: boolean;
  hasPool: boolean;
  hasGarden: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  
  // المميزات الإضافية المخصصة
  customFeatures: string;
  
  // الوصف
  description: string;
  
  // النزاعات والنسبة
  propertyDisputes: string;
  agreedCommissionRate: string;
  
  // موافقة
  agreeToTerms: boolean;
}

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

interface PublicOfferFormProps {
  ownerMode?: boolean;
  ownerUserId?: string;
  onOwnerSubmitted?: (submissionId: string) => void;
}

export default function PublicOfferForm({ ownerMode = false, ownerUserId, onOwnerSubmitted }: PublicOfferFormProps = {}) {
  const { brokerId, slug } = useParams<{ brokerId?: string; slug?: string }>();
  const brokerSlug = ownerMode ? `owner_${ownerUserId || 'self'}` : (slug || brokerId);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [isLoadingBroker, setIsLoadingBroker] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Map states
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Smart Price Generator states
  const [isGeneratingPrices, setIsGeneratingPrices] = useState(false);
  const [suggestedPrices, setSuggestedPrices] = useState<{min: number; max: number; average: number} | null>(null);
  const [priceEvaluation, setPriceEvaluation] = useState<{status: 'low' | 'fair' | 'high'; message: string} | null>(null);
  const [marketAverage, setMarketAverage] = useState<number | null>(null);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  
  // تحميل بيانات الوسيط مع الصور من قاعدة البيانات
  useEffect(() => {
    const loadBrokerData = async () => {
      if (ownerMode) {
        // وضع المالك: لا نجلب وسيطًا — نضع بطاقة محايدة لاستيفاء واجهة Layout فقط
        setBroker({
          id: 'owner-mode',
          name: 'إرسال من المالك',
          company: '',
          phone: '',
          email: '',
          location: '',
          licenseNumber: '',
          rating: 0,
          verified: false,
        });
        setIsLoadingBroker(false);
        return;
      }
      if (!brokerSlug) {
        setIsLoadingBroker(false);
        return;
      }
      
      setIsLoadingBroker(true);
      try {
        console.log('[PublicOfferForm] Fetching broker data for slug:', brokerSlug);
        const { data: businessCard, error } = await (supabase as any)
          .from('public_business_cards')
          .select('data, user_id')
          .eq('slug', brokerSlug)
          .eq('published', true)
          .maybeSingle();
        
        if (error) {
          console.error('[PublicOfferForm] Database error:', error);
        }
        
        console.log('[PublicOfferForm] Result:', { businessCard, error });

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
      } finally {
        setIsLoadingBroker(false);
      }
    };
    
    loadBrokerData();
  }, [brokerSlug]);

  // حفظ واستعادة البيانات من sessionStorage لمنع فقدانها على الأندرويد
  const STORAGE_KEY = `public_offer_form_${brokerSlug}`;
  
  const getInitialFormData = (): FormData => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to restore form data:', e);
    }
    return {
      ownerName: '',
      ownerPhone: '',
      ownerIdNumber: '',
      ownerBirthDate: '',
      ownerCity: '',
      ownerDistrict: '',
      deedNumber: '',
      deedDate: '',
      deedCity: '',
      tour3dUrl: '',
      propertyType: '',
      purpose: '',
      area: '',
      price: '',
      priceJustification: '',
      locationLat: '',
      locationLng: '',
      locationCity: '',
      locationDistrict: '',
      locationStreet: '',
      locationBuilding: '',
      locationAdditionalNumber: '',
      locationPostalCode: '',
      googleMapsUrl: '',
      paymentPrices: {
        onePayment: '',
        twoPayments: '',
        fourPayments: '',
        monthly: '',
      },
      floors: '',
      floorNumber: '',
      bedrooms: '',
      bathrooms: '',
      livingRooms: '',
      councils: '',
      streetWidth: '',
      facade: '',
      furnishing: '',
      propertyAge: '',
      entrances: '',
      warehouses: '',
      hasLaundryRoom: false,
      balconies: '',
      acUnits: '',
      hasExtraKitchen: false,
      hasPool: false,
      hasGarden: false,
      hasElevator: false,
      hasParking: false,
      customFeatures: '',
      description: '',
      propertyDisputes: '',
      agreedCommissionRate: '',
      agreeToTerms: false,
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  
  // حفظ البيانات تلقائياً عند كل تغيير
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save form data:', e);
    }
  }, [formData, STORAGE_KEY]);
  
  // حفظ واستعادة الوسائط أيضاً
  const MEDIA_STORAGE_KEY = `public_offer_media_${brokerSlug}`;
  
  useEffect(() => {
    try {
      const savedMedia = sessionStorage.getItem(MEDIA_STORAGE_KEY);
      if (savedMedia) {
        setMedia(JSON.parse(savedMedia));
      }
    } catch (e) {
      console.warn('Failed to restore media:', e);
    }
  }, [brokerSlug]);

  // Fetch address from coordinates
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const city = address.city || address.town || address.village || address.state || '';
        const district = address.suburb || address.neighbourhood || address.district || '';
        const street = address.road || address.street || '';
        const buildingNumber = address.house_number || '';
        const postalCode = address.postcode || '';

        setFormData(prev => ({
          ...prev,
          locationCity: city,
          locationDistrict: district,
          locationStreet: street,
          locationBuilding: buildingNumber,
          locationPostalCode: postalCode,
          locationLat: lat.toString(),
          locationLng: lng.toString(),
          googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Initialize Map
  // ملاحظة مهمة: هذه الصفحة تعرض شاشة تحميل حتى يتم جلب بيانات الوسيط.
  // إذا حاولنا تهيئة Leaflet أثناء شاشة التحميل، فلن يكون عنصر الخريطة موجوداً
  // وبالتالي لن تُنشأ الخريطة أبداً. لذلك نربط التهيئة بانتهاء التحميل ووجود broker.
  useEffect(() => {
    if (isLoadingBroker || !broker) return;
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current).setView([24.7136, 46.6753], 12);
    mapRef.current = map;

    // Street layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    });
    streetLayerRef.current = streetLayer;
    streetLayer.addTo(map);

    // Satellite layer
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri' }
    );
    satelliteLayerRef.current = satelliteLayer;

    // Click to place marker
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;
        
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          await fetchAddressFromCoordinates(pos.lat, pos.lng);
        });
      }
      
      await fetchAddressFromCoordinates(lat, lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      streetLayerRef.current = null;
      satelliteLayerRef.current = null;
    };
  }, [isLoadingBroker, broker]);

  // Toggle map layer
  const toggleMapLayer = () => {
    if (!mapRef.current || !streetLayerRef.current || !satelliteLayerRef.current) return;
    
    if (mapLayer === 'street') {
      mapRef.current.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(mapRef.current);
      setMapLayer('satellite');
    } else {
      mapRef.current.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(mapRef.current);
      setMapLayer('street');
    }
  };

  // Go to my location
  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const marker = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            
            marker.on('dragend', async () => {
              const pos = marker.getLatLng();
              await fetchAddressFromCoordinates(pos.lat, pos.lng);
            });
          }
        }
        
        await fetchAddressFromCoordinates(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('تعذر تحديد موقعك');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Smart Price Generator (يدعم وضع صامت للتقييم التلقائي)
  const generateSmartPrices = async (silent: boolean = false) => {
    if (!formData.propertyType || !formData.locationCity || !formData.area) {
      if (!silent) toast.error('يرجى تحديد نوع العقار والمدينة والمساحة أولاً');
      return;
    }

    if (!silent) setIsGeneratingPrices(true);
    try {
      // الدالة في backend تتطلب body يحتوي propertyData (حرفياً)
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
              propertyType: formData.propertyType,
              category: 'سكني',
              purpose: formData.purpose || 'للبيع',
              area: String(formData.area),
              city: formData.locationCity,
              district: formData.locationDistrict || '',
              bedrooms: formData.bedrooms || '',
              propertyAge: '0',
              furnishing: formData.furnishing || 'غير مؤثث',
              userPrice: formData.price || undefined,
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Smart prices request failed');
      const data = await response.json();

      const pricesArr: number[] = Array.isArray(data?.prices)
        ? data.prices.map((p: any) => Number(p?.price)).filter((n: any) => Number.isFinite(n))
        : [];

      const avg = Number(data?.marketAverage);
      const average = Number.isFinite(avg)
        ? avg
        : pricesArr.length
          ? Math.round(pricesArr.reduce((a, b) => a + b, 0) / pricesArr.length)
          : 0;

      const min = pricesArr.length ? Math.min(...pricesArr) : average;
      const max = pricesArr.length ? Math.max(...pricesArr) : average;

      setSuggestedPrices({ min, max, average });
      setMarketAverage(average);

      if (data?.priceEvaluation?.status && data?.priceEvaluation?.message) {
        const mappedStatus: 'low' | 'fair' | 'high' =
          data.priceEvaluation.status === 'أقل من السوق'
            ? 'low'
            : data.priceEvaluation.status === 'مناسب'
              ? 'fair'
              : 'high';

        setPriceEvaluation({
          status: mappedStatus,
          message: String(data.priceEvaluation.message),
        });
      }

      if (!silent) toast.success('تم توليد الأسعار المقترحة بنجاح');
    } catch (error) {
      console.error('Error generating prices:', error);
      if (!silent) toast.error('حدث خطأ أثناء توليد الأسعار');
    } finally {
      if (!silent) setIsGeneratingPrices(false);
    }
  };

  // جلب أسعار السوق تلقائياً بصمت عند توفر الحقول الأساسية
  useEffect(() => {
    if (!formData.propertyType || !formData.locationCity || !formData.area) return;
    const timer = setTimeout(() => {
      generateSmartPrices(true);
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.propertyType, formData.locationCity, formData.area, formData.purpose, formData.bedrooms, formData.furnishing]);

  // تقييم تلقائي للسعر فور تغييره مقابل أسعار السوق
  useEffect(() => {
    const priceNum = Number(formData.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0 || !suggestedPrices) {
      return;
    }
    const { min, max, average } = suggestedPrices;
    let status: 'low' | 'fair' | 'high';
    let message: string;
    if (priceNum < min) {
      status = 'low';
      message = `السعر أقل من متوسط السوق (${average.toLocaleString()} ريال)`;
    } else if (priceNum > max) {
      status = 'high';
      message = `السعر أعلى من متوسط السوق (${average.toLocaleString()} ريال) — يرجى توضيح السبب`;
    } else {
      status = 'fair';
      message = `السعر ضمن نطاق السوق (${min.toLocaleString()} - ${max.toLocaleString()} ريال)`;
    }
    setPriceEvaluation({ status, message });
  }, [formData.price, suggestedPrices]);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add warranty
  const addWarranty = () => {
    setWarranties([...warranties, { type: '', duration: '' }]);
  };

  // Remove warranty
  const removeWarranty = (index: number) => {
    setWarranties(warranties.filter((_, i) => i !== index));
  };

  // Update warranty
  const updateWarranty = (index: number, field: keyof Warranty, value: string) => {
    const updated = [...warranties];
    updated[index][field] = value;
    setWarranties(updated);
  };

  // Upload file to Supabase Storage with broker ownership path
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const ownerId = broker?.id || 'public-submissions';
    const filePath = `${ownerId}/client-offers/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }, [broker?.id]);

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newMedia: MediaFile[] = [];
    const totalFiles = files.length;
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error(`الملف ${file.name} غير مدعوم`);
        continue;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`الملف ${file.name} كبير جداً`);
        continue;
      }

      const url = await uploadFile(file);
      if (url) {
        newMedia.push({
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          type: isVideo ? 'video' : 'image',
          isMain: media.length === 0 && newMedia.length === 0,
          fileName: file.name,
        });
      }

      uploadedCount++;
      setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
    }

    if (newMedia.length > 0) {
      const updatedMedia = [...media, ...newMedia];
      setMedia(updatedMedia);
      try {
        sessionStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(updatedMedia));
      } catch (e) {
        console.warn('Failed to save media:', e);
      }
      toast.success(`تم رفع ${newMedia.length} ملف بنجاح`);
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove media
  const removeMedia = (mediaId: string) => {
    const updatedMedia = media.filter(m => m.id !== mediaId);
    if (media.find(m => m.id === mediaId)?.isMain && updatedMedia.length > 0) {
      updatedMedia[0].isMain = true;
    }
    setMedia(updatedMedia);
    try {
      sessionStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(updatedMedia));
    } catch (e) {
      console.warn('Failed to save media:', e);
    }
    toast.success('تم حذف الملف');
  };

  // Set as main image
  const setAsMain = (mediaId: string) => {
    setMedia(media.map(m => ({ ...m, isMain: m.id === mediaId })));
  };

  const handleSubmit = async () => {
    if (!formData.ownerName || !formData.ownerPhone || !formData.propertyType || !formData.purpose) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return;
    }
    if (priceEvaluation?.status === 'high' && !formData.priceJustification.trim()) {
      toast.error('السعر أعلى من متوسط السوق — يرجى توضيح سبب السعر المرتفع');
      return;
    }

    setIsSubmitting(true);

    try {
      // إنشاء بيانات العرض
      const offerId = `offer_${Date.now()}`;
      const submissionData = {
        id: offerId,
        type: 'property_offer',
        brokerId: broker.id,
        brokerName: broker.name,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerIdNumber: formData.ownerIdNumber,
        ownerBirthDate: formData.ownerBirthDate,
        ownerCity: formData.ownerCity,
        ownerDistrict: formData.ownerDistrict,
        deedNumber: formData.deedNumber,
        deedDate: formData.deedDate,
        deedCity: formData.deedCity,
        tour3dUrl: formData.tour3dUrl,
        propertyType: formData.propertyType,
        purpose: formData.purpose,
        area: formData.area,
        price: formData.price,
        priceJustification: formData.priceJustification,
        locationLat: formData.locationLat,
        locationLng: formData.locationLng,
        locationCity: formData.locationCity,
        locationDistrict: formData.locationDistrict,
        locationStreet: formData.locationStreet,
        locationBuilding: formData.locationBuilding,
        locationPostalCode: formData.locationPostalCode,
        googleMapsUrl: formData.googleMapsUrl,
        paymentPrices: formData.paymentPrices,
        floors: formData.floors,
        floorNumber: formData.floorNumber,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        livingRooms: formData.livingRooms,
        councils: formData.councils,
        streetWidth: formData.streetWidth,
        facade: formData.facade,
        furnishing: formData.furnishing,
        propertyAge: formData.propertyAge,
        entrances: formData.entrances,
        warehouses: formData.warehouses,
        hasLaundryRoom: formData.hasLaundryRoom,
        balconies: formData.balconies,
        acUnits: formData.acUnits,
        hasExtraKitchen: formData.hasExtraKitchen,
        hasPool: formData.hasPool,
        hasGarden: formData.hasGarden,
        hasElevator: formData.hasElevator,
        hasParking: formData.hasParking,
        customFeatures: formData.customFeatures,
        description: formData.description,
        propertyDisputes: formData.propertyDisputes,
        agreedCommissionRate: formData.agreedCommissionRate,
        warranties,
        media,
        mainImage: media.find(m => m.isMain)?.url || null,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        isNew: true,
        isViewed: false,
        // Smart price data
        priceEvaluation: priceEvaluation ? {
          status: priceEvaluation.status,
          message: priceEvaluation.message,
          requestedPrice: formData.price,
          marketAverage: marketAverage,
        } : null,
        suggestedPrices: suggestedPrices,
      };

      if (ownerMode) {
        // وضع المالك: احفظ مباشرةً في owner_submissions بدون ربط وسيط
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('يجب تسجيل الدخول');
        const purposeNorm = formData.purpose === 'للبيع' ? 'sale' : formData.purpose === 'للإيجار' ? 'rent' : formData.purpose;
        const { data: inserted, error: insErr } = await supabase
          .from('owner_submissions')
          .insert({
            owner_user_id: user.id,
            submission_type: 'offer',
            purpose: purposeNorm,
            status: 'pending_acceptance',
            source: 'owner_portal',
            city: formData.locationCity || null,
            district: formData.locationDistrict || null,
            data: submissionData as any,
            media: media as any,
          })
          .select('id')
          .maybeSingle();
        if (insErr) throw insErr;
        onOwnerSubmitted?.(inserted?.id || '');
      } else {
        // استخدام Edge Function لإرسال البيانات (تتجاوز RLS)
        const { data: response, error: functionError } = await supabase.functions.invoke('public-form-submit', {
          body: {
            slug: brokerSlug,
            formType: 'offer',
            data: submissionData,
          },
        });

        if (functionError) {
          console.error('Edge function error:', functionError);
          throw new Error(functionError.message || 'فشل في إرسال العرض');
        }

        if (!response?.success) {
          console.error('Submission failed:', response?.error);
          throw new Error(response?.error || 'فشل في إرسال العرض');
        }

        console.log('[PublicOfferForm] Submission successful:', response);
      }

      // مسح البيانات المحفوظة بعد الإرسال الناجح
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(MEDIA_STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear saved form data:', e);
      }
      
      setIsSubmitted(true);
      toast.success('تم إرسال العرض بنجاح');
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚠️ محمي: عرض شاشة تحميل أو رسالة خطأ
  if (isLoadingBroker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C] flex items-center justify-center" dir="rtl">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#D4AF37]" />
          <p className="text-lg">جاري تحميل بيانات الوسيط...</p>
        </div>
      </div>
    );
  }
  
  // إذا لم يُعثر على الوسيط
  if (!broker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C] flex items-center justify-center" dir="rtl">
        <div className="text-center text-white">
          <p className="text-lg mb-4">لم يتم العثور على بيانات الوسيط</p>
          <p className="text-sm text-white/70">تأكد من صحة الرابط</p>
        </div>
      </div>
    );
  }

  // لا نعرّف Wrapper كمكوّن داخل الصفحة حتى لا يتغير مرجعه مع كل كتابة
  // في الحقول؛ هذا يمنع إعادة تركيب شجرة النموذج وعنصر الخريطة.
  const wrap = (children: React.ReactNode) =>
    ownerMode ? (
      <div className="bg-white rounded-2xl border" dir="rtl">{children}</div>
    ) : (
      <PublicFormLayout broker={broker!} title="إرسال عرض عقاري">{children}</PublicFormLayout>
    );

  if (isSubmitted) {
    return wrap(
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الإرسال بنجاح!</h3>
          <p className="text-gray-600 mb-6">شكراً لك، تم استلام عرضك وسيتواصل معك الوسيط قريباً</p>
          {!ownerMode && (
            <Button onClick={() => window.close()} className="bg-[#01411C] hover:bg-[#065f41] text-white">
              إغلاق الصفحة
            </Button>
          )}
        </div>
    );
  }

  return wrap(
      <div className="p-4 space-y-4">
        {/* عنوان المستند */}
        <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
          <Home className="w-8 h-8 text-green-600 mx-auto mb-1" />
          <h2 className="text-xl font-bold text-[#01411C]">إرسال عرض</h2>
          <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        
        {/* ===== 1. معلومات المالك ===== */}
        <Section title="معلومات المالك" icon={<User className="w-5 h-5" />} color="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-green-800">الاسم الكامل *</Label>
              <Input
                value={formData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div>
              <PhoneVerificationField
                phone={formData.ownerPhone}
                onPhoneChange={(val) => updateField('ownerPhone', val)}
                onVerified={setPhoneVerified}
                label="رقم الجوال *"
                inputClassName="border-green-200 focus:border-green-400"
              />
            </div>
            <div>
              <Label className="text-green-800">رقم الهوية</Label>
              <Input
                value={formData.ownerIdNumber}
                onChange={(e) => updateField('ownerIdNumber', e.target.value)}
                placeholder="رقم الهوية الوطنية"
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div>
              <Label className="text-green-800">تاريخ الميلاد</Label>
              <Input
                type="date"
                value={formData.ownerBirthDate}
                onChange={(e) => updateField('ownerBirthDate', e.target.value)}
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div>
              <Label className="text-green-800">المدينة</Label>
              <Select value={formData.ownerCity} onValueChange={(v) => updateField('ownerCity', v)}>
                <SelectTrigger className="border-green-200">
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-green-800">الحي</Label>
              <Input
                value={formData.ownerDistrict}
                onChange={(e) => updateField('ownerDistrict', e.target.value)}
                placeholder="اسم الحي"
                className="border-green-200 focus:border-green-400"
              />
            </div>
          </div>
        </Section>

        {/* ===== 2. معلومات الصك ===== */}
        <Section title="معلومات الصك" icon={<FileText className="w-5 h-5" />} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-blue-800">رقم الصك</Label>
              <Input
                value={formData.deedNumber}
                onChange={(e) => updateField('deedNumber', e.target.value)}
                placeholder="رقم الصك"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label className="text-blue-800">تاريخ الصك</Label>
              <Input
                type="date"
                value={formData.deedDate}
                onChange={(e) => updateField('deedDate', e.target.value)}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label className="text-blue-800">مدينة إصدار الصك</Label>
              <Select value={formData.deedCity} onValueChange={(v) => updateField('deedCity', v)}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* ===== 3. صور وفيديوهات العقار ورابط 3D ===== */}
        <Section title="صور وفيديوهات العقار" icon={<ImageIcon className="w-5 h-5" />} color="orange">
          {/* رابط الجولة ثلاثية الأبعاد */}
          <div className="mb-4">
            <Label className="text-orange-800">رابط الجولة الافتراضية 3D (اختياري)</Label>
            <Input
              value={formData.tour3dUrl}
              onChange={(e) => updateField('tour3dUrl', e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="border-orange-200 focus:border-orange-400"
            />
          </div>

          {/* منطقة رفع الملفات */}
          <div 
            className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50/50 hover:bg-orange-100/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-orange-700 font-semibold">جاري الرفع... {uploadProgress}%</p>
                <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-orange-500 mb-2" />
                <p className="text-orange-700 font-semibold">اضغط لرفع الصور والفيديوهات</p>
                <p className="text-gray-500 text-sm">PNG, JPG, MP4 - حتى 10MB للصور و 50MB للفيديو</p>
              </>
            )}
          </div>

          {media.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
              {media.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative aspect-square rounded-lg overflow-hidden group ${item.isMain ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {item.type === 'image' && !item.isMain && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAsMain(item.id); }}
                        className="p-1.5 bg-white rounded-lg"
                        title="تعيين كصورة رئيسية"
                      >
                        <Star className="w-4 h-4 text-orange-500" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                      className="p-1.5 bg-white rounded-lg"
                      title="حذف"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  {item.isMain && (
                    <div className="absolute top-1 right-1 bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" /> رئيسية
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {media.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              تم رفع {media.filter(m => m.type === 'image').length} صورة و {media.filter(m => m.type === 'video').length} فيديو
            </p>
          )}
        </Section>

        {/* ===== 4. معلومات العقار الأساسية ===== */}
        <Section title="معلومات العقار" icon={<Home className="w-5 h-5" />} color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-800">نوع العقار *</Label>
              <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="اختر نوع العقار" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-amber-800">الغرض *</Label>
              <Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="للبيع / للإيجار" />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-amber-800">المساحة (م²)</Label>
              <Input
                type="number"
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
                placeholder="المساحة بالمتر المربع"
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
            <div>
              <Label className="text-amber-800">غرف النوم</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                placeholder="عدد الغرف"
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
          </div>
        </Section>

        {/* ===== 5. موقع العقار - الخريطة التفاعلية ===== */}
        <Section title="موقع العقار على الخريطة" icon={<MapPin className="w-5 h-5" />} color="cyan">
          <div className="space-y-4">
            {/* أزرار التحكم */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={goToMyLocation}
                disabled={isLoadingLocation}
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              >
                {isLoadingLocation ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 ml-2" />
                )}
                موقعي الحالي
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={toggleMapLayer}
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              >
                {mapLayer === 'street' ? (
                  <Satellite className="w-4 h-4 ml-2" />
                ) : (
                  <MapIcon className="w-4 h-4 ml-2" />
                )}
                {mapLayer === 'street' ? 'القمر الصناعي' : 'الخريطة'}
              </Button>
            </div>

            {/* الخريطة */}
            <div 
              ref={mapContainer} 
              className="h-[300px] rounded-lg border-2 border-cyan-200 overflow-hidden"
              style={{ zIndex: 1 }}
            />

            {/* بيانات الموقع المستخرجة */}
            {(formData.locationStreet || formData.locationCity) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                {formData.locationStreet && (
                  <div>
                    <Label className="text-cyan-700 text-xs">اسم الشارع</Label>
                    <p className="font-semibold text-cyan-900">{formData.locationStreet}</p>
                  </div>
                )}
                {formData.locationBuilding && (
                  <div>
                    <Label className="text-cyan-700 text-xs">رقم المبنى</Label>
                    <p className="font-semibold text-cyan-900">{formData.locationBuilding}</p>
                  </div>
                )}
                {formData.locationPostalCode && (
                  <div>
                    <Label className="text-cyan-700 text-xs">الرمز البريدي</Label>
                    <p className="font-semibold text-cyan-900">{formData.locationPostalCode}</p>
                  </div>
                )}
                {formData.locationCity && (
                  <div>
                    <Label className="text-cyan-700 text-xs">المدينة</Label>
                    <p className="font-semibold text-cyan-900">{formData.locationCity}</p>
                  </div>
                )}
                {formData.locationDistrict && (
                  <div>
                    <Label className="text-cyan-700 text-xs">الحي</Label>
                    <p className="font-semibold text-cyan-900">{formData.locationDistrict}</p>
                  </div>
                )}
                {formData.locationLat && formData.locationLng && (
                  <div>
                    <Label className="text-cyan-700 text-xs">الإحداثيات</Label>
                    <p className="font-semibold text-cyan-900 text-xs">
                      {parseFloat(formData.locationLat).toFixed(6)}, {parseFloat(formData.locationLng).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* رابط خرائط جوجل */}
            {formData.googleMapsUrl && (
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                <Label className="text-cyan-800 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  رابط الموقع على خرائط جوجل
                </Label>
                <a 
                  href={formData.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-800 underline text-sm break-all"
                >
                  {formData.googleMapsUrl}
                </a>
              </div>
            )}
          </div>
        </Section>

        {/* ===== 6. السعر ومولد الأسعار الذكي ===== */}
        <Section title="السعر ومولد الأسعار الذكي" icon={<Sparkles className="w-5 h-5" />} color="amber">
          <div className="space-y-4">
            {/* السعر المطلوب أولاً */}
            <div>
              <Label className="text-amber-800">السعر المطلوب (ريال)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="أدخل السعر المطلوب"
                className="border-amber-200 focus:border-amber-400"
              />
            </div>

            {/* تقييم تلقائي فوري للسعر */}
            {priceEvaluation && formData.price && (
              <div className={`rounded-lg border-2 p-3 flex items-center gap-2 text-sm ${
                priceEvaluation.status === 'low' ? 'border-green-300 bg-green-50 text-green-800' :
                priceEvaluation.status === 'fair' ? 'border-blue-300 bg-blue-50 text-blue-800' :
                'border-red-300 bg-red-50 text-red-800'
              }`}>
                <Badge className={`${
                  priceEvaluation.status === 'low' ? 'bg-green-500' :
                  priceEvaluation.status === 'fair' ? 'bg-blue-500' :
                  'bg-red-500'
                } text-white shrink-0`}>
                  {priceEvaluation.status === 'low' ? 'أقل من السوق' :
                   priceEvaluation.status === 'fair' ? 'مناسب' :
                   'مبالغ فيه'}
                </Badge>
                <span>{priceEvaluation.message}</span>
              </div>
            )}

            {/* حقل توضيح إلزامي عند المبالغة في السعر */}
            {priceEvaluation?.status === 'high' && formData.price && (
              <div className="rounded-lg border-2 border-red-300 bg-red-50/50 p-3 space-y-2">
                <Label className="text-red-800 font-bold flex items-center gap-1">
                  سبب السعر المرتفع <span className="text-red-600">*</span>
                </Label>
                <p className="text-xs text-red-700">
                  يرجى توضيح سبب وضع سعر أعلى من متوسط السوق (مثل: مفروش بالكامل، تشطيبات فاخرة، موقع مميز، إطلالة...)
                </p>
                <Textarea
                  value={formData.priceJustification}
                  onChange={(e) => updateField('priceJustification', e.target.value)}
                  placeholder="اذكر سبب السعر المرتفع بشكل واضح..."
                  className="border-red-200 focus:border-red-400 min-h-[80px] bg-white"
                  required
                />
              </div>
            )}

            {/* زر مولد الأسعار الذكي */}
            <Button
              type="button"
              onClick={() => generateSmartPrices(false)}
              disabled={isGeneratingPrices || !formData.propertyType || !formData.locationCity || !formData.area}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isGeneratingPrices ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  مولد الأسعار الذكي
                </>
              )}
            </Button>

            {/* نتائج مولد الأسعار */}
            {suggestedPrices && (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-800 flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5" />
                    الأسعار المقترحة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-amber-600">الحد الأدنى</p>
                      <p className="font-bold text-amber-800">{suggestedPrices.min.toLocaleString()} ريال</p>
                    </div>
                    <div className="border-x border-amber-200">
                      <p className="text-xs text-amber-600">متوسط السوق</p>
                      <p className="font-bold text-amber-800 text-lg">{suggestedPrices.average.toLocaleString()} ريال</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">الحد الأعلى</p>
                      <p className="font-bold text-amber-800">{suggestedPrices.max.toLocaleString()} ريال</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* تقييم السعر المطلوب */}
            {priceEvaluation && formData.price && (
              <Card className={`border-2 ${
                priceEvaluation.status === 'low' ? 'border-green-300 bg-green-50' :
                priceEvaluation.status === 'fair' ? 'border-blue-300 bg-blue-50' :
                'border-red-300 bg-red-50'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`${
                      priceEvaluation.status === 'low' ? 'bg-green-500' :
                      priceEvaluation.status === 'fair' ? 'bg-blue-500' :
                      'bg-red-500'
                    } text-white`}>
                      {priceEvaluation.status === 'low' ? 'أقل من السوق' :
                       priceEvaluation.status === 'fair' ? 'سعر عادل' :
                       'أعلى من السوق'}
                    </Badge>
                    <span className="text-sm">{priceEvaluation.message}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* حقول الدفعات للإيجار */}
            {formData.purpose === 'للإيجار' && (
              <div className="border-t pt-4 mt-2 space-y-4">
                <Label className="text-amber-800 font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  خيارات الدفعات (اختياري)
                </Label>
                <p className="text-sm text-amber-600">
                  حدد الأسعار حسب طريقة الدفع المفضلة للمستأجر
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-amber-700">دفعة واحدة</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.onePayment}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, onePayment: e.target.value }
                      }))}
                      placeholder="السعر السنوي"
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-amber-700">دفعتين</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.twoPayments}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, twoPayments: e.target.value }
                      }))}
                      placeholder="السعر للدفعتين"
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-amber-700">أربع دفعات</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.fourPayments}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, fourPayments: e.target.value }
                      }))}
                      placeholder="السعر لأربع دفعات"
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-amber-700">شهري</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.monthly}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        paymentPrices: { ...prev.paymentPrices, monthly: e.target.value }
                      }))}
                      placeholder="الإيجار الشهري"
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ===== 7. المواصفات التفصيلية ===== */}
        <Section title="المواصفات التفصيلية" icon={<Building className="w-5 h-5" />} color="purple">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-purple-800">عدد الأدوار</Label>
              <Input
                type="number"
                value={formData.floors}
                onChange={(e) => updateField('floors', e.target.value)}
                placeholder="عدد الأدوار"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">رقم الدور</Label>
              <Input
                type="number"
                value={formData.floorNumber}
                onChange={(e) => updateField('floorNumber', e.target.value)}
                placeholder="للشقق"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">دورات المياه</Label>
              <Input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
                placeholder="عدد الحمامات"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">صالات المعيشة</Label>
              <Input
                type="number"
                value={formData.livingRooms}
                onChange={(e) => updateField('livingRooms', e.target.value)}
                placeholder="عدد الصالات"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">المجالس</Label>
              <Input
                type="number"
                value={formData.councils}
                onChange={(e) => updateField('councils', e.target.value)}
                placeholder="عدد المجالس"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">عرض الشارع (م)</Label>
              <Input
                type="number"
                value={formData.streetWidth}
                onChange={(e) => updateField('streetWidth', e.target.value)}
                placeholder="عرض الشارع"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">عمر العقار (سنة)</Label>
              <Input
                type="number"
                value={formData.propertyAge}
                onChange={(e) => updateField('propertyAge', e.target.value)}
                placeholder="عمر البناء"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label className="text-purple-800">الواجهة</Label>
              <Select value={formData.facade} onValueChange={(v) => updateField('facade', v)}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue placeholder="اختر الواجهة" />
                </SelectTrigger>
                <SelectContent>
                  {facadeOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-purple-800">التأثيث</Label>
              <Select value={formData.furnishing} onValueChange={(v) => updateField('furnishing', v)}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue placeholder="حالة التأثيث" />
                </SelectTrigger>
                <SelectContent>
                  {furnishingOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-purple-800">المداخل</Label>
              <Select value={formData.entrances} onValueChange={(v) => updateField('entrances', v)}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue placeholder="عدد المداخل" />
                </SelectTrigger>
                <SelectContent>
                  {entranceOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-purple-800">عدد المكيفات</Label>
              <Input
                type="number"
                value={formData.acUnits}
                onChange={(e) => updateField('acUnits', e.target.value)}
                placeholder="عدد المكيفات"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>
        </Section>

        {/* ===== 8. المميزات الإضافية ===== */}
        <Section title="المميزات الإضافية" icon={<Star className="w-5 h-5" />} color="cyan">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasPool"
                checked={formData.hasPool}
                onCheckedChange={(c) => updateField('hasPool', c === true)}
              />
              <Label htmlFor="hasPool" className="text-cyan-800 cursor-pointer">🏊 مسبح</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasGarden"
                checked={formData.hasGarden}
                onCheckedChange={(c) => updateField('hasGarden', c === true)}
              />
              <Label htmlFor="hasGarden" className="text-cyan-800 cursor-pointer">🌳 حديقة</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasElevator"
                checked={formData.hasElevator}
                onCheckedChange={(c) => updateField('hasElevator', c === true)}
              />
              <Label htmlFor="hasElevator" className="text-cyan-800 cursor-pointer">🛗 مصعد</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasParking"
                checked={formData.hasParking}
                onCheckedChange={(c) => updateField('hasParking', c === true)}
              />
              <Label htmlFor="hasParking" className="text-cyan-800 cursor-pointer">🚗 موقف سيارات</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasLaundryRoom"
                checked={formData.hasLaundryRoom}
                onCheckedChange={(c) => updateField('hasLaundryRoom', c === true)}
              />
              <Label htmlFor="hasLaundryRoom" className="text-cyan-800 cursor-pointer">🧺 غرفة غسيل</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasExtraKitchen"
                checked={formData.hasExtraKitchen}
                onCheckedChange={(c) => updateField('hasExtraKitchen', c === true)}
              />
              <Label htmlFor="hasExtraKitchen" className="text-cyan-800 cursor-pointer">🍳 مطبخ إضافي</Label>
            </div>
            <div>
              <Label className="text-cyan-800">البلكونات</Label>
              <Input
                type="number"
                value={formData.balconies}
                onChange={(e) => updateField('balconies', e.target.value)}
                placeholder="عدد البلكونات"
                className="border-cyan-200 focus:border-cyan-400"
              />
            </div>
            <div>
              <Label className="text-cyan-800">المستودعات</Label>
              <Input
                type="number"
                value={formData.warehouses}
                onChange={(e) => updateField('warehouses', e.target.value)}
                placeholder="عدد المستودعات"
                className="border-cyan-200 focus:border-cyan-400"
              />
            </div>
          </div>
          
          {/* حقل المميزات الإضافية المخصصة */}
          <div className="mt-4">
            <Label className="text-cyan-800">مميزات إضافية أخرى</Label>
            <Textarea
              value={formData.customFeatures}
              onChange={(e) => updateField('customFeatures', e.target.value)}
              placeholder="أضف أي مميزات إضافية للعقار... (مثال: مصاعد، مطبخ راقي، تشطيبات فاخرة، إطلالة مميزة...)"
              rows={3}
              className="border-cyan-200 focus:border-cyan-400 mt-1"
            />
          </div>
        </Section>

        {/* ===== 9. الضمانات والكفالات ===== */}
        <Section title="الضمانات والكفالات" icon={<Shield className="w-5 h-5" />} color="rose">
          <div className="space-y-3">
            {warranties.map((warranty, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-rose-800">نوع الضمان</Label>
                  <Select value={warranty.type} onValueChange={(v) => updateWarranty(index, 'type', v)}>
                    <SelectTrigger className="border-rose-200">
                      <SelectValue placeholder="اختر نوع الضمان" />
                    </SelectTrigger>
                    <SelectContent>
                      {warrantyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label className="text-rose-800">المدة (سنة)</Label>
                  <Input
                    type="number"
                    value={warranty.duration}
                    onChange={(e) => updateWarranty(index, 'duration', e.target.value)}
                    placeholder="المدة"
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWarranty(index)}
                  className="text-rose-600 hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addWarranty}
              className="w-full border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة ضمان
            </Button>
          </div>
        </Section>

        {/* ===== 10. وصف إضافي ===== */}
        <Section title="وصف إضافي" icon={<FileText className="w-5 h-5" />} color="green">
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="أي تفاصيل إضافية عن العقار تود إضافتها..."
            rows={4}
            className="border-green-200 focus:border-green-400"
          />
        </Section>

        {/* ===== 11. النزاعات والنسبة المتفق عليها ===== */}
        <Section title="النزاعات والنسبة المتفق عليها" icon={<AlertTriangle className="w-5 h-5" />} color="rose">
          <div className="space-y-4">
            <div>
              <Label className="text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                النزاعات على العقار أو المنفعة
              </Label>
              <Textarea
                value={formData.propertyDisputes}
                onChange={(e) => updateField('propertyDisputes', e.target.value)}
                placeholder="هل يوجد أي نزاعات قائمة على العقار أو المنفعة؟ يرجى التوضيح بالتفصيل (مثال: نزاع ملكية، دعاوى قضائية، حقوق ارتفاق، رهن عقاري...)"
                rows={3}
                className="border-rose-200 focus:border-rose-400 mt-1"
              />
              <p className="text-xs text-rose-600 mt-1">
                ⚠️ يجب الإفصاح عن أي نزاعات قائمة أو محتملة على العقار للحفاظ على الشفافية
              </p>
            </div>
            
            <div>
              <Label className="text-rose-800 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                النسبة المتفق عليها للوسيط (%)
              </Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={formData.agreedCommissionRate}
                onChange={(e) => updateField('agreedCommissionRate', e.target.value)}
                placeholder="مثال: 2.5"
                className="border-rose-200 focus:border-rose-400 mt-1"
              />
              <p className="text-xs text-rose-600 mt-1">
                نسبة العمولة المتفق عليها مع الوسيط العقاري (عادة من 2% إلى 2.5% من قيمة الصفقة)
              </p>
            </div>
          </div>
        </Section>

        {/* الموافقة */}
        <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => updateField('agreeToTerms', checked === true)}
            className="mt-1"
          />
          <div className="flex-1">
            <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              أوافق على{' '}
              <button
                type="button"
                onClick={() => setShowTermsDialog(true)}
                className="text-[#01411C] hover:text-[#065f41] underline font-medium"
              >
                الشروط والأحكام
              </button>
              {' '}وسياسة الخصوصية
            </Label>
          </div>
        </div>

        {/* نافذة الشروط والأحكام */}
        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#01411C] flex items-center gap-2">
                <ScrollText className="w-6 h-6" />
                شروط استخدام رابط إرسال عرض عقار
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                يرجى قراءة هذه الشروط بعناية قبل إرسال أي عرض عقاري عبر الرابط
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-bold text-amber-800">⚠️ تنبيه مهم:</p>
                <p>باستخدامك للرابط، فإنك توافق على الالتزام بهذه الشروط بالكامل.</p>
              </div>

              <div>
                <h4 className="font-bold text-[#01411C] mb-2">1. المسؤولية عن المعلومات</h4>
                <ul className="list-disc list-inside space-y-1 mr-2">
                  <li>المستخدم مسؤول بالكامل عن صحة ودقة أي معلومات أو مستندات يرسلها عبر الرابط.</li>
                  <li>أي بيانات خاطئة أو مضللة يتحمل المستخدم المسؤولية القانونية عنها أمام الجهات المختصة.</li>
                  <li>لا يتحمل الوسيط العقاري أو التطبيق أي مسؤولية عن أي ضرر أو تبعات قانونية نتيجة معلومات غير دقيقة أو ناقصة.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#01411C] mb-2">2. الالتزام بالأنظمة والقوانين السعودية</h4>
                <p className="mb-2">يلتزم المستخدم بكافة الأنظمة واللوائح السعودية المتعلقة بالعقار والوساطة العقارية، بما في ذلك:</p>
                <ul className="list-disc list-inside space-y-1 mr-2">
                  <li>نظام الموثق العقاري.</li>
                  <li>الهيئة العامة للعقار.</li>
                  <li>اشتراطات البيع والتسجيل العقاري.</li>
                  <li>أي قوانين تتعلق بالضرائب العقارية أو رسوم التسجيل.</li>
                </ul>
                <p className="mt-2 text-amber-700">إرسال العرض عبر الرابط لا يعني توقيع عقد بيع أو تفويض الوسيط للتصرف نيابة عن المالك. أي تفويض أو عقد رسمي يجب أن يتم بمستند منفصل.</p>
              </div>

              <div>
                <h4 className="font-bold text-[#01411C] mb-2">3. العلاقة بالعقد التفصيلي</h4>
                <ul className="list-disc list-inside space-y-1 mr-2">
                  <li>هذه الشروط هي اتفاقية استخدام أولية فقط، ولا تلغي أو تحل محل عقد الوساطة المكتوب بين المالك والوسيط.</li>
                  <li>في حال وجود أي تعارض بين هذه الشروط والعقد المكتوب، فإن العقد المكتوب هو المرجع القانوني الأعلى.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#01411C] mb-2">4. حماية البيانات والسرية</h4>
                <ul className="list-disc list-inside space-y-1 mr-2">
                  <li>يتم التعامل مع المعلومات بسرية تامة وفق سياسة الخصوصية للتطبيق/الوسيط العقاري.</li>
                  <li>لا يجوز لأي طرف ثالث الوصول إلى المعلومات إلا بموافقة المستخدم أو وفق القانون.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#01411C] mb-2">5. التحذيرات والتنبيهات</h4>
                <ul className="list-disc list-inside space-y-1 mr-2">
                  <li>أي محاولة لإرسال معلومات مخالفة للنظام السعودي أو بيانات مضللة قد تعرض المستخدم للمساءلة القانونية.</li>
                  <li>التطبيق/الوسيط يحق له رفض أي عرض غير مكتمل أو مخالف للشروط.</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-bold text-green-800 mb-2">6. الموافقة الإلكترونية</h4>
                <p className="mb-2">من خلال الضغط على "أوافق"، يقر المستخدم ويصرح بما يلي:</p>
                <ul className="list-disc list-inside space-y-1 mr-2 text-green-700">
                  <li>أنه قرأ وفهم جميع الشروط أعلاه.</li>
                  <li>أنه ملتزم بالقوانين والأنظمة السعودية المتعلقة بالعقار.</li>
                  <li>أنه يتحمل المسؤولية القانونية عن صحة المعلومات المرسلة.</li>
                  <li>أنه يوافق على أن هذه الشروط تمثل اتفاقية استخدام أولية وأن العقد التفصيلي للوساطة سيحدد جميع الجوانب المالية والقانونية لاحقًا.</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowTermsDialog(false)}
                className="border-gray-300"
              >
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  updateField('agreeToTerms', true);
                  setShowTermsDialog(false);
                }}
                className="bg-[#01411C] hover:bg-[#065f41] text-white"
              >
                أوافق على الشروط
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              إرسال العرض
            </>
          )}
        </Button>
      </div>
    );
}
