/**
 * CreateRequestForm.tsx
 * صفحة إنشاء طلب عقار جديد - مشابهة لنموذج الطلب العام
 * مع خيار نشر الإعلان وربطه بإدارة العملاء
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Send, Loader2, CheckCircle, Search, User, Phone, MapPin, DollarSign,
  CreditCard, Building, Home, Calendar, Ruler, BedDouble, Bath, ArrowRight,
  FileDown, RefreshCw, CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateRequestPDF } from '@/utils/generateRequestPDF';
import { triggerNotification } from '@/hooks/useNotifications';
import { NotificationSounds } from '@/utils/notificationSounds';

// أنواع العقارات والمدن
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

interface RequestFormData {
  // معلومات المالك
  ownerName: string;
  ownerPhone: string;
  ownerIdNumber: string;
  ownerBirthDate: string;
  ownerCity: string;
  ownerDistrict: string;
  
  // معلومات العقار المطلوب
  propertyType: string;
  purpose: string;
  preferredCity: string;
  preferredDistricts: string;
  
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
  
  // نشر الإعلان
  publishRequest: boolean;
}

interface CreateRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: any) => void;
  user?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  brokerData?: {
    name?: string;
    phone?: string;
    company?: string;
    licenseNumber?: string;
    profileImage?: string;
    coverImage?: string;
    logoImage?: string;
  } | null;
}

export default function CreateRequestForm({ isOpen, onClose, onSuccess, user, brokerData }: CreateRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const [pdfOption, setPdfOption] = useState<'request_only' | 'request_and_owner'>('request_only');

  const [formData, setFormData] = useState<RequestFormData>({
    ownerName: '',
    ownerPhone: '',
    ownerIdNumber: '',
    ownerBirthDate: '',
    ownerCity: '',
    ownerDistrict: '',
    propertyType: '',
    purpose: '',
    preferredCity: '',
    preferredDistricts: '',
    minArea: '',
    maxArea: '',
    bedrooms: '',
    bathrooms: '',
    livingRooms: '',
    floors: '',
    furnishing: '',
    minBudget: '',
    maxBudget: '',
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
    publishRequest: true,
  });

  const updateField = (field: keyof RequestFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePaymentPrice = (field: keyof RequestFormData['paymentPrices'], value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentPrices: { ...prev.paymentPrices, [field]: value }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.ownerName || !formData.ownerPhone) {
      toast.error('يرجى إدخال اسم المالك ورقم الجوال');
      return;
    }
    if (!formData.propertyType || !formData.purpose) {
      toast.error('يرجى تحديد نوع العقار والغرض');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = `request_${Date.now()}`;
      const requestData = {
        id: requestId,
        type: 'property_request',
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'published',
        isNew: true,
      };

      // البحث عن العميل برقم الجوال في قاعدة البيانات
      let customerWasCreated = false;
      let customerWasUpdated = false;
      let customerId = '';
      
      if (user?.id) {
        const { data: existingCustomer } = await supabase
          .from('crm_customers')
          .select('*')
          .eq('user_id', user.id)
          .or(`phone.eq.${formData.ownerPhone},whatsapp.eq.${formData.ownerPhone}`)
          .maybeSingle();

        if (existingCustomer) {
          // العميل موجود - تحديث بياناته وإضافة الطلب
          const currentMetadata = (existingCustomer.metadata as Record<string, any>) || {};
          const existingRequests = currentMetadata.published_requests || [];
          
          await supabase
            .from('crm_customers')
            .update({
              name: formData.ownerName || existingCustomer.name,
              last_contact: new Date().toISOString().split('T')[0],
              location: formData.ownerCity || existingCustomer.location,
              metadata: {
                ...currentMetadata,
                idNumber: formData.ownerIdNumber || currentMetadata.idNumber,
                birthDate: formData.ownerBirthDate || currentMetadata.birthDate,
                city: formData.ownerCity || currentMetadata.city,
                district: formData.ownerDistrict || currentMetadata.district,
                published_requests: [...existingRequests, requestData],
                hasPublishedRequest: true,
                hasNewPublishedRequest: true,
                lastRequestAt: new Date().toISOString(),
              },
            })
            .eq('id', existingCustomer.id);

          customerWasUpdated = true;
          customerId = existingCustomer.id;
          toast.success('تم تحديث بيانات العميل وإضافة الطلب');
        } else {
          // العميل غير موجود - إنشاء بطاقة جديدة
          const { data: newCustomer } = await supabase
            .from('crm_customers')
            .insert([{
              user_id: user.id,
              name: formData.ownerName,
              phone: formData.ownerPhone,
              status: 'جديد',
              priority: 'عالي',
              property_type: formData.purpose === 'للشراء' ? 'buyer' : 'renter',
              source: 'طلب منشور',
              location: formData.ownerCity || null,
              budget: formData.maxBudget ? `${formData.minBudget || 0} - ${formData.maxBudget}` : null,
              notes: `طلب عقاري: ${formData.propertyType} ${formData.purpose}`,
              last_contact: new Date().toISOString().split('T')[0],
              metadata: {
                idNumber: formData.ownerIdNumber,
                birthDate: formData.ownerBirthDate,
                city: formData.ownerCity,
                district: formData.ownerDistrict,
                published_requests: [requestData],
                hasPublishedRequest: true,
                hasNewPublishedRequest: true,
                isNewCard: true,
                lastRequestAt: new Date().toISOString(),
              },
            }])
            .select()
            .single();

          customerWasCreated = true;
          customerId = newCustomer?.id || '';
          toast.success('تم إنشاء بطاقة عميل جديدة مع الطلب');
        }

        // إرسال إشعارات
        // 1. إشعار نشر الطلب
        await triggerNotification(user.id, {
          title: '📋 تم نشر طلب جديد',
          message: `طلب ${formData.purpose} - ${formData.propertyType} في ${formData.preferredCity || 'غير محدد'}`,
          notification_type: 'request',
          category: 'request_published',
          priority: 'high',
          related_entity_type: 'request',
          related_entity_id: requestId,
          action_url: '/app/dashboard?tab=requests',
          metadata: { requestData, isNew: true },
        });

        // 2. إشعار إضافة/تحديث بطاقة العميل
        if (customerWasCreated) {
          await triggerNotification(user.id, {
            title: '👤 تم إنشاء بطاقة عميل جديدة',
            message: `${formData.ownerName} - ${formData.ownerPhone}`,
            notification_type: 'crm',
            category: 'customer_created',
            priority: 'normal',
            related_entity_type: 'customer',
            related_entity_id: customerId,
            action_url: '/app/dashboard?tab=customers',
            metadata: { customerId, hasPublishedRequest: true, isNew: true },
          });
        } else if (customerWasUpdated) {
          await triggerNotification(user.id, {
            title: '📝 تم تحديث بطاقة العميل',
            message: `تمت إضافة طلب منشور لـ ${formData.ownerName}`,
            notification_type: 'crm',
            category: 'customer_updated',
            priority: 'normal',
            related_entity_type: 'customer',
            related_entity_id: customerId,
            action_url: '/app/dashboard?tab=customers',
            metadata: { customerId, hasNewPublishedRequest: true },
          });
        }

        // تشغيل صوت التنبيه
        try {
          await NotificationSounds.newRequest();
        } catch (e) {
          console.log('Sound playback error:', e);
        }
      }

      // حفظ الطلب في localStorage للعرض في تبويب الطلبات
      const existingRequestsLocal = JSON.parse(localStorage.getItem('wasata_published_requests') || '[]');
      existingRequestsLocal.push(requestData);
      localStorage.setItem('wasata_published_requests', JSON.stringify(existingRequestsLocal));

      // تحديث قائمة الطلبات الجديدة (للنقاط النابضة)
      const newRequestIds = JSON.parse(localStorage.getItem('new_request_ids') || '[]');
      newRequestIds.push(requestId);
      localStorage.setItem('new_request_ids', JSON.stringify(newRequestIds));

      // إرسال حدث لتحديث تبويب الطلبات
      window.dispatchEvent(new CustomEvent('requestPublished', { detail: requestData }));

      // إرسال حدث لتحديث إدارة العملاء
      window.dispatchEvent(new CustomEvent('customerUpdated', { 
        detail: { customerId, hasNewPublishedRequest: true, customerWasCreated, customerWasUpdated } 
      }));

      setSubmittedRequest(requestData);
      setIsSubmitted(true);
      onSuccess(requestData);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!submittedRequest) return;
    
    const includeOwner = pdfOption === 'request_and_owner';
    await generateRequestPDF(submittedRequest, includeOwner, brokerData);
    setShowPDFOptions(false);
    toast.success('تم تحميل ملف PDF بنجاح');
  };

  const handlePublishAgain = () => {
    setIsSubmitted(false);
    setSubmittedRequest(null);
    setFormData({
      ownerName: '',
      ownerPhone: '',
      ownerIdNumber: '',
      ownerBirthDate: '',
      ownerCity: '',
      ownerDistrict: '',
      propertyType: '',
      purpose: '',
      preferredCity: '',
      preferredDistricts: '',
      minArea: '',
      maxArea: '',
      bedrooms: '',
      bathrooms: '',
      livingRooms: '',
      floors: '',
      furnishing: '',
      minBudget: '',
      maxBudget: '',
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
      publishRequest: true,
    });
  };

  const handleMarkAsFulfilled = () => {
    if (!submittedRequest) return;
    
    // تحديث حالة الطلب
    const existingRequests = JSON.parse(localStorage.getItem('wasata_published_requests') || '[]');
    const updatedRequests = existingRequests.map((r: any) => 
      r.id === submittedRequest.id ? { ...r, status: 'fulfilled' } : r
    );
    localStorage.setItem('wasata_published_requests', JSON.stringify(updatedRequests));
    
    window.dispatchEvent(new CustomEvent('requestFulfilled', { detail: submittedRequest }));
    toast.success('تم تحديث حالة الطلب إلى "تم التوفير"');
    onClose();
  };

  // صفحة النجاح بعد النشر
  if (isSubmitted && submittedRequest) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg" dir="rtl">
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">تم نشر الطلب بنجاح!</h3>
            <p className="text-gray-600 mb-6">
              تم حفظ الطلب وإضافته في تبويب الطلبات وربطه بإدارة العملاء
            </p>

            <div className="space-y-3">
              {/* زر نشر مرة أخرى */}
              <Button
                onClick={handlePublishAgain}
                variant="outline"
                className="w-full border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                نشر طلب جديد
              </Button>

              {/* زر تم توفير الطلب */}
              <Button
                onClick={handleMarkAsFulfilled}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                <CheckCheck className="w-4 h-4 ml-2" />
                تم توفير الطلب
              </Button>

              {/* زر تحميل PDF */}
              <Button
                onClick={() => setShowPDFOptions(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                <FileDown className="w-4 h-4 ml-2" />
                تحميل البيانات PDF
              </Button>

              {/* زر إغلاق */}
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
              >
                إغلاق
              </Button>
            </div>
          </div>

          {/* نافذة خيارات PDF */}
          <Dialog open={showPDFOptions} onOpenChange={setShowPDFOptions}>
            <DialogContent className="max-w-sm" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-center">خيارات تحميل PDF</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <RadioGroup value={pdfOption} onValueChange={(v: any) => setPdfOption(v)}>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="request_only" id="request_only" />
                    <Label htmlFor="request_only" className="flex-1 cursor-pointer">
                      معلومات الطلب فقط
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 mt-2">
                    <RadioGroupItem value="request_and_owner" id="request_and_owner" />
                    <Label htmlFor="request_and_owner" className="flex-1 cursor-pointer">
                      معلومات الطلب ومعلومات المالك
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPDFOptions(false)}>إلغاء</Button>
                <Button onClick={handleDownloadPDF} className="bg-red-500 hover:bg-red-600 text-white">
                  <FileDown className="w-4 h-4 ml-2" />
                  تحميل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Search className="w-6 h-6 text-[#01411C]" />
            إنشاء طلب عقار جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* عنوان المستند */}
          <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
            <Search className="w-8 h-8 text-blue-600 mx-auto mb-1" />
            <h2 className="text-xl font-bold text-[#01411C]">نموذج طلب عقار</h2>
            <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          
          {/* القسم 1: معلومات المالك */}
          <Section title="معلومات المالك/العميل" icon={<User className="w-5 h-5" />} color="green">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المالك/العميل *</Label>
                <Input
                  value={formData.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <Label>رقم الجوال *</Label>
                <Input
                  value={formData.ownerPhone}
                  onChange={(e) => updateField('ownerPhone', e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div>
                <Label>رقم الهوية/البطاقة</Label>
                <Input
                  value={formData.ownerIdNumber}
                  onChange={(e) => updateField('ownerIdNumber', e.target.value)}
                  placeholder="رقم الهوية الوطنية"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div>
                <Label>تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={formData.ownerBirthDate}
                  onChange={(e) => updateField('ownerBirthDate', e.target.value)}
                />
              </div>
              <div>
                <Label>المدينة</Label>
                <Select value={formData.ownerCity} onValueChange={(v) => updateField('ownerCity', v)}>
                  <SelectTrigger>
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
                <Label>الحي</Label>
                <Input
                  value={formData.ownerDistrict}
                  onChange={(e) => updateField('ownerDistrict', e.target.value)}
                  placeholder="اسم الحي"
                />
              </div>
            </div>
          </Section>

          {/* القسم 2: معلومات العقار المطلوب */}
          <Section title="تفاصيل العقار المطلوب" icon={<Building className="w-5 h-5" />} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>نوع العقار *</Label>
                <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
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
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الغرض" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map(purpose => (
                      <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المدينة المفضلة</Label>
                <Select value={formData.preferredCity} onValueChange={(v) => updateField('preferredCity', v)}>
                  <SelectTrigger>
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
                  placeholder="الأحياء المفضلة (مفصولة بفاصلة)"
                />
              </div>
            </div>
          </Section>

          {/* القسم 3: المواصفات */}
          <Section title="المواصفات المطلوبة" icon={<Ruler className="w-5 h-5" />} color="amber">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>الحد الأدنى للمساحة (م²)</Label>
                <Input
                  type="number"
                  value={formData.minArea}
                  onChange={(e) => updateField('minArea', e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>الحد الأقصى للمساحة (م²)</Label>
                <Input
                  type="number"
                  value={formData.maxArea}
                  onChange={(e) => updateField('maxArea', e.target.value)}
                  placeholder="300"
                />
              </div>
              <div>
                <Label>غرف النوم</Label>
                <Select value={formData.bedrooms} onValueChange={(v) => updateField('bedrooms', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5', '6', '7+'].map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>دورات المياه</Label>
                <Select value={formData.bathrooms} onValueChange={(v) => updateField('bathrooms', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5', '6+'].map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الصالات</Label>
                <Select value={formData.livingRooms} onValueChange={(v) => updateField('livingRooms', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4+'].map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عدد الأدوار</Label>
                <Select value={formData.floors} onValueChange={(v) => updateField('floors', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4+'].map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>التأثيث</Label>
                <Select value={formData.furnishing} onValueChange={(v) => updateField('furnishing', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع التأثيث" />
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

          {/* القسم 4: الميزانية */}
          <Section title="الميزانية" icon={<DollarSign className="w-5 h-5" />} color="purple">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الحد الأدنى (ريال)</Label>
                <Input
                  type="number"
                  value={formData.minBudget}
                  onChange={(e) => updateField('minBudget', e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div>
                <Label>الحد الأقصى (ريال)</Label>
                <Input
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => updateField('maxBudget', e.target.value)}
                  placeholder="1000000"
                />
              </div>
            </div>

            {formData.purpose === 'للإيجار' && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <Label className="text-purple-800 font-bold mb-2 block">خيارات الدفع للإيجار (ريال/سنة)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">دفعة واحدة</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.onePayment}
                      onChange={(e) => updatePaymentPrice('onePayment', e.target.value)}
                      placeholder="السعر"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">دفعتين</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.twoPayments}
                      onChange={(e) => updatePaymentPrice('twoPayments', e.target.value)}
                      placeholder="السعر"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">4 دفعات</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.fourPayments}
                      onChange={(e) => updatePaymentPrice('fourPayments', e.target.value)}
                      placeholder="السعر"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">شهري</Label>
                    <Input
                      type="number"
                      value={formData.paymentPrices.monthly}
                      onChange={(e) => updatePaymentPrice('monthly', e.target.value)}
                      placeholder="السعر"
                    />
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* القسم 5: الميزات */}
          <Section title="الميزات المطلوبة" icon={<Home className="w-5 h-5" />} color="cyan">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'hasPool', label: '🏊 مسبح' },
                { key: 'hasGarden', label: '🌳 حديقة' },
                { key: 'hasElevator', label: '🛗 مصعد' },
                { key: 'hasParking', label: '🚗 موقف سيارات' },
                { key: 'hasMaidRoom', label: '🏠 غرفة خادمة' },
                { key: 'hasDriverRoom', label: '🚗 غرفة سائق' },
              ].map(feature => (
                <div key={feature.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData[feature.key as keyof RequestFormData] as boolean}
                    onCheckedChange={(checked) => updateField(feature.key as keyof RequestFormData, !!checked)}
                  />
                  <Label>{feature.label}</Label>
                </div>
              ))}
            </div>
          </Section>

          {/* القسم 6: ملاحظات إضافية */}
          <Section title="متطلبات إضافية" icon={<CreditCard className="w-5 h-5" />} color="orange">
            <Textarea
              value={formData.additionalRequirements}
              onChange={(e) => updateField('additionalRequirements', e.target.value)}
              placeholder="أي متطلبات أو ملاحظات إضافية..."
              rows={3}
            />
            <div className="mt-4">
              <Label>درجة الاستعجال</Label>
              <Select value={formData.urgency} onValueChange={(v) => updateField('urgency', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 عاجل جداً</SelectItem>
                  <SelectItem value="high">🟠 عاجل</SelectItem>
                  <SelectItem value="normal">🟢 عادي</SelectItem>
                  <SelectItem value="low">🔵 غير مستعجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* خيار النشر */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <Checkbox
              checked={formData.publishRequest}
              onCheckedChange={(checked) => updateField('publishRequest', !!checked)}
            />
            <div>
              <Label className="font-bold text-green-800">نشر الطلب في تبويب الطلبات</Label>
              <p className="text-xs text-green-600">سيظهر الطلب في قائمة الطلبات المنشورة</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#01411C] hover:bg-[#065f41] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 ml-2" />
                نشر الطلب
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
