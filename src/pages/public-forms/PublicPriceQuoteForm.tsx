/**
 * PublicPriceQuoteForm.tsx
 * صفحة إرسال طلب عرض سعر من العميل
 * يحفظ البيانات في قاعدة البيانات مع الإشعارات و Push Notifications
 * تصميم موحد مع باقي الصفحات العامة
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, CheckCircle, FileText, User, Home, Calculator, Clock } from 'lucide-react';
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
  profileImage: '',
  coverImage: '',
  logoImage: '',
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
            name: cardData?.name || cardData?.userName || 'وسيط عقاري',
            company: cardData?.company || cardData?.companyName || '',
            phone: cardData?.phone || cardData?.primaryPhone || '',
            email: cardData?.email || '',
            location: cardData?.city || cardData?.location || 'الرياض',
            licenseNumber: cardData?.falLicenseNumber || cardData?.falLicense || '',
            rating: 4.8,
            verified: true,
            profileImage: cardData?.profileImage || '',
            coverImage: cardData?.coverImage || '',
            logoImage: cardData?.logoImage || '',
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

      // إرسال البيانات للخلفية (يعمل حتى لو العميل غير مسجل دخول)
      const identifier = slug || brokerId;
      const { data: submitResult, error: submitError } = await supabase.functions.invoke('public-form-submit', {
        body: {
          slug: identifier,
          formType: 'quote',
          data: submissionData,
        },
      });

      if (submitError) {
        console.error('Public quote submit error:', submitError);
      }

      const customerId = (submitResult as any)?.customerId as string | undefined;

      // حفظ نسخة محلية احتياطية
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // تحديث localStorage للعملاء للتوافق
      const localCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingLocalCustomer = localCustomers.find((c: any) => c.phone === formData.clientPhone);
      if (!existingLocalCustomer) {
        localCustomers.push({
          id: customerId || `cust_${Date.now()}`,
          name: formData.clientName,
          phone: formData.clientPhone,
          email: formData.clientEmail,
          type: 'buyer',
          source: 'public_form',
          status: 'new',
          isNewCard: true,
          createdAt: new Date().toISOString(),
          priceQuotes: [submissionData],
        });
      } else {
        existingLocalCustomer.priceQuotes = existingLocalCustomer.priceQuotes || [];
        existingLocalCustomer.priceQuotes.push(submissionData);
      }
      localStorage.setItem('crm_customers', JSON.stringify(localCustomers));

      // إطلاق حدث UI محلي
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: {
          title: '💰 طلب عرض سعر جديد',
          message: `تم استلام طلب عرض سعر من ${formData.clientName}`,
          type: 'success',
          category: 'customer',
          isPulsing: true,
        }
      }));

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
        {/* عنوان المستند */}
        <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
          <FileText className="w-8 h-8 text-[#D4AF37] mx-auto mb-1" />
          <h2 className="text-xl font-bold text-[#01411C]">طلب عرض سعر</h2>
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
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
                className="bg-white"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                وقت التواصل المفضل
              </Label>
              <Select value={formData.preferredContactTime} onValueChange={(v) => updateField('preferredContactTime', v)}>
                <SelectTrigger className="bg-white">
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
        </Section>

        {/* القسم 2: نوع الخدمة */}
        <Section title="نوع الخدمة المطلوبة" icon={<Calculator className="w-5 h-5" />} color="blue">
          <div>
            <Label>نوع الخدمة *</Label>
            <Select value={formData.serviceType} onValueChange={(v) => updateField('serviceType', v)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="اختر نوع الخدمة" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* القسم 3: معلومات العقار */}
        <Section title="معلومات العقار (إن وجد)" icon={<Home className="w-5 h-5" />} color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>نوع العقار</Label>
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
              <Label>موقع العقار</Label>
              <Input
                value={formData.propertyLocation}
                onChange={(e) => updateField('propertyLocation', e.target.value)}
                placeholder="المدينة - الحي"
                className="bg-white"
              />
            </div>
            <div>
              <Label>المساحة (م²)</Label>
              <Input
                type="number"
                value={formData.propertyArea}
                onChange={(e) => updateField('propertyArea', e.target.value)}
                placeholder="المساحة التقريبية"
                className="bg-white"
              />
            </div>
            <div>
              <Label>القيمة التقديرية</Label>
              <Input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => updateField('estimatedValue', e.target.value)}
                placeholder="بالريال السعودي"
                className="bg-white"
              />
            </div>
          </div>
        </Section>

        {/* القسم 4: تفاصيل إضافية */}
        <Section title="تفاصيل إضافية" icon={<FileText className="w-5 h-5" />} color="purple">
          <div>
            <Label>اشرح طلبك بالتفصيل</Label>
            <Textarea
              value={formData.details}
              onChange={(e) => updateField('details', e.target.value)}
              placeholder="اكتب أي تفاصيل إضافية تود مشاركتها..."
              rows={4}
              className="bg-white"
            />
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
              إرسال طلب عرض السعر
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
