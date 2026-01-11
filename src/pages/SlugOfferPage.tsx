/**
 * SlugOfferPage.tsx
 * صفحة إرسال عرض عقاري - شاملة جميع الحقول مع رفع الصور والفيديو
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useEventTracker } from '@/hooks/useEventTracker';
import {
  ArrowRight, Loader2, Send, Upload, Home, MapPin, User, Phone,
  CreditCard, FileText, Building, X, Image as ImageIcon, Video, Star,
  Camera, GripVertical, Play, Expand, Globe, Link, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import PublicFormLayout, { BrokerInfo } from '@/pages/public-forms/PublicFormLayout';

// ===================== Types =====================

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  isMain: boolean;
  fileName: string;
}

interface BusinessCardData {
  id: string;
  slug: string;
  user_id: string;
  data: {
    userName?: string;
    companyName?: string;
    primaryPhone?: string;
    email?: string;
    profileImage?: string;
    logoImage?: string;
    location?: string;
    falLicense?: string;
  };
}

// ===================== Constants =====================

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "أرض زراعية", "استراحة"];
const categories = ["سكني", "تجاري", "صناعي", "زراعي"];
const purposes = ["للبيع", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف", "نجران", "القصيم", "حائل", "جازان", "ينبع", "الأحساء", "الجبيل", "خميس مشيط", "الباحة", "عرعر", "سكاكا"];
const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "مطبخ مؤثث", "غير مؤثث"];
const facadeOptions = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];
const entranceOptions = ["مدخل", "مدخلين", "ثلاث مداخل أو أكثر"];

const defaultFeatures = [
  "مسبح خاص", "حديقة", "مصعد", "موقف سيارات", "غرفة خادمة",
  "غرفة سائق", "مجلس", "صالة", "مطبخ مجهز", "تكييف مركزي",
  "تدفئة مركزية", "نظام أمان", "كاميرات مراقبة", "انتركم", "قبو"
];

// ===================== Component =====================

const SlugOfferPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trackPageView, track } = useEventTracker();
  const [businessCard, setBusinessCard] = useState<BusinessCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // معلومات المالك
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerIdNumber: '',
    ownerNationalAddress: '',
    isOwner: false,
    
    // معلومات الصك
    deedNumber: '',
    deedDate: '',
    
    // معلومات العقار
    propertyType: '',
    category: '',
    purpose: '',
    
    // الموقع
    city: '',
    district: '',
    street: '',
    
    // المواصفات
    area: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    livingRooms: '',
    floors: '',
    floorNumber: '',
    facade: '',
    furnishing: '',
    propertyAge: '',
    streetWidth: '',
    
    // مميزات إضافية
    hasLaundryRoom: false,
    hasExtraKitchen: false,
    balconies: '',
    acUnits: '',
    entrances: '',
    warehouses: '',
    
    // المميزات
    features: [] as string[],
    
    // الوصف
    description: '',
    
    // الوسائط
    media: [] as MediaFile[],
    tour3DUrl: '',
    
    // الموافقة
    agreeToTerms: false,
  });

  // Fetch business card
  useEffect(() => {
    const fetchBusinessCard = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setBusinessCard(data as BusinessCardData);
          // Track page view
          trackPageView('offer_form', data.id, 'public_web');
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessCard();
  }, [slug]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  // Upload file to storage
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `offers/${slug}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }, [slug]);

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newMedia: MediaFile[] = [];
    const totalFiles = files.length;
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error(`الملف ${file.name} غير مدعوم`);
        continue;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`الملف ${file.name} كبير جداً`);
        continue;
      }

      const url = await uploadFile(file);
      if (url) {
        newMedia.push({
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          type: isVideo ? 'video' : 'image',
          isMain: formData.media.length === 0 && newMedia.length === 0,
          fileName: file.name,
        });
      }

      uploadedCount++;
      setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
    }

    if (newMedia.length > 0) {
      updateField('media', [...formData.media, ...newMedia]);
      toast.success(`تم رفع ${newMedia.length} ملف بنجاح`);
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove media
  const removeMedia = (mediaId: string) => {
    const updatedMedia = formData.media.filter(m => m.id !== mediaId);
    if (formData.media.find(m => m.id === mediaId)?.isMain && updatedMedia.length > 0) {
      updatedMedia[0].isMain = true;
    }
    updateField('media', updatedMedia);
  };

  // Set as main
  const setAsMain = (mediaId: string) => {
    const updatedMedia = formData.media.map(m => ({
      ...m,
      isMain: m.id === mediaId,
    }));
    updateField('media', updatedMedia);
  };

  const handleSubmit = async () => {
    if (!formData.agreeToTerms) {
      toast.error('يجب الموافقة على الشروط والأحكام');
      return;
    }
    if (!formData.ownerName || !formData.ownerPhone) {
      toast.error('يرجى إدخال اسم ورقم هاتف المالك');
      return;
    }
    if (!formData.propertyType || !formData.city) {
      toast.error('يرجى اختيار نوع العقار والمدينة');
      return;
    }

    setIsSubmitting(true);
    
    // Track offer submission
    track({
      eventName: 'offer_submitted',
      channel: 'public_web',
      entityType: 'offer_form',
      entityId: businessCard?.id,
      metadata: { propertyType: formData.propertyType, city: formData.city, purpose: formData.purpose }
    });
    
    // Simulate submission - in real app, save to database
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('تم إرسال العرض بنجاح! سيتواصل معك الوسيط قريباً');
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#01411C] to-[#065f41]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (notFound || !businessCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#01411C] to-[#065f41] text-white p-4">
        <h1 className="text-2xl font-bold mb-4">نموذج إرسال العرض غير متاح</h1>
        <p className="text-gray-300 mb-6">لم يتم العثور على الصفحة المطلوبة</p>
        <Button onClick={() => navigate('/')} className="bg-[#D4AF37] text-[#01411C] hover:bg-[#b8941f]">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  const cardData = businessCard.data;
  const brokerInfo: BrokerInfo = {
    id: businessCard.user_id,
    name: cardData?.userName || 'الوسيط',
    company: cardData?.companyName || '',
    phone: cardData?.primaryPhone || '',
    email: cardData?.email || '',
    location: cardData?.location || '',
    licenseNumber: cardData?.falLicense || '',
    rating: 4.8,
    verified: true,
    profileImage: cardData?.profileImage,
  };

  return (
    <>
      <Helmet>
        <title>إرسال عرض عقاري - {brokerInfo.name}</title>
        <meta name="description" content={`أرسل عرضك العقاري إلى ${brokerInfo.name}`} />
        <link rel="canonical" href={`${window.location.origin}/${slug}/offer`} />
      </Helmet>

      <PublicFormLayout broker={brokerInfo} title="إرسال عرض عقاري">
        <div className="space-y-8">
          
          {/* معلومات المالك */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات المالك
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input value={formData.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} placeholder="اسم المالك" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال *</Label>
                  <Input type="tel" value={formData.ownerPhone} onChange={(e) => updateField('ownerPhone', e.target.value)} placeholder="05xxxxxxxx" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={formData.ownerEmail} onChange={(e) => updateField('ownerEmail', e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهوية</Label>
                  <Input value={formData.ownerIdNumber} onChange={(e) => updateField('ownerIdNumber', e.target.value)} placeholder="رقم الهوية الوطنية" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>العنوان الوطني</Label>
                <Input value={formData.ownerNationalAddress} onChange={(e) => updateField('ownerNationalAddress', e.target.value)} placeholder="العنوان الوطني الكامل" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isOwner" checked={formData.isOwner} onCheckedChange={(c) => updateField('isOwner', c === true)} />
                <Label htmlFor="isOwner" className="cursor-pointer text-sm">أنا مالك العقار</Label>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الصك */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                معلومات الصك
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الصك</Label>
                  <Input value={formData.deedNumber} onChange={(e) => updateField('deedNumber', e.target.value)} placeholder="رقم الصك" />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الصك</Label>
                  <Input type="date" value={formData.deedDate} onChange={(e) => updateField('deedDate', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات العقار */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <Building className="w-5 h-5" />
                معلومات العقار
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>نوع العقار *</Label>
                  <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الغرض *</Label>
                  <Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {purposes.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الموقع */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>المدينة *</Label>
                  <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الحي</Label>
                  <Input value={formData.district} onChange={(e) => updateField('district', e.target.value)} placeholder="اسم الحي" />
                </div>
                <div className="space-y-2">
                  <Label>الشارع</Label>
                  <Input value={formData.street} onChange={(e) => updateField('street', e.target.value)} placeholder="اسم الشارع" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المواصفات */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <Home className="w-5 h-5" />
                المواصفات التفصيلية
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>المساحة (م²)</Label>
                  <Input type="number" value={formData.area} onChange={(e) => updateField('area', e.target.value)} placeholder="المساحة" />
                </div>
                <div className="space-y-2">
                  <Label>السعر (ريال)</Label>
                  <Input type="number" value={formData.price} onChange={(e) => updateField('price', e.target.value)} placeholder="السعر" />
                </div>
                <div className="space-y-2">
                  <Label>غرف النوم</Label>
                  <Input type="number" value={formData.bedrooms} onChange={(e) => updateField('bedrooms', e.target.value)} placeholder="العدد" />
                </div>
                <div className="space-y-2">
                  <Label>دورات المياه</Label>
                  <Input type="number" value={formData.bathrooms} onChange={(e) => updateField('bathrooms', e.target.value)} placeholder="العدد" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>الصالات</Label>
                  <Input type="number" value={formData.livingRooms} onChange={(e) => updateField('livingRooms', e.target.value)} placeholder="العدد" />
                </div>
                <div className="space-y-2">
                  <Label>الأدوار</Label>
                  <Input type="number" value={formData.floors} onChange={(e) => updateField('floors', e.target.value)} placeholder="العدد" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الدور</Label>
                  <Input value={formData.floorNumber} onChange={(e) => updateField('floorNumber', e.target.value)} placeholder="الدور" />
                </div>
                <div className="space-y-2">
                  <Label>عرض الشارع (م)</Label>
                  <Input type="number" value={formData.streetWidth} onChange={(e) => updateField('streetWidth', e.target.value)} placeholder="العرض" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الواجهة</Label>
                  <Select value={formData.facade} onValueChange={(v) => updateField('facade', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {facadeOptions.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التأثيث</Label>
                  <Select value={formData.furnishing} onValueChange={(v) => updateField('furnishing', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {furnishingOptions.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>عمر العقار (سنة)</Label>
                  <Input type="number" value={formData.propertyAge} onChange={(e) => updateField('propertyAge', e.target.value)} placeholder="العمر" />
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>المداخل</Label>
                  <Select value={formData.entrances} onValueChange={(v) => updateField('entrances', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {entranceOptions.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المستودعات</Label>
                  <Input type="number" value={formData.warehouses} onChange={(e) => updateField('warehouses', e.target.value)} placeholder="العدد" />
                </div>
                <div className="space-y-2">
                  <Label>البلكونات</Label>
                  <Input type="number" value={formData.balconies} onChange={(e) => updateField('balconies', e.target.value)} placeholder="العدد" />
                </div>
                <div className="space-y-2">
                  <Label>وحدات التكييف</Label>
                  <Input type="number" value={formData.acUnits} onChange={(e) => updateField('acUnits', e.target.value)} placeholder="العدد" />
                </div>
              </div>

              <div className="flex gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="laundry" checked={formData.hasLaundryRoom} onCheckedChange={(c) => updateField('hasLaundryRoom', c === true)} />
                  <Label htmlFor="laundry" className="cursor-pointer">غرفة غسيل</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="extraKitchen" checked={formData.hasExtraKitchen} onCheckedChange={(c) => updateField('hasExtraKitchen', c === true)} />
                  <Label htmlFor="extraKitchen" className="cursor-pointer">مطبخ إضافي</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المميزات */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <Star className="w-5 h-5" />
                المميزات
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {defaultFeatures.map(feature => (
                  <Badge
                    key={feature}
                    variant={formData.features.includes(feature) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      formData.features.includes(feature) 
                        ? 'bg-[#01411C] text-white hover:bg-[#065f41]' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleFeature(feature)}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* صور وفيديوهات العقار */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <Camera className="w-5 h-5" />
                صور وفيديوهات العقار
                {formData.media.length > 0 && (
                  <Badge variant="outline" className="mr-2 text-xs">
                    {formData.media.length} ملف
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Upload Button */}
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-[#D4AF37] rounded-lg p-8 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                    <p className="text-[#01411C] font-semibold">جاري الرفع... {uploadProgress}%</p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-[#D4AF37] mb-3" />
                    <p className="text-[#01411C] font-semibold text-lg">اضغط لرفع الصور والفيديوهات</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      PNG, JPG, WEBP, MP4, MOV - حتى 10MB للصور و 50MB للفيديو
                    </p>
                  </>
                )}
              </div>

              {/* Media Grid */}
              {formData.media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.media.map((item, index) => (
                    <div
                      key={item.id}
                      className={`relative aspect-square rounded-lg overflow-hidden group ${
                        item.isMain ? 'ring-2 ring-[#D4AF37] ring-offset-2' : ''
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="relative w-full h-full bg-black">
                          <video src={item.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-12 h-12 text-white fill-white" />
                          </div>
                        </div>
                      )}

                      {/* Order Number */}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold">
                        {index + 1}
                      </div>

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {item.type === 'image' && !item.isMain && (
                          <Button size="sm" variant="secondary" onClick={() => setAsMain(item.id)} className="h-8">
                            <Star className="w-4 h-4 ml-1" />
                            رئيسية
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => removeMedia(item.id)} className="h-8">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Main Badge */}
                      {item.isMain && (
                        <div className="absolute top-2 right-2 bg-[#D4AF37] text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          رئيسية
                        </div>
                      )}

                      {/* Video Badge */}
                      {item.type === 'video' && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                          <Video className="w-3 h-3 inline ml-1" />
                          فيديو
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 3D Tour */}
              <div className="pt-4 border-t">
                <Label className="text-[#01411C] flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4" />
                  رابط تصوير 3D
                </Label>
                <Input
                  value={formData.tour3DUrl}
                  onChange={(e) => updateField('tour3DUrl', e.target.value)}
                  placeholder="https://my.matterport.com/show/?m=..."
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>

          {/* الوصف */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="text-[#01411C] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                وصف العقار
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="أدخل وصف تفصيلي للعقار يتضمن مميزاته وموقعه..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* الموافقة والإرسال */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => updateField('agreeToTerms', checked === true)}
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                أوافق على الشروط والأحكام وأتعهد بصحة المعلومات المدخلة
              </Label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#01411C] hover:bg-[#065f41] text-white py-6 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 ml-2" />
                  إرسال العرض
                </>
              )}
            </Button>
          </div>
        </div>
      </PublicFormLayout>
    </>
  );
};

export default SlugOfferPage;