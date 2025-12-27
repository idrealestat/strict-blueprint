/**
 * OfferEditPage.tsx
 * صفحة تعديل العرض - تظهر عند لمس العرض
 * تصميم مشابه للصورة المرفقة مع التبويبات والصور
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  MapPin,
  Phone,
  Globe,
  Tag,
  FileText,
  Settings,
  Layers,
  Package,
  ZoomIn,
  User,
  MessageSquare,
  Mail,
  FileCheck,
  Calendar,
  Clock,
  Hash,
  Upload,
  AlertCircle,
  CheckCircle,
  Bell,
  Home,
  Key,
  FileUp,
  Link,
  RefreshCw,
  LogOut,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  street?: string;

  // Media
  images?: string[];
  videos?: string[];
  tour3DUrl?: string;

  // Owner
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerBirthDate?: string;
  ownerCity?: string;
  ownerDistrict?: string;

  // Deed
  deedNumber?: string;
  deedDate?: string;
  deedCity?: string;

  // Link to CRM
  linkedCustomerId?: string;

  // Rental Info
  contractDuration?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  isCurrentlyRented?: boolean;
}

interface OfferEditPageProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedListing: Listing) => void;
}

const OfferEditPage: React.FC<OfferEditPageProps> = ({
  listing,
  isOpen,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  const buildInitialFormData = (l: Listing) => ({
    title: l.title || '',
    sku: `AD${l.id.slice(0, 6).toUpperCase()}`,
    price: l.price || 0,
    priceType: 'total',
    description: l.description || '',
    phone: l.ownerPhone || '+966541176696',
    whatsapp: '720' + l.id.slice(0, 7),
    website: 'https://www.id-realestat.com',
    company: 'شركة مبتكر ومميز العقارية',
    companyEn: 'Innovative and Distinguished Real Estate Company',
    city: l.city || '',
    district: l.district || '',
    street: l.street || '',
    area: l.area || 0,
    bedrooms: l.bedrooms || 0,
    bathrooms: l.bathrooms || 0,
    propertyType: l.propertyType || '',
    tour3DUrl: l.tour3DUrl || '',
    // حقول الإعلان الجديدة
    adDate: new Date().toISOString().split('T')[0],
    adDuration: 6, // بالأشهر
    // حقول تفاصيل المالك
    ownerName: l.ownerName || '',
    ownerBirthDate: l.ownerBirthDate || '',
    ownerIdNumber: l.ownerIdNumber || '',
    ownerMobile: l.ownerPhone || '',
    ownerWhatsapp: l.ownerPhone || '',
    ownerNationalAddress: l.ownerNationalAddress || '',
    ownerGoogleLocation: '',
    ownerNotes: '',
    // حقول معلومات الصك
    deedNumber: l.deedNumber || '',
    deedDate: l.deedDate || '',
    deedImage: null as string | null,
    deedNotes: '',
    deedCity: l.deedCity || '',
    propertyNotes: '',
    // الهاشتاقات
    hashtags: ['#شقة', '#للبيع', '#الرياض'] as string[],
    // معلومات التأجير
    contractDuration: l.contractDuration || 12,
    contractStartDate: l.contractStartDate || '',
    isCurrentlyRented: l.isCurrentlyRented || false,
    contractEndDate: l.contractEndDate || '',
    rentalContractFile: null as string | null,
    rentalContractFileName: '',
  });

  const [formData, setFormData] = useState(() => buildInitialFormData(listing));

  useEffect(() => {
    setFormData(buildInitialFormData(listing));
    setSelectedImageIndex(0);
  }, [listing.id]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [deedVerificationStatus, setDeedVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [ejarVerificationStatus, setEjarVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [newHashtag, setNewHashtag] = useState('');
  const [showRentalEndOptions, setShowRentalEndOptions] = useState(false);
  const deedImageInputRef = useRef<HTMLInputElement>(null);
  const rentalContractInputRef = useRef<HTMLInputElement>(null);

  const images = listing.images?.length ? listing.images : [
    listing.image,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  ];

  const videos = listing.videos?.length ? listing.videos : [];

  const mediaItems: Array<{ type: 'image' | 'video'; url: string }> = [
    ...images.filter(Boolean).map((url) => ({ type: 'image' as const, url })),
    ...videos.filter(Boolean).map((url) => ({ type: 'video' as const, url })),
  ];

  const tabs = [
    { id: 'basic', label: 'معلومات أساسية', labelEn: 'Basic info' },
    { id: 'owner', label: 'تفاصيل المالك', labelEn: 'Owner Details' },
    { id: 'deed', label: 'معلومات الصك', labelEn: 'Deed Info' },
    { id: 'rental', label: 'معلومات التأجير', labelEn: 'Rental Info' }
  ];

  // حساب تاريخ انتهاء الإعلان
  const calculateExpiryDate = () => {
    const startDate = new Date(formData.adDate);
    startDate.setMonth(startDate.getMonth() + formData.adDuration);
    return startDate.toISOString().split('T')[0];
  };

  // حساب الأيام المتبقية
  const calculateRemainingDays = () => {
    const expiryDate = new Date(calculateExpiryDate());
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // إضافة هاشتاق جديد
  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
      if (!formData.hashtags.includes(tag)) {
        setFormData({ ...formData, hashtags: [...formData.hashtags, tag] });
      }
      setNewHashtag('');
    }
  };

  // حذف هاشتاق
  const removeHashtag = (tag: string) => {
    setFormData({ ...formData, hashtags: formData.hashtags.filter(h => h !== tag) });
  };

  // رفع صورة الصك
  const handleDeedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, deedImage: reader.result as string });
        toast({ title: '✅ تم رفع صورة الصك بنجاح' });
      };
      reader.readAsDataURL(file);
    }
  };

  // التحقق من الصك
  const verifyDeed = () => {
    if (!formData.deedNumber) {
      toast({ title: '⚠️ يرجى إدخال رقم الصك أولاً', variant: 'destructive' });
      return;
    }
    setDeedVerificationStatus('verifying');
    // محاكاة التحقق من الصك
    setTimeout(() => {
      const isValid = formData.deedNumber.length >= 8;
      setDeedVerificationStatus(isValid ? 'verified' : 'failed');
      toast({ 
        title: isValid ? '✅ تم التحقق من الصك بنجاح' : '❌ لم يتم التحقق من الصك',
        variant: isValid ? 'default' : 'destructive'
      });
    }, 2000);
  };

  // حساب تاريخ انتهاء عقد التأجير
  const calculateContractEndDate = () => {
    if (!formData.contractStartDate) return '';
    const startDate = new Date(formData.contractStartDate);
    startDate.setMonth(startDate.getMonth() + formData.contractDuration);
    return startDate.toISOString().split('T')[0];
  };

  // حساب المتبقي من عقد التأجير
  const calculateRemainingRental = () => {
    const endDate = formData.contractEndDate || calculateContractEndDate();
    if (!endDate) return { months: 0, days: 0, isExpired: true };
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { months: 0, days: 0, isExpired: true };
    
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return { months, days, isExpired: false };
  };

  // رفع ملف عقد التأجير
  const handleRentalContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          rentalContractFile: reader.result as string,
          rentalContractFileName: file.name
        });
        toast({ title: '✅ تم رفع ملف عقد التأجير بنجاح' });
      };
      reader.readAsDataURL(file);
    }
  };

  // التحقق من منصة إيجار
  const verifyEjar = () => {
    setEjarVerificationStatus('verifying');
    setTimeout(() => {
      setEjarVerificationStatus('verified');
      toast({ title: '✅ تم التحقق من منصة إيجار بنجاح' });
    }, 2000);
  };

  // زر تم التأجير
  const handleRentalConfirmed = () => {
    // حفظ في التقويم
    const calendarEvent = new CustomEvent('addCalendarEvent', {
      detail: {
        title: `انتهاء عقد التأجير - ${formData.ownerName}`,
        date: formData.contractEndDate || calculateContractEndDate(),
        type: 'rental_end',
        ownerName: formData.ownerName,
        deedNumber: formData.deedNumber,
        city: formData.city,
        district: formData.district,
        contractDuration: formData.contractDuration
      }
    });
    window.dispatchEvent(calendarEvent);

    // حفظ في بطاقة المالك
    const ownerCardEvent = new CustomEvent('addOwnerRentedProperty', {
      detail: {
        ownerName: formData.ownerName,
        propertyTitle: formData.title,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate || calculateContractEndDate(),
        contractDuration: formData.contractDuration,
        deedNumber: formData.deedNumber,
        city: formData.city,
        district: formData.district
      }
    });
    window.dispatchEvent(ownerCardEvent);

    toast({ title: '✅ تم تسجيل التأجير وإضافته للتقويم وبطاقة المالك' });
  };

  // معالجة خيارات انتهاء العقد
  const handleRentalEndOption = (option: 'renewed' | 'moved_out' | 'extension') => {
    setShowRentalEndOptions(false);
    switch (option) {
      case 'renewed':
        toast({ title: '✅ تم تجديد العقد - يرجى تحديث تاريخ البداية الجديد' });
        break;
      case 'moved_out':
        setFormData({ ...formData, isCurrentlyRented: false });
        toast({ title: '📤 تم تسجيل خروج المستأجر' });
        break;
      case 'extension':
        toast({ title: '⏳ تم طلب مهلة - سيتم إشعار المالك' });
        break;
    }
  };

  // إشعارات انتهاء عقد التأجير
  useEffect(() => {
    if (formData.isCurrentlyRented) {
      const remaining = calculateRemainingRental();
      const totalDays = remaining.months * 30 + remaining.days;
      
      // إشعار قبل شهرين (60 يوم)
      if (totalDays === 60) {
        toast({ title: '🔔 تنبيه: عقد التأجير سينتهي خلال شهرين' });
      }
      // إشعار قبل شهر (30 يوم)
      if (totalDays === 30) {
        toast({ title: '🔔 تنبيه: عقد التأجير سينتهي خلال شهر واحد' });
      }
      // إشعار عند الانتهاء
      if (remaining.isExpired) {
        setShowRentalEndOptions(true);
        toast({ title: '⛔ انتهى عقد التأجير', variant: 'destructive' });
      }
    }
  }, [formData.contractStartDate, formData.contractDuration, formData.isCurrentlyRented]);

  // جدولة الإشعارات
  useEffect(() => {
    const remainingDays = calculateRemainingDays();
    
    // إشعار قبل 3 أشهر (90 يوم)
    if (remainingDays === 90) {
      toast({ title: '🔔 تنبيه: إعلانك سينتهي خلال 3 أشهر' });
    }
    // إشعار قبل شهر (30 يوم)
    if (remainingDays === 30) {
      toast({ title: '🔔 تنبيه: إعلانك سينتهي خلال شهر واحد' });
    }
    // إشعار عند الانتهاء
    if (remainingDays === 0) {
      toast({ title: '⛔ انتهت مدة الإعلان - يرجى تجديده برقم إعلاني جديد', variant: 'destructive' });
    }
  }, [formData.adDate, formData.adDuration]);

  const handleSave = () => {
    const updatedListing = {
      ...listing,
      title: formData.title,
      price: formData.price,
      description: formData.description,
      city: formData.city,
      district: formData.district,
      area: formData.area,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms
    };
    onSave?.(updatedListing);
    toast({ title: '✅ تم حفظ التغييرات بنجاح' });
    onClose();
  };

  if (!isOpen) return null;

  const remainingDays = calculateRemainingDays();

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-white overflow-y-auto"
          dir="rtl"
        >
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button onClick={onClose} className="p-2">
              <X className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1" />
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-[#01411C] hover:bg-[#01411C]/90 text-white px-6 rounded-full"
            >
              <Save className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b-2 border-[#D4AF37] bg-[#01411C]">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[80px] py-3 px-4 text-center text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[#D4AF37] border-b-3 border-[#D4AF37] bg-[#01411C]/80'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="block text-xs opacity-70">{tab.labelEn}</span>
                  <span className="block">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* الصور والفيديو تحت التبويبات - تظهر في تبويب المعلومات الأساسية */}
          {activeTab === 'basic' && (
            <div className="bg-gray-100 p-4">
              {/* الصورة/الفيديو الرئيسي */}
              <div 
                className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-3 cursor-pointer"
                onClick={() => setShowZoom(true)}
              >
                {mediaItems[selectedImageIndex]?.type === 'video' ? (
                  <video
                    src={mediaItems[selectedImageIndex]?.url}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaItems[selectedImageIndex]?.url || 'https://via.placeholder.com/800x600?text=لا+توجد+صور'}
                    alt="صور وفيديو العرض"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  className="absolute top-3 right-3 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); setShowZoom(true); }}
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        setSelectedImageIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(prev => (prev + 1) % mediaItems.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {mediaItems.length || 1}
                </div>
              </div>

              {/* شبكة الصور والفيديو على شكل انستقرام */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                      index === selectedImageIndex 
                        ? 'ring-2 ring-[#01411C] scale-105' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <span className="absolute bottom-1 right-1 bg-[#01411C] text-white text-[10px] px-1.5 py-0.5 rounded">فيديو</span>
                      </>
                    ) : (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    )}
                    {index === 0 && (
                      <span className="absolute top-1 right-1 bg-[#D4AF37] text-[#01411C] text-[10px] px-1.5 py-0.5 rounded font-bold">رئيسية</span>
                    )}
                  </button>
                ))}
                <button className="aspect-square rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all">
                  <Plus className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* رابط الجولة 3D */}
              {listing.tour3DUrl && (
                <div className="bg-[#01411C]/10 border border-[#01411C]/30 rounded-xl p-3 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#01411C]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#01411C]">رابط الجولة الافتراضية 3D</p>
                    <a 
                      href={listing.tour3DUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline truncate block"
                    >
                      {listing.tour3DUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* المحتوى - نموذج التعديل */}
          <div className="p-4 pb-24">
            {activeTab === 'basic' && (
              <div className="space-y-5">
                {/* العنوان */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-[#01411C]" />
                    العنوان / Title
                  </label>
                  <Textarea
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="شقة مؤثثة للبيع في فندق 4 نجوم..."
                    rows={2}
                    className="text-right bg-gray-50 border-gray-200"
                  />
                </div>

                {/* رقم الاعلان */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 text-[#01411C]" />
                    رقم الإعلان / SKU
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="text-right bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>

                {/* تاريخ الإعلان ومدة الإعلان */}
                <div className="bg-[#01411C]/5 rounded-xl p-4 border border-[#01411C]/20 space-y-4">
                  <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    إعدادات مدة الإعلان
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* تاريخ الإعلان */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 text-[#01411C]" />
                        تاريخ الإعلان
                      </label>
                      <Input
                        type="date"
                        value={formData.adDate}
                        onChange={e => setFormData({ ...formData, adDate: e.target.value })}
                        className="bg-white border-gray-200"
                      />
                    </div>

                    {/* مدة الإعلان */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 text-[#01411C]" />
                        مدة الإعلان (بالأشهر)
                      </label>
                      <select
                        value={formData.adDuration}
                        onChange={e => setFormData({ ...formData, adDuration: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>
                            {month} {month === 1 ? 'شهر' : month <= 10 ? 'أشهر' : 'شهر'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* معلومات الانتهاء */}
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    remainingDays <= 30 ? 'bg-red-50 border border-red-200' : 
                    remainingDays <= 90 ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Bell className={`w-5 h-5 ${
                        remainingDays <= 30 ? 'text-red-500' : 
                        remainingDays <= 90 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`} />
                      <span className="text-sm font-medium">تاريخ الانتهاء: {calculateExpiryDate()}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      remainingDays <= 30 ? 'bg-red-500 text-white' : 
                      remainingDays <= 90 ? 'bg-yellow-500 text-white' : 
                      'bg-green-500 text-white'
                    }`}>
                      {remainingDays > 0 ? `${remainingDays} يوم متبقي` : 'انتهى الإعلان'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    سيختفي الإعلان تلقائياً بعد انتهاء المدة ولن يمكن عرضه إلا برقم إعلاني جديد
                  </p>
                </div>

                {/* السعر */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <span className="text-[#01411C] font-bold">SAR</span>
                    سعر العقار / Product price
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="flex-1 text-right bg-gray-50 border-gray-200"
                      dir="ltr"
                    />
                    <select
                      value={formData.priceType}
                      onChange={e => setFormData({ ...formData, priceType: e.target.value })}
                      className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                    >
                      <option value="total">إجمالي</option>
                      <option value="meter">سعر المتر</option>
                    </select>
                  </div>
                </div>

                {/* الوصف */}
                <div>
                  <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#01411C]" />
                      الوصف / Description
                    </span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف العقار..."
                    rows={6}
                    className="text-right bg-gray-50 border-gray-200 whitespace-pre-wrap"
                  />
                </div>

                {/* معلومات التواصل */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#01411C]" />
                    تواصل والاستفسارات
                  </h4>
                  <Input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966541176696"
                    className="text-right bg-white border-gray-200"
                    dir="ltr"
                  />
                  <Input
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="رقم واتساب"
                    className="text-right bg-white border-gray-200"
                    dir="ltr"
                  />
                  <div className="pt-2 border-t">
                    <p className="text-sm text-[#01411C] font-bold">ترخيص فال: {formData.whatsapp}</p>
                    <p className="text-sm text-gray-600">{formData.company}</p>
                    <p className="text-sm text-gray-500">{formData.companyEn}</p>
                    <a href={formData.website} className="text-sm text-blue-600 underline">{formData.website}</a>
                  </div>
                </div>

                {/* الهاشتاقات */}
                <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#01411C] mb-3">
                    <Hash className="w-4 h-4" />
                    الهاشتاقات / Hashtags
                  </label>
                  <p className="text-xs text-gray-500 mb-3">بناءً على الهاشتاقات ستظهر عروض أخرى مشابهة في نفس المدينة والحي</p>
                  
                  {/* إضافة هاشتاق جديد */}
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newHashtag}
                      onChange={e => setNewHashtag(e.target.value)}
                      placeholder="أضف هاشتاق جديد..."
                      className="flex-1 bg-white"
                      onKeyPress={e => e.key === 'Enter' && addHashtag()}
                    />
                    <Button
                      onClick={addHashtag}
                      size="sm"
                      className="bg-[#01411C] hover:bg-[#01411C]/90 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* عرض الهاشتاقات */}
                  <div className="flex flex-wrap gap-2">
                    {formData.hashtags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#01411C] text-white rounded-full text-sm"
                      >
                        {tag}
                        <button 
                          onClick={() => removeHashtag(tag)}
                          className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'owner' && (
              <div className="space-y-5">
                {/* زر الانتقال الى بطاقة اسم المالك */}
                <Button
                  onClick={() => {
                    // فتح بطاقة المالك داخل إدارة الأعمال (CRM)
                    const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
                    const matched = listing.linkedCustomerId
                      ? customers.find((c: any) => c.id === listing.linkedCustomerId)
                      : customers.find((c: any) => (c.phone && c.phone === formData.ownerMobile) || c.name === formData.ownerName);

                    const customerId = matched?.id || listing.linkedCustomerId;

                    if (!customerId) {
                      toast({ title: '⚠️ لم يتم العثور على بطاقة المالك بعد' , variant: 'destructive' });
                      return;
                    }

                    window.dispatchEvent(new CustomEvent('openCustomerDetails', {
                      detail: { customerId, activeTab: 'overview' }
                    }));
                  }}
                  className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#01411C] font-bold"
                >
                  <User className="w-4 h-4 ml-2" />
                  الانتقال الى بطاقة اسم المالك
                </Button>
                
                {/* اسم المالك */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <User className="w-4 h-4 text-[#01411C]" />
                    اسم المالك / Owner Name
                  </label>
                  <Input
                    value={formData.ownerName}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="اسم المالك الكامل"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* تاريخ الميلاد */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-[#01411C]" />
                    تاريخ الميلاد / Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.ownerBirthDate}
                    onChange={e => setFormData({ ...formData, ownerBirthDate: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* رقم الجوال */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 text-[#01411C]" />
                    رقم الجوال / Mobile Number
                  </label>
                  <Input
                    value={formData.ownerMobile}
                    onChange={e => setFormData({ ...formData, ownerMobile: e.target.value })}
                    placeholder="+966500000000"
                    className="bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>

                {/* رقم الواتساب */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    رقم واتساب / WhatsApp
                  </label>
                  <Input
                    value={formData.ownerWhatsapp}
                    onChange={e => setFormData({ ...formData, ownerWhatsapp: e.target.value })}
                    placeholder="رقم الواتساب"
                    className="bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>

                {/* رقم الهوية */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 text-[#01411C]" />
                    رقم الهوية / ID Number
                  </label>
                  <Input
                    value={(formData as any).ownerIdNumber || ''}
                    onChange={e => setFormData({ ...(formData as any), ownerIdNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                    placeholder="10 أرقام"
                    className="bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>

                {/* العنوان الوطني */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Home className="w-4 h-4 text-[#01411C]" />
                    العنوان الوطني للمالك / National Address
                  </label>
                  <Textarea
                    value={formData.ownerNationalAddress}
                    onChange={e => setFormData({ ...formData, ownerNationalAddress: e.target.value })}
                    placeholder="العنوان الوطني الكامل..."
                    rows={2}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* رابط الموقع من قوقل */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-[#01411C]" />
                    أو رابط الموقع من قوقل / Google Maps Link
                  </label>
                  <Input
                    value={formData.ownerGoogleLocation}
                    onChange={e => setFormData({ ...formData, ownerGoogleLocation: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>

                {/* ملاحظات المالك */}
                <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#01411C] mb-2">
                    <FileText className="w-4 h-4" />
                    ملاحظات بخصوص المالك / Owner Notes
                  </label>
                  <p className="text-xs text-gray-500 mb-2">ملاحظات خاصة أو طلبات المالك أو شروطه</p>
                  <Textarea
                    value={formData.ownerNotes}
                    onChange={e => setFormData({ ...formData, ownerNotes: e.target.value })}
                    placeholder="أي ملاحظات أو شروط خاصة بالمالك..."
                    rows={4}
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>
            )}

            {activeTab === 'deed' && (
              <div className="space-y-5">
                {/* رقم الصك */}
                <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#01411C] mb-2">
                    <FileCheck className="w-4 h-4" />
                    رقم الصك / Deed Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.deedNumber}
                      onChange={e => setFormData({ ...formData, deedNumber: e.target.value })}
                      placeholder="أدخل رقم الصك"
                      className="flex-1 bg-white border-gray-200"
                      dir="ltr"
                    />
                    <Button
                      onClick={verifyDeed}
                      disabled={deedVerificationStatus === 'verifying'}
                      className={`px-4 ${
                        deedVerificationStatus === 'verified' ? 'bg-green-500 hover:bg-green-600' :
                        deedVerificationStatus === 'failed' ? 'bg-red-500 hover:bg-red-600' :
                        'bg-[#01411C] hover:bg-[#01411C]/90'
                      } text-white`}
                    >
                      {deedVerificationStatus === 'verifying' ? (
                        <span className="animate-spin">⏳</span>
                      ) : deedVerificationStatus === 'verified' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : deedVerificationStatus === 'failed' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        'تحقق'
                      )}
                    </Button>
                  </div>
                  {deedVerificationStatus === 'verified' && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> تم التحقق من الصك بنجاح
                    </p>
                  )}
                  {deedVerificationStatus === 'failed' && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> لم يتم العثور على الصك - تحقق من الرقم
                    </p>
                  )}
                </div>

                {/* تاريخ الصك */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-[#01411C]" />
                    تاريخ الصك / Deed Date
                  </label>
                  <Input
                    type="date"
                    value={formData.deedDate}
                    onChange={e => setFormData({ ...formData, deedDate: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* رفع صورة الصك */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Upload className="w-4 h-4 text-[#01411C]" />
                    رفع صورة من الصك / Upload Deed Image
                  </label>
                  <input
                    type="file"
                    ref={deedImageInputRef}
                    onChange={handleDeedImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {formData.deedImage ? (
                    <div className="relative">
                      <img 
                        src={formData.deedImage} 
                        alt="صورة الصك" 
                        className="w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => setFormData({ ...formData, deedImage: null })}
                          className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deedImageInputRef.current?.click()}
                          className="w-8 h-8 bg-[#01411C] hover:bg-[#01411C]/90 rounded-full flex items-center justify-center text-white"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => deedImageInputRef.current?.click()}
                      className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#01411C] transition-colors bg-gray-50"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">اضغط لرفع صورة الصك</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG حتى 10MB</span>
                    </button>
                  )}
                </div>

                {/* ملاحظات الصك */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-[#01411C]" />
                    الملاحظات على الصك / Deed Notes
                  </label>
                  <Textarea
                    value={formData.deedNotes}
                    onChange={e => setFormData({ ...formData, deedNotes: e.target.value })}
                    placeholder="أي ملاحظات على الصك..."
                    rows={3}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* ملاحظات خاصة على العقار */}
                <div className="bg-[#01411C]/5 rounded-xl p-4 border border-[#01411C]/20">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#01411C] mb-2">
                    <Home className="w-4 h-4" />
                    ملاحظات خاصة على العقار / Property Notes
                  </label>
                  <Textarea
                    value={formData.propertyNotes}
                    onChange={e => setFormData({ ...formData, propertyNotes: e.target.value })}
                    placeholder="أي ملاحظات خاصة بالعقار..."
                    rows={4}
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>
            )}

            {activeTab === 'rental' && (
              <div className="space-y-5">
                {/* مدة العقد */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Timer className="w-4 h-4 text-[#01411C]" />
                    مدة العقد / Contract Duration
                  </label>
                  <select
                    value={formData.contractDuration}
                    onChange={e => setFormData({ ...formData, contractDuration: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {month} {month === 1 ? 'شهر' : month <= 10 ? 'أشهر' : 'شهر'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* تاريخ ابتداء العقد */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-[#01411C]" />
                    تاريخ ابتداء العقد / Contract Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.contractStartDate}
                    onChange={e => setFormData({ ...formData, contractStartDate: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* هل لازال مأجر */}
                <div className="bg-[#01411C]/5 rounded-xl p-4 border border-[#01411C]/20">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isCurrentlyRented}
                      onChange={e => setFormData({ ...formData, isCurrentlyRented: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-[#01411C] focus:ring-[#01411C]"
                    />
                    <span className="font-bold text-[#01411C] flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      لازال مأجر / Currently Rented
                    </span>
                  </label>

                  {/* عرض المتبقي من العقد */}
                  {formData.isCurrentlyRented && formData.contractStartDate && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-[#01411C]/20">
                      {(() => {
                        const remaining = calculateRemainingRental();
                        return remaining.isExpired ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold">انتهى العقد</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[#01411C]">
                            <Clock className="w-5 h-5" />
                            <span className="font-bold">
                              المتبقي: {remaining.months > 0 && `${remaining.months} شهر`} {remaining.days > 0 && `و ${remaining.days} يوم`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* تاريخ انتهاء العقد */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-red-500" />
                    تاريخ انتهاء العقد / Contract End Date
                  </label>
                  <Input
                    type="date"
                    value={formData.contractEndDate || calculateContractEndDate()}
                    onChange={e => setFormData({ ...formData, contractEndDate: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                  {formData.contractStartDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      يتم حسابه تلقائياً بناءً على تاريخ البداية ومدة العقد
                    </p>
                  )}
                </div>

                {/* رفع ملف عقد التأجير */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <FileUp className="w-4 h-4 text-[#01411C]" />
                    رفع ملف عقد التأجير / Upload Rental Contract
                  </label>
                  <input
                    type="file"
                    ref={rentalContractInputRef}
                    onChange={handleRentalContractUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  {formData.rentalContractFile ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-bold text-green-800">{formData.rentalContractFileName}</p>
                        <p className="text-xs text-green-600">تم رفع الملف بنجاح</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFormData({ ...formData, rentalContractFile: null, rentalContractFileName: '' })}
                          className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rentalContractInputRef.current?.click()}
                          className="w-8 h-8 bg-[#01411C] hover:bg-[#01411C]/90 rounded-full flex items-center justify-center text-white"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => rentalContractInputRef.current?.click()}
                      className="w-full py-10 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#01411C] transition-colors bg-gray-50"
                    >
                      <FileUp className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">اضغط لرفع ملف عقد التأجير</span>
                      <span className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG</span>
                    </button>
                  )}
                </div>

                {/* رابط التحقق من منصة إيجار */}
                <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#01411C] mb-3">
                    <Link className="w-4 h-4" />
                    التحقق من منصة إيجار / Ejar Platform Verification
                  </label>
                  <div className="flex gap-2">
                    <a
                      href="https://ejar.sa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 px-4 bg-white border border-[#01411C] text-[#01411C] rounded-lg hover:bg-[#01411C]/5 transition-colors text-sm font-medium"
                    >
                      فتح منصة إيجار
                    </a>
                    <Button
                      onClick={verifyEjar}
                      disabled={ejarVerificationStatus === 'verifying'}
                      className={`px-6 ${
                        ejarVerificationStatus === 'verified' ? 'bg-green-500 hover:bg-green-600' :
                        'bg-[#01411C] hover:bg-[#01411C]/90'
                      } text-white`}
                    >
                      {ejarVerificationStatus === 'verifying' ? (
                        <span className="animate-spin">⏳</span>
                      ) : ejarVerificationStatus === 'verified' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        'تحقق'
                      )}
                    </Button>
                  </div>
                  {ejarVerificationStatus === 'verified' && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> تم التحقق من العقد في منصة إيجار
                    </p>
                  )}
                </div>

                {/* زر تم التأجير */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleRentalConfirmed}
                    disabled={!formData.contractStartDate || !formData.ownerName}
                    className="w-full py-4 bg-[#01411C] hover:bg-[#01411C]/90 text-white text-lg font-bold rounded-xl"
                  >
                    <CheckCircle className="w-5 h-5 ml-2" />
                    تم التأجير
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    سيتم حفظ معلومات التأجير في التقويم وبطاقة المالك تلقائياً
                  </p>
                </div>

                {/* خيارات انتهاء العقد */}
                {showRentalEndOptions && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      انتهى عقد التأجير - اختر الإجراء
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleRentalEndOption('renewed')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <RefreshCw className="w-4 h-4 ml-2" />
                        تم التجديد
                      </Button>
                      <Button
                        onClick={() => handleRentalEndOption('moved_out')}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        <LogOut className="w-4 h-4 ml-2" />
                        تم الخروج
                      </Button>
                      <Button
                        onClick={() => handleRentalEndOption('extension')}
                        variant="outline"
                        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                      >
                        <Timer className="w-4 h-4 ml-2" />
                        تم طلب مهلة
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* مودال زوم الصورة */}
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
              src={images[selectedImageIndex]}
              alt={listing.title}
              className="max-w-[95vw] max-h-[95vh] object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(prev => (prev + 1) % images.length);
                  }}
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
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === selectedImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfferEditPage;
