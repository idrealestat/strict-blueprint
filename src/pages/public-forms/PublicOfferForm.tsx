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
import { 
  Send, Loader2, CheckCircle, Upload, Home, MapPin, User, Phone, 
  FileText, Building, X, Image as ImageIcon, Video, Star, Shield,
  CreditCard, Calendar, Plus, Trash2, Ruler, DoorOpen, Car, Droplets
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';
import LocationPickerMap from '@/components/auth/LocationPickerMap';

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
  ownerNationalAddress: string;
  ownerCity: string;
  
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

export default function PublicOfferForm() {
  const { brokerId, slug } = useParams<{ brokerId?: string; slug?: string }>();
  const brokerSlug = slug || brokerId;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [broker, setBroker] = useState<BrokerInfo>(getMockBroker(brokerSlug || '1'));
  
  // تحميل بيانات الوسيط مع الصور من قاعدة البيانات
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
      ownerNationalAddress: '',
      ownerCity: '',
      deedNumber: '',
      deedDate: '',
      deedCity: '',
      tour3dUrl: '',
      propertyType: '',
      purpose: '',
      area: '',
      price: '',
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
  // Note: Public forms upload to broker's folder using broker id from URL params
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    // SECURITY: Path uses broker's id for ownership, falling back to 'public-submissions' for anonymous
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
      // حفظ الوسائط في sessionStorage لمنع فقدانها
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
    // حفظ التحديثات في sessionStorage
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

    setIsSubmitting(true);

    try {
      // إنشاء بيانات العرض
      const offerId = `offer_${Date.now()}`;
      const submissionData = {
        id: offerId,
        type: 'property_offer',
        brokerId: broker.id,
        brokerName: broker.name,
        ...formData,
        warranties,
        media,
        mainImage: media.find(m => m.isMain)?.url || null,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        isNew: true, // علامة للدائرة النابضة
        isViewed: false,
      };

      // إرسال البيانات للخلفية (يعمل حتى لو العميل غير مسجل دخول)
      if (!brokerSlug) {
        throw new Error('missing broker slug');
      }

      const { data: submitResult, error: submitError } = await supabase.functions.invoke('public-form-submit', {
        body: {
          slug: brokerSlug,
          formType: 'offer',
          data: submissionData,
        },
      });

      if (submitError) {
        console.error('[PublicOfferForm] public submit error:', submitError);
        throw submitError;
      }

      const customerId = (submitResult as any)?.customerId as string | undefined;
      // ملاحظة: إنشاء بطاقة العميل + إضافة العرض + إنشاء الإشعار يتم بالكامل في الخلفية
      console.log('[PublicOfferForm] submitResult:', submitResult, 'customerId:', customerId);


      // 6. حفظ نسخة محلية احتياطية
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // 7. تحديث localStorage للعملاء (للتوافق مع النظام الحالي)
      const localCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingLocalCustomer = localCustomers.find((c: any) => c.phone === formData.ownerPhone);
      
      const tabData = {
        id: `tab_${Date.now()}`,
        name: 'عرض عقاري',
        type: 'property_offer',
        data: submissionData,
        isNew: true,
        isViewed: false,
        createdAt: new Date().toISOString(),
      };

      if (existingLocalCustomer) {
        existingLocalCustomer.tabs = existingLocalCustomer.tabs || [];
        existingLocalCustomer.tabs.push(tabData);
        existingLocalCustomer.hasUnreadPublishedAd = true;
        existingLocalCustomer.hasUnreadOffer = true;
        existingLocalCustomer.name = formData.ownerName;
        existingLocalCustomer.idNumber = formData.ownerIdNumber;
        existingLocalCustomer.nationalAddress = formData.ownerNationalAddress;
      } else {
        localCustomers.push({
          id: `cust_${Date.now()}`,
          name: formData.ownerName,
          phone: formData.ownerPhone,
          idNumber: formData.ownerIdNumber,
          nationalAddress: formData.ownerNationalAddress,
          type: 'owner',
          source: 'public_form',
          status: 'new',
          hasUnreadPublishedAd: true,
          hasUnreadOffer: true,
          isNewCard: true,
          createdAt: new Date().toISOString(),
          tabs: [tabData],
        });
      }
      localStorage.setItem('crm_customers', JSON.stringify(localCustomers));

      // 8. إرسال حدث لتحديث واجهة المستخدم
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: {
          title: '🏠 عرض عقاري جديد',
          message: `تم استلام عرض من ${formData.ownerName}`,
          type: 'success',
          category: 'customer',
          isPulsing: true,
        }
      }));

      window.dispatchEvent(new CustomEvent('newOfferReceived', {
        detail: {
          offerId,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
        }
      }));

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

  if (isSubmitted) {
    return (
      <PublicFormLayout broker={broker} title="إرسال عرض عقاري">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الإرسال بنجاح!</h3>
          <p className="text-gray-600 mb-6">شكراً لك، تم استلام عرضك وسيتواصل معك الوسيط قريباً</p>
          <Button onClick={() => window.close()} className="bg-[#01411C] hover:bg-[#065f41] text-white">
            إغلاق الصفحة
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout broker={broker} title="إرسال عرض عقاري">
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
              <Label className="text-green-800">رقم الجوال *</Label>
              <Input
                value={formData.ownerPhone}
                onChange={(e) => updateField('ownerPhone', e.target.value)}
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="border-green-200 focus:border-green-400"
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
            <div className="md:col-span-2">
              <Label className="text-green-800">العنوان الوطني</Label>
              <Input
                value={formData.ownerNationalAddress}
                onChange={(e) => updateField('ownerNationalAddress', e.target.value)}
                placeholder="العنوان الوطني الكامل"
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

        {/* ===== 3. معلومات العقار الأساسية ===== */}
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
              <Label className="text-amber-800">المساحة (م²)</Label>
              <Input
                type="number"
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
                placeholder="المساحة بالمتر المربع"
                className="border-amber-200 focus:border-amber-400"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-amber-800">السعر المطلوب (ريال)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="السعر بالريال"
                className="border-amber-200 focus:border-amber-400"
              />
            </div>

            {/* حقول الدفعات للإيجار */}
            {formData.purpose === 'للإيجار' && (
              <div className="md:col-span-2 border-t pt-4 mt-2 space-y-4">
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
                      placeholder="السعر الشهري"
                      className="border-amber-200 focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ===== قسم تحديد موقع العقار ===== */}
        <Section title="تحديد موقع العقار" icon={<MapPin className="w-5 h-5" />} color="cyan">
          <div className="space-y-4">
            {/* الخريطة */}
            <div className="mb-4">
              <Label className="text-cyan-800 mb-2 block">حدد موقع العقار على الخريطة</Label>
              <LocationPickerMap
                onLocationSelect={async (lat, lng) => {
                  // تحديث الإحداثيات فوراً
                  setFormData(prev => ({
                    ...prev,
                    locationLat: lat.toString(),
                    locationLng: lng.toString(),
                    googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
                  }));
                  
                  // جلب العنوان من Nominatim (Reverse Geocoding)
                  try {
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&addressdetails=1`
                    );
                    const data = await response.json();
                    
                    if (data && data.address) {
                      const addr = data.address;
                      setFormData(prev => ({
                        ...prev,
                        locationCity: addr.city || addr.town || addr.village || addr.state || '',
                        locationDistrict: addr.suburb || addr.neighbourhood || addr.district || addr.county || '',
                        locationStreet: addr.road || addr.street || '',
                        locationPostalCode: addr.postcode || '',
                        // رقم المبني والرقم الإضافي قد لا يتوفران دائماً
                        locationBuilding: addr.house_number || '',
                      }));
                    }
                  } catch (error) {
                    console.error('Error fetching address:', error);
                  }
                }}
                initialLat={formData.locationLat ? parseFloat(formData.locationLat) : 24.7136}
                initialLng={formData.locationLng ? parseFloat(formData.locationLng) : 46.6753}
              />
            </div>

            {/* الحقول التلقائية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-cyan-800">المدينة</Label>
                <Input
                  value={formData.locationCity}
                  onChange={(e) => updateField('locationCity', e.target.value)}
                  placeholder="المدينة"
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label className="text-cyan-800">الحي</Label>
                <Input
                  value={formData.locationDistrict}
                  onChange={(e) => updateField('locationDistrict', e.target.value)}
                  placeholder="الحي"
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label className="text-cyan-800">اسم الشارع</Label>
                <Input
                  value={formData.locationStreet}
                  onChange={(e) => updateField('locationStreet', e.target.value)}
                  placeholder="اسم الشارع"
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label className="text-cyan-800">رقم المبنى</Label>
                <Input
                  value={formData.locationBuilding}
                  onChange={(e) => updateField('locationBuilding', e.target.value)}
                  placeholder="رقم المبنى"
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label className="text-cyan-800">الرقم الإضافي</Label>
                <Input
                  value={formData.locationAdditionalNumber}
                  onChange={(e) => updateField('locationAdditionalNumber', e.target.value)}
                  placeholder="الرقم الإضافي"
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label className="text-cyan-800">الرمز البريدي</Label>
                <Input
                  value={formData.locationPostalCode}
                  onChange={(e) => updateField('locationPostalCode', e.target.value)}
                  placeholder="الرمز البريدي"
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
            </div>

            {/* رابط خرائط جوجل */}
            {formData.googleMapsUrl && (
              <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
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

        {/* ===== 4. المواصفات التفصيلية ===== */}
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
              <Label className="text-purple-800">غرف النوم</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                placeholder="عدد الغرف"
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

        {/* ===== 5. المميزات الإضافية ===== */}
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

        {/* ===== 6. الضمانات والكفالات ===== */}
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

        {/* ===== 8. وصف إضافي ===== */}
        <Section title="وصف إضافي" icon={<FileText className="w-5 h-5" />} color="green">
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="أي تفاصيل إضافية عن العقار تود إضافتها..."
            rows={4}
            className="border-green-200 focus:border-green-400"
          />
        </Section>

        {/* الموافقة */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
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
              إرسال العرض
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
