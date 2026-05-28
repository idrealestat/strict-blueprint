/**
 * SlugAppointmentApprovalBroker.tsx
 * صفحة تأكيد حضور الوسيط للموعد
 * wasataai.com/:slug/appointmentapproval/broker/:appointmentId
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, X, Phone, Calendar, Clock, User, MapPin, FileText, Loader2, AlertCircle, Home, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getFullUrl } from '@/utils/slugify';
import PublicFormLayout, { BrokerInfo } from '@/pages/public-forms/PublicFormLayout';

interface AppointmentData {
  id: string;
  title: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  location?: string;
  appointment_type: string;
  notes?: string;
  status: string;
  property_title?: string;
  property_id?: string;
  user_id?: string;
}

export default function SlugAppointmentApprovalBroker() {
  const { slug, appointmentId } = useParams<{ slug: string; appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState<'accepted' | 'rejected' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // جلب بيانات البطاقة من الـ slug
        const { data: cardData, error: cardError } = await supabase
          .from('public_business_cards')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .maybeSingle();

        if (cardError || !cardData) {
          console.error('Card not found:', cardError);
          setIsLoading(false);
          return;
        }

        const card = cardData as any;
        const cardJson = card.data as Record<string, any>;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_name, phone')
          .eq('user_id', card.user_id)
          .maybeSingle();
        
        setBroker({
          id: card.user_id,
          name: cardJson?.name || profile?.full_name || 'وسيط',
          company: cardJson?.companyName || profile?.company_name || '',
          phone: cardJson?.primaryPhone || card.phone || profile?.phone || '',
          email: card.email || '',
          location: cardJson?.location || '',
          licenseNumber: card.fal_license_number || '',
          rating: 4.8,
          verified: true,
          profileImage: cardJson?.profileImage,
          coverImage: cardJson?.coverImage,
          logoImage: cardJson?.logoImage,
        });

        // جلب بيانات الموعد
        if (appointmentId) {
          const { data: aptData, error: aptError } = await supabase
            .from('calendar_appointments')
            .select('*')
            .eq('id', appointmentId)
            .maybeSingle();

          if (aptData) {
            setAppointment(aptData);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, appointmentId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeRemaining = () => {
    if (!appointment) return '';
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'حان موعد المعاينة الآن';
    if (diffMins < 60) return `بقي ${diffMins} دقيقة على موعد المعاينة`;
    if (diffMins < 120) return `بقي ساعة تقريباً على موعد المعاينة`;
    
    const hours = Math.floor(diffMins / 60);
    return `بقي ${hours} ساعة على موعد المعاينة`;
  };

  const handleAccept = async () => {
    if (!appointment || !broker) return;
    setIsProcessing(true);
    
    try {
      // تحديث حالة الموعد
      await supabase
        .from('calendar_appointments')
        .update({ status: 'broker_confirmed' })
        .eq('id', appointment.id);

      // إنشاء إشعار
      if (appointment.user_id) {
        await supabase.from('notifications').insert({
          user_id: appointment.user_id,
          title: '✅ تأكيد حضور الوسيط',
          message: `قمت بتأكيد حضورك لموعد ${appointment.title}`,
          notification_type: 'appointment_broker_confirmed',
          related_entity_id: appointment.id,
          related_entity_type: 'appointment',
        });
      }

      // إرسال رسالة للعميل
      const clientConfirmationLink = getFullUrl(`/${slug}/appointmentapproval/customer/${appointment.id}`);
      
      // إرسال SMS للعميل
      if (appointment.customer_phone) {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: appointment.customer_phone,
            message: `السلام عليكم ${appointment.customer_name}، أكد الوسيط ${broker.name} حضوره لموعدكم. يرجى تأكيد حضورك: ${clientConfirmationLink}`,
          }
        });
      }

      setResponse('accepted');
      toast.success('تم تأكيد حضورك وإرسال رسالة للعميل');
      
      // تشغيل صوت النجاح
      playSuccessSound();
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!appointment || !broker) return;
    setIsProcessing(true);
    
    try {
      // تحديث حالة الموعد
      await supabase
        .from('calendar_appointments')
        .update({ status: 'broker_rejected' })
        .eq('id', appointment.id);

      // إنشاء إشعار
      if (appointment.user_id) {
        await supabase.from('notifications').insert({
          user_id: appointment.user_id,
          title: '❌ اعتذار عن الموعد',
          message: `اعتذرت عن موعد ${appointment.title}`,
          notification_type: 'appointment_broker_rejected',
          related_entity_id: appointment.id,
          related_entity_type: 'appointment',
        });
      }

      // إرسال رسالة اعتذار للعميل مع رابط صفحة الاعتذار
      const rescheduleLink = getFullUrl(
        `/${slug}/appointmentapproval/sorry?name=${encodeURIComponent(appointment.customer_name)}&phone=${encodeURIComponent(appointment.customer_phone || '')}&appointmentId=${encodeURIComponent(appointment.id)}`
      );

      if (appointment.customer_phone) {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: appointment.customer_phone,
            message: `السلام عليكم ${appointment.customer_name}، نعتذر عن موعد المعاينة لأسباب طارئة. نرجو تحديد موعد آخر: ${rescheduleLink}`,
          }
        });
      }

      setResponse('rejected');
      toast.info('تم إرسال اعتذار للعميل');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCallClient = () => {
    if (appointment?.customer_phone) {
      window.location.href = `tel:${appointment.customer_phone}`;
    }
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#01411C] to-[#065f41]">
        <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">الصفحة غير موجودة</h2>
            <p className="text-gray-500">الرابط غير صالح أو انتهت صلاحيته</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // شاشة التأكيد
  if (response === 'accepted') {
    return (
      <PublicFormLayout broker={broker} title="تم تأكيد الحضور">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم تأكيد حضورك!</h3>
          <p className="text-gray-600 mb-4">تم إرسال رسالة تأكيد للعميل</p>
          
          {appointment && (
            <Card className="bg-green-50 border-green-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                  <span>|</span>
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{appointment.appointment_time}</span>
                </div>
                <p className="text-sm mt-2">العميل: {appointment.customer_name}</p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleCallClient} className="w-full bg-green-600 hover:bg-green-700">
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالعميل
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  if (response === 'rejected') {
    return (
      <PublicFormLayout broker={broker} title="تم إرسال الاعتذار">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Send className="w-10 h-10 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال الاعتذار</h3>
          <p className="text-gray-600 mb-6">تم إرسال رسالة للعميل مع رابط لتحديد موعد جديد</p>
          
          <Button onClick={handleCallClient} variant="outline" className="w-full">
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالعميل للتوضيح
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout broker={broker} title="تأكيد حضور الموعد">
      <div className="p-6 space-y-6">
        {/* Banner الوقت المتبقي */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-lg">{getTimeRemaining()}</span>
          </div>
          <p className="text-sm opacity-90">موعد مع العميل</p>
        </div>

        {/* تفاصيل الموعد */}
        {appointment && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-sm text-gray-500">التاريخ</p>
                  <p className="font-semibold">{formatDate(appointment.appointment_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-sm text-gray-500">الوقت</p>
                  <p className="font-semibold text-xl">{appointment.appointment_time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b">
                <User className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-sm text-gray-500">العميل</p>
                  <p className="font-semibold">{appointment.customer_name}</p>
                  <p className="text-sm text-gray-500">{appointment.customer_phone}</p>
                </div>
              </div>

              {appointment.location && (
                <div className="flex items-center gap-3 pb-3 border-b">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">المكان</p>
                    <p className="font-semibold">{appointment.location}</p>
                  </div>
                </div>
              )}

              {appointment.property_title && (
                <div className="flex items-center gap-3 pb-3 border-b">
                  <Home className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">العقار</p>
                    <p className="font-semibold">{appointment.property_title}</p>
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#D4AF37] mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">ملاحظات</p>
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ملاحظة */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700 text-center">
            <strong>ملاحظة:</strong> عند تأكيد حضورك سيتم إرسال رسالة للعميل لتأكيد حضوره
          </p>
        </div>

        {/* الأزرار */}
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 ml-2" />
            )}
            تأكيد الحضور
          </Button>

          <Button
            onClick={handleReject}
            disabled={isProcessing}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 py-6 text-lg"
          >
            <X className="w-5 h-5 ml-2" />
            إرسال اعتذار
          </Button>

          <Button
            onClick={handleCallClient}
            variant="outline"
            className="w-full py-6 text-lg"
          >
            <Phone className="w-5 h-5 ml-2" />
            الاتصال بالعميل
          </Button>
        </div>
      </div>
    </PublicFormLayout>
  );
}
