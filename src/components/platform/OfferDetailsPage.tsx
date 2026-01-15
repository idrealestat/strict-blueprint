/**
 * OfferDetailsPage.tsx
 * صفحة تفاصيل العرض للعملاء - تظهر عند الضغط على "عرض التفاصيل"
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Building2,
  Calendar,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle,
  Star,
  Clock,
  User,
  FileText,
  Send,
  CreditCard,
  CalendarDays,
  Navigation,
  CalendarCheck,
  DollarSign,
  AlertCircle,
  Video,
  View,
  ZoomIn,
  Shield,
  Users,
  FileDown
} from 'lucide-react';
import { generatePropertyPDF } from '@/utils/generatePropertyPDF';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import SimilarOffersSection from './SimilarOffersSection';
import { mockCustomers, Customer } from '@/data/mockCustomers';
import { saveViewingAppointmentToDb } from '@/hooks/useCalendarAppointments';
import { useViewsSync } from '@/hooks/useViewsSync';
import { showPushNotification } from '@/hooks/usePushNotifications';
import { useEventTracker, getEventStats } from '@/hooks/useEventTracker';
import { triggerOfferInteractionNotification } from '@/utils/notificationTriggers';
import { useSingleOfferPresence } from '@/hooks/useRealtimePresence';
import { markAsNew } from '@/hooks/usePublishedAdsManager';
import { supabase } from '@/integrations/supabase/client';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  propertyType: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  image: string;
  imageCount: number;
  city: string;
  district: string;
  images?: string[];
  ownerName?: string;
  ownerPhone?: string;
  createdAt?: string;
  views?: number;
  street?: string;
  age?: number;
  direction?: string;
  features?: string[];
  lat?: number;
  lng?: number;
  // حقول إضافية من نموذج النشر
  videoUrl?: string;
  tour3DUrl?: string;
  livingRooms?: string;
  councils?: string;
  floors?: string;
  floorNumber?: string;
  cornerType?: string;
  streetWidth?: string;
  furnishing?: string;
  entrances?: string;
  balconies?: string;
  acUnits?: string;
  warehouses?: string;
  hasLaundryRoom?: boolean;
  curtains?: string;
  hasExtraKitchen?: boolean;
  extraKitchenAppliances?: string;
  category?: string;
  purpose?: string;
  smartPath?: string;
  warranties?: { type: string; duration: string }[];
  paymentOption?: string;
  paymentPrices?: {
    onePayment?: string;
    twoPayments?: string;
    fourPayments?: string;
    monthly?: string;
  };
  hashtags?: string[];
  customHashtags?: string[];
  deedNumber?: string;
  deedDate?: string;
  adLicense?: string;
  brokerPhone?: string;
}

interface OfferDetailsPageProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  allListings?: Listing[];
  brokerPhone?: string;
  brokerName?: string; // اسم الوسيط المعلن (من بطاقة الأعمال)
  userId?: string; // for notifications
  trackingChannel?: 'public_web' | 'in_app_preview';
  platformSlug?: string; // slug للنماذج العامة
}

// ============ مودال جدولة المعاينة ============
const ScheduleVisitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  userId?: string;
  platformSlug?: string;
}> = ({ isOpen, onClose, listing, userId, platformSlug }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const timeSlots = [
    '09:00 ص', '10:00 ص', '11:00 ص', '12:00 م',
    '01:00 م', '02:00 م', '03:00 م', '04:00 م',
    '05:00 م', '06:00 م', '07:00 م', '08:00 م'
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  // استخراج slug من URL إذا لم يكن متوفر
  const getSlug = (): string | null => {
    if (platformSlug) return platformSlug;
    
    // محاولة استخراج من URL
    const pathParts = window.location.pathname.split('/');
    // Pattern: /{slug} or /{slug}/offer/{id}
    if (pathParts.length >= 2 && pathParts[1] && !['app', 'auth', 'admin'].includes(pathParts[1])) {
      return pathParts[1];
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !name || !phone) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const slug = getSlug();
      const offerUrl = window.location.href;
      
      // تحويل الوقت للصيغة المطلوبة
      const timeForDb = selectedTime.replace(' ص', '').replace(' م', '');
      
      // البيانات للإرسال
      const submissionData = {
        id: `apt_${Date.now()}`,
        clientName: name,
        clientPhone: phone,
        appointmentType: 'معاينة عقار',
        preferredDate: selectedDate,
        preferredTime: timeForDb,
        meetingLocation: `${listing.city} - ${listing.district}`,
        notes: `${notes || ''}\n\nتفاصيل العقار:\n- ${listing.title}\n- السعر: ${listing.price.toLocaleString('ar-SA')} ريال\n- رابط العرض: ${offerUrl}`,
        propertyId: listing.id,
        propertyTitle: listing.title,
        propertyPrice: listing.price,
        propertyType: listing.propertyType,
        offerUrl: offerUrl,
      };
      
      if (slug) {
        // إرسال للـ Edge Function (يحفظ في DB ويرسل إشعارات)
        const { data: result, error } = await supabase.functions.invoke('public-form-submit', {
          body: {
            slug: slug,
            formType: 'appointment',
            data: submissionData,
          },
        });
        
        if (error) {
          console.error('Edge function error:', error);
          throw new Error('فشل في حفظ الموعد');
        }
        
        console.log('[ScheduleVisit] Saved via Edge Function:', result);
        
        // إرسال Push Notification محلي للمتصفح
        await showPushNotification(
          '📅 موعد معاينة جديد',
          `${name} - ${listing.title} - ${selectedDate} ${selectedTime}`,
          { type: 'appointment', propertyId: listing.id }
        );
        
        // تشغيل التنبيه الصوتي
        if (typeof window !== 'undefined') {
          import('@/utils/notificationSounds').then(({ NotificationSounds }) => {
            NotificationSounds.reminder(0.6);
          });
        }
        
        // إشعار محلي للـ UI
        window.dispatchEvent(new CustomEvent('addNotification', {
          detail: {
            title: '📅 موعد معاينة جديد',
            message: `${name} طلب موعد معاينة - ${listing.title}`,
            type: 'success',
            category: 'appointment',
            priority: 'high',
            isPulsing: true,
          }
        }));
        
        // تحديث النقاط الحمراء
        markAsNew('tab', 'calendar');
        markAsNew('tab', 'appointments');
        
        toast({
          title: '✅ تم جدولة موعد المعاينة بنجاح',
          description: `موعدك يوم ${selectedDate} الساعة ${selectedTime}`
        });
      } else {
        // Fallback: حفظ محلي فقط إذا لم يكن هناك slug
        console.warn('[ScheduleVisit] No slug available, falling back to local storage');
        
        await saveViewingAppointmentToDb({
          title: `معاينة: ${listing.title}`,
          customerName: name,
          customerPhone: phone,
          date: selectedDate,
          time: timeForDb,
          propertyId: listing.id,
          propertyTitle: listing.title,
          location: `${listing.city} - ${listing.district}`,
          notes: `${notes}\n\nرابط العرض: ${offerUrl}`,
        });
        
        toast({
          title: '✅ تم جدولة الموعد',
          description: `موعدك يوم ${selectedDate} الساعة ${selectedTime}`
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({ title: 'حدث خطأ أثناء حفظ الموعد', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">جدولة معاينة</h2>
                <p className="text-blue-100 text-sm">{listing.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* الاسم */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              className="text-right"
            />
          </div>

          {/* رقم الجوال */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال *</label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="text-right"
              dir="ltr"
            />
          </div>

          {/* التاريخ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ المعاينة *</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="text-right"
            />
          </div>

          {/* الوقت */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">وقت المعاينة *</label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === time
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="أي تفاصيل إضافية تود إضافتها..."
              rows={3}
              className="text-right"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
            >
              {isSubmitting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <CalendarCheck className="w-5 h-5 ml-2" />
                  تأكيد الموعد
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 py-3 rounded-xl"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ مودال عرض السعر ============
const SendQuoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  userId?: string;
  platformSlug?: string;
}> = ({ isOpen, onClose, listing, userId, platformSlug }) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استخراج slug من URL إذا لم يكن متوفر
  const getSlug = (): string | null => {
    if (platformSlug) return platformSlug;
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 2 && pathParts[1] && !['app', 'auth', 'admin'].includes(pathParts[1])) {
      return pathParts[1];
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!offerPrice || !name || !phone) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const slug = getSlug();
      const offerUrl = window.location.href;
      
      const submissionData = {
        id: `quote_${Date.now()}`,
        clientName: name,
        clientPhone: phone,
        propertyId: listing.id,
        propertyTitle: listing.title,
        propertyLocation: `${listing.city} - ${listing.district}`,
        propertyType: listing.propertyType,
        originalPrice: listing.price,
        offeredPrice: Number(offerPrice),
        paymentMethod,
        message,
        offerUrl,
      };
      
      if (slug) {
        // إرسال للـ Edge Function
        const { data: result, error } = await supabase.functions.invoke('public-form-submit', {
          body: { slug, formType: 'quote', data: submissionData },
        });
        
        if (error) throw new Error('فشل في إرسال العرض');
        console.log('[SendQuote] Saved via Edge Function:', result);
        
        // Push + صوت
        await showPushNotification(
          '💰 طلب عرض سعر جديد',
          `${name} - ${Number(offerPrice).toLocaleString('ar-SA')} ريال`,
          { type: 'new_quote', propertyId: listing.id }
        );
        
        if (typeof window !== 'undefined') {
          import('@/utils/notificationSounds').then(({ NotificationSounds }) => {
            NotificationSounds.priceQuote(0.6);
          });
        }
        
        window.dispatchEvent(new CustomEvent('addNotification', {
          detail: {
            title: '💰 طلب عرض سعر جديد',
            message: `${name} - ${Number(offerPrice).toLocaleString('ar-SA')} ريال`,
            type: 'success', category: 'quote', priority: 'high', isPulsing: true,
          }
        }));
        
        markAsNew('tab', 'price_quotes');
        
        toast({
          title: '✅ تم إرسال عرض السعر بنجاح',
          description: `عرضك: ${Number(offerPrice).toLocaleString('ar-SA')} ريال`
        });
      } else {
        toast({ title: '✅ تم إرسال عرض السعر', description: `عرضك: ${Number(offerPrice).toLocaleString('ar-SA')} ريال` });
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({ title: 'حدث خطأ أثناء إرسال عرض السعر', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-purple-600 to-purple-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">إرسال عرض سعر</h2>
                <p className="text-purple-100 text-sm">السعر الحالي: {listing.price.toLocaleString('ar-SA')} ريال</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* السعر المقترح */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">السعر المقترح (ريال) *</label>
            <div className="relative">
              <Input
                type="number"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                placeholder="أدخل السعر المقترح"
                className="text-right pl-16"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">ريال</span>
            </div>
            {offerPrice && (
              <p className="mt-2 text-sm text-purple-600">
                {Number(offerPrice) < listing.price 
                  ? `أقل من السعر المطلوب بـ ${(listing.price - Number(offerPrice)).toLocaleString('ar-SA')} ريال`
                  : Number(offerPrice) > listing.price
                    ? `أعلى من السعر المطلوب بـ ${(Number(offerPrice) - listing.price).toLocaleString('ar-SA')} ريال`
                    : 'مساوي للسعر المطلوب'
                }
              </p>
            )}
          </div>

          {/* الاسم */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              className="text-right"
            />
          </div>

          {/* رقم الجوال */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال *</label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="text-right"
              dir="ltr"
            />
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'نقداً' },
                { id: 'finance', label: 'تمويل' },
                { id: 'installment', label: 'تقسيط' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    paymentMethod === method.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* رسالة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رسالة إضافية</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="أضف رسالة للبائع..."
              rows={3}
              className="text-right"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl"
            >
              <Send className="w-5 h-5 ml-2" />
              إرسال العرض
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 py-3 rounded-xl"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ مودال دفع العربون (قيد التطوير) ============
const PayDepositModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}> = ({ isOpen, onClose, listing }) => {
  
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-[#D4AF37] to-[#B8942E] p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">دفع العربون</h2>
                <p className="text-white/80 text-sm">{listing.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* محتوى قيد التطوير */}
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            🚧 قيد التطوير
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            ميزة دفع العربون الإلكتروني قيد التطوير حالياً.
            <br />
            سيتم إطلاقها قريباً بإذن الله.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <p className="text-sm text-gray-500">
              للتواصل المباشر بخصوص دفع العربون، يرجى الاتصال أو التواصل عبر الواتساب
            </p>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-white font-bold py-3 rounded-xl"
          >
            حسناً، فهمت
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ الصفحة الرئيسية ============
const OfferDetailsPage: React.FC<OfferDetailsPageProps> = ({ 
  listing, 
  isOpen, 
  onClose, 
  allListings = [], 
  brokerPhone,
  brokerName,
  userId,
  trackingChannel = 'public_web',
  platformSlug
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historicalViews, setHistoricalViews] = useState(0);
  
  // Event tracker for CTA tracking
  const { track } = useEventTracker();
  
  // المشاهدين المباشرين باستخدام Supabase Presence
  const liveViewerCount = useSingleOfferPresence(listing.id);
  
  // جلب المشاهدات الإجمالية من قاعدة البيانات
  useEffect(() => {
    const fetchHistoricalViews = async () => {
      const stats = await getEventStats('offer', listing.id, 'public_web');
      setHistoricalViews(stats.total);
    };
    if (listing.id) {
      fetchHistoricalViews();
    }
  }, [listing.id]);
  
  // المودالات
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  
  // للسحب على الصور
  const constraintsRef = useRef(null);

  // صور تجريبية إذا لم توجد صور
  const images = listing.images?.length ? listing.images : [
    listing.image,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  ];

  // موقع افتراضي (الرياض)
  const mapLat = listing.lat || 24.7136;
  const mapLng = listing.lng || 46.6753;

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} مليون ريال`;
    }
    return `${price.toLocaleString('ar-SA')} ريال`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // التعامل مع السحب على الصور
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) {
      prevImage();
    } else if (info.offset.x < -50) {
      nextImage();
    }
  };

  const handleCall = () => {
    const phone = listing.ownerPhone || brokerPhone || '0500000000';
    
    // Track call CTA click
    track({
      eventName: 'offer_call',
      channel: trackingChannel,
      entityType: 'offer',
      entityId: listing.id,
      metadata: {
        offerTitle: listing.title,
        city: listing.city,
        district: listing.district,
      }
    });
    
    // Trigger notification for broker (only for public_web)
    if (trackingChannel === 'public_web' && userId) {
      triggerOfferInteractionNotification(userId, {
        interactionType: 'call',
        offerTitle: listing.title,
      });
    }
    
    window.open(`tel:${phone}`, '_self');
    toast({ title: 'جاري الاتصال...', description: phone });
  };

  const handleWhatsApp = () => {
    const phone = listing.ownerPhone || brokerPhone || '0500000000';
    
    // بناء رابط العرض العام
    const currentUrl = window.location.href;
    
    // بناء الرسالة المفصلة
    let message = `🏠 *أريد الاستفسار عن هذا العرض*\n\n`;
    message += `📌 *${listing.title}*\n\n`;
    message += `📍 الموقع: ${listing.city} - ${listing.district}\n`;
    if (listing.area) message += `📐 المساحة: ${listing.area} م²\n`;
    message += `💰 السعر: ${listing.price.toLocaleString()} ريال سعودي\n`;
    if (listing.bedrooms) message += `🛏️ عدد الغرف: ${listing.bedrooms}\n`;
    message += `\n🔗 شاهد العرض:\n${currentUrl}`;
    
    // Track whatsapp CTA click
    track({
      eventName: 'offer_whatsapp',
      channel: trackingChannel,
      entityType: 'offer',
      entityId: listing.id,
      metadata: {
        offerTitle: listing.title,
        city: listing.city,
        district: listing.district,
      }
    });
    
    // Trigger notification for broker (only for public_web)
    if (trackingChannel === 'public_web' && userId) {
      triggerOfferInteractionNotification(userId, {
        interactionType: 'whatsapp',
        offerTitle: listing.title,
      });
    }
    
    window.open(`https://wa.me/966${phone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${formatPrice(listing.price)}`,
      url: window.location.href
    };
    
    // Track share CTA click
    track({
      eventName: 'offer_share',
      channel: trackingChannel,
      entityType: 'offer',
      entityId: listing.id,
      metadata: {
        offerTitle: listing.title,
        city: listing.city,
        district: listing.district,
      }
    });
    
    // Trigger notification for broker (only for public_web)
    if (trackingChannel === 'public_web' && userId) {
      triggerOfferInteractionNotification(userId, {
        interactionType: 'share',
        offerTitle: listing.title,
      });
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: 'تم نسخ الرابط!' });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${mapLat},${mapLng}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[99999] bg-white overflow-y-auto"
          dir="rtl"
        >
          {/* زر الرجوع */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 z-[100000] w-12 h-12 bg-[#01411C] hover:bg-[#065f41] text-white rounded-full shadow-lg flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

            {/* معرض الصور مع السحب */}
            <div 
              ref={constraintsRef}
              className="relative h-72 md:h-96 bg-gradient-to-br from-[#01411C] to-[#065f41] overflow-hidden"
            >
              <motion.div
                drag="x"
                dragConstraints={constraintsRef}
                onDragEnd={handleDragEnd}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={listing.title}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </AnimatePresence>
              </motion.div>

              {/* أزرار التنقل بين الصور */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute left-16 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                </>
              )}

              {/* عداد الصور */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                📷 {currentImageIndex + 1} / {images.length}
              </div>

              {/* الصور المصغرة */}
              <div className="absolute bottom-4 right-4 flex gap-2 overflow-x-auto max-w-[50%]">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      index === currentImageIndex ? 'ring-3 ring-[#D4AF37] scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Badge className="bg-[#D4AF37] text-[#01411C] text-sm font-bold px-3 py-1">
                  {listing.propertyType}
                </Badge>
                <Badge className="bg-green-500 text-white text-sm font-bold px-3 py-1">
                  متاح
                </Badge>
                {/* شارة المشاهدين المباشرين */}
                {liveViewerCount > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1.5 animate-pulse">
                    <div className="relative">
                      <Users className="w-4 h-4" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <span>{liveViewerCount}</span>
                    <span className="text-green-100">يشاهدون الآن</span>
                  </Badge>
                )}
                {/* شارة المشاهدات الإجمالية */}
                <Badge className="bg-gray-800/80 text-white text-sm px-3 py-1 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{historicalViews || listing.views || 0}</span>
                  <span className="text-gray-300">مشاهدة</span>
                </Badge>
              </div>

              {/* السعر */}
              <div className="absolute bottom-16 right-4 bg-[#01411C] text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
                {formatPrice(listing.price)}
              </div>

              {/* أيقونات التفاعل */}
              <div className="absolute top-4 left-16 flex gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-800'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5 text-gray-800" />}
                </button>
              </div>

              {/* زر زوم للصورة */}
              <button
                onClick={() => setShowZoom(true)}
                className="absolute bottom-20 left-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
              >
                <ZoomIn className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            {/* أزرار الفيديو والجولة الافتراضية - تظهر فقط إذا كان هناك فيديو أو جولة */}
            {(listing.videoUrl || listing.tour3DUrl) && (
              <div className="flex gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200" dir="rtl">
                {listing.videoUrl && (
                  <Button
                    onClick={() => setShowVideo(true)}
                    className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90 text-white font-bold py-3 rounded-xl"
                  >
                    <Video className="w-5 h-5 ml-2" />
                    عرض الفيديو
                  </Button>
                )}
                {listing.tour3DUrl && (
                  <Button
                    onClick={() => setShowVirtualTour(true)}
                    className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#01411C] font-bold py-3 rounded-xl"
                  >
                    <View className="w-5 h-5 ml-2" />
                    جولة افتراضية
                  </Button>
                )}
              </div>
            )}

            {/* المحتوى */}
            <div className="p-6">
              {/* العنوان والموقع */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-[#01411C] mb-3">{listing.title}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-lg">{listing.city} - {listing.district}</span>
                  {listing.street && <span>، {listing.street}</span>}
                </div>
              </div>

              {/* المواصفات الرئيسية */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {listing.area && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
                    <Maximize className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">{listing.area}</div>
                    <div className="text-sm text-blue-700">متر مربع</div>
                  </div>
                )}
                {listing.bedrooms && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
                    <BedDouble className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">{listing.bedrooms}</div>
                    <div className="text-sm text-green-700">غرف نوم</div>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                    <Bath className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-900">{listing.bathrooms}</div>
                    <div className="text-sm text-purple-700">حمامات</div>
                  </div>
                )}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center border-2 border-amber-200">
                  <Building2 className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-amber-900">{listing.propertyType}</div>
                  <div className="text-sm text-amber-700">نوع العقار</div>
                </div>
              </div>

              {/* الوصف - يظهر دائماً إذا موجود */}
              {listing.description && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#01411C]" />
                    وصف العقار
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
                </div>
              )}

              {/* المسار الذكي */}
              {listing.smartPath && (
                <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-xl p-4 mb-6 border-2 border-[#D4AF37]/30">
                  <div className="flex items-center gap-2 text-[#01411C] font-bold">
                    <Navigation className="w-5 h-5 text-[#D4AF37]" />
                    <span>المسار: {listing.smartPath}</span>
                  </div>
                </div>
              )}

              {/* المواصفات التفصيلية */}
              <div className="bg-white rounded-xl p-6 mb-6 border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#01411C]" />
                  المواصفات التفصيلية
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {listing.floors && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">عدد الأدوار:</span>
                      <span className="font-bold text-gray-800">{listing.floors}</span>
                    </div>
                  )}
                  {listing.floorNumber && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">رقم الدور:</span>
                      <span className="font-bold text-gray-800">{listing.floorNumber}</span>
                    </div>
                  )}
                  {listing.livingRooms && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">صالات:</span>
                      <span className="font-bold text-gray-800">{listing.livingRooms}</span>
                    </div>
                  )}
                  {listing.councils && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">مجالس:</span>
                      <span className="font-bold text-gray-800">{listing.councils}</span>
                    </div>
                  )}
                  {listing.cornerType && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">الموقع:</span>
                      <span className="font-bold text-gray-800">{listing.cornerType}</span>
                    </div>
                  )}
                  {listing.streetWidth && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">عرض الشارع:</span>
                      <span className="font-bold text-gray-800">{listing.streetWidth} م</span>
                    </div>
                  )}
                  {listing.furnishing && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">التأثيث:</span>
                      <span className="font-bold text-gray-800">{listing.furnishing}</span>
                    </div>
                  )}
                  {listing.entrances && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">المداخل:</span>
                      <span className="font-bold text-gray-800">{listing.entrances}</span>
                    </div>
                  )}
                  {listing.balconies && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">الشرفات:</span>
                      <span className="font-bold text-gray-800">{listing.balconies}</span>
                    </div>
                  )}
                  {listing.acUnits && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">المكيفات:</span>
                      <span className="font-bold text-gray-800">{listing.acUnits}</span>
                    </div>
                  )}
                  {listing.warehouses && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">المستودعات:</span>
                      <span className="font-bold text-gray-800">{listing.warehouses}</span>
                    </div>
                  )}
                  {listing.curtains && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">الستائر:</span>
                      <span className="font-bold text-gray-800">{listing.curtains}</span>
                    </div>
                  )}
                  {listing.hasLaundryRoom && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">غرفة غسيل:</span>
                      <span className="font-bold text-green-600">✓ متوفرة</span>
                    </div>
                  )}
                  {listing.hasExtraKitchen && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">مطبخ إضافي:</span>
                      <span className="font-bold text-green-600">✓ متوفر</span>
                    </div>
                  )}
                  {listing.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">التصنيف:</span>
                      <span className="font-bold text-gray-800">{listing.category}</span>
                    </div>
                  )}
                  {listing.purpose && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">الغرض:</span>
                      <span className="font-bold text-gray-800">{listing.purpose}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* أزرار التواصل */}
              <div className="bg-white rounded-xl p-4 mb-6 border-2 border-gray-200 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Button
                    onClick={handleWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>واتساب</span>
                  </Button>
                  <Button
                    onClick={async () => {
                      const publishedDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'strict-page-playbook.lovable.app';
                      const offerUrl = `https://${publishedDomain}/${platformSlug || 'default'}/offers/${listing.id}`;
                      
                      await generatePropertyPDF({
                        id: listing.id,
                        title: listing.title,
                        propertyType: listing.propertyType,
                        category: listing.category || 'للبيع',
                        purpose: listing.purpose,
                        area: listing.area?.toString(),
                        price: listing.price?.toString(),
                        locationDetails: {
                          city: listing.city,
                          district: listing.district,
                          street: listing.street
                        },
                        bedrooms: listing.bedrooms?.toString(),
                        bathrooms: listing.bathrooms?.toString(),
                        livingRooms: listing.livingRooms,
                        floors: listing.floors,
                        floorNumber: listing.floorNumber,
                        streetWidth: listing.streetWidth,
                        propertyAge: listing.age?.toString(),
                        facade: listing.direction,
                        furnishing: listing.furnishing,
                        features: listing.features,
                        aiDescription: listing.description,
                        images: listing.images || (listing.image ? [listing.image] : []),
                        image: listing.image,
                        brokerPhone: brokerPhone,
                        adLicense: listing.adLicense,
                        offerUrl: offerUrl
                      }, true, {
                        name: brokerName,
                        phone: brokerPhone
                      });
                      
                      toast({ title: '✅ تم تحميل ملف PDF بنجاح!' });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-5 h-5" />
                    <span>تحميل PDF</span>
                  </Button>
                  <Button
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <CalendarDays className="w-5 h-5" />
                    <span>جدولة معاينة</span>
                  </Button>
                  <Button
                    onClick={() => setShowQuoteModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>عرض سعر</span>
                  </Button>
                  <Button
                    onClick={() => setShowDepositModal(true)}
                    className="bg-[#D4AF37] hover:bg-[#C4A030] text-[#01411C] font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>دفع عربون</span>
                  </Button>
                </div>
              </div>

              {/* خيارات الدفع (للإيجار) */}
              {listing.paymentPrices && (listing.paymentPrices.onePayment || listing.paymentPrices.twoPayments || listing.paymentPrices.fourPayments || listing.paymentPrices.monthly) && (
                <div className="bg-purple-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    خيارات الدفع
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {listing.paymentPrices.onePayment && (
                      <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                        <div className="text-sm text-gray-500">دفعة واحدة</div>
                        <div className="font-bold text-purple-700">{Number(listing.paymentPrices.onePayment).toLocaleString('ar-SA')} ريال</div>
                      </div>
                    )}
                    {listing.paymentPrices.twoPayments && (
                      <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                        <div className="text-sm text-gray-500">دفعتين</div>
                        <div className="font-bold text-purple-700">{Number(listing.paymentPrices.twoPayments).toLocaleString('ar-SA')} ريال</div>
                      </div>
                    )}
                    {listing.paymentPrices.fourPayments && (
                      <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                        <div className="text-sm text-gray-500">4 دفعات</div>
                        <div className="font-bold text-purple-700">{Number(listing.paymentPrices.fourPayments).toLocaleString('ar-SA')} ريال</div>
                      </div>
                    )}
                    {listing.paymentPrices.monthly && (
                      <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                        <div className="text-sm text-gray-500">شهري</div>
                        <div className="font-bold text-purple-700">{Number(listing.paymentPrices.monthly).toLocaleString('ar-SA')} ريال</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* الضمانات */}
              {listing.warranties && listing.warranties.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    الضمانات والكفالات
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {listing.warranties.map((warranty, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-blue-200 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{warranty.type}</div>
                          <div className="text-xs text-gray-500">{warranty.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* تم إزالة قسم معلومات الصك والمالك */}

              {/* الهاشتاقات */}
              {((listing.hashtags && listing.hashtags.length > 0) || (listing.customHashtags && listing.customHashtags.length > 0)) && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {listing.hashtags?.map((tag, index) => (
                      <Badge key={`h-${index}`} variant="outline" className="text-[#01411C] border-[#01411C]/30 text-sm">
                        {tag}
                      </Badge>
                    ))}
                    {listing.customHashtags?.map((tag, index) => (
                      <Badge key={`c-${index}`} variant="outline" className="text-[#D4AF37] border-[#D4AF37]/30 text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* خريطة الموقع */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#01411C]" />
                  موقع العقار
                </h3>
                <div className="relative rounded-xl overflow-hidden h-64 bg-gray-200">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${mapLng}!3d${mapLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2ssa!4v1234567890`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-xl"
                  />
                  <button
                    onClick={openGoogleMaps}
                    className="absolute bottom-4 right-4 bg-[#01411C] hover:bg-[#065f41] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Navigation className="w-5 h-5" />
                    فتح في خرائط جوجل
                  </button>
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {listing.age && (
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-gray-200">
                    <Clock className="w-6 h-6 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">عمر العقار</div>
                      <div className="font-bold text-gray-800">{listing.age} سنة</div>
                    </div>
                  </div>
                )}
                {listing.direction && (
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-gray-200">
                    <MapPin className="w-6 h-6 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">الواجهة</div>
                      <div className="font-bold text-gray-800">{listing.direction}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-gray-200">
                  <Eye className="w-6 h-6 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">المشاهدات</div>
                    <div className="font-bold text-gray-800">{listing.views || Math.floor(Math.random() * 500) + 50}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-gray-200">
                  <Calendar className="w-6 h-6 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">تاريخ النشر</div>
                    <div className="font-bold text-gray-800">{listing.createdAt || new Date().toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>
              </div>

              {/* المميزات */}
              {listing.features && listing.features.length > 0 && (
                <div className="bg-[#01411C]/5 rounded-xl p-6 mb-6 border-2 border-[#01411C]/20">
                  <h3 className="font-bold text-[#01411C] mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#D4AF37]" />
                    مميزات العقار
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.features.map((feature, index) => (
                      <Badge key={index} className="bg-[#01411C] text-white px-3 py-1">
                        ✓ {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* معلومات الوسيط */}
              {(brokerName || listing.ownerName) && (
                <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-[#01411C]" />
                    </div>
                    <h3 className="font-bold text-lg">{brokerName || listing.ownerName}</h3>
                  </div>
                </div>
              )}

              {/* العروض المشابهة */}
              {allListings && allListings.length > 1 && (
                <SimilarOffersSection
                  currentListing={listing}
                  allListings={allListings}
                  onSelectListing={(selectedListing) => {
                    // سيتم التعامل معها من الأعلى
                    console.log('Selected similar listing:', selectedListing.id);
                  }}
                  brokerPhone={brokerPhone}
                />
              )}
            </div>

          </motion.div>
        </AnimatePresence>

      {/* المودالات */}
      <ScheduleVisitModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        listing={listing}
        platformSlug={platformSlug}
      />
      <SendQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        listing={listing}
        platformSlug={platformSlug}
      />
      <PayDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        listing={listing}
      />

      {/* مودال زوم الصور */}
      <AnimatePresence>
        {showZoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95"
            onClick={() => setShowZoom(false)}
          >
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={images[currentImageIndex]}
              alt={listing.title}
              className="max-w-[95vw] max-h-[95vh] object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
              </>
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال الفيديو */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                {listing.videoUrl ? (
                  <video
                    src={listing.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-bold">فيديو العقار</p>
                    <p className="text-gray-400 text-sm mt-2">لا يوجد فيديو متاح حالياً</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال الجولة الافتراضية */}
      <AnimatePresence>
        {showVirtualTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowVirtualTour(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-5xl bg-gradient-to-br from-[#01411C] to-[#065f41] rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVirtualTour(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="aspect-video flex items-center justify-center bg-gray-900">
                {listing.tour3DUrl ? (
                  <iframe
                    src={listing.tour3DUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                    title="جولة افتراضية 360°"
                  />
                ) : (
                  <div className="text-center text-white">
                    <View className="w-16 h-16 mx-auto mb-4 opacity-70" />
                    <p className="text-xl font-bold">جولة افتراضية 360°</p>
                    <p className="text-white/70 text-sm mt-2">لا توجد جولة افتراضية متاحة حالياً</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfferDetailsPage;
