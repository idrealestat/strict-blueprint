/**
 * ViewingNotificationModal.tsx
 * نافذة إشعار موعد المعاينة مع الأزرار الثلاثة
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  X, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  MessageSquare,
  AlertCircle,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { useViewingNotifications, ViewingAppointment } from '@/hooks/useViewingNotifications';

interface ViewingNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: ViewingAppointment | null;
}

export default function ViewingNotificationModal({ 
  isOpen, 
  onClose, 
  appointment 
}: ViewingNotificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { acceptViewing, rejectViewing, callClient } = useViewingNotifications();

  if (!appointment) return null;

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
    setIsProcessing(true);
    try {
      acceptViewing(appointment);
      toast.success('تم إرسال رابط التأكيد للعميل عبر الواتساب');
      onClose();
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      rejectViewing(appointment);
      toast.success('تم إرسال رسالة الاعتذار للعميل');
      onClose();
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCall = () => {
    callClient(appointment.customerPhone);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Home className="w-5 h-5 text-amber-600" />
            </div>
            <span>تذكير بموعد معاينة</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time remaining banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-lg">بقي على الموعد ساعة</span>
            </div>
          </div>

          {/* Appointment details */}
          <Card className="border-amber-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">التاريخ والوقت</p>
                  <p className="font-semibold">
                    {formatDate(appointment.date)} - {appointment.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-2 border-b">
                <User className="w-5 h-5 text-[#D4AF37]" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">اسم العميل</p>
                  <p className="font-semibold">{appointment.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-2 border-b">
                <Phone className="w-5 h-5 text-[#D4AF37]" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">رقم الجوال</p>
                  <p className="font-semibold" dir="ltr">{appointment.customerPhone}</p>
                </div>
              </div>

              {appointment.location && (
                <div className="flex items-center gap-3 pb-2 border-b">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">مكان المعاينة</p>
                    <p className="font-semibold">{appointment.location}</p>
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">ملاحظات</p>
                    <p className="text-sm text-gray-700">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              <strong>ملاحظة:</strong> بقي على الموعد ساعة للقاء العميل
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-5"
            >
              <CheckCircle className="w-5 h-5 ml-2" />
              قبول الحضور وإرسال التأكيد
            </Button>

            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 py-5"
            >
              <X className="w-5 h-5 ml-2" />
              إرسال اعتذار
            </Button>

            <Button
              onClick={handleCall}
              variant="outline"
              className="w-full py-5"
            >
              <Phone className="w-5 h-5 ml-2" />
              الاتصال بالعميل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
