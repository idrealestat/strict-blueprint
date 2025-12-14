/**
 * OfferEditPage.tsx
 * صفحة تعديل العرض - تظهر عند لمس العرض
 * تصميم مشابه للصورة المرفقة مع التبويبات والصور
 */

import React, { useState } from 'react';
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
  ZoomIn
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
  images?: string[];
  ownerName?: string;
  ownerPhone?: string;
  street?: string;
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
  const [formData, setFormData] = useState({
    title: listing.title || '',
    sku: `AD${listing.id.slice(0, 6).toUpperCase()}`,
    price: listing.price || 0,
    priceType: 'total',
    offerDiscount: false,
    bulkDiscount: false,
    minOrder: 1,
    description: listing.description || '',
    phone: listing.ownerPhone || '+966541176696',
    whatsapp: '720' + listing.id.slice(0, 7),
    website: 'https://www.id-realestat.com',
    company: 'شركة مبتكر ومميز العقارية',
    companyEn: 'Innovative and Distinguished Real Estate Company',
    city: listing.city || '',
    district: listing.district || '',
    street: listing.street || '',
    area: listing.area || 0,
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 0,
    propertyType: listing.propertyType || ''
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  const images = listing.images?.length ? listing.images : [
    listing.image,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  ];

  const tabs = [
    { id: 'basic', label: 'معلومات أساسية', labelEn: 'Basic info' },
    { id: 'variants', label: 'المتغيرات', labelEn: 'Variants' },
    { id: 'inventory', label: 'المخزون', labelEn: 'Inventory' },
    { id: 'more', label: 'المزيد', labelEn: 'More' }
  ];

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

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-white"
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
          <div className="border-b border-gray-200 bg-white sticky top-14 z-40">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[80px] py-3 px-4 text-center text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[#01411C] border-b-2 border-[#01411C]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="block text-xs text-gray-400">{tab.labelEn}</span>
                  <span className="block">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* الصور تحت التبويبات مباشرة */}
          <div className="bg-gray-100 p-4">
            {/* الصورة الرئيسية الكبيرة */}
            <div 
              className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-3 cursor-pointer"
              onClick={() => setShowZoom(true)}
            >
              <img
                src={images[selectedImageIndex]}
                alt="العرض"
                className="w-full h-full object-cover"
              />
              <button
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setShowZoom(true); }}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev + 1) % images.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* الصور المصغرة */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                    index === selectedImageIndex 
                      ? 'ring-2 ring-[#01411C] scale-105' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <button className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all">
                <Plus className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* المحتوى - نموذج التعديل */}
          <div className="p-4 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
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

                {/* خيارات الخصم */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.offerDiscount}
                      onChange={e => setFormData({ ...formData, offerDiscount: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-[#01411C] focus:ring-[#01411C]"
                    />
                    <span className="text-sm text-gray-700">خصم عرض</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bulkDiscount}
                      onChange={e => setFormData({ ...formData, bulkDiscount: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-[#01411C] focus:ring-[#01411C]"
                    />
                    <span className="text-sm text-gray-700">خصم جملة</span>
                  </label>
                </div>

                {/* الوصف */}
                <div>
                  <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#01411C]" />
                      الوصف / Description
                    </span>
                    <span className="text-xs text-gray-400">يُدار بواسطة إعدادات الكتالوج</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="رقم الاعلان: 0453489&#10;شقة مؤثثة للبيع في فندق 4 نجوم..."
                    rows={6}
                    className="text-right bg-gray-50 border-gray-200"
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
              </div>
            )}

            {activeTab === 'variants' && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-800 mb-2">الحقول المخصصة / Custom Fields</h4>
                  <button className="text-[#01411C] text-sm font-medium flex items-center gap-1">
                    <Settings className="w-4 h-4" />
                    إدارة / Manage
                  </button>
                </div>

                <div>
                  <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                    <span>الفئات الفرعية / Sub categories</span>
                    <span className="text-xs text-gray-400">نظم منتجاتك</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['شقق', 'فلل', 'أراضي', 'تجاري'].map((cat, i) => (
                      <div key={i} className="relative">
                        <img
                          src={images[i % images.length]}
                          alt={cat}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-1 rounded-b-lg">{cat}</span>
                      </div>
                    ))}
                    <button className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#01411C] transition-colors">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                  <button className="mt-2 text-[#01411C] text-sm font-medium flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    إضافة فئات فرعية
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Package className="w-4 h-4 text-[#01411C]" />
                    المساحة / Area
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.area}
                      onChange={e => setFormData({ ...formData, area: Number(e.target.value) })}
                      className="flex-1 bg-gray-50 border-gray-200"
                    />
                    <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm">متر مربع</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">غرف النوم</label>
                    <Input
                      type="number"
                      value={formData.bedrooms}
                      onChange={e => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">الحمامات</label>
                    <Input
                      type="number"
                      value={formData.bathrooms}
                      onChange={e => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-[#01411C]" />
                    الموقع / Location
                  </label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="المدينة"
                    className="mb-2 bg-gray-50 border-gray-200"
                  />
                  <Input
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    placeholder="الحي"
                    className="mb-2 bg-gray-50 border-gray-200"
                  />
                  <Input
                    value={formData.street}
                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                    placeholder="الشارع"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
            )}

            {activeTab === 'more' && (
              <div className="space-y-5">
                {/* الفيديو والصور */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Video className="w-4 h-4 text-[#01411C]" />
                    الفيديو والصور / Video/Pictures
                  </label>
                  <p className="text-xs text-gray-400 mb-3">اختر اللون والصورة</p>
                  <div className="flex gap-3">
                    <button className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#01411C] transition-colors">
                      <Video className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">إضافة فيديو</span>
                    </button>
                    <button className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#01411C] transition-colors">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">إضافة صور</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 text-[#01411C]" />
                    الموقع الإلكتروني
                  </label>
                  <Input
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    اسم الشركة
                  </label>
                  <Input
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="mb-2 bg-gray-50 border-gray-200"
                  />
                  <Input
                    value={formData.companyEn}
                    onChange={e => setFormData({ ...formData, companyEn: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                    dir="ltr"
                  />
                </div>
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
