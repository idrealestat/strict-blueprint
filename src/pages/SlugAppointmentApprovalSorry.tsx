/**
 * SlugAppointmentApprovalSorry.tsx
 * صفحة اعتذار عن الموعد مع إمكانية إعادة الجدولة
 * wasataai.com/:slug/appointmentapproval/sorry
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Calendar, Clock, ChevronRight, ChevronLeft, Send, Loader2, 
  AlertCircle, HeartHandshake, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PublicFormLayout, { BrokerInfo } from '@/pages/public-forms/PublicFormLayout';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, getDay, isToday, isBefore, startOfToday 
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WorkingHours {
  [key: string]: { open: string; close: string; isOpen: boolean };
}

export default function SlugAppointmentApprovalSorry() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const customerName = searchParams.get('name') || '';
  const customerPhone = searchParams.get('phone') || '';

  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // حالة التقويم
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        // جلب بيانات البطاقة
        const { data: cardData, error } = await (supabase as any)
          .from('public_business_cards')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching card:', error);
          setIsLoading(false);
          return;
        }

        if (!cardData) {
          console.log('No card found for slug:', slug);
          setIsLoading(false);
          return;
        }

        const cardJson = cardData.data as Record<string, any>;
        
        // جلب بيانات الملف الشخصي منفصلاً
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, company_name, phone')
          .eq('user_id', cardData.user_id)
          .maybeSingle();
        
        setBroker({
          id: cardData.user_id,
          name: cardJson?.name || profileData?.full_name || 'وسيط',
          company: cardJson?.companyName || profileData?.company_name || '',
          phone: cardJson?.primaryPhone || cardData.phone || profileData?.phone || '',
          email: cardData.email || '',
          location: cardJson?.location || '',
          licenseNumber: cardData.fal_license_number || '',
          rating: 4.8,
          verified: true,
          profileImage: cardJson?.profileImage,
          coverImage: cardJson?.coverImage,
          logoImage: cardJson?.logoImage,
        });

        // جلب أوقات الدوام
        if (cardJson?.workingHours) {
          setWorkingHours(cardJson.workingHours);
        }

        // جلب المواعيد المحجوزة
        const { data: appointments } = await supabase
          .from('calendar_appointments')
          .select('appointment_date, appointment_time')
          .eq('user_id', cardData.user_id)
          .not('status', 'in', '("cancelled","client_rejected","broker_rejected")');

        if (appointments) {
          setBookedSlots(appointments.map(a => ({
            date: a.appointment_date,
            time: a.appointment_time
          })));
        }

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // التقويم
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = getDay(start);
    return [...Array(startDayOfWeek).fill(null), ...days];
  }, [currentMonth]);

  // الأوقات المتاحة حسب يوم الأسبوع
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dayName = format(selectedDate, 'EEEE').toLowerCase();
    const dayHours = workingHours[dayName];
    
    // إذا كان اليوم مغلق
    if (!dayHours || !dayHours.isOpen) {
      return [];
    }

    const slots: string[] = [];
    const openHour = parseInt(dayHours.open.split(':')[0]);
    const closeHour = parseInt(dayHours.close.split(':')[0]);
    
    for (let h = openHour; h < closeHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // استبعاد المواعيد المحجوزة
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return slots.filter(time => {
      const isBooked = bookedSlots.some(
        slot => slot.date === dateStr && slot.time === time
      );
      return !isBooked;
    });
  }, [selectedDate, workingHours, bookedSlots]);

  // هل اليوم يوم عمل؟
  const isWorkingDay = (date: Date) => {
    const dayName = format(date, 'EEEE').toLowerCase();
    const dayHours = workingHours[dayName];
    return dayHours && dayHours.isOpen;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !broker) {
      toast.error('يرجى اختيار التاريخ والوقت');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // إنشاء موعد جديد
      const { data: newApt, error } = await supabase
        .from('calendar_appointments')
        .insert({
          title: 'موعد معاينة جديد',
          customer_name: customerName || 'عميل',
          customer_phone: customerPhone,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          appointment_type: 'viewing',
          status: 'pending',
          user_id: broker.id,
          notes: 'موعد جديد بعد الاعتذار عن الموعد السابق',
        })
        .select()
        .single();

      if (error) throw error;

      // إنشاء إشعار للوسيط
      await supabase.from('notifications').insert({
        user_id: broker.id,
        title: '📅 موعد جديد من العميل',
        message: `قام العميل ${customerName || 'عميل'} بتحديد موعد جديد في ${format(selectedDate, 'EEEE d MMMM', { locale: ar })} الساعة ${selectedTime}`,
        notification_type: 'appointment_rescheduled',
        related_entity_id: newApt.id,
        related_entity_type: 'appointment',
        priority: 'high',
        metadata: {
          is_pulsing: true,
          source: 'sorry_page',
        },
      });

      setSubmitted(true);
      toast.success('تم إرسال طلب الموعد الجديد');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallBroker = () => {
    if (broker?.phone) {
      window.location.href = `tel:${broker.phone}`;
    }
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

  if (submitted) {
    return (
      <PublicFormLayout broker={broker} title="تم إرسال الموعد">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Send className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">شكراً لك!</h3>
          <p className="text-gray-600 mb-4">تم إرسال طلب الموعد الجديد وسيتم التواصل معك قريباً</p>
          
          <Card className="bg-green-50 border-green-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: ar })}
                </span>
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium">{selectedTime}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleCallBroker} className="w-full bg-[#01411C] hover:bg-[#065f41]">
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالوسيط
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout broker={broker} title="نعتذر عن الموعد">
      <div className="p-6 space-y-6">
        {/* رسالة الاعتذار */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <HeartHandshake className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">نعتذر عن عدم الحضور</h3>
          <p className="text-gray-600">
            للأسف لم نتمكن من الحضور للموعد السابق لأسباب طارئة.
            <br />
            نرجو منك تحديد موعد آخر يناسبك.
          </p>
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
              const isWorking = isWorkingDay(day);
              const isDisabled = isPast || !isWorking;
              
              return (
                <button
                  key={day.toISOString()}
                  disabled={isDisabled}
                  onClick={() => {
                    setSelectedDate(day);
                    setSelectedTime('');
                  }}
                  className={cn(
                    "h-10 rounded-lg flex items-center justify-center text-sm transition-all",
                    isDisabled && 'text-gray-300 cursor-not-allowed bg-gray-100',
                    isSelected && 'bg-[#01411C] text-white',
                    isTodayDate && !isSelected && 'bg-blue-100 text-blue-600',
                    !isDisabled && !isSelected && !isTodayDate && 'hover:bg-gray-200'
                  )}
                  title={!isWorking && !isPast ? 'يوم إجازة' : ''}
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
            <Label className="mb-2 block">اختر الوقت المتاح</Label>
            {availableTimeSlots.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                لا توجد أوقات متاحة في هذا اليوم
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableTimeSlots.map(time => (
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
            )}
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
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || isSubmitting}
            className="w-full bg-[#01411C] hover:bg-[#065f41] py-6 text-lg"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-2" />
            )}
            إرسال طلب الموعد
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
