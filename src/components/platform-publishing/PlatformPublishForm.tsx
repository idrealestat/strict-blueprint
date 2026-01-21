/**
 * PlatformPublishForm.tsx
 * نموذج النشر على المنصات - المكون الرئيسي
 * يستخدم نفس منطق PropertyPublishForm مع إضافة اختيار المنصات
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building,
  MapPin,
  User,
  Phone,
  FileText,
  CreditCard,
  Home,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Image,
  Video,
  Link2,
  Hash,
  Sparkles,
  Globe,
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalPlatform, 
  PlatformPublishedOffer, 
  PlatformPublishResult,
  AVAILABLE_PLATFORMS 
} from './types';
import { usePublishedAdsManager, PublishedAdData } from '@/hooks/usePublishedAdsManager';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import PropertyMediaUpload, { MediaFile } from '@/components/platform/PropertyMediaUpload';

// Constants
const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "أرض زراعية", "استراحة"];
const categories = ["سكني", "تجاري", "صناعي", "زراعي"];
const purposes = ["للبيع", "للإيجار"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف", "نجران", "القصيم", "حائل", "جازان", "ينبع", "الأحساء", "الجبيل", "خميس مشيط", "الباحة", "عرعر", "سكاكا"];
const furnishingOptions = ["مفروشة بالكامل", "شبه مفروشة", "مطبخ مؤثث", "غير مؤثث"];
const facadeOptions = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];

interface PlatformPublishFormProps {
  connectedPlatforms: ExternalPlatform[];
  onPublishComplete: (offer: PlatformPublishedOffer) => void;
  onCancel: () => void;
}

export default function PlatformPublishForm({
  connectedPlatforms,
  onPublishComplete,
  onCancel,
}: PlatformPublishFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'owner' | 'deed' | 'rental' | 'platforms'>('basic');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishResults, setPublishResults] = useState<PlatformPublishResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic
    propertyType: '',
    category: '',
    purpose: '',
    price: '',
    area: '',
    city: '',
    district: '',
    street: '',
    bedrooms: '',
    bathrooms: '',
    livingRooms: '',
    floors: '',
    propertyAge: '',
    furnishing: '',
    facade: '',
    streetWidth: '',
    description: '',
    adLicense: '',
    adLicenseDate: '',
    adLicenseDuration: '30',
    
    // Owner
    ownerName: '',
    ownerPhone: '',
    ownerIdNumber: '',
    ownerBirthDate: '',
    ownerNationalAddress: '',
    ownerCity: '',
    ownerDistrict: '',
    
    // Deed
    deedNumber: '',
    deedDate: '',
    deedCity: '',
    
    // Rental
    isCurrentlyRented: false,
    contractDuration: '',
    contractStartDate: '',
    contractEndDate: '',
    rentalContractFile: '',
    
    // Media
    media: [] as MediaFile[],
    tour3DUrl: '',
    
    // Platforms
    selectedPlatforms: [] as string[],
    
    // Features
    features: [] as string[],
    customFeatures: [] as string[],
    hashtags: [] as string[],
    customHashtags: [] as string[],
  });

  const { publishAdWithCustomerLink } = usePublishedAdsManager();
  const { data: businessCardData } = useBusinessCardData();

  // Auto-fill broker phone
  useEffect(() => {
    if (businessCardData && !formData.ownerPhone) {
      // Don't auto-fill owner phone with broker phone
    }
  }, [businessCardData]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(id => id !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }));
  };

  // Validation
  const validateForm = (): { valid: boolean; message: string } => {
    if (!formData.propertyType || !formData.purpose || !formData.city) {
      return { valid: false, message: 'يرجى ملء الحقول المطلوبة: نوع العقار، الغرض، المدينة' };
    }
    if (!formData.ownerName || !formData.ownerPhone) {
      return { valid: false, message: 'يرجى ملء معلومات المالك: الاسم ورقم الجوال' };
    }
    if (!formData.adLicense) {
      return { valid: false, message: 'يرجى إدخال رقم الترخيص الإعلاني' };
    }
    if (formData.selectedPlatforms.length === 0) {
      return { valid: false, message: 'يرجى اختيار منصة واحدة على الأقل للنشر' };
    }
    return { valid: true, message: '' };
  };

  // Handle publish
  const handlePublish = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);
    setShowResults(false);
    const results: PlatformPublishResult[] = [];

    try {
      // 1. Create offer data
      const offerId = `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const title = `${formData.purpose} - ${formData.propertyType} - ${formData.area}م²`.trim();

      // 2. Publish to each selected platform (simulate)
      const totalPlatforms = formData.selectedPlatforms.length;
      for (let i = 0; i < totalPlatforms; i++) {
        const platformId = formData.selectedPlatforms[i];
        const platform = AVAILABLE_PLATFORMS.find(p => p.id === platformId);
        
        setPublishProgress(((i + 1) / (totalPlatforms + 1)) * 80);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Random success/failure for demo
        const success = Math.random() > 0.2;
        
        results.push({
          platformId,
          platformName: platform?.nameAr || platformId,
          status: success ? 'success' : 'failed',
          externalId: success ? `ext_${Date.now()}` : undefined,
          publishedAt: success ? new Date().toISOString() : undefined,
          error: success ? undefined : 'فشل الاتصال بالمنصة',
          views: 0,
          clicks: 0,
          leads: 0,
        });
      }

      setPublishProgress(90);

      // 3. Create ad data for local system (منصتي + إدارة العملاء)
      const adData: PublishedAdData = {
        id: offerId,
        title,
        propertyType: formData.propertyType,
        category: formData.category,
        purpose: formData.purpose,
        area: formData.area,
        propertyCategory: formData.category,
        platformPath: '',
        locationDetails: {
          city: formData.city,
          district: formData.district,
          street: formData.street,
          buildingNumber: '',
          postalCode: '',
          additionalNumber: '',
        },
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        livingRooms: formData.livingRooms,
        floors: formData.floors,
        propertyAge: formData.propertyAge,
        furnishing: formData.furnishing,
        facade: formData.facade,
        streetWidth: formData.streetWidth,
        features: formData.features,
        customFeatures: formData.customFeatures,
        warranties: {
          structuralWarranty: false,
          structuralYears: '',
          acWarranty: false,
          acYears: '',
          plumbingWarranty: false,
          plumbingYears: '',
          electricalWarranty: false,
          electricalYears: '',
          customWarranties: [],
        },
        hashtags: formData.hashtags,
        customHashtags: formData.customHashtags,
        aiDescription: formData.description,
        descriptionTone: 'احترافي',
        descriptionLength: 'متوسط',
        price: formData.price,
        priceType: '',
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerIdNumber: formData.ownerIdNumber,
        ownerBirthDate: formData.ownerBirthDate,
        ownerNationalAddress: formData.ownerNationalAddress,
        ownerCity: formData.ownerCity,
        ownerDistrict: formData.ownerDistrict,
        deedNumber: formData.deedNumber,
        deedDate: formData.deedDate,
        deedCity: formData.deedCity,
        adLicense: formData.adLicense,
        adLicenseDate: formData.adLicenseDate,
        adLicenseDuration: formData.adLicenseDuration,
        images: formData.media.filter(m => m.type === 'image').map(m => m.url),
        videos: formData.media.filter(m => m.type === 'video').map(m => m.url),
        tour3DUrl: formData.tour3DUrl,
        publishedAt: new Date().toISOString(),
        status: 'published',
        source: 'platform_publishing',
      };

      // 4. Link to customer management (same as منصتي)
      const linkResult = await publishAdWithCustomerLink(adData);
      
      setPublishProgress(100);
      setPublishResults(results);
      setShowResults(true);

      // 5. Create platform published offer
      const platformOffer: PlatformPublishedOffer = {
        id: offerId,
        title,
        propertyType: formData.propertyType,
        purpose: formData.purpose,
        price: formData.price,
        area: formData.area,
        city: formData.city,
        district: formData.district,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerIdNumber: formData.ownerIdNumber,
        ownerBirthDate: formData.ownerBirthDate,
        ownerNationalAddress: formData.ownerNationalAddress,
        ownerCity: formData.ownerCity,
        ownerDistrict: formData.ownerDistrict,
        deedNumber: formData.deedNumber,
        deedDate: formData.deedDate,
        deedCity: formData.deedCity,
        isCurrentlyRented: formData.isCurrentlyRented,
        contractDuration: formData.contractDuration ? parseInt(formData.contractDuration) : undefined,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        rentalContractFile: formData.rentalContractFile,
        adLicense: formData.adLicense,
        adLicenseDate: formData.adLicenseDate,
        adLicenseDuration: formData.adLicenseDuration,
        images: formData.media.filter(m => m.type === 'image').map(m => m.url),
        videos: formData.media.filter(m => m.type === 'video').map(m => m.url),
        tour3DUrl: formData.tour3DUrl,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        livingRooms: formData.livingRooms,
        floors: formData.floors,
        propertyAge: formData.propertyAge,
        furnishing: formData.furnishing,
        facade: formData.facade,
        streetWidth: formData.streetWidth,
        features: formData.features,
        customFeatures: formData.customFeatures,
        hashtags: formData.hashtags,
        customHashtags: formData.customHashtags,
        aiDescription: formData.description,
        publishedPlatforms: results,
        source: 'platform_publishing',
        linkedCustomerId: linkResult.customerId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage
      const existingOffers = JSON.parse(localStorage.getItem('platform_published_offers') || '[]');
      existingOffers.push(platformOffer);
      localStorage.setItem('platform_published_offers', JSON.stringify(existingOffers));

      // Dispatch event to update العروض tab
      window.dispatchEvent(new CustomEvent('platformOfferPublished', { detail: platformOffer }));

      // Success notifications
      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount === totalPlatforms) {
        toast.success(`✅ تم النشر بنجاح على ${successCount} منصات`);
      } else if (successCount > 0) {
        toast.warning(`تم النشر على ${successCount}/${totalPlatforms} منصات`);
      } else {
        toast.error('فشل النشر على جميع المنصات');
      }

      if (linkResult.success) {
        toast.success(`✅ تم ربط العرض مع بطاقة العميل: ${formData.ownerName}`);
      }

      onPublishComplete(platformOffer);

    } catch (error) {
      console.error('Publish error:', error);
      toast.error('حدث خطأ أثناء النشر');
    } finally {
      setIsPublishing(false);
    }
  };

  // Get tab completion status
  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'basic':
        return formData.propertyType && formData.purpose && formData.city && formData.price && formData.adLicense;
      case 'owner':
        return formData.ownerName && formData.ownerPhone;
      case 'deed':
        return formData.deedNumber && formData.deedDate;
      case 'rental':
        return !formData.isCurrentlyRented || (formData.contractDuration && formData.contractStartDate);
      case 'platforms':
        return formData.selectedPlatforms.length > 0;
      default:
        return false;
    }
  };

  const connectedPlatformsList = connectedPlatforms.filter(p => p.status === 'connected');

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">نشر إعلان جديد</h2>
              <p className="text-sm text-muted-foreground">انشر على منصتك والمنصات الخارجية</p>
            </div>
          </div>
          <Badge variant="outline" className="border-[hsl(var(--gold))] text-[hsl(var(--gold))]">
            <Globe className="w-3 h-3 ml-1" />
            {formData.selectedPlatforms.length} منصة مختارة
          </Badge>
        </div>
      </div>

      {/* Publishing Progress */}
      <AnimatePresence>
        {isPublishing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-gradient-to-r from-[hsl(var(--gold))]/10 to-amber-50 border-b"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">جاري النشر...</span>
              <span className="text-sm text-muted-foreground">{Math.round(publishProgress)}%</span>
            </div>
            <Progress value={publishProgress} className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Results Modal */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4 text-center">نتائج النشر</h3>
              <div className="space-y-3">
                {publishResults.map((result) => (
                  <div 
                    key={result.platformId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.status === 'success' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {AVAILABLE_PLATFORMS.find(p => p.id === result.platformId)?.logo}
                      </span>
                      <span className="font-medium">{result.platformName}</span>
                    </div>
                    {result.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600">{result.error}</span>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowResults(false)}
                >
                  إغلاق
                </Button>
                <Button 
                  className="flex-1 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/90"
                  onClick={() => {
                    setShowResults(false);
                    onCancel();
                  }}
                >
                  العودة للقائمة
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 mx-4 mt-4">
          <TabsTrigger value="basic" className="relative text-xs">
            معلومات أساسية
            {getTabStatus('basic') && (
              <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="owner" className="relative text-xs">
            المالك
            {getTabStatus('owner') && (
              <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="deed" className="relative text-xs">
            الصك
            {getTabStatus('deed') && (
              <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="rental" className="relative text-xs">
            الإيجار
            {getTabStatus('rental') && (
              <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="platforms" className="relative text-xs">
            المنصات
            {getTabStatus('platforms') && (
              <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Basic Info Tab */}
          <TabsContent value="basic" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="w-4 h-4 text-[hsl(var(--gold))]" />
                  معلومات العقار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>نوع العقار *</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => updateFormData('propertyType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العقار" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الغرض *</Label>
                    <Select value={formData.purpose} onValueChange={(v) => updateFormData('purpose', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="للبيع / للإيجار" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposes.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>المدينة *</Label>
                    <Select value={formData.city} onValueChange={(v) => updateFormData('city', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الحي</Label>
                    <Input 
                      placeholder="أدخل اسم الحي"
                      value={formData.district}
                      onChange={(e) => updateFormData('district', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>السعر *</Label>
                    <Input 
                      placeholder="السعر بالريال"
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateFormData('price', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>المساحة (م²)</Label>
                    <Input 
                      placeholder="المساحة"
                      type="number"
                      value={formData.area}
                      onChange={(e) => updateFormData('area', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>الغرف</Label>
                    <Input 
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => updateFormData('bedrooms', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>الحمامات</Label>
                    <Input 
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => updateFormData('bathrooms', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>الصالات</Label>
                    <Input 
                      type="number"
                      value={formData.livingRooms}
                      onChange={(e) => updateFormData('livingRooms', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[hsl(var(--gold))]" />
                  الترخيص الإعلاني
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>رقم الترخيص الإعلاني *</Label>
                  <Input 
                    placeholder="أدخل رقم الترخيص"
                    value={formData.adLicense}
                    onChange={(e) => updateFormData('adLicense', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>تاريخ الترخيص</Label>
                    <Input 
                      type="date"
                      value={formData.adLicenseDate}
                      onChange={(e) => updateFormData('adLicenseDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>مدة الترخيص (أيام)</Label>
                    <Input 
                      type="number"
                      value={formData.adLicenseDuration}
                      onChange={(e) => updateFormData('adLicenseDuration', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[hsl(var(--gold))]" />
                  الوصف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="أدخل وصف العقار..."
                  className="min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Owner Tab */}
          <TabsContent value="owner" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-[hsl(var(--gold))]" />
                  معلومات المالك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>اسم المالك *</Label>
                  <Input 
                    placeholder="أدخل اسم المالك"
                    value={formData.ownerName}
                    onChange={(e) => updateFormData('ownerName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>رقم الجوال *</Label>
                  <Input 
                    placeholder="05XXXXXXXX"
                    value={formData.ownerPhone}
                    onChange={(e) => updateFormData('ownerPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label>رقم الهوية</Label>
                  <Input 
                    placeholder="أدخل رقم الهوية"
                    value={formData.ownerIdNumber}
                    onChange={(e) => updateFormData('ownerIdNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label>تاريخ الميلاد</Label>
                  <Input 
                    type="date"
                    value={formData.ownerBirthDate}
                    onChange={(e) => updateFormData('ownerBirthDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>العنوان الوطني</Label>
                  <Input 
                    placeholder="العنوان الوطني"
                    value={formData.ownerNationalAddress}
                    onChange={(e) => updateFormData('ownerNationalAddress', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>المدينة</Label>
                    <Select value={formData.ownerCity} onValueChange={(v) => updateFormData('ownerCity', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الحي</Label>
                    <Input 
                      placeholder="الحي"
                      value={formData.ownerDistrict}
                      onChange={(e) => updateFormData('ownerDistrict', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deed Tab */}
          <TabsContent value="deed" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[hsl(var(--gold))]" />
                  معلومات الصك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>رقم الصك</Label>
                  <Input 
                    placeholder="أدخل رقم الصك"
                    value={formData.deedNumber}
                    onChange={(e) => updateFormData('deedNumber', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>تاريخ الصك</Label>
                    <Input 
                      type="date"
                      value={formData.deedDate}
                      onChange={(e) => updateFormData('deedDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>مدينة الصك</Label>
                    <Select value={formData.deedCity} onValueChange={(v) => updateFormData('deedCity', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rental Tab */}
          <TabsContent value="rental" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4 text-[hsl(var(--gold))]" />
                  معلومات الإيجار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={formData.isCurrentlyRented}
                    onCheckedChange={(v) => updateFormData('isCurrentlyRented', v)}
                  />
                  <Label>العقار مؤجر حالياً</Label>
                </div>

                {formData.isCurrentlyRented && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>مدة العقد (بالأشهر)</Label>
                      <Input 
                        type="number"
                        value={formData.contractDuration}
                        onChange={(e) => updateFormData('contractDuration', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>تاريخ بداية العقد</Label>
                        <Input 
                          type="date"
                          value={formData.contractStartDate}
                          onChange={(e) => updateFormData('contractStartDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>تاريخ نهاية العقد</Label>
                        <Input 
                          type="date"
                          value={formData.contractEndDate}
                          onChange={(e) => updateFormData('contractEndDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="p-4 space-y-4">
            <Card className="bg-gradient-to-br from-[hsl(var(--gold))]/5 to-amber-50 border-[hsl(var(--gold))]/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-[hsl(var(--gold))]" />
                  <span className="font-semibold">اختر المنصات للنشر</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  سيتم نشر الإعلان على منصتك الشخصية + المنصات المختارة
                </p>
              </CardContent>
            </Card>

            {/* منصتي - Always included */}
            <Card className="border-2 border-green-500 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Building className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800">منصتي</h3>
                      <p className="text-xs text-green-600">منصتك الشخصية - مشمول تلقائياً</p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Separator />

            <h3 className="font-semibold text-sm text-muted-foreground">المنصات الخارجية</h3>

            {connectedPlatformsList.length > 0 ? (
              <div className="space-y-2">
                {connectedPlatformsList.map((platform) => (
                  <Card 
                    key={platform.id}
                    className={`cursor-pointer transition-all ${
                      formData.selectedPlatforms.includes(platform.id)
                        ? 'border-2 border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: platform.bgColor }}
                          >
                            {platform.logo}
                          </div>
                          <div>
                            <h3 className="font-bold">{platform.nameAr}</h3>
                            <p className="text-xs text-muted-foreground">{platform.name}</p>
                          </div>
                        </div>
                        <Checkbox 
                          checked={formData.selectedPlatforms.includes(platform.id)}
                          onCheckedChange={() => togglePlatform(platform.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <Globe className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-muted-foreground">لا توجد منصات مربوطة</p>
                  <p className="text-sm text-muted-foreground">اذهب إلى تبويب "ربط المنصات" لربط حساباتك</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-white">
        <Button 
          className="w-full bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/90 text-white h-12 text-lg"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              جاري النشر...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 ml-2" />
              نشر الإعلان
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
