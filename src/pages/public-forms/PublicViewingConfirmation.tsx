/**
 * PublicViewingConfirmation.tsx
 * صفحة تأكيد موعد المعاينة للعميل
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, X, Phone, Calendar, Clock, User, MapPin, FileText, Loader2, AlertCircle } from 'lucide-react';
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

interface AppointmentData {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  notes?: string;
  status: string;
}

export default function PublicViewingConfirmation() {
  const { brokerId, appointmentId } = useParams<{ brokerId: string; appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState<'accepted' | 'rejected' | 'reschedule' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const broker = getMockBroker(brokerId || '1');

  useEffect(() => {
    // Load appointment data from localStorage
    const loadAppointment = () => {
      try {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const found = appointments.find((apt: AppointmentData) => apt.id === appointmentId);
        
        if (found) {
          setAppointment(found);
        } else {
          // Try to get from URL params
          const appointmentData = searchParams.get('data');
          if (appointmentData) {
            setAppointment(JSON.parse(decodeURIComponent(appointmentData)));
          }
        }
      } catch (error) {
        console.error('Error loading appointment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, searchParams]);

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!appointment) return '';
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'حان موعد المعاينة الآن';
    if (diffMins < 60) return `بقي ${diffMins} دقيقة على موعد المعاينة`;
    if (diffMins < 120) return `بقي ساعة تقريباً على موعد المعاينة`;
    
    const hours = Math.floor(diffMins / 60);
    return `بقي ${hours} ساعة على موعد المعاينة`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAccept = async () => {
    if (!appointment) return;
    setIsProcessing(true);
    
    try {
      // Update appointment status
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const updatedAppointments = appointments.map((apt: AppointmentData) => 
        apt.id === appointment.id 
          ? { ...apt, status: 'confirmed', clientConfirmed: true, confirmedAt: new Date().toISOString() }
          : apt
      );
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

      // Create notification for broker
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'appointment_confirmed',
        title: '✅ تأكيد حضور موعد',
        message: `قام العميل ${appointment.customerName} بتأكيد حضور موعد المعاينة`,
        data: {
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          date: appointment.date,
          time: appointment.time,
        },
        isRead: false,
        isPulsing: true,
        createdAt: new Date().toISOString(),
      };
      
      const notifications = JSON.parse(localStorage.getItem('broker_notifications') || '[]');
      notifications.unshift(notification);
      localStorage.setItem('broker_notifications', JSON.stringify(notifications));

      // Dispatch event
      window.dispatchEvent(new CustomEvent('appointmentConfirmed', { detail: appointment }));

      setResponse('accepted');
      toast.success('تم تأكيد حضورك بنجاح');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('حدث خطأ أثناء التأكيد');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!appointment) return;
    setIsProcessing(true);
    
    try {
      // Update appointment status
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const updatedAppointments = appointments.map((apt: AppointmentData) => 
        apt.id === appointment.id 
          ? { ...apt, status: 'client_rejected', slotOpen: true, rejectedAt: new Date().toISOString() }
          : apt
      );
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

      // Create notification for broker
      const notification = {
        id: `notif_${Date.now()}`,
        type: 'appointment_rejected',
        title: '❌ رفض موعد',
        message: `العميل ${appointment.customerName} يعتذر عن الحضور ويريد تحديد موعد جديد`,
        data: {
          appointmentId: appointment.id,
          customerName: appointment.customerName,
        },
        isRead: false,
        isPulsing: true,
        createdAt: new Date().toISOString(),
      };
      
      const notifications = JSON.parse(localStorage.getItem('broker_notifications') || '[]');
      notifications.unshift(notification);
      localStorage.setItem('broker_notifications', JSON.stringify(notifications));

      setResponse('reschedule');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCall = () => {
    if (broker.phone) {
      window.location.href = `tel:${broker.phone}`;
    }
  };

  const handleReschedule = () => {
    // Redirect to appointment form with pre-filled data
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/public/appointment/${brokerId}?reschedule=true&name=${encodeURIComponent(appointment?.customerName || '')}&phone=${encodeURIComponent(appointment?.customerPhone || '')}`;
  };

  if (isLoading) {
    return (
      <PublicFormLayout broker={broker} title="تأكيد موعد المعاينة">
        <div className="p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#D4AF37]" />
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الموعد...</p>
        </div>
      </PublicFormLayout>
    );
  }

  if (!appointment) {
    return (
      <PublicFormLayout broker={broker} title="تأكيد موعد المعاينة">
        <div className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">لم يتم العثور على الموعد</h3>
          <p className="text-gray-600">قد يكون الرابط غير صالح أو انتهت صلاحيته</p>
        </div>
      </PublicFormLayout>
    );
  }

  // Response screens
  if (response === 'accepted') {
    return (
      <PublicFormLayout broker={broker} title="تأكيد موعد المعاينة">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">تم تأكيد حضورك!</h3>
          <p className="text-gray-600 mb-4">شكراً لك، تم إرسال تأكيد الحضور للوسيط</p>
          
          <Card className="bg-green-50 border-green-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{formatDate(appointment.date)}</span>
                <span>|</span>
                <Clock className="w-5 h-5" />
                <span className="font-medium">{appointment.time}</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500 mb-6">
            سيتم التواصل معك لتأكيد التفاصيل النهائية
          </p>

          <Button
            onClick={handleCall}
            className="bg-[#01411C] hover:bg-[#065f41] text-white"
          >
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالوسيط
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  if (response === 'reschedule') {
    return (
      <PublicFormLayout broker={broker} title="إعادة جدولة الموعد">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">لا مشكلة!</h3>
          <p className="text-gray-600 mb-6">يمكنك تحديد موعد جديد يناسبك</p>
          
          <Button
            onClick={handleReschedule}
            className="w-full bg-[#01411C] hover:bg-[#065f41] text-white py-6 text-lg mb-4"
          >
            <Calendar className="w-5 h-5 ml-2" />
            تحديد موعد جديد
          </Button>

          <Button
            variant="outline"
            onClick={handleCall}
            className="w-full"
          >
            <Phone className="w-4 h-4 ml-2" />
            الاتصال بالوسيط
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout broker={broker} title="تأكيد موعد المعاينة">
      <div className="p-6 space-y-6">
        {/* Time remaining banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-lg">{getTimeRemaining()}</span>
          </div>
          <p className="text-sm opacity-90">موعد معاينة العقار</p>
        </div>

        {/* Appointment details */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <p className="text-sm text-gray-500">التاريخ</p>
                <p className="font-semibold">{formatDate(appointment.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <p className="text-sm text-gray-500">الوقت</p>
                <p className="font-semibold text-xl">{appointment.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b">
              <User className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <p className="text-sm text-gray-500">اسم العميل</p>
                <p className="font-semibold">{appointment.customerName}</p>
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

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700 text-center">
            <strong>ملاحظة:</strong> بقي على الموعد ساعة للقاء الوسيط
          </p>
        </div>

        {/* Action buttons */}
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
            className="w-full border-red-300 text-red-600 hover:bg-red-50 py-6 text-lg"
          >
            <X className="w-5 h-5 ml-2" />
            إرسال اعتذار
          </Button>

          <Button
            onClick={handleCall}
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
