'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, Phone, Mail, Globe, MessageCircle, Download, Share2, Check,
  User, Building2, Briefcase, MapPin, Link, Camera, Image, 
  Linkedin, Instagram, Twitter, ArrowRight, Save, Eye, QrCode,
  Sparkles, X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { HelpHint } from '@/components/ui/help-hint';

interface Template {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  isPremium: boolean;
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'عصري',
    description: 'تصميم عصري وأنيق للمحترفين',
    primaryColor: '#01411C',
    secondaryColor: '#D4AF37',
    isPremium: false,
  },
  {
    id: 'luxury',
    name: 'فاخر',
    description: 'مخصص للوسطاء العقاريين',
    primaryColor: '#1a1a1a',
    secondaryColor: '#DAA520',
    isPremium: true,
  },
  {
    id: 'minimal',
    name: 'بسيط',
    description: 'تصميم بسيط وأنيق',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    isPremium: false,
  },
  {
    id: 'creative',
    name: 'إبداعي',
    description: 'للمبدعين والفنانين',
    primaryColor: '#6B46C1',
    secondaryColor: '#F687B3',
    isPremium: true,
  },
];

interface CardData {
  fullName: string;
  jobTitle: string;
  company: string;
  bio: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  city: string;
  country: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  profilePhoto: string | null;
  coverPhoto: string | null;
  primaryColor: string;
  secondaryColor: string;
  template: string;
}

interface CardEditorProps {
  cardId?: string;
  initialData?: Partial<CardData>;
  onSave?: (data: CardData) => void;
  onBack?: () => void;
}

export function CardEditor({ cardId, initialData, onSave, onBack }: CardEditorProps) {
  const [cardData, setCardData] = useState<CardData>({
    fullName: initialData?.fullName || '',
    jobTitle: initialData?.jobTitle || '',
    company: initialData?.company || '',
    bio: initialData?.bio || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    city: initialData?.city || '',
    country: initialData?.country || 'السعودية',
    linkedin: initialData?.linkedin || '',
    instagram: initialData?.instagram || '',
    twitter: initialData?.twitter || '',
    profilePhoto: initialData?.profilePhoto || null,
    coverPhoto: initialData?.coverPhoto || null,
    primaryColor: initialData?.primaryColor || '#01411C',
    secondaryColor: initialData?.secondaryColor || '#D4AF37',
    template: initialData?.template || 'modern',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // جلب بيانات بطاقة الأعمال الحقيقية إذا لم يتم تمرير initialData
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) return;

    const loadFromBusinessCard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('data')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, company_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (businessCard?.data) {
          const bc = businessCard.data as Record<string, any>;
          setCardData(prev => ({
            ...prev,
            fullName: bc.userName || profile?.full_name || prev.fullName,
            jobTitle: bc.userTitle || prev.jobTitle || 'وسيط عقاري معتمد',
            company: bc.companyName || profile?.company_name || prev.company,
            bio: bc.bio || prev.bio,
            phone: bc.primaryPhone || profile?.phone || prev.phone,
            whatsapp: bc.whatsappPhone || bc.primaryPhone || profile?.phone || prev.whatsapp,
            email: bc.email || user.email || prev.email,
            website: bc.websiteUrl || prev.website,
            city: bc.location || prev.city,
            linkedin: bc.socialMedia?.linkedin || prev.linkedin,
            instagram: bc.socialMedia?.instagram || prev.instagram,
            twitter: bc.socialMedia?.twitter || prev.twitter,
            profilePhoto: bc.profileImage || prev.profilePhoto,
            coverPhoto: bc.coverImage || prev.coverPhoto,
          }));
        } else if (profile) {
          setCardData(prev => ({
            ...prev,
            fullName: profile.full_name || prev.fullName,
            company: profile.company_name || prev.company,
            phone: profile.phone || prev.phone,
          }));
        }
      } catch (err) {
        console.error('[CardEditor] Error loading business card:', err);
      }
    };

    loadFromBusinessCard();
  }, []);

  const updateField = (field: keyof CardData, value: string | null) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (template: Template) => {
    setCardData(prev => ({
      ...prev,
      template: template.id,
      primaryColor: template.primaryColor,
      secondaryColor: template.secondaryColor,
    }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'profilePhoto' | 'coverPhoto'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار ملف صورة');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    const setUploading = field === 'profilePhoto' ? setIsUploadingProfile : setIsUploadingCover;
    setUploading(true);

    try {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateField(field, result);
        setUploading(false);
        toast.success(field === 'profilePhoto' ? 'تم رفع صورة الملف الشخصي' : 'تم رفع صورة الغلاف');
      };
      reader.onerror = () => {
        setUploading(false);
        toast.error('فشل في قراءة الصورة');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast.error('حدث خطأ أثناء رفع الصورة');
    }
  };

  const removeImage = (field: 'profilePhoto' | 'coverPhoto') => {
    updateField(field, null);
    toast.success(field === 'profilePhoto' ? 'تم حذف صورة الملف الشخصي' : 'تم حذف صورة الغلاف');
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave?.(cardData);
    toast.success('تم حفظ البطاقة بنجاح');
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white p-3 sticky top-0 z-50 border-b-2 border-[#D4AF37]">
        <div className="container mx-auto">
          {/* الهيدر للجوال: اسم الصفحة في سطر واحد + الأزرار أسفله */}
          <div className="flex flex-col gap-2">
            {/* اسم الصفحة في الأعلى */}
            <h1 className="text-lg md:text-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap">
              <Palette className="h-5 w-5 text-[#D4AF37]" />
              {cardId ? 'تحرير البطاقة' : 'إنشاء بطاقة جديدة'}
            </h1>
            
            {/* الأزرار في سطر منفصل */}
            <div className="flex items-center justify-between">
              {onBack && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onBack} 
                  className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
                >
                  <ArrowRight className="h-3 w-3 ml-1" />
                  رجوع
                </Button>
              )}
              {!onBack && <div />}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  <Eye className="h-3 w-3 ml-1" />
                  معاينة
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="معاينة"
                    description="عرض البطاقة كما ستظهر للعملاء قبل الحفظ."
                    source="TODO: spec/digital-card-editor.md#preview"
                  />
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/90"
                >
                  <Save className="h-3 w-3 ml-1" />
                  {isSaving ? 'جاري...' : 'حفظ'}
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="حفظ"
                    description="حفظ جميع تعديلاتك على بطاقتك الرقمية."
                    source="TODO: spec/digital-card-editor.md#save"
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger value="info" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white text-xs sm:text-sm">
                  <User className="h-4 w-4 ml-1" />
                  المعلومات
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="المعلومات"
                    description="الاسم والمسمى الوظيفي والشركة والنبذة والموقع والصور."
                    source="TODO: spec/digital-card-editor.md#tab-info"
                  />
                </TabsTrigger>
                <TabsTrigger value="contact" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white text-xs sm:text-sm">
                  <Phone className="h-4 w-4 ml-1" />
                  التواصل
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="التواصل"
                    description="هاتف، واتساب، بريد إلكتروني، وموقع إلكتروني للظهور على البطاقة."
                    source="TODO: spec/digital-card-editor.md#tab-contact"
                  />
                </TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white text-xs sm:text-sm">
                  <Link className="h-4 w-4 ml-1" />
                  الروابط
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="الروابط"
                    description="روابط حساباتك على LinkedIn و Instagram و Twitter/X."
                    source="TODO: spec/digital-card-editor.md#tab-social"
                  />
                </TabsTrigger>
                <TabsTrigger value="design" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white text-xs sm:text-sm">
                  <Palette className="h-4 w-4 ml-1" />
                  التصميم
                  <HelpHint
                    size="xs"
                    className="mr-1"
                    title="التصميم"
                    description="اختيار القالب وتخصيص الألوان الرئيسية والثانوية."
                    source="TODO: spec/digital-card-editor.md#tab-design"
                  />
                </TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="info" className="mt-4 space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-[#01411C]" />
                    المعلومات الشخصية
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">الاسم الكامل *</Label>
                      <Input
                        value={cardData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">المسمى الوظيفي</Label>
                      <Input
                        value={cardData.jobTitle}
                        onChange={(e) => updateField('jobTitle', e.target.value)}
                        placeholder="مثال: وسيط عقاري معتمد"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">الشركة / المؤسسة</Label>
                      <Input
                        value={cardData.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        placeholder="اسم الشركة"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">نبذة تعريفية</Label>
                      <Textarea
                        value={cardData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        placeholder="اكتب نبذة مختصرة عنك..."
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#01411C]" />
                    الموقع
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">المدينة</Label>
                      <Input
                        value={cardData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="الرياض"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">البلد</Label>
                      <Input
                        value={cardData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="السعودية"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#01411C]" />
                    الصور
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Profile Photo */}
                    <div>
                      <Label className="mb-2 block">صورة الملف الشخصي</Label>
                      <div className="relative">
                        {cardData.profilePhoto ? (
                          <div className="relative group">
                            <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-[#01411C]">
                              <img
                                src={cardData.profilePhoto}
                                alt="صورة الملف الشخصي"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                              <label className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                <Camera className="h-5 w-5 text-white" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(e, 'profilePhoto')}
                                />
                              </label>
                              <button
                                onClick={() => removeImage('profilePhoto')}
                                className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                              >
                                <X className="h-5 w-5 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-[#01411C] transition-colors">
                            {isUploadingProfile ? (
                              <div className="animate-spin w-8 h-8 border-2 border-[#01411C] border-t-transparent rounded-full mx-auto mb-2" />
                            ) : (
                              <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            )}
                            <p className="text-sm text-muted-foreground">
                              {isUploadingProfile ? 'جاري الرفع...' : 'اضغط للرفع'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG (حد أقصى 5MB)</p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'profilePhoto')}
                              disabled={isUploadingProfile}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Cover Photo */}
                    <div>
                      <Label className="mb-2 block">صورة الغلاف</Label>
                      <div className="relative">
                        {cardData.coverPhoto ? (
                          <div className="relative group">
                            <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-[#D4AF37]">
                              <img
                                src={cardData.coverPhoto}
                                alt="صورة الغلاف"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                              <label className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                <Image className="h-5 w-5 text-white" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(e, 'coverPhoto')}
                                />
                              </label>
                              <button
                                onClick={() => removeImage('coverPhoto')}
                                className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                              >
                                <X className="h-5 w-5 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-[#D4AF37] transition-colors">
                            {isUploadingCover ? (
                              <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-2" />
                            ) : (
                              <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            )}
                            <p className="text-sm text-muted-foreground">
                              {isUploadingCover ? 'جاري الرفع...' : 'اضغط للرفع'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG (حد أقصى 5MB)</p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'coverPhoto')}
                              disabled={isUploadingCover}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="mt-4 space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-[#01411C]" />
                    معلومات الاتصال
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">رقم الهاتف</Label>
                      <Input
                        type="tel"
                        value={cardData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+966501234567"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">رقم الواتساب</Label>
                      <Input
                        type="tel"
                        value={cardData.whatsapp}
                        onChange={(e) => updateField('whatsapp', e.target.value)}
                        placeholder="+966501234567"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">البريد الإلكتروني</Label>
                      <Input
                        type="email"
                        value={cardData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="email@example.com"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">الموقع الإلكتروني</Label>
                      <Input
                        type="url"
                        value={cardData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="www.example.com"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social" className="mt-4 space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Link className="h-5 w-5 text-[#01411C]" />
                    روابط التواصل الاجتماعي
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#0077B5]" />
                        LinkedIn
                      </Label>
                      <Input
                        value={cardData.linkedin}
                        onChange={(e) => updateField('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-[#E4405F]" />
                        Instagram
                      </Label>
                      <Input
                        value={cardData.instagram}
                        onChange={(e) => updateField('instagram', e.target.value)}
                        placeholder="https://instagram.com/username"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                        Twitter / X
                      </Label>
                      <Input
                        value={cardData.twitter}
                        onChange={(e) => updateField('twitter', e.target.value)}
                        placeholder="https://twitter.com/username"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Design Tab */}
              <TabsContent value="design" className="mt-4 space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[#01411C]" />
                    اختر القالب
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`relative p-4 rounded-lg border-2 text-right transition-all ${
                          cardData.template === template.id
                            ? 'border-[#01411C] bg-[#01411C]/5'
                            : 'border-muted hover:border-[#01411C]/50'
                        }`}
                      >
                        {cardData.template === template.id && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#01411C] flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {template.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-[#D4AF37] text-xs">
                            مميز
                          </Badge>
                        )}
                        <div 
                          className="w-full h-12 rounded-md mb-2"
                          style={{ 
                            background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)` 
                          }}
                        />
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">تخصيص الألوان</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">اللون الرئيسي</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={cardData.primaryColor}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={cardData.primaryColor}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="flex-1 font-mono text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">اللون الثانوي</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={cardData.secondaryColor}
                          onChange={(e) => updateField('secondaryColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={cardData.secondaryColor}
                          onChange={(e) => updateField('secondaryColor', e.target.value)}
                          className="flex-1 font-mono text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">ألوان سريعة</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { primary: '#01411C', secondary: '#D4AF37' },
                      { primary: '#1a1a1a', secondary: '#ffffff' },
                      { primary: '#0066cc', secondary: '#ffcc00' },
                      { primary: '#8B5CF6', secondary: '#F97316' },
                      { primary: '#DC2626', secondary: '#FCD34D' },
                      { primary: '#059669', secondary: '#A78BFA' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          updateField('primaryColor', preset.primary);
                          updateField('secondaryColor', preset.secondary);
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-muted hover:border-[#01411C] transition-all overflow-hidden"
                      >
                        <div 
                          className="w-full h-full"
                          style={{ 
                            background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)` 
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="overflow-hidden">
              <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#01411C]" />
                  معاينة حية
                </h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 ml-1 text-[#D4AF37]" />
                    تحديث فوري
                  </Badge>
                </div>
              </div>
              
              {/* Card Preview */}
              <div 
                className="p-6"
                style={{ 
                  background: `linear-gradient(135deg, ${cardData.primaryColor}10 0%, ${cardData.secondaryColor}10 100%)` 
                }}
              >
                <div className="bg-background rounded-xl shadow-lg overflow-hidden max-w-sm mx-auto">
                  {/* Header */}
                  <div 
                    className="h-28 relative"
                    style={{ 
                      background: `linear-gradient(135deg, ${cardData.primaryColor} 0%, ${cardData.secondaryColor} 100%)` 
                    }}
                  >
                    <div className="absolute inset-0 bg-black/10" />
                    {/* Avatar */}
                    <div className="absolute -bottom-10 right-4">
                      <div 
                        className="w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: cardData.primaryColor }}
                      >
                        {cardData.fullName.charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-14 p-6">
                    <h3 className="font-bold text-xl">{cardData.fullName || 'الاسم'}</h3>
                    <p className="text-sm font-medium" style={{ color: cardData.primaryColor }}>
                      {cardData.jobTitle || 'المسمى الوظيفي'}
                    </p>
                    <p className="text-xs text-muted-foreground">{cardData.company || 'الشركة'}</p>
                    
                    {cardData.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {cardData.bio}
                      </p>
                    )}

                    {/* Location */}
                    {(cardData.city || cardData.country) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <MapPin className="h-3 w-3" />
                        {cardData.city}{cardData.city && cardData.country && '، '}{cardData.country}
                      </div>
                    )}

                    {/* Contact Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="w-full text-white"
                        style={{ backgroundColor: cardData.primaryColor }}
                      >
                        <Phone className="h-4 w-4 ml-1" />
                        اتصل
                      </Button>
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MessageCircle className="h-4 w-4 ml-1" />
                        واتساب
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 ml-1" />
                        بريد
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                      >
                        <Globe className="h-4 w-4 ml-1" />
                        الموقع
                      </Button>
                    </div>

                    {/* Social Links */}
                    {(cardData.linkedin || cardData.instagram || cardData.twitter) && (
                      <div className="flex justify-center gap-3 mt-4 pt-4 border-t">
                        {cardData.linkedin && (
                          <div className="w-8 h-8 rounded-full bg-[#0077B5] flex items-center justify-center">
                            <Linkedin className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {cardData.instagram && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                            <Instagram className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {cardData.twitter && (
                          <div className="w-8 h-8 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                            <Twitter className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                      >
                        <Download className="h-4 w-4 ml-1" />
                        حفظ جهة الاتصال
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 ml-1" />
                        مشاركة
                      </Button>
                    </div>
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-background rounded-lg shadow">
                    <QrCode className="h-5 w-5 text-[#01411C]" />
                    <span className="text-sm text-muted-foreground">رمز QR سيُنشأ تلقائياً</span>
                  </div>
                </div>

                {/* Powered By */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Powered by وساطه AI
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
