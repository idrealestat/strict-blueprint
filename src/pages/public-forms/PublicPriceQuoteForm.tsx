/**
 * PublicPriceQuoteForm.tsx
 * صفحة تقديم عرض سعر من المشتري/المستأجر للوسيط
 * العميل يقدم سعره المقترح على عقار يعرضه الوسيط
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, CheckCircle, FileText, User, Home, DollarSign, CreditCard, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';
import { supabase } from '@/integrations/supabase/client';

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

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "محل تجاري", "مكتب"];
const purposeTypes = ["شراء", "إيجار"];
const paymentMethods = [
  { id: 'cash', label: 'نقداً' },
  { id: 'finance', label: 'تمويل عقاري' },
  { id: 'installment', label: 'تقسيط' },
];

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
  // معلومات العميل (المشتري/المستأجر)
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  // معلومات العقار المطلوب
  propertyType: string;
  purpose: string;
  propertyLocation: string;
  propertyTitle: string;
  propertyLink: string; // رابط العقار إن وجد
  // عرض السعر
  offeredPrice: string;
  paymentMethod: string;
  // رسالة للوسيط
  message: string;
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
    propertyType: '',
    purpose: 'شراء',
    propertyLocation: '',
    propertyTitle: '',
    propertyLink: '',
    offeredPrice: '',
    paymentMethod: 'cash',
    message: '',
    agreeToTerms: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientPhone) {
      toast.error('يرجى إدخال اسمك ورقم جوالك');
      return;
    }
    if (!formData.offeredPrice) {
      toast.error('يرجى إدخال السعر المقترح');
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
        // معلومات العميل (المشتري/المستأجر)
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        // معلومات العقار
        propertyType: formData.propertyType,
        purpose: formData.purpose,
        propertyLocation: formData.propertyLocation,
        propertyTitle: formData.propertyTitle || `${formData.propertyType || 'عقار'} - ${formData.propertyLocation || 'غير محدد'}`,
        propertyLink: formData.propertyLink || '',
        // عرض السعر
        offeredPrice: parseFloat(formData.offeredPrice) || 0,
        paymentMethod: formData.paymentMethod,
        // رسالة للوسيط
        message: formData.message,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      // إرسال البيانات للخلفية
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
        toast.error('حدث خطأ أثناء الإرسال');
        setIsSubmitting(false);
        return;
      }

      const customerId = (submitResult as any)?.customerId as string | undefined;

      // حفظ نسخة محلية احتياطية
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // تحديث localStorage للعملاء للتوافق مع CRM
      const localCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const existingLocalCustomer = localCustomers.find((c: any) => c.phone === formData.clientPhone);
      if (!existingLocalCustomer) {
        localCustomers.push({
          id: customerId || `cust_${Date.now()}`,
          name: formData.clientName,
          phone: formData.clientPhone,
          email: formData.clientEmail,
          type: formData.purpose === 'إيجار' ? 'renter' : 'buyer',
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
          title: '💰 عرض سعر جديد',
          message: `تم استلام عرض سعر من ${formData.clientName} بقيمة ${parseFloat(formData.offeredPrice).toLocaleString()} ريال`,
          type: 'success',
          category: 'customer',
          isPulsing: true,
        }
      }));

      setIsSubmitted(true);
      toast.success('تم إرسال عرض السعر بنجاح');
    } catch (error) {
      console.error('Error submitting quote:', error);
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
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال عرض السعر!</h3>
          <p className="text-gray-600 mb-2">
            شكراً لك، تم استلام عرضك بنجاح
          </p>
          <p className="text-sm text-gray-500 mb-6">
            سيقوم الوسيط بمراجعة عرضك والرد عليك قريباً
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 font-bold">السعر المقترح: {parseFloat(formData.offeredPrice).toLocaleString()} ريال</p>
            <p className="text-amber-600 text-sm">طريقة الدفع: {paymentMethods.find(m => m.id === formData.paymentMethod)?.label}</p>
          </div>
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
          <DollarSign className="w-8 h-8 text-[#D4AF37] mx-auto mb-1" />
          <h2 className="text-xl font-bold text-[#01411C]">تقديم عرض سعر</h2>
          <p className="text-sm text-gray-600 mt-1">قدم سعرك المقترح على العقار</p>
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
            <div className="md:col-span-2">
              <Label>البريد الإلكتروني (اختياري)</Label>
              <Input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
                className="bg-white"
              />
            </div>
          </div>
        </Section>

        {/* القسم 2: معلومات العقار */}
        <Section title="العقار المطلوب" icon={<Home className="w-5 h-5" />} color="blue">
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
              <Label>الغرض</Label>
              <Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="اختر الغرض" />
                </SelectTrigger>
                <SelectContent>
                  {purposeTypes.map(type => (
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
              <Label>اسم/وصف العقار</Label>
              <Input
                value={formData.propertyTitle}
                onChange={(e) => updateField('propertyTitle', e.target.value)}
                placeholder="مثال: فيلا حي النرجس"
                className="bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="flex items-center gap-2">
                🔗 رابط العقار (إن وجد)
              </Label>
              <Input
                value={formData.propertyLink}
                onChange={(e) => updateField('propertyLink', e.target.value)}
                placeholder="https://example.com/property/123"
                dir="ltr"
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                إذا كان لديك رابط صفحة العقار، الصقه هنا
              </p>
            </div>
          </div>
        </Section>

        {/* القسم 3: عرض السعر */}
        <Section title="عرض السعر الخاص بك" icon={<DollarSign className="w-5 h-5" />} color="amber">
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-bold">السعر المقترح (ريال سعودي) *</Label>
              <div className="relative mt-2">
                <Input
                  type="number"
                  value={formData.offeredPrice}
                  onChange={(e) => updateField('offeredPrice', e.target.value)}
                  placeholder="أدخل السعر الذي تقترحه"
                  className="bg-white text-xl font-bold h-14 pr-4 pl-16"
                  dir="ltr"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">ريال</span>
              </div>
              {formData.offeredPrice && (
                <p className="text-sm text-green-600 mt-2 font-bold">
                  💰 {parseFloat(formData.offeredPrice).toLocaleString()} ريال سعودي
                </p>
              )}
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                طريقة الدفع المفضلة
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => updateField('paymentMethod', method.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.paymentMethod === method.id
                        ? 'border-[#01411C] bg-[#01411C]/10 text-[#01411C] font-bold'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* القسم 4: رسالة للوسيط */}
        <Section title="رسالة للوسيط" icon={<MessageSquare className="w-5 h-5" />} color="purple">
          <div>
            <Label>اكتب رسالتك أو ملاحظاتك (اختياري)</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="مثال: أنا جاد في الشراء ومستعد للتفاوض..."
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
            أوافق على أن هذا العرض غير ملزم وقابل للتفاوض
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
              إرسال عرض السعر
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
