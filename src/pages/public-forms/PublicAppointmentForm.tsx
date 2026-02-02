/**
 * PublicAppointmentForm.tsx
 * صفحة إنشاء موعد من العميل
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
import { Send, Loader2, CheckCircle, Calendar, User, Clock, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import PublicFormLayout, { BrokerInfo } from './PublicFormLayout';
import { supabase } from '@/integrations/supabase/client';
import { useEventTracker } from '@/hooks/useEventTracker';
import { createNotification } from '@/utils/notificationTriggers';
import { markAsNew } from '@/hooks/usePublishedAdsManager';

// ⚠️ محمي: لا يُسمح بإعادة البيانات الوهمية - يجب استخدام البيانات الحقيقية فقط من قاعدة البيانات

const appointmentTypes = [
  "معاينة عقار",
  "استشارة عقارية",
  "توقيع عقد",
  "تسليم مفاتيح",
  "اجتماع مبدئي",
  "متابعة صفقة",
  "زيارة ميدانية",
  "أخرى",
];

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
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
  clientName: string;
  clientPhone: string;
  appointmentType: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate: string;
  alternativeTime: string;
  meetingLocation: string;
  notes: string;
  agreeToTerms: boolean;
}

interface PublicAppointmentFormProps {
  brokerInfo?: BrokerInfo;
}

export default function PublicAppointmentForm({ brokerInfo }: PublicAppointmentFormProps = {}) {
  const { brokerId, slug } = useParams<{ brokerId?: string; slug?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [brokerUserId, setBrokerUserId] = useState<string | null>(null);
  const [broker, setBroker] = useState<BrokerInfo | null>(brokerInfo || null);
  const [isLoadingBroker, setIsLoadingBroker] = useState(!brokerInfo);
  const { track, trackPageView } = useEventTracker();
  
  // جلب بيانات الوسيط من business_card إذا كان slug موجود ولم يتم تمرير brokerInfo
  useEffect(() => {
    const fetchBrokerData = async () => {
      if (brokerInfo) {
        setBroker(brokerInfo);
        setBrokerUserId(brokerInfo.id);
        setIsLoadingBroker(false);
        return;
      }
      
      if (!slug && !brokerId) {
        setIsLoadingBroker(false);
        return;
      }
      
      setIsLoadingBroker(true);
      try {
        const slugValue = slug || brokerId;
        console.log('[PublicAppointmentForm] Fetching broker data for slug:', slugValue);
        const { data, error } = await supabase
          .from('business_cards')
          .select('user_id, id, data')
          .eq('slug', slugValue)
          .eq('published', true)
          .maybeSingle();
        
        if (error) {
          console.error('[PublicAppointmentForm] Database error:', error);
        }
        
        console.log('[PublicAppointmentForm] Result:', { data, error });
        
        if (data) {
          setBrokerUserId(data.user_id);
          // Track page view
          trackPageView('calendar', data.id, 'public_web');
          
          // استخراج بيانات الوسيط من البطاقة مع الصور
          const cardData = data.data as Record<string, any>;
          setBroker({
            id: data.id,
            name: cardData?.userName || cardData?.name || 'وسيط عقاري',
            company: cardData?.companyName || cardData?.company || 'شركة عقارية',
            phone: cardData?.primaryPhone || cardData?.phone || '',
            email: cardData?.email || '',
            location: cardData?.location || cardData?.officeAddress || cardData?.city || '',
            licenseNumber: cardData?.falLicense || cardData?.falLicenseNumber || '',
            rating: cardData?.rating || 4.5,
            verified: cardData?.verified || true,
            profileImage: cardData?.profileImage || '',
            coverImage: cardData?.coverImage || '',
            logoImage: cardData?.logoImage || '',
          });
        }
      } catch (error) {
        console.error('Error loading broker data:', error);
      } finally {
        setIsLoadingBroker(false);
      }
    };
    fetchBrokerData();
  }, [slug, brokerId, brokerInfo, trackPageView]);

  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    appointmentType: '',
    preferredDate: '',
    preferredTime: '',
    alternativeDate: '',
    alternativeTime: '',
    meetingLocation: '',
    notes: '',
    agreeToTerms: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientPhone || !formData.appointmentType || !formData.preferredDate || !formData.preferredTime) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentId = `apt_${Date.now()}`;
      const submissionData = {
        id: appointmentId,
        type: 'appointment',
        brokerId: broker.id,
        brokerName: broker.name,
        ...formData,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      // 1. الحصول على معرف الوسيط من business_cards
      let actualBrokerUserId = brokerUserId;
      if (!actualBrokerUserId && slug) {
        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('user_id')
          .eq('slug', slug)
          .eq('published', true)
          .single();
        actualBrokerUserId = businessCard?.user_id || null;
      }

      if (actualBrokerUserId) {
        // 2. حفظ الموعد في جدول calendar_appointments
        const { data: newAppointment, error: appointmentError } = await supabase
          .from('calendar_appointments')
          .insert([{
            user_id: actualBrokerUserId,
            title: `${formData.appointmentType} - ${formData.clientName}`,
            customer_name: formData.clientName,
            customer_phone: formData.clientPhone,
            appointment_date: formData.preferredDate,
            appointment_time: formData.preferredTime,
            appointment_type: formData.appointmentType,
            location: formData.meetingLocation || null,
            notes: formData.notes || null,
            status: 'pending',
            reminder: true,
            reminder_time: 30,
          }])
          .select()
          .single();

        if (appointmentError) {
          console.error('Error creating appointment:', appointmentError);
        }

        const dbAppointmentId = newAppointment?.id || appointmentId;

        // 3. البحث عن العميل أو إنشاء بطاقة جديدة
        const { data: existingCustomer } = await supabase
          .from('crm_customers')
          .select('*')
          .eq('user_id', actualBrokerUserId)
          .or(`phone.eq.${formData.clientPhone},whatsapp.eq.${formData.clientPhone}`)
          .maybeSingle();

        let customerId: string;
        let isNewCustomer = false;

        if (existingCustomer) {
          customerId = existingCustomer.id;
          
          const currentMetadata = (existingCustomer.metadata as Record<string, any>) || {};
          const existingAppointments = currentMetadata.appointments || [];
          
          await supabase
            .from('crm_customers')
            .update({
              last_contact: new Date().toISOString().split('T')[0],
              metadata: {
                ...currentMetadata,
                appointments: [...existingAppointments, submissionData],
                hasUnreadAppointment: true,
                lastAppointmentAt: new Date().toISOString(),
              },
            })
            .eq('id', customerId);
        } else {
          isNewCustomer = true;
          
          const { data: newCustomer } = await supabase
            .from('crm_customers')
            .insert([{
              user_id: actualBrokerUserId,
              name: formData.clientName,
              phone: formData.clientPhone,
              status: 'جديد',
              priority: 'عادي',
              source: 'نموذج موعد',
              last_contact: new Date().toISOString().split('T')[0],
              metadata: {
                appointments: [submissionData],
                hasUnreadAppointment: true,
                isNewCard: true,
                lastAppointmentAt: new Date().toISOString(),
              } as Record<string, any>,
            }])
            .select()
            .single();

          customerId = newCustomer?.id || '';
        }

        // 4. إنشاء إشعار في قاعدة البيانات مع Push Notification
        await createNotification({
          userId: actualBrokerUserId,
          title: '📅 موعد جديد',
          message: `${formData.clientName} طلب موعد ${formData.appointmentType} - ${formData.preferredDate} ${formData.preferredTime}`,
          notificationType: 'calendar',
          category: 'appointment',
          priority: 'high',
          relatedEntityType: 'calendar',
          relatedEntityId: dbAppointmentId,
          actionUrl: '/app/calendar',
          metadata: {
            customerName: formData.clientName,
            customerPhone: formData.clientPhone,
            appointmentType: formData.appointmentType,
            date: formData.preferredDate,
            time: formData.preferredTime,
            customerId: customerId,
            isNewCustomer,
            isPulsing: true,
          },
          sendPush: true,
          pushData: {
            type: 'new_appointment',
            customerName: formData.clientName,
            appointmentType: formData.appointmentType,
          },
        });

        // 5. تتبع الدوائر النابضة
        markAsNew('offer', dbAppointmentId);
        if (customerId) {
          markAsNew('customer', customerId);
        }
        markAsNew('tab', 'calendar');
      }

      // 6. حفظ نسخة محلية احتياطية
      const existingSubmissions = JSON.parse(localStorage.getItem('client_submissions') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('client_submissions', JSON.stringify(existingSubmissions));

      // Track event
      track({
        eventName: 'appointment_create',
        channel: 'public_web',
        entityType: 'calendar',
        entityId: appointmentId,
        metadata: {
          customerName: formData.clientName,
          appointmentType: formData.appointmentType,
          date: formData.preferredDate,
          time: formData.preferredTime,
        },
      });

      setIsSubmitted(true);
      toast.success('تم إرسال طلب الموعد بنجاح');
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚠️ محمي: عرض شاشة تحميل حتى جلب بيانات الوسيط الحقيقية
  if (isLoadingBroker || !broker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C] flex items-center justify-center" dir="rtl">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#D4AF37]" />
          <p className="text-lg">جاري تحميل بيانات الوسيط...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <PublicFormLayout broker={broker} title="جدولة موعد">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال الطلب بنجاح!</h3>
          <p className="text-gray-600 mb-2">
            شكراً لك، تم استلام طلب الموعد
          </p>
          <p className="text-sm text-gray-500 mb-6">
            التاريخ المطلوب: {formData.preferredDate} الساعة {formData.preferredTime}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            سيتم التواصل معك لتأكيد الموعد
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
    <PublicFormLayout broker={broker} title="جدولة موعد">
      <div className="p-6 space-y-6">
        {/* عنوان المستند */}
        <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
          <Calendar className="w-8 h-8 text-amber-600 mx-auto mb-1" />
          <h2 className="text-xl font-bold text-[#01411C]">جدولة موعد</h2>
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
          </div>
        </Section>

        {/* القسم 2: تفاصيل الموعد */}
        <Section title="تفاصيل الموعد" icon={<Calendar className="w-5 h-5" />} color="blue">
          <div className="space-y-4">
            <div>
              <Label>نوع الموعد *</Label>
              <Select value={formData.appointmentType} onValueChange={(v) => updateField('appointmentType', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="اختر نوع الموعد" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>التاريخ المفضل *</Label>
                <Input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => updateField('preferredDate', e.target.value)}
                  min={getMinDate()}
                  className="bg-white"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  الوقت المفضل *
                </Label>
                <Select value={formData.preferredTime} onValueChange={(v) => updateField('preferredTime', v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="اختر الوقت" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Section>

        {/* القسم 3: موعد بديل */}
        <Section title="موعد بديل (اختياري)" icon={<Clock className="w-5 h-5" />} color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>تاريخ بديل</Label>
              <Input
                type="date"
                value={formData.alternativeDate}
                onChange={(e) => updateField('alternativeDate', e.target.value)}
                min={getMinDate()}
                className="bg-white"
              />
            </div>
            <div>
              <Label>وقت بديل</Label>
              <Select value={formData.alternativeTime} onValueChange={(v) => updateField('alternativeTime', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="اختر الوقت" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* القسم 4: مكان الاجتماع */}
        <Section title="مكان الاجتماع" icon={<MapPin className="w-5 h-5" />} color="purple">
          <div>
            <Label>مكان الاجتماع المفضل</Label>
            <Input
              value={formData.meetingLocation}
              onChange={(e) => updateField('meetingLocation', e.target.value)}
              placeholder="المكتب، موقع العقار، أو حدد مكاناً آخر..."
              className="bg-white"
            />
          </div>
        </Section>

        {/* القسم 5: ملاحظات */}
        <Section title="ملاحظات إضافية" icon={<FileText className="w-5 h-5" />} color="cyan">
          <div>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="أي ملاحظات أو تفاصيل إضافية تود مشاركتها..."
              rows={3}
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
              إرسال طلب الموعد
            </>
          )}
        </Button>
      </div>
    </PublicFormLayout>
  );
}
