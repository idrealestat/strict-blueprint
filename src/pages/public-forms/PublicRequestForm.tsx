/**
 * PublicRequestForm.tsx
 * صفحة إرسال طلب عقار من العميل
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, CheckCircle, Search, User, Phone, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';

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

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب"];
const purposes = ["للشراء", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف"];

interface FormData {
  clientName: string;
  clientPhone: string;
  clientIdNumber: string;
  propertyType: string;
  purpose: string;
  preferredCity: string;
  preferredDistricts: string;
  minArea: string;
  maxArea: string;
  minBudget: string;
  maxBudget: string;
  bedrooms: string;
  additionalRequirements: string;
  urgency: string;
  agreeToTerms: boolean;
}

export default function PublicRequestForm() {
  const { brokerId } = useParams<{ brokerId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const broker = getMockBroker(brokerId || '1');

  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    clientIdNumber: '',
    propertyType: '',
    purpose: '',
    preferredCity: '',
    preferredDistricts: '',
    minArea: '',
    maxArea: '',
    minBudget: '',
    maxBudget: '',
    bedrooms: '',
    additionalRequirements: '',
    urgency: 'normal',
    agreeToTerms: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientPhone || !formData.propertyType || !formData.purpose) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        id: `request_${Date.now()}`,
        type: 'property_request',
        brokerId: broker.id,
        brokerName: broker.name,
        ...formData,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      // Save submission
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // Create notification
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'new_request',
        title: 'طلب عقار جديد',
        message: `تم استلام طلب عقار جديد من ${formData.clientName}`,
        data: submissionData,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      const notifications = JSON.parse(localStorage.getItem('broker_notifications') || '[]');
      notifications.unshift(notification);
      localStorage.setItem('broker_notifications', JSON.stringify(notifications));

      // Add/update customer in CRM
      const customerData = {
        id: `cust_${Date.now()}`,
        name: formData.clientName,
        phone: formData.clientPhone,
        idNumber: formData.clientIdNumber,
        type: 'buyer',
        source: 'public_form',
        status: 'new',
        createdAt: new Date().toISOString(),
        tabs: [{
          id: `tab_${Date.now()}`,
          name: 'طلب عقار',
          type: 'property_request',
          data: submissionData,
          createdAt: new Date().toISOString(),
        }],
      };

      const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingCustomer = customers.find((c: any) => c.phone === formData.clientPhone);
      
      if (existingCustomer) {
        existingCustomer.tabs = existingCustomer.tabs || [];
        existingCustomer.tabs.push(customerData.tabs[0]);
        localStorage.setItem('crm_customers', JSON.stringify(customers));
      } else {
        customers.push(customerData);
        localStorage.setItem('crm_customers', JSON.stringify(customers));
      }

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
        {/* معلومات العميل */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <User className="w-5 h-5 text-[#D4AF37]" />
            معلوماتك
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="أدخل اسمك الكامل"
              />
            </div>
            <div>
              <Label>رقم الجوال *</Label>
              <Input
                value={formData.clientPhone}
                onChange={(e) => updateField('clientPhone', e.target.value)}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div className="md:col-span-2">
              <Label>رقم الهوية (اختياري)</Label>
              <Input
                value={formData.clientIdNumber}
                onChange={(e) => updateField('clientIdNumber', e.target.value)}
                placeholder="رقم الهوية الوطنية"
              />
            </div>
          </div>
        </div>

        {/* متطلبات العقار */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Search className="w-5 h-5 text-[#D4AF37]" />
            متطلبات العقار المطلوب
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
                placeholder="حي النخيل، حي الياسمين..."
              />
            </div>
          </div>
        </div>

        {/* المساحة والميزانية */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            المساحة والميزانية
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>الحد الأدنى للمساحة</Label>
              <Input
                type="number"
                value={formData.minArea}
                onChange={(e) => updateField('minArea', e.target.value)}
                placeholder="م²"
              />
            </div>
            <div>
              <Label>الحد الأقصى للمساحة</Label>
              <Input
                type="number"
                value={formData.maxArea}
                onChange={(e) => updateField('maxArea', e.target.value)}
                placeholder="م²"
              />
            </div>
            <div>
              <Label>الحد الأدنى للميزانية</Label>
              <Input
                type="number"
                value={formData.minBudget}
                onChange={(e) => updateField('minBudget', e.target.value)}
                placeholder="ريال"
              />
            </div>
            <div>
              <Label>الحد الأقصى للميزانية</Label>
              <Input
                type="number"
                value={formData.maxBudget}
                onChange={(e) => updateField('maxBudget', e.target.value)}
                placeholder="ريال"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>عدد الغرف المطلوب</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                placeholder="عدد غرف النوم"
              />
            </div>
            <div>
              <Label>درجة الاستعجال</Label>
              <Select value={formData.urgency} onValueChange={(v) => updateField('urgency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">عاجل جداً</SelectItem>
                  <SelectItem value="soon">قريباً (خلال شهر)</SelectItem>
                  <SelectItem value="normal">عادي (خلال 3 أشهر)</SelectItem>
                  <SelectItem value="exploring">أتصفح فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>متطلبات إضافية</Label>
            <Textarea
              value={formData.additionalRequirements}
              onChange={(e) => updateField('additionalRequirements', e.target.value)}
              placeholder="أي متطلبات خاصة مثل: مسبح، حديقة، قريب من مدرسة..."
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
              إرسال الطلب
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
