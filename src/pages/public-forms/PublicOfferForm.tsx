/**
 * PublicOfferForm.tsx
 * صفحة إرسال عرض عقاري من العميل مع رفع الصور
 */

import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, CheckCircle, Upload, Home, MapPin, User, Phone, CreditCard, FileText, Building, X, Image as ImageIcon, Video, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';

// Mock broker data - will be fetched by broker ID
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
});

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "استراحة"];
const purposes = ["للبيع", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف"];

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  isMain: boolean;
  fileName: string;
}

interface FormData {
  // معلومات المالك
  ownerName: string;
  ownerPhone: string;
  ownerIdNumber: string;
  ownerNationalAddress: string;
  // معلومات العقار
  propertyType: string;
  purpose: string;
  city: string;
  district: string;
  area: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  description: string;
  // موافقة
  agreeToTerms: boolean;
}

export default function PublicOfferForm() {
  const { brokerId } = useParams<{ brokerId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [media, setMedia] = useState<MediaFile[]>([]);
  
  const broker = getMockBroker(brokerId || '1');

  const [formData, setFormData] = useState<FormData>({
    ownerName: '',
    ownerPhone: '',
    ownerIdNumber: '',
    ownerNationalAddress: '',
    propertyType: '',
    purpose: '',
    city: '',
    district: '',
    area: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    agreeToTerms: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Upload file to Supabase Storage
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `client-offers/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }, []);

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
      setMedia([...media, ...newMedia]);
      toast.success(`تم رفع ${newMedia.length} ملف بنجاح`);
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove media
  const removeMedia = (mediaId: string) => {
    const updatedMedia = media.filter(m => m.id !== mediaId);
    if (media.find(m => m.id === mediaId)?.isMain && updatedMedia.length > 0) {
      updatedMedia[0].isMain = true;
    }
    setMedia(updatedMedia);
    toast.success('تم حذف الملف');
  };

  // Set as main image
  const setAsMain = (mediaId: string) => {
    const updatedMedia = media.map(m => ({
      ...m,
      isMain: m.id === mediaId,
    }));
    setMedia(updatedMedia);
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
      // Create submission data with media
      const submissionData = {
        id: `offer_${Date.now()}`,
        type: 'property_offer',
        brokerId: broker.id,
        brokerName: broker.name,
        ...formData,
        media: media, // إضافة الصور والفيديو
        mainImage: media.find(m => m.isMain)?.url || null,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      // Save to localStorage (simulating backend)
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // Trigger notification for broker with pulsing dot
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'new_offer',
        title: 'عرض عقاري جديد',
        message: `تم استلام عرض عقاري جديد من ${formData.ownerName} - ${formData.propertyType} ${formData.purpose}`,
        data: submissionData,
        isRead: false,
        isPulsing: true, // للعلامة الحمراء النابضة
        createdAt: new Date().toISOString(),
      };
      
      const notifications = JSON.parse(localStorage.getItem('broker_notifications') || '[]');
      notifications.unshift(notification);
      localStorage.setItem('broker_notifications', JSON.stringify(notifications));

      // Mark customer for CRM with full data including media
      const customerData = {
        id: `cust_${Date.now()}`,
        name: formData.ownerName,
        phone: formData.ownerPhone,
        idNumber: formData.ownerIdNumber,
        nationalAddress: formData.ownerNationalAddress,
        type: 'owner',
        source: 'public_form',
        status: 'new',
        hasUnreadPublishedAd: true, // للعلامة الحمراء النابضة
        createdAt: new Date().toISOString(),
        tabs: [{
          id: `tab_${Date.now()}`,
          name: 'عرض عقاري',
          type: 'property_offer',
          data: submissionData,
          isNew: true, // للعلامة الحمراء النابضة
          createdAt: new Date().toISOString(),
        }],
      };

      const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingCustomer = customers.find((c: any) => c.phone === formData.ownerPhone);
      
      if (existingCustomer) {
        existingCustomer.tabs = existingCustomer.tabs || [];
        existingCustomer.tabs.push(customerData.tabs[0]);
        existingCustomer.hasUnreadPublishedAd = true;
        localStorage.setItem('crm_customers', JSON.stringify(customers));
      } else {
        customers.push(customerData);
        localStorage.setItem('crm_customers', JSON.stringify(customers));
      }

      // Mark as new for pulsing dot
      const newItems = JSON.parse(localStorage.getItem('wasata_new_items') || '{}');
      newItems.offers = newItems.offers || [];
      newItems.offers.push(submissionData.id);
      newItems.customers = newItems.customers || [];
      newItems.customers.push(customerData.id);
      localStorage.setItem('wasata_new_items', JSON.stringify(newItems));

      // Trigger event for real-time notification
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: {
          title: 'عرض عقاري جديد',
          message: `تم استلام عرض من ${formData.ownerName}`,
          type: 'success',
          category: 'customer',
        }
      }));

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
          <p className="text-gray-600 mb-6">
            شكراً لك، تم استلام عرضك وسيتواصل معك الوسيط قريباً
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
    <PublicFormLayout broker={broker} title="إرسال عرض عقاري">
      <div className="p-6 space-y-6">
        {/* معلومات المالك */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <User className="w-5 h-5 text-[#D4AF37]" />
            معلومات المالك
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                placeholder="أدخل اسمك الكامل"
              />
            </div>
            <div>
              <Label>رقم الجوال *</Label>
              <Input
                value={formData.ownerPhone}
                onChange={(e) => updateField('ownerPhone', e.target.value)}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <Label>رقم الهوية</Label>
              <Input
                value={formData.ownerIdNumber}
                onChange={(e) => updateField('ownerIdNumber', e.target.value)}
                placeholder="رقم الهوية الوطنية"
              />
            </div>
            <div>
              <Label>العنوان الوطني</Label>
              <Input
                value={formData.ownerNationalAddress}
                onChange={(e) => updateField('ownerNationalAddress', e.target.value)}
                placeholder="العنوان الوطني"
              />
            </div>
          </div>
        </div>

        {/* معلومات العقار */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Home className="w-5 h-5 text-[#D4AF37]" />
            معلومات العقار
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>نوع العقار *</Label>
              <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="للبيع / للإيجار" />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المدينة</Label>
              <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
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
                value={formData.district}
                onChange={(e) => updateField('district', e.target.value)}
                placeholder="اسم الحي"
              />
            </div>
            <div>
              <Label>المساحة (م²)</Label>
              <Input
                type="number"
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
                placeholder="المساحة بالمتر المربع"
              />
            </div>
            <div>
              <Label>السعر المطلوب</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="السعر بالريال"
              />
            </div>
            <div>
              <Label>عدد الغرف</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                placeholder="عدد غرف النوم"
              />
            </div>
            <div>
              <Label>عدد دورات المياه</Label>
              <Input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
                placeholder="عدد دورات المياه"
              />
            </div>
          </div>

          <div>
            <Label>وصف إضافي</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="أي تفاصيل إضافية عن العقار..."
              rows={4}
            />
          </div>
        </div>

        {/* رفع صور العقار */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
            صور وفيديوهات العقار
          </h3>

          {/* منطقة الرفع */}
          <div 
            className="flex flex-col items-center justify-center border-2 border-dashed border-[#D4AF37] rounded-lg p-6 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
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
                <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                <p className="text-[#01411C] font-semibold">جاري الرفع... {uploadProgress}%</p>
                <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#D4AF37] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-[#D4AF37] mb-2" />
                <p className="text-[#01411C] font-semibold">اضغط لرفع الصور والفيديوهات</p>
                <p className="text-gray-500 text-sm">PNG, JPG, MP4 - حتى 10MB للصور و 50MB للفيديو</p>
              </>
            )}
          </div>

          {/* عرض الوسائط المرفوعة */}
          {media.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {media.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative aspect-square rounded-lg overflow-hidden group ${
                    item.isMain ? 'ring-2 ring-[#D4AF37] ring-offset-2' : ''
                  }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {item.type === 'image' && !item.isMain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsMain(item.id);
                        }}
                        className="p-1.5 bg-white rounded-lg"
                        title="تعيين كصورة رئيسية"
                      >
                        <Star className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(item.id);
                      }}
                      className="p-1.5 bg-white rounded-lg"
                      title="حذف"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  {/* Main Badge */}
                  {item.isMain && (
                    <div className="absolute top-1 right-1 bg-[#D4AF37] text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      رئيسية
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {media.length > 0 && (
            <p className="text-sm text-gray-500">
              تم رفع {media.filter(m => m.type === 'image').length} صورة و {media.filter(m => m.type === 'video').length} فيديو
            </p>
          )}
        </div>

        {/* الموافقة */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
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
