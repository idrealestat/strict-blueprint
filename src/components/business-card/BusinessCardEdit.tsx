import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Save,
  Camera,
  User,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Award,
  Share2,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  UploadCloud,
  Info,
  Map,
} from "lucide-react";
import OfficeLocationMap from "./OfficeLocationMap";
import UserTitleSelector from "./UserTitleSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  type: "individual" | "company";
  companyName?: string;
  city: string;
  plan: string;
  rating: number;
}

interface BusinessCardEditProps {
  onBack: () => void;
  user: User;
  isNewUser?: boolean;
}

interface WorkingHour {
  open: string;
  close: string;
  isOpen: boolean;
}

interface SocialMedia {
  tiktok: string;
  twitter: string;
  instagram: string;
  snapchat: string;
  youtube: string;
  facebook: string;
}

interface Achievements {
  totalDeals: number;
  totalProperties: number;
  totalClients: number;
  yearsOfExperience: number;
  awards: string[];
  certifications: string[];
  topPerformer: boolean;
  verified: boolean;
}

interface AddressDetails {
  city: string;
  district: string;
  street: string;
  nationalAddress: string;
  postalCode: string;
  buildingNumber: string;
  additionalNumber: string;
  latitude: number;
  longitude: number;
}

interface BusinessCardData {
  userName: string;
  companyName: string;
  websiteUrl: string;
  userTitle: string;
  falLicense: string;
  falExpiry: string;
  commercialRegistration: string;
  commercialExpiryDate: string;
  primaryPhone: string;
  email: string;
  domain: string;
  googleMapsLocation: string;
  location: string;
  officialPlatform: string;
  bio: string;
  socialMedia: SocialMedia;
  workingHours: Record<string, WorkingHour>;
  achievements: Achievements;
  profileImage: string;
  coverImage: string;
  logoImage: string;
  officeLat: number | null;
  officeLng: number | null;
  officeAddress: string;
  officeAddressDetails: AddressDetails | null;
  nationalId: string;
  birthDate: string;
  accountType: string;
}

const BusinessCardEdit: React.FC<BusinessCardEditProps> = ({ onBack, user, isNewUser = false }) => {
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [newAward, setNewAward] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  const STORAGE_KEY = `business_card_${user.id}`;

  // Default form data
  const defaultFormData: BusinessCardData = {
    userName: user.name,
    companyName: user.companyName || "",
    websiteUrl: "",
    userTitle: "",
    falLicense: "",
    falExpiry: "",
    commercialRegistration: "",
    commercialExpiryDate: "",
    primaryPhone: user.phone,
    email: user.email,
    domain: "",
    googleMapsLocation: "",
    location: user.city,
    officialPlatform: "",
    bio: "",
    socialMedia: {
      tiktok: "",
      twitter: "",
      instagram: "",
      snapchat: "",
      youtube: "",
      facebook: ""
    },
    workingHours: {
      sunday: { open: "8:00 ص", close: "2:00 م", isOpen: true },
      monday: { open: "8:00 ص", close: "2:00 م", isOpen: true },
      tuesday: { open: "8:00 ص", close: "2:00 م", isOpen: true },
      wednesday: { open: "8:00 ص", close: "2:00 م", isOpen: true },
      thursday: { open: "8:00 ص", close: "2:00 م", isOpen: true },
      friday: { open: "", close: "", isOpen: false },
      saturday: { open: "8:00 ص", close: "2:00 م", isOpen: true }
    },
    achievements: {
      totalDeals: 0,
      totalProperties: 0,
      totalClients: 0,
      yearsOfExperience: 0,
      awards: [],
      certifications: [],
      topPerformer: false,
      verified: false
    },
    profileImage: "",
    coverImage: "",
    logoImage: "",
    officeLat: null,
    officeLng: null,
    officeAddress: "",
    officeAddressDetails: null,
    nationalId: "",
    birthDate: "",
    accountType: "individual"
  };

  const [formData, setFormData] = useState<BusinessCardData>(defaultFormData);

  // Load data from Supabase profiles first, then localStorage
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // جلب بيانات الملف الشخصي
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();

          // جلب حالة النشر والـ slug من business_cards
          const { data: businessCard } = await supabase
            .from('business_cards')
            .select('published, slug')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (businessCard) {
            setIsPublished(businessCard.published);
            setCurrentSlug(businessCard.slug);
          }
          
          if (profile && !error) {
            // Load saved card data from localStorage
            const savedData = localStorage.getItem(STORAGE_KEY);
            let localData: Partial<BusinessCardData> = {};
            if (savedData) {
              try {
                localData = JSON.parse(savedData);
              } catch (e) {
                console.error("Error parsing saved data:", e);
              }
            }
            
            // Merge profile data with local data (profile takes priority for certain fields)
            setFormData(prev => ({
              ...prev,
              ...localData,
              userName: profile.full_name || localData.userName || prev.userName,
              companyName: profile.company_name || localData.companyName || prev.companyName,
              websiteUrl: profile.website || localData.websiteUrl || "",
              primaryPhone: profile.phone || localData.primaryPhone || prev.primaryPhone,
              falLicense: profile.fal_license_number || localData.falLicense || "",
              falExpiry: profile.fal_license_expiry || localData.falExpiry || "",
              commercialRegistration: profile.commercial_reg_number || localData.commercialRegistration || "",
              commercialExpiryDate: profile.commercial_reg_expiry || localData.commercialExpiryDate || "",
              nationalId: profile.national_id || localData.nationalId || "",
              birthDate: profile.birth_date || localData.birthDate || "",
              accountType: profile.account_type || localData.accountType || "individual",
              officeLat: profile.office_lat || localData.officeLat || null,
              officeLng: profile.office_lng || localData.officeLng || null,
              officeAddress: profile.office_address || localData.officeAddress || "",
              domain: profile.website || localData.domain || "",
            }));
            
            setProfileLoaded(true);
          }
        } else {
          // No auth user, load from localStorage only
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              setFormData({ ...defaultFormData, ...parsed });
            } catch (error) {
              console.error("Error loading saved data:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        // Fallback to localStorage
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setFormData({ ...defaultFormData, ...parsed });
          } catch (e) {
            console.error("Error loading saved data:", e);
          }
        }
      }
    };

    loadProfileData();
  }, []);

  // Show welcome dialog for new users
  useEffect(() => {
    if (isNewUser || localStorage.getItem('show_welcome_dialog') === 'true') {
      setShowWelcomeDialog(true);
      localStorage.removeItem('show_welcome_dialog');
    }
  }, [isNewUser]);

  // Handle save - حفظ مزدوج للربط مع منصتي + نشر تلقائي للصفحة العامة
  const handleSave = async () => {
    try {
      const dataToSave = JSON.stringify(formData);
      // Check if data size is too large (localStorage limit is ~5MB)
      if (dataToSave.length > 4 * 1024 * 1024) {
        toast.error("حجم البيانات كبير جداً! حاول استخدام صور أصغر");
        return;
      }
      // حفظ بالمفتاح الأساسي
      localStorage.setItem(STORAGE_KEY, dataToSave);

      // حفظ نسخة للربط مع منصتي - صورة البروفايل فقط
      const platformData = {
        profileImage: formData.profileImage, // صورة البروفايل فقط للمنصة
        coverImage: formData.coverImage,
        name: formData.userName,
        title: formData.companyName || 'وسيط عقاري معتمد'
      };
      localStorage.setItem('wasata_business_card_data', JSON.stringify(platformData));

      // التحقق من اختيار slug متاح (باللون الأخضر)
      const selectedSlug = isSlugAvailable && formData.userTitle ? String(formData.userTitle).trim() : '';
      if (!selectedSlug) {
        setShowError(true);
        setErrorMessage('اختر اسم رابط (Slug) متاح باللون الأخضر ثم احفظ.');
        toast.error('اختر اسم رابط (Slug) متاح ثم أعد الحفظ');
        return;
      }

      // الحصول على user id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // 1) التحقق من تفرد الـ slug في قاعدة البيانات
      const { data: existingSlug, error: checkError } = await supabase
        .from('business_cards')
        .select('id, user_id, published')
        .eq('slug', selectedSlug)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking slug:', checkError);
        toast.error('حدث خطأ في التحقق من الرابط');
        return;
      }

      // إذا الـ slug موجود ومملوك لمستخدم آخر
      if (existingSlug && existingSlug.user_id !== authUser.id) {
        toast.error('هذا الرابط محجوز لمستخدم آخر. اختر رابطاً مختلفاً.');
        return;
      }

      // التحقق من اكتمال البيانات الأساسية (الاسم + الهاتف)
      const hasBasicFields = formData.userName?.trim() && formData.primaryPhone?.trim();
      
      // التحقق من حالة النشر الحالية للبطاقة الخاصة بالمستخدم
      const { data: currentCard } = await supabase
        .from('business_cards')
        .select('published, slug')
        .eq('user_id', authUser.id)
        .maybeSingle();

      // تحديد ما إذا كان هذا أول نشر تلقائي
      // النشر التلقائي يحدث فقط إذا:
      // 1. البطاقة غير منشورة حالياً (published = false)
      // 2. يوجد slug متاح
      // 3. البيانات الأساسية مكتملة (الاسم + الهاتف)
      const isFirstAutoPublish = currentCard && !currentCard.published && selectedSlug && hasBasicFields;

      // 2) تحديث سجل business_cards بالـ slug
      const cardDataPayload = JSON.parse(JSON.stringify({
        ...formData,
        swapState: localStorage.getItem(`business_card_swap_${user.id}`) === 'true',
      }));

      const updatePayload: {
        slug: string;
        data: typeof cardDataPayload;
        updated_at: string;
        published?: boolean;
      } = {
        slug: selectedSlug,
        data: cardDataPayload,
        updated_at: new Date().toISOString()
      };

      // إضافة published = true فقط في حالة النشر التلقائي الأول
      if (isFirstAutoPublish) {
        updatePayload.published = true;
      }

      const { error: updateError } = await supabase
        .from('business_cards')
        .update(updatePayload)
        .eq('user_id', authUser.id);

      if (updateError) {
        console.error('Error updating business card:', updateError);
        toast.error('حدث خطأ في حفظ الرابط');
        return;
      }

      // حفظ الـ slug المستخدم للرابط العام
      localStorage.setItem('public_platform_slug', selectedSlug);

      // إرسال حدث لتحديث المنصة فوراً
      window.dispatchEvent(new CustomEvent('businessCardUpdated'));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);

      // تحديث حالة النشر والـ slug في الـ state
      setCurrentSlug(selectedSlug);
      if (isFirstAutoPublish) {
        setIsPublished(true);
      }

      // رسالة مختلفة حسب حالة النشر التلقائي
      if (isFirstAutoPublish) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">تم حفظ بطاقتك ونشر صفحتك العامة تلقائياً ✨</span>
            <span className="text-sm opacity-90">رابطك: wasataai.com/{selectedSlug}</span>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success("تم حفظ التغييرات والرابط بنجاح!");
      }
    } catch (error) {
      console.error('Save error:', error);
      setShowError(true);
      setErrorMessage("حدث خطأ في الحفظ - حاول تصغير حجم الصور");
      toast.error("فشل الحفظ! حاول استخدام صور أصغر");
    }
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle social media change
  const handleSocialChange = (platform: keyof SocialMedia, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value }
    }));
  };

  // Handle working hours change
  const handleWorkingHoursChange = (day: string, field: keyof WorkingHour, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value }
      }
    }));
  };

  // Handle achievements change
  const handleAchievementsChange = (field: keyof Achievements, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      achievements: { ...prev.achievements, [field]: value }
    }));
  };

  // Add award
  const addAward = () => {
    if (newAward.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: {
          ...prev.achievements,
          awards: [...prev.achievements.awards, newAward.trim()]
        }
      }));
      setNewAward("");
    }
  };

  // Remove award
  const removeAward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: {
        ...prev.achievements,
        awards: prev.achievements.awards.filter((_, i) => i !== index)
      }
    }));
  };

  // Add certification
  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: {
          ...prev.achievements,
          certifications: [...prev.achievements.certifications, newCertification.trim()]
        }
      }));
      setNewCertification("");
    }
  };

  // Remove certification
  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: {
        ...prev.achievements,
        certifications: prev.achievements.certifications.filter((_, i) => i !== index)
      }
    }));
  };

  // Compress image function
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } else {
            reject(new Error('Could not get canvas context'));
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload with compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'coverImage' | 'logoImage') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Different max sizes for different image types
        const maxWidth = field === 'coverImage' ? 800 : 300;
        const compressedBase64 = await compressImage(file, maxWidth, 0.7);
        setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
        toast.success("تم رفع الصورة بنجاح!");
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error("حدث خطأ في رفع الصورة");
      }
    }
  };

  const daysArabic: Record<string, string> = {
    sunday: "الأحد",
    monday: "الإثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت"
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32" dir="rtl">
      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>تم الحفظ بنجاح! ✅</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] px-4 py-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            عودة
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
              className="text-white hover:bg-white/20"
            >
              {showPreview ? <EyeOff className="w-4 h-4 ml-1" /> : <Eye className="w-4 h-4 ml-1" />}
              {showPreview ? 'إخفاء' : 'معاينة'}
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#D4AF37] text-[#01411C] hover:bg-[#f1c40f]"
            >
              <Save className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </div>
        </div>
        
        {/* عنوان الصفحة مع مؤشر حالة النشر */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <h1 className="text-white text-lg font-bold">تعديل بطاقة الأعمال</h1>
          
          {/* مؤشر حالة النشر */}
          {isPublished !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isPublished 
                ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                : 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
            }`}>
              {isPublished ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>منشورة</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>غير منشورة</span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* رابط الصفحة العامة إذا كانت منشورة */}
        {isPublished && currentSlug && (
          <div className="flex items-center justify-center mt-2">
            <a
              href={`https://wasataai.com/${currentSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37] text-sm hover:underline flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              wasataai.com/{currentSlug}
            </a>
          </div>
        )}
      </div>

      {/* Live Preview Section */}
      {showPreview && (
        <div className="bg-gray-100 p-4 border-b-4 border-[#D4AF37]">
          <div className="max-w-sm mx-auto">
            {/* Mini Preview Card */}
            <div className="bg-gradient-to-b from-[#01411C] via-[#065f41] to-[#01411C] rounded-xl shadow-2xl overflow-hidden border-2 border-[#D4AF37]">
              {/* Cover with overlay */}
              <div className="relative h-24">
                {formData.coverImage && (
                  <>
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60" />
                  </>
                )}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                  }} />
                </div>
              </div>
              
              {/* Profile section */}
              <div className="relative -mt-10 text-center px-4 pb-4">
                {/* Profile Image */}
                <div className="inline-block relative">
                  <div className="w-20 h-20 rounded-full border-3 border-[#D4AF37] shadow-xl overflow-hidden bg-[#D4AF37] mx-auto">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {formData.userName.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Logo badge */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full border border-white bg-[#D4AF37] flex items-center justify-center overflow-hidden">
                    {formData.logoImage ? (
                      <img src={formData.logoImage} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">🏢</span>
                    )}
                  </div>
                </div>
                
                {/* Name */}
                <h3 className="text-white font-bold mt-2 text-sm">{formData.userName || 'الاسم'}</h3>
                
                {/* Company */}
                {formData.companyName && (
                  <p className="text-white/80 text-xs flex items-center justify-center gap-1">
                    <Building className="w-3 h-3" />
                    {formData.companyName}
                  </p>
                )}
                
                {/* Contact */}
                <div className="mt-2 flex flex-wrap justify-center gap-1 text-xs text-white/80">
                  {formData.primaryPhone && (
                    <span className="bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      {formData.primaryPhone}
                    </span>
                  )}
                  {formData.email && (
                    <span className="bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#D4AF37]" />
                      {formData.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">معاينة مباشرة للبطاقة</p>
          </div>
        </div>
      )}

      {/* Image Upload Section */}
      <div className="px-4 py-6 bg-white border-b">
        <div className="flex justify-center gap-6">
          {/* Cover Image */}
          <div className="text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'coverImage')}
              />
              <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-[#01411C] hover:bg-gray-100 overflow-hidden">
                {formData.coverImage ? (
                  <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#01411C]" />
                )}
              </div>
            </label>
            <span className="text-xs text-gray-600 mt-1 block">صورة الغلاف</span>
          </div>

          {/* Profile Image */}
          <div className="text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'profileImage')}
              />
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-[#01411C] hover:bg-gray-100 overflow-hidden">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-[#01411C]" />
                )}
              </div>
            </label>
            <span className="text-xs text-gray-600 mt-1 block">الصورة الشخصية</span>
          </div>

          {/* Logo */}
          <div className="text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'logoImage')}
              />
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-[#01411C] hover:bg-gray-100 overflow-hidden">
                {formData.logoImage ? (
                  <img src={formData.logoImage} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-6 h-6 text-[#01411C]" />
                )}
              </div>
            </label>
            <span className="text-xs text-gray-600 mt-1 block">شعار الشركة</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full bg-gray-100">
            <TabsTrigger value="basic" className="text-xs data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              الأساسية
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              التواصل
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              السوشيال
            </TabsTrigger>
            <TabsTrigger value="hours" className="text-xs data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              الأوقات
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              الإنجازات
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">👤 المعلومات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={formData.userName}
                    onChange={(e) => handleInputChange("userName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>اسم الشركة / المكتب</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="mt-1"
                    placeholder="اسم الشركة أو المكتب العقاري"
                  />
                </div>
                <div>
                  <Label>رابط الموقع الإلكتروني</Label>
                  <Input
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                    className="mt-1"
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>
                
                {/* حقل اختيار النطاق الخاص */}
                <UserTitleSelector
                  value={formData.userTitle}
                  onChange={(value) => handleInputChange("userTitle", value)}
                  onAvailabilityChange={setIsSlugAvailable}
                  companyName={formData.companyName}
                  websiteUrl={formData.websiteUrl}
                  accountType={formData.accountType}
                />
                <div>
                  <Label>نبذة عني (500 حرف كحد أقصى)</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value.slice(0, 500))}
                    className="mt-1"
                    maxLength={500}
                    rows={4}
                  />
                  <span className="text-xs text-gray-500">{formData.bio.length}/500</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">📜 الرخص والسجلات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم رخصة فال</Label>
                    <Input
                      value={formData.falLicense}
                      onChange={(e) => handleInputChange("falLicense", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>تاريخ انتهاء رخصة فال</Label>
                    <Input
                      type="date"
                      value={formData.falExpiry}
                      onChange={(e) => handleInputChange("falExpiry", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم السجل التجاري</Label>
                    <Input
                      value={formData.commercialRegistration}
                      onChange={(e) => handleInputChange("commercialRegistration", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>تاريخ انتهاء السجل</Label>
                    <Input
                      type="date"
                      value={formData.commercialExpiryDate}
                      onChange={(e) => handleInputChange("commercialExpiryDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">🆔 البيانات الشخصية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم الهوية / الإقامة</Label>
                    <Input
                      value={formData.nationalId}
                      onChange={(e) => handleInputChange("nationalId", e.target.value)}
                      className="mt-1"
                      dir="ltr"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label>تاريخ الميلاد</Label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>نوع الحساب</Label>
                  <Input
                    value={formData.accountType === 'individual' ? 'فرد' : formData.accountType === 'office' ? 'مكتب' : 'شركة'}
                    className="mt-1 bg-gray-100"
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            {(formData.accountType === 'office' || formData.accountType === 'company') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#01411C] flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    📍 موقع المكتب / الشركة على الخريطة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-gray-500">
                    اضغط على الخريطة أو استخدم زر "موقعي الحالي" لتحديد موقع المكتب وسيتم تعبئة العنوان الوطني تلقائياً
                  </p>
                  <OfficeLocationMap
                    initialLat={formData.officeLat}
                    initialLng={formData.officeLng}
                    initialAddress={formData.officeAddressDetails}
                    onLocationSelect={(lat, lng, address) => {
                      setFormData(prev => ({
                        ...prev,
                        officeLat: lat,
                        officeLng: lng,
                        officeAddress: address.nationalAddress,
                        officeAddressDetails: address,
                        location: address.city || prev.location,
                      }));
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">📞 معلومات التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>رقم الجوال الأساسي</Label>
                  <Input
                    value={formData.primaryPhone}
                    onChange={(e) => handleInputChange("primaryPhone", e.target.value)}
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>الموقع الإلكتروني</Label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => handleInputChange("domain", e.target.value)}
                    className="mt-1"
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>رابط خرائط جوجل</Label>
                  <Input
                    value={formData.googleMapsLocation}
                    onChange={(e) => handleInputChange("googleMapsLocation", e.target.value)}
                    className="mt-1"
                    placeholder="https://maps.google.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>المدينة / المنطقة</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">📱 وسائل التواصل الاجتماعي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>⚫ TikTok</Label>
                  <Input
                    value={formData.socialMedia.tiktok}
                    onChange={(e) => handleSocialChange("tiktok", e.target.value)}
                    className="mt-1"
                    placeholder="https://tiktok.com/@..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>🐦 Twitter / X</Label>
                  <Input
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleSocialChange("twitter", e.target.value)}
                    className="mt-1"
                    placeholder="https://twitter.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>📸 Instagram</Label>
                  <Input
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleSocialChange("instagram", e.target.value)}
                    className="mt-1"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>👻 Snapchat</Label>
                  <Input
                    value={formData.socialMedia.snapchat}
                    onChange={(e) => handleSocialChange("snapchat", e.target.value)}
                    className="mt-1"
                    placeholder="https://snapchat.com/add/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>▶️ YouTube</Label>
                  <Input
                    value={formData.socialMedia.youtube}
                    onChange={(e) => handleSocialChange("youtube", e.target.value)}
                    className="mt-1"
                    placeholder="https://youtube.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>📘 Facebook</Label>
                  <Input
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleSocialChange("facebook", e.target.value)}
                    className="mt-1"
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Working Hours Tab */}
          <TabsContent value="hours" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">⏰ ساعات العمل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 w-24">
                      <Switch
                        checked={hours.isOpen}
                        onCheckedChange={(checked) => handleWorkingHoursChange(day, "isOpen", checked)}
                      />
                      <span className="text-sm font-medium">{daysArabic[day]}</span>
                    </div>
                    {hours.isOpen && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={hours.open}
                          onChange={(e) => handleWorkingHoursChange(day, "open", e.target.value)}
                          placeholder="وقت الفتح"
                          className="w-24 text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          value={hours.close}
                          onChange={(e) => handleWorkingHoursChange(day, "close", e.target.value)}
                          placeholder="وقت الإغلاق"
                          className="w-24 text-sm"
                        />
                      </div>
                    )}
                    {!hours.isOpen && (
                      <span className="text-red-500 text-sm">مغلق</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">📊 الإحصائيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>🤝 عدد الصفقات المكتملة</Label>
                    <Input
                      type="number"
                      value={formData.achievements.totalDeals}
                      onChange={(e) => handleAchievementsChange("totalDeals", parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>🏢 عدد العقارات المدرجة</Label>
                    <Input
                      type="number"
                      value={formData.achievements.totalProperties}
                      onChange={(e) => handleAchievementsChange("totalProperties", parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>👥 عدد العملاء</Label>
                    <Input
                      type="number"
                      value={formData.achievements.totalClients}
                      onChange={(e) => handleAchievementsChange("totalClients", parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>⏱️ سنوات الخبرة</Label>
                    <Input
                      type="number"
                      value={formData.achievements.yearsOfExperience}
                      onChange={(e) => handleAchievementsChange("yearsOfExperience", parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">⭐ أفضل أداء</span>
                  <Switch
                    checked={formData.achievements.topPerformer}
                    onCheckedChange={(checked) => handleAchievementsChange("topPerformer", checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">✅ موثق</span>
                  <Switch
                    checked={formData.achievements.verified}
                    onCheckedChange={(checked) => handleAchievementsChange("verified", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">🏅 الجوائز</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    placeholder="اسم الجائزة"
                    className="flex-1"
                  />
                  <Button onClick={addAward} size="icon" className="bg-[#01411C]">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.achievements.awards.map((award, i) => (
                    <span key={i} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-1">
                      {award}
                      <button onClick={() => removeAward(i)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C]">📜 الشهادات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="اسم الشهادة"
                    className="flex-1"
                  />
                  <Button onClick={addCertification} size="icon" className="bg-[#01411C]">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.achievements.certifications.map((cert, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                      {cert}
                      <button onClick={() => removeCertification(i)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Save Button */}
      <button
        onClick={handleSave}
        className="fixed bottom-24 left-4 z-40 p-4 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] border-2 border-[#D4AF37] text-white shadow-2xl hover:scale-110 transition-transform"
      >
        <Save className="w-6 h-6" />
      </button>

      {/* Welcome Dialog for New Users */}
      <AlertDialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#01411C]">
              <Info className="w-6 h-6 text-[#D4AF37]" />
              مرحباً بك في وساطة!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-3">
              <p className="text-base font-medium text-foreground">
                يرجى إكمال تسجيل المعلومات في جميع التبويبات:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>الأساسية:</strong> المعلومات الشخصية والرخص</li>
                <li><strong>التواصل:</strong> أرقام الهاتف والبريد والموقع</li>
                <li><strong>السوشيال:</strong> حسابات التواصل الاجتماعي</li>
                <li><strong>الأوقات:</strong> ساعات العمل</li>
                <li><strong>الإنجازات:</strong> الإحصائيات والجوائز</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                لا تنسَ رفع صورتك الشخصية وشعار الشركة لإكمال ملفك!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowWelcomeDialog(false)}
              className="bg-[#01411C] hover:bg-[#065f41] w-full"
            >
              فهمت، سأكمل البيانات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessCardEdit;
