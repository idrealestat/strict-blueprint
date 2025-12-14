/**
 * OfferDetailsPage.tsx
 * صفحة تفاصيل العرض للعملاء - تظهر عند الضغط على "عرض التفاصيل"
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  Printer,
  Copy,
  CheckCircle,
  Star,
  Clock,
  User,
  FileText,
  ExternalLink,
  Send,
  CreditCard,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

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
}

interface OfferDetailsPageProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

const OfferDetailsPage: React.FC<OfferDetailsPageProps> = ({ listing, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // صور تجريبية إذا لم توجد صور
  const images = listing.images?.length ? listing.images : [
    listing.image,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  ];

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

  const handleCall = () => {
    const phone = listing.ownerPhone || '0500000000';
    window.open(`tel:${phone}`, '_self');
    toast({ title: 'جاري الاتصال...', description: phone });
  };

  const handleWhatsApp = () => {
    const phone = listing.ownerPhone || '0500000000';
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

  const handleScheduleVisit = () => {
    toast({ title: 'جدولة موعد معاينة', description: 'سيتم التواصل معك قريباً' });
    // TODO: فتح مودال جدولة الموعد
  };

  const handleSendQuote = () => {
    toast({ title: 'إرسال عرض سعر', description: 'سيتم إرسال عرض السعر' });
    // TODO: فتح مودال عرض السعر
  };

  const handlePayDeposit = () => {
    toast({ title: 'دفع عربون', description: 'سيتم توجيهك لصفحة الدفع' });
    // TODO: فتح مودال الدفع
  };

  if (!isOpen) return null;

  return (
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
          className="relative w-full max-w-5xl h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-gray-800" />
          </button>

          {/* معرض الصور */}
          <div className="relative h-72 md:h-96 bg-gradient-to-br from-[#01411C] to-[#065f41] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={listing.title}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

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
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            {/* عداد الصور */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              📷 {currentImageIndex + 1} / {images.length}
            </div>

            {/* مؤشرات الصور */}
            <div className="absolute bottom-4 right-4 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'w-6 bg-[#D4AF37]' : 'bg-white/60'
                  }`}
                />
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
            <div className="absolute bottom-4 right-4 bg-[#01411C] text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg">
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
          </div>

          {/* المحتوى */}
          <div className="flex-1 overflow-y-auto p-6">
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

            {/* معلومات المالك */}
            <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#01411C]" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{listing.ownerName || 'المالك'}</h3>
                  <p className="text-white/80">وسيط عقاري معتمد</p>
                </div>
              </div>
            </div>
          </div>

          {/* أزرار التواصل الثابتة */}
          <div className="bg-white border-t-2 border-gray-200 p-4 shadow-lg">
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
                onClick={handleScheduleVisit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <CalendarDays className="w-5 h-5" />
                <span>جدولة معاينة</span>
              </Button>
              <Button
                onClick={handleSendQuote}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>عرض سعر</span>
              </Button>
              <Button
                onClick={handlePayDeposit}
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
  );
};

export default OfferDetailsPage;
