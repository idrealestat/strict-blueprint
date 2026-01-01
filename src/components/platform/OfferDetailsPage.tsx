/**
 * OfferDetailsPage.tsx
 * صفحة تفاصيل العرض للعملاء - تظهر عند الضغط على "عرض التفاصيل"
 */

import React, { useState, useRef } from 'react';
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
  Phone,
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
  ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import SimilarOffersSection from './SimilarOffersSection';
import { mockCustomers, Customer } from '@/data/mockCustomers';

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
}

interface OfferDetailsPageProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  allListings?: Listing[];
  brokerPhone?: string;
}

// ============ مودال جدولة المعاينة ============
const ScheduleVisitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}> = ({ isOpen, onClose, listing }) => {
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

  // حفظ الموعد في التقويم
  const saveToCalendar = (appointmentData: any) => {
    const existingAppointments = JSON.parse(localStorage.getItem('calendar_appointments') || '[]');
    const newAppointment = {
      id: `apt_${Date.now()}`,
      type: 'معاينة عقار',
      title: `معاينة: ${listing.title}`,
      date: appointmentData.date,
      time: appointmentData.time,
      clientName: appointmentData.name,
      clientPhone: appointmentData.phone,
      propertyId: listing.id,
      propertyTitle: listing.title,
      propertyLocation: `${listing.city} - ${listing.district}`,
      notes: appointmentData.notes,
      status: 'مؤكد',
      createdAt: new Date().toISOString()
    };
    existingAppointments.push(newAppointment);
    localStorage.setItem('calendar_appointments', JSON.stringify(existingAppointments));
    return newAppointment;
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !name || !phone) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    
    // حفظ في التقويم
    const savedAppointment = saveToCalendar({
      date: selectedDate,
      time: selectedTime,
      name,
      phone,
      notes
    });
    
    toast({
      title: '✅ تم جدولة موعد المعاينة وحفظه في التقويم',
      description: `موعدك يوم ${selectedDate} الساعة ${selectedTime}`
    });
    onClose();
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
            >
              <CalendarCheck className="w-5 h-5 ml-2" />
              تأكيد الموعد
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
}> = ({ isOpen, onClose, listing }) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // البحث عن العميل أو إنشاء بطاقة جديدة
  const findOrCreateCustomer = (customerData: { name: string; phone: string }) => {
    const existingCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
    
    // البحث برقم الجوال
    let customer = existingCustomers.find((c: any) => 
      c.phone === customerData.phone || c.whatsapp === customerData.phone
    );
    
    if (!customer) {
      // إنشاء بطاقة جديدة للعميل
      customer = {
        id: `cust_${Date.now()}`,
        name: customerData.name,
        phone: customerData.phone,
        whatsapp: customerData.phone,
        status: 'جديد',
        priority: 'متوسط',
        propertyType: listing.propertyType as any,
        budget: `${listing.price.toLocaleString()} ريال`,
        location: `${listing.city} - ${listing.district}`,
        notes: '',
        source: 'موقع',
        createdAt: new Date().toISOString().split('T')[0],
        lastContact: new Date().toISOString().split('T')[0],
        tags: ['عرض سعر'],
        priceQuotes: []
      };
      existingCustomers.push(customer);
      localStorage.setItem('crm_customers', JSON.stringify(existingCustomers));
    }
    
    return { customer, existingCustomers, isNew: !existingCustomers.find((c: any) => c.id === customer.id && c.priceQuotes) };
  };

  // إضافة عرض السعر لبطاقة العميل
  const addQuoteToCustomer = (customerPhone: string, quoteData: any) => {
    const existingCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
    const customerIndex = existingCustomers.findIndex((c: any) => 
      c.phone === customerPhone || c.whatsapp === customerPhone
    );
    
    if (customerIndex !== -1) {
      if (!existingCustomers[customerIndex].priceQuotes) {
        existingCustomers[customerIndex].priceQuotes = [];
      }
      existingCustomers[customerIndex].priceQuotes.push(quoteData);
      existingCustomers[customerIndex].lastContact = new Date().toISOString().split('T')[0];
      localStorage.setItem('crm_customers', JSON.stringify(existingCustomers));
    }
  };

  const handleSubmit = () => {
    if (!offerPrice || !name || !phone) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    
    // البحث أو إنشاء العميل
    const { customer, isNew } = findOrCreateCustomer({ name, phone });
    
    // إضافة عرض السعر
    const quoteData = {
      id: `quote_${Date.now()}`,
      propertyId: listing.id,
      propertyTitle: listing.title,
      propertyLocation: `${listing.city} - ${listing.district}`,
      originalPrice: listing.price,
      offeredPrice: Number(offerPrice),
      paymentMethod,
      message,
      status: 'معلق',
      createdAt: new Date().toISOString()
    };
    
    addQuoteToCustomer(phone, quoteData);
    
    toast({
      title: isNew ? '✅ تم إنشاء بطاقة عميل جديدة وإضافة عرض السعر' : '✅ تم إضافة عرض السعر لبطاقة العميل',
      description: `عرضك: ${Number(offerPrice).toLocaleString('ar-SA')} ريال`
    });
    onClose();
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

// ============ مودال دفع العربون ============
const PayDepositModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}> = ({ isOpen, onClose, listing }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [agreed, setAgreed] = useState(false);

  const suggestedDeposits = [
    { label: '5%', value: listing.price * 0.05 },
    { label: '10%', value: listing.price * 0.10 },
    { label: '15%', value: listing.price * 0.15 },
    { label: '20%', value: listing.price * 0.20 }
  ];

  const handleSubmit = () => {
    if (!depositAmount || !name || !phone || !idNumber) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    if (!agreed) {
      toast({ title: 'يرجى الموافقة على الشروط والأحكام', variant: 'destructive' });
      return;
    }
    toast({
      title: '✅ تم إرسال طلب دفع العربون',
      description: `سيتم التواصل معك لإتمام الدفع: ${Number(depositAmount).toLocaleString('ar-SA')} ريال`
    });
    onClose();
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
        <div className="bg-gradient-to-l from-[#D4AF37] to-[#B8942E] p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">دفع العربون</h2>
                <p className="text-white/80 text-sm">سعر العقار: {listing.price.toLocaleString('ar-SA')} ريال</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* اختيار نسبة العربون */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اختر نسبة العربون</label>
            <div className="grid grid-cols-4 gap-2">
              {suggestedDeposits.map(deposit => (
                <button
                  key={deposit.label}
                  onClick={() => setDepositAmount(deposit.value.toString())}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                    depositAmount === deposit.value.toString()
                      ? 'bg-[#D4AF37] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {deposit.label}
                </button>
              ))}
            </div>
          </div>

          {/* مبلغ العربون */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">مبلغ العربون (ريال) *</label>
            <Input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="أدخل مبلغ العربون"
              className="text-right text-xl font-bold"
            />
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

          {/* رقم الهوية */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهوية *</label>
            <Input
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              placeholder="أدخل رقم الهوية الوطنية"
              className="text-right"
              dir="ltr"
            />
          </div>

          {/* تنبيه */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              العربون غير قابل للاسترداد في حال التراجع عن الشراء. يرجى التأكد من جدية الرغبة في الشراء.
            </p>
          </div>

          {/* الموافقة */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[#D4AF37]"
            />
            <span className="text-sm text-gray-700">
              أوافق على <span className="text-[#D4AF37] font-bold">الشروط والأحكام</span> وأتعهد بالالتزام بها
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#D4AF37] hover:bg-[#C4A030] text-white font-bold py-3 rounded-xl"
            >
              <CreditCard className="w-5 h-5 ml-2" />
              تأكيد الدفع
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

// ============ الصفحة الرئيسية ============
const OfferDetailsPage: React.FC<OfferDetailsPageProps> = ({ listing, isOpen, onClose, allListings = [], brokerPhone }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
    window.open(`tel:${phone}`, '_self');
    toast({ title: 'جاري الاتصال...', description: phone });
  };

  const handleWhatsApp = () => {
    const phone = listing.ownerPhone || brokerPhone || '0500000000';
    const message = `مرحباً، أنا مهتم بالعقار: ${listing.title}`;
    window.open(`https://wa.me/966${phone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${formatPrice(listing.price)}`,
      url: window.location.href
    };
    
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-5xl h-[95vh] bg-white rounded-2xl shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* زر الإغلاق */}
            <button
              onClick={onClose}
              className="fixed top-4 left-4 z-[100000] w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-gray-800" />
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

            {/* أزرار الفيديو والجولة الافتراضية */}
            <div className="flex gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200" dir="rtl">
              <Button
                onClick={() => setShowVideo(true)}
                className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90 text-white font-bold py-3 rounded-xl"
              >
                <Video className="w-5 h-5 ml-2" />
                عرض الفيديو
              </Button>
              <Button
                onClick={() => setShowVirtualTour(true)}
                className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#01411C] font-bold py-3 rounded-xl"
              >
                <View className="w-5 h-5 ml-2" />
                جولة افتراضية
              </Button>
            </div>

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

              {/* الوصف */}
              {listing.description && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#01411C]" />
                    وصف العقار
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{listing.description}</p>
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
              {listing.ownerName && (
                <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] rounded-xl p-6 mb-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-[#01411C]" />
                    </div>
                    <h3 className="font-bold text-lg">{listing.ownerName}</h3>
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

            {/* أزرار التواصل الثابتة */}
            <div className="bg-white border-t-2 border-gray-200 p-4 shadow-lg flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button
                  onClick={handleCall}
                  className="bg-[#01411C] hover:bg-[#065f41] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>اتصال</span>
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>واتساب</span>
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
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* المودالات */}
      <ScheduleVisitModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        listing={listing}
      />
      <SendQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        listing={listing}
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
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">فيديو العقار</p>
                  <p className="text-gray-400 text-sm mt-2">لا يوجد فيديو متاح حالياً</p>
                </div>
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
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center text-white">
                  <View className="w-16 h-16 mx-auto mb-4 opacity-70" />
                  <p className="text-xl font-bold">جولة افتراضية 360°</p>
                  <p className="text-white/70 text-sm mt-2">لا توجد جولة افتراضية متاحة حالياً</p>
                  <p className="text-[#D4AF37] text-xs mt-4">قريباً - تجربة غامرة للعقار</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfferDetailsPage;
