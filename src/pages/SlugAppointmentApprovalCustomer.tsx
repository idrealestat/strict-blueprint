/**
 * SlugAppointmentApprovalCustomer.tsx
 * صفحة تأكيد حضور العميل للموعد
 * wasataai.com/:slug/appointmentapproval/customer/:appointmentId
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, X, Phone, Calendar, Clock, User, MapPin, Home, Loader2, AlertCircle, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PublicFormLayout, { BrokerInfo } from '@/pages/public-forms/PublicFormLayout';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

export default function SlugAppointmentApprovalCustomer() {
  const { slug, appointmentId } = useParams<{ slug: string; appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState<'accepted' | 'rescheduling' | 'rescheduled' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // حالة إعادة الجدولة
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // جلب بيانات البطاقة من الـ slug
        const { data: cardData, error: cardError } = await supabase
          .from('business_cards')
          .select('*, profiles!business_cards_user_id_fkey(full_name, company_name, phone)')
          .eq('slug', slug)
          .eq('published', true)
          .maybeSingle();

        if (cardError || !cardData) {
          console.error('Card not found:', cardError);
          setIsLoading(false);
          return;
        }

        const cardJson = cardData.data as Record<string, any>;
        const profile = (cardData as any).profiles;
        
        setBroker({
          id: cardData.user_id,
          name: cardJson?.name || profile?.full_name || 'وسيط',
          company: cardJson?.companyName || profile?.company_name || '',
          phone: cardJson?.primaryPhone || cardData.phone || profile?.phone || '',
          email: cardData.email || '',
          location: cardJson?.location || '',
          licenseNumber: cardData.fal_license_number || '',
          rating: 4.8,
          verified: true,
          profileImage: cardJson?.profileImage,
          coverImage: cardJson?.coverImage,
          logoImage: cardJson?.logoImage,
        });

        // جلب بيانات الموعد
        if (appointmentId) {
          const { data: aptData } = await supabase
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
    if (!appointment) return;
    setIsProcessing(true);
    
    try {
      // تحديث حالة الموعد
      await supabase
        .from('calendar_appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id);

      // إنشاء إشعار للوسيط
      if (appointment.user_id) {
        await supabase.from('notifications').insert({
          user_id: appointment.user_id,
          title: '✅ تأكيد حضور العميل',
          message: `قام العميل ${appointment.customer_name} بتأكيد حضوره للموعد`,
          notification_type: 'appointment_client_confirmed',
          related_entity_id: appointment.id,
          related_entity_type: 'appointment',
          priority: 'high',
        });
      }

      // تشغيل صوت
      playSound('success');
      
      // إرسال حدث للتطبيق
      window.dispatchEvent(new CustomEvent('appointmentClientConfirmed', { detail: appointment }));

      setResponse('accepted');
      toast.success('تم تأكيد حضورك بنجاح');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setResponse('rescheduling');
  };

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedTime) {
      toast.error('يرجى اختيار التاريخ والوقت');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // إنشاء موعد جديد
      const { data: newApt, error } = await supabase
        .from('calendar_appointments')
        .insert({
          title: appointment.title,
          customer_name: appointment.customer_name,
          customer_phone: appointment.customer_phone,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          location: appointment.location,
          appointment_type: appointment.appointment_type,
          property_id: appointment.property_id,
          property_title: appointment.property_title,
          notes: `موعد بديل - الموعد السابق: ${appointment.appointment_date} ${appointment.appointment_time}`,
          status: 'pending',
          user_id: appointment.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      // تحديث الموعد القديم
      await supabase
        .from('calendar_appointments')
        .update({ status: 'client_rejected' })
        .eq('id', appointment.id);

      // إنشاء إشعار للوسيط
      if (appointment.user_id) {
        await supabase.from('notifications').insert({
          user_id: appointment.user_id,
          title: '📅 موعد جديد من العميل',
          message: `اعتذر العميل ${appointment.customer_name} عن الموعد السابق وأنشأ موعداً جديداً في ${format(selectedDate, 'EEEE d MMMM', { locale: ar })} الساعة ${selectedTime}`,
          notification_type: 'appointment_rescheduled',
          related_entity_id: newApt.id,
          related_entity_type: 'appointment',
          priority: 'high',
          metadata: {
            old_appointment_id: appointment.id,
            is_pulsing: true,
          },
        });
      }

      // تشغيل صوت
      playSound('notification');

      setResponse('rescheduled');
      toast.success('تم إنشاء الموعد الجديد');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCallBroker = () => {
    if (broker?.phone) {
      window.location.href = `tel:${broker.phone}`;
    }
  };

  const playSound = (type: 'success' | 'notification') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      } else {
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      }
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {}
  };

  // التقويم المصغر
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = getDay(start);
    const emptyDays = Array(startDayOfWeek).fill(null);
    return [...emptyDays, ...days];
  }, [currentMonth]);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30'
  ];

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

  // شاشة تأكيد الحضور
  if (response === 'accepted') {
    return (
      <PublicFormLayout broker={broker} title="تم تأكيد الحضور">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">شكراً لك!</h3>
          <p className="text-gray-600 mb-4">تم تأكيد حضورك للموعد</p>
          
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
              </CardContent>
            </Card>
          )}

          <p className="text-sm text-gray-500 mb-6">سيتم تذكيرك قبل الموعد بنصف ساعة</p>

          <Button onClick={handleCallBroker} className="w-full bg-[#01411C] hover:bg-[#065f41]">
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالوسيط
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  // شاشة إعادة الجدولة
  if (response === 'rescheduling') {
    return (
      <PublicFormLayout broker={broker} title="تحديد موعد جديد">
        <div className="p-6 space-y-6">
          <div className="text-center mb-4">
            <Calendar className="w-12 h-12 mx-auto text-[#D4AF37] mb-2" />
            <h3 className="text-lg font-bold">اختر موعداً جديداً يناسبك</h3>
          </div>

          {/* التقويم */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <h5 className="font-bold text-gray-800">
                {format(currentMonth, 'MMMM yyyy', { locale: ar })}
              </h5>
              <button 
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'].map((day, i) => (
                <div key={i} className="text-center text-sm text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="h-10" />;
                
                const isPast = isBefore(day, startOfToday());
                const isSelected = selectedDate && day.getTime() === selectedDate.getTime();
                const isTodayDate = isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    disabled={isPast}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-10 rounded-lg flex items-center justify-center text-sm transition-all",
                      isPast && 'text-gray-300 cursor-not-allowed',
                      isSelected && 'bg-[#01411C] text-white',
                      isTodayDate && !isSelected && 'bg-blue-100 text-blue-600',
                      !isPast && !isSelected && !isTodayDate && 'hover:bg-gray-200'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* اختيار الوقت */}
          {selectedDate && (
            <div>
              <Label className="mb-2 block">اختر الوقت</Label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm border transition-all",
                      selectedTime === time
                        ? 'bg-[#01411C] text-white border-[#01411C]'
                        : 'bg-white border-gray-200 hover:border-[#01411C]'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الملخص */}
          {selectedDate && selectedTime && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600 mb-2">الموعد الجديد:</p>
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: ar })}</span>
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{selectedTime}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* الأزرار */}
          <div className="space-y-3">
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || isProcessing}
              className="w-full bg-[#01411C] hover:bg-[#065f41] py-6 text-lg"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-2" />
              )}
              إرسال طلب الموعد
            </Button>
            
            <Button
              onClick={handleCallBroker}
              variant="outline"
              className="w-full"
            >
              <Phone className="w-4 h-4 ml-2" />
              الاتصال بالوسيط
            </Button>
          </div>
        </div>
      </PublicFormLayout>
    );
  }

  // شاشة تم إعادة الجدولة
  if (response === 'rescheduled') {
    return (
      <PublicFormLayout broker={broker} title="تم إرسال طلب الموعد">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Send className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال طلب الموعد</h3>
          <p className="text-gray-600 mb-6">سيتواصل معك الوسيط لتأكيد الموعد الجديد</p>

          {selectedDate && selectedTime && (
            <Card className="bg-blue-50 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{format(selectedDate, 'EEEE d MMMM', { locale: ar })}</span>
                  <span>|</span>
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleCallBroker} className="w-full bg-[#01411C] hover:bg-[#065f41]">
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالوسيط
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  // الصفحة الرئيسية
  return (
    <PublicFormLayout broker={broker} title="تأكيد حضور الموعد">
      <div className="p-6 space-y-6">
        {/* Banner الوقت المتبقي */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-lg">{getTimeRemaining()}</span>
          </div>
          <p className="text-sm opacity-90">موعد معاينة العقار</p>
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
                  <p className="text-sm text-gray-500">الوسيط</p>
                  <p className="font-semibold">{broker.name}</p>
                  <p className="text-sm text-gray-500">{broker.company}</p>
                </div>
              </div>

              {appointment.location && (
                <div className="flex items-center gap-3 pb-3 border-b">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">مكان المعاينة</p>
                    <p className="font-semibold">{appointment.location}</p>
                  </div>
                </div>
              )}

              {appointment.property_title && (
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm text-gray-500">العقار</p>
                    <p className="font-semibold">{appointment.property_title}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ملاحظة */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700 text-center">
            <strong>ملاحظة:</strong> يرجى تأكيد حضورك أو تحديد موعد بديل
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
            قبول الحضور
          </Button>

          <Button
            onClick={handleReject}
            disabled={isProcessing}
            variant="outline"
            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 py-6 text-lg"
          >
            <Calendar className="w-5 h-5 ml-2" />
            تحديد موعد آخر
          </Button>

          <Button
            onClick={handleCallBroker}
            variant="outline"
            className="w-full py-6 text-lg"
          >
            <Phone className="w-5 h-5 ml-2" />
            الاتصال بالوسيط
          </Button>
        </div>
      </div>
    </PublicFormLayout>
  );
}
