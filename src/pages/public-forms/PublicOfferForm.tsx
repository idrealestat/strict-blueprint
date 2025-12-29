/**
 * PublicOfferForm.tsx
 * صفحة إرسال عرض عقاري من العميل
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, CheckCircle, Upload, Home, MapPin, User, Phone, CreditCard, FileText, Building } from 'lucide-react';
import { toast } from 'sonner';
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

  const handleSubmit = async () => {
    // Validation
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
      // Create submission data
      const submissionData = {
        id: `offer_${Date.now()}`,
        type: 'property_offer',
        brokerId: broker.id,
        brokerName: broker.name,
        ...formData,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      // Save to localStorage (simulating backend)
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // Trigger notification for broker
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'new_offer',
        title: 'عرض عقاري جديد',
        message: `تم استلام عرض عقاري جديد من ${formData.ownerName}`,
        data: submissionData,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      const notifications = JSON.parse(localStorage.getItem('broker_notifications') || '[]');
      notifications.unshift(notification);
      localStorage.setItem('broker_notifications', JSON.stringify(notifications));

      // Mark customer for CRM
      const customerData = {
        id: `cust_${Date.now()}`,
        name: formData.ownerName,
        phone: formData.ownerPhone,
        idNumber: formData.ownerIdNumber,
        nationalAddress: formData.ownerNationalAddress,
        type: 'owner',
        source: 'public_form',
        status: 'new',
        createdAt: new Date().toISOString(),
        tabs: [{
          id: `tab_${Date.now()}`,
          name: 'عرض عقاري',
          type: 'property_offer',
          data: submissionData,
          createdAt: new Date().toISOString(),
        }],
      };

      const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingCustomer = customers.find((c: any) => c.phone === formData.ownerPhone);
      
      if (existingCustomer) {
        existingCustomer.tabs = existingCustomer.tabs || [];
        existingCustomer.tabs.push(customerData.tabs[0]);
        localStorage.setItem('crm_customers', JSON.stringify(customers));
      } else {
        customers.push(customerData);
        localStorage.setItem('crm_customers', JSON.stringify(customers));
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
