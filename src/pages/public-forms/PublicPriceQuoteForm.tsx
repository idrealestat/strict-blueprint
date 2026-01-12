/**
 * PublicPriceQuoteForm.tsx
 * صفحة إرسال طلب عرض سعر من العميل
 * يحفظ البيانات في قاعدة البيانات مع الإشعارات و Push Notifications
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, CheckCircle, FileText, User, Home, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';
import { supabase } from '@/integrations/supabase/client';
import { triggerQuoteNotification } from '@/utils/notificationTriggers';
import { markAsNew } from '@/hooks/usePublishedAdsManager';

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

const serviceTypes = [
  "تقييم عقار",
  "بيع عقار",
  "شراء عقار",
  "تأجير عقار",
  "إدارة أملاك",
  "استشارة عقارية",
  "تسويق عقاري",
  "خدمات قانونية عقارية",
];

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "محل تجاري", "مكتب"];

interface FormData {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceType: string;
  propertyType: string;
  propertyLocation: string;
  propertyArea: string;
  estimatedValue: string;
  details: string;
  preferredContactTime: string;
  agreeToTerms: boolean;
}

export default function PublicPriceQuoteForm() {
  const { brokerId, slug } = useParams<{ brokerId?: string; slug?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [brokerUserId, setBrokerUserId] = useState<string | null>(null);
  const [fetchedBroker, setFetchedBroker] = useState<BrokerInfo | null>(null);
  
  // جلب بيانات الوسيط من business_card إذا كان slug موجود
  useEffect(() => {
    const fetchBrokerData = async () => {
      const identifier = slug || brokerId;
      if (identifier) {
        const { data } = await supabase
          .from('business_cards')
          .select('user_id, data')
          .eq('slug', identifier)
          .eq('published', true)
          .single();
        
        if (data) {
          setBrokerUserId(data.user_id);
          const cardData = data.data as Record<string, any>;
          setFetchedBroker({
            id: identifier,
            name: cardData?.name || 'وسيط عقاري',
            company: cardData?.company || '',
            phone: cardData?.phone || '',
            email: cardData?.email || '',
            location: cardData?.city || 'الرياض',
            licenseNumber: cardData?.falLicenseNumber || '',
            rating: 4.8,
            verified: true,
          });
        }
      }
    };
    fetchBrokerData();
  }, [brokerId, slug]);
  
  const broker = fetchedBroker || getMockBroker(brokerId || slug || '1');

  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceType: '',
    propertyType: '',
    propertyLocation: '',
    propertyArea: '',
    estimatedValue: '',
    details: '',
    preferredContactTime: '',
    agreeToTerms: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientPhone || !formData.serviceType) {
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
        id: `quote_${Date.now()}`,
        type: 'price_quote',
        brokerId: broker.id,
        brokerName: broker.name,
        ...formData,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      // حفظ في قاعدة البيانات إذا كان الوسيط موجود
      if (brokerUserId) {
        // البحث عن العميل برقم الجوال
        const { data: existingCustomer } = await supabase
          .from('crm_customers')
          .select('*')
          .eq('user_id', brokerUserId)
          .or(`phone.eq.${formData.clientPhone}`)
          .maybeSingle();

        let customerId: string;

        if (existingCustomer) {
          customerId = existingCustomer.id;
          const currentMetadata = (existingCustomer.metadata as Record<string, any>) || {};
          const existingQuotes = currentMetadata.price_quotes || [];
          
          await supabase
            .from('crm_customers')
            .update({
              last_contact: new Date().toISOString().split('T')[0],
              metadata: {
                ...currentMetadata,
                price_quotes: [...existingQuotes, submissionData],
                hasUnreadQuote: true,
                lastQuoteAt: new Date().toISOString(),
              },
            })
            .eq('id', customerId);
        } else {
          const { data: newCustomer } = await supabase
            .from('crm_customers')
            .insert([{
              user_id: brokerUserId,
              name: formData.clientName,
              phone: formData.clientPhone,
              email: formData.clientEmail || null,
              status: 'جديد',
              priority: 'عادي',
              source: 'نموذج عرض سعر',
              last_contact: new Date().toISOString().split('T')[0],
              metadata: {
                price_quotes: [submissionData],
                hasUnreadQuote: true,
                isNewCard: true,
                lastQuoteAt: new Date().toISOString(),
              } as Record<string, any>,
            }])
            .select()
            .single();

          customerId = newCustomer?.id || '';
        }

        // إرسال إشعار مع Push Notification
        await triggerQuoteNotification(brokerUserId, {
          clientName: formData.clientName,
          serviceType: formData.serviceType,
          propertyType: formData.propertyType,
          quoteId: submissionData.id,
        });

        if (customerId) {
          markAsNew('customer', customerId);
        }
      }

      // حفظ نسخة محلية احتياطية
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      setIsSubmitted(true);
      toast.success('تم إرسال طلب عرض السعر بنجاح');
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PublicFormLayout broker={broker} title="عرض سعر">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الإرسال بنجاح!</h3>
          <p className="text-gray-600 mb-6">
            شكراً لك، سيتم إرسال عرض السعر لك قريباً
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
    <PublicFormLayout broker={broker} title="عرض سعر">
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
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <Label>وقت التواصل المفضل</Label>
              <Select value={formData.preferredContactTime} onValueChange={(v) => updateField('preferredContactTime', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوقت المناسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">صباحاً (8-12)</SelectItem>
                  <SelectItem value="afternoon">ظهراً (12-4)</SelectItem>
                  <SelectItem value="evening">مساءً (4-8)</SelectItem>
                  <SelectItem value="anytime">أي وقت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* نوع الخدمة */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Calculator className="w-5 h-5 text-[#D4AF37]" />
            نوع الخدمة المطلوبة
          </h3>

          <div>
            <Label>نوع الخدمة *</Label>
            <Select value={formData.serviceType} onValueChange={(v) => updateField('serviceType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الخدمة" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* معلومات العقار */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Home className="w-5 h-5 text-[#D4AF37]" />
            معلومات العقار (إن وجد)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>نوع العقار</Label>
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
              <Label>موقع العقار</Label>
              <Input
                value={formData.propertyLocation}
                onChange={(e) => updateField('propertyLocation', e.target.value)}
                placeholder="المدينة - الحي"
              />
            </div>
            <div>
              <Label>المساحة (م²)</Label>
              <Input
                type="number"
                value={formData.propertyArea}
                onChange={(e) => updateField('propertyArea', e.target.value)}
                placeholder="المساحة التقريبية"
              />
            </div>
            <div>
              <Label>القيمة التقديرية</Label>
              <Input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => updateField('estimatedValue', e.target.value)}
                placeholder="بالريال السعودي"
              />
            </div>
          </div>

          <div>
            <Label>تفاصيل إضافية</Label>
            <Textarea
              value={formData.details}
              onChange={(e) => updateField('details', e.target.value)}
              placeholder="اشرح طلبك بالتفصيل..."
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
              إرسال طلب عرض السعر
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
