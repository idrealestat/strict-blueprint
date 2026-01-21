import React, { useState, useEffect } from "react";
import { z } from "zod";
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
  LogOut,
  Star,
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
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useEntitlementsContext } from "@/context/EntitlementsContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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

// Display options for printed card
interface CardDisplaySettings {
  // Name options
  showNameEnglish: boolean;
  nameEnglish: string;
  
  // Job title
  showJobTitle: boolean;
  jobTitle: string;
  
  // Rating
  showRating: boolean;
  
  // Phone options
  showPhone: boolean;
  showWhatsapp: boolean;
  whatsappNumber: string;
  
  // Other fields
  showEmail: boolean;
  showCity: boolean;
  showDistrict: boolean;
  
  // Display name type for documents (personal / company / platform)
  displayNameType: 'personal' | 'company' | 'platform';
  platformNameArabic: string;
  
  // اختيار الاسم الرئيسي في الهيدر (للمكاتب والشركات)
  // 'company' = اسم الشركة/المكتب بالأعلى (الافتراضي)
  // 'personal' = اسم المستخدم بالأعلى
  primaryDisplayName: 'company' | 'personal';
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
  district: string;
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
  displayOptions: CardDisplaySettings;
  platformNameArabic: string; // اسم المنصة بالعربية
}

// Zod validation schema for business card
const businessCardValidationSchema = z.object({
  userName: z.string()
    .trim()
    .min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
    .max(100, { message: "الاسم يجب أن يكون أقل من 100 حرف" }),
  primaryPhone: z.string()
    .trim()
    .regex(/^05\d{8}$/, { message: "رقم الجوال غير صحيح (مثال: 0512345678)" }),
  slug: z.string()
    .trim()
    .min(3, { message: "الرابط يجب أن يكون 3 أحرف على الأقل" })
    .max(30, { message: "الرابط يجب أن يكون أقل من 30 حرف" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام فقط" }),
});

const BusinessCardEdit: React.FC<BusinessCardEditProps> = ({ onBack, user, isNewUser = false }) => {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const { completeOnboarding } = useEntitlementsContext();
  const showOfficialCard = !flagsLoading && flags.official_business_card_enabled !== false;
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
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showFirstPublishSuccess, setShowFirstPublishSuccess] = useState(false);
  const [firstPublishSlug, setFirstPublishSlug] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const STORAGE_KEY = `business_card_${user.id}`;

  // Default display options
  const defaultDisplayOptions: CardDisplaySettings = {
    showNameEnglish: false,
    nameEnglish: '',
    showJobTitle: true,
    jobTitle: 'وسيط ومسوق عقاري',
    showRating: true,
    showPhone: true,
    showWhatsapp: false,
    whatsappNumber: '',
    showEmail: true,
    showCity: true,
    showDistrict: false,
    displayNameType: 'personal',
    platformNameArabic: '',
    primaryDisplayName: 'company', // الافتراضي: اسم الشركة بالأعلى للمكاتب والشركات
  };

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
    district: "",
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
    accountType: "individual",
    displayOptions: defaultDisplayOptions,
    platformNameArabic: "",
  };

  const [formData, setFormData] = useState<BusinessCardData>(defaultFormData);

  // Load data from Supabase profiles first, then localStorage
  // البحث عن بطاقة مرتبطة بالمعرفات (رخصة فال، بطاقة الأحوال، الإيميل، الجوال)
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
            .maybeSingle();

          // البحث عن بطاقة مرتبطة بهذا المستخدم أو بمعرفاته
          let businessCard = null;
          
          // 1. أولاً نحاول البحث عن بطاقة بنفس user_id
          const { data: cardByUserId } = await supabase
            .from('business_cards')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();
          
          if (cardByUserId) {
            businessCard = cardByUserId;
          } else if (profile) {
            // 2. البحث بواسطة رخصة فال (الأولوية الأولى)
            if (profile.fal_license_number) {
              const { data: cardByFal } = await supabase
                .from('business_cards')
                .select('*')
                .eq('fal_license_number', profile.fal_license_number)
                .maybeSingle();
              if (cardByFal) businessCard = cardByFal;
            }
            
            // 3. البحث بواسطة بطاقة الأحوال (الأولوية الثانية)
            if (!businessCard && profile.national_id) {
              const { data: cardByNationalId } = await supabase
                .from('business_cards')
                .select('*')
                .eq('national_id', profile.national_id)
                .maybeSingle();
              if (cardByNationalId) businessCard = cardByNationalId;
            }
            
            // 4. البحث بواسطة الإيميل
            if (!businessCard && authUser.email) {
              const { data: cardByEmail } = await supabase
                .from('business_cards')
                .select('*')
                .eq('email', authUser.email)
                .maybeSingle();
              if (cardByEmail) businessCard = cardByEmail;
            }
            
            // 5. البحث بواسطة رقم الجوال
            if (!businessCard && profile.phone) {
              const { data: cardByPhone } = await supabase
                .from('business_cards')
                .select('*')
                .eq('phone', profile.phone)
                .maybeSingle();
              if (cardByPhone) businessCard = cardByPhone;
            }
          }

          if (businessCard) {
            // ❌ ممنوع نقل الملكية التلقائي - البطاقة يجب أن تكون مملوكة للمستخدم الحالي فقط
            // إذا كانت البطاقة مملوكة لمستخدم آخر، نتجاهلها (لا ننقل ملكيتها)
            if (businessCard.user_id !== authUser.id) {
              console.log('Found card with matching identifiers but owned by another user - ignoring');
              // لا يوجد سجل للمستخدم الحالي
              setIsPublished(false);
              setCurrentSlug(null);
              setProfileLoaded(true);
              return;
            }
            
            setIsPublished(businessCard.published);
            setCurrentSlug(businessCard.slug);
            
            // تحميل بيانات البطاقة المحفوظة
            const savedCardData = businessCard.data as Partial<BusinessCardData>;
            if (savedCardData) {
              setFormData(prev => ({
                ...prev,
                ...savedCardData,
                // تعبئة الإيميل من حساب المستخدم
                email: authUser.email || savedCardData.email || prev.email,
                // تعبئة الجوال من الملف الشخصي
                primaryPhone: profile?.phone || savedCardData.primaryPhone || prev.primaryPhone,
              }));
              setProfileLoaded(true);
              return;
            }
          } else {
            // لا يوجد سجل بعد - نُظهر زر النشر (غير منشور افتراضياً)
            setIsPublished(false);
            setCurrentSlug(null);
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
            // تعبئة الإيميل والجوال تلقائياً من حساب المستخدم
            setFormData(prev => ({
              ...prev,
              ...localData,
              userName: profile.full_name || localData.userName || prev.userName,
              companyName: profile.company_name || localData.companyName || prev.companyName,
              websiteUrl: profile.website || localData.websiteUrl || "",
              // تعبئة الجوال تلقائياً من الملف الشخصي
              primaryPhone: profile.phone || localData.primaryPhone || prev.primaryPhone,
              // تعبئة الإيميل تلقائياً من حساب المستخدم
              email: authUser.email || localData.email || prev.email,
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
      // مسح أخطاء التحقق السابقة
      setValidationErrors({});
      
      // تحديد الـ slug المستخدم:
      // 1. إذا كان المستخدم يحتفظ بنفس الـ slug الحالي المنشور
      // 2. أو إذا اختار slug جديد متاح
      const userTitleSlug = formData.userTitle ? String(formData.userTitle).trim() : '';
      const isKeepingCurrentSlug = currentSlug && userTitleSlug === currentSlug;
      const selectedSlug = (isKeepingCurrentSlug || isSlugAvailable) ? userTitleSlug : '';
      
      // التحقق من صحة البيانات باستخدام Zod
      const validationResult = businessCardValidationSchema.safeParse({
        userName: formData.userName,
        primaryPhone: formData.primaryPhone,
        slug: selectedSlug,
      });

      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          errors[field] = err.message;
        });
        setValidationErrors(errors);
        
        // عرض أول خطأ كـ toast
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const dataToSave = JSON.stringify(formData);
      // Check if data size is too large (localStorage limit is ~5MB)
      if (dataToSave.length > 4 * 1024 * 1024) {
        toast.error("حجم البيانات كبير جداً! حاول استخدام صور أصغر");
        return;
      }
      // حفظ بالمفتاح الأساسي
      localStorage.setItem(STORAGE_KEY, dataToSave);

      // حفظ نسخة للربط مع منصتي - جميع الصور
      const platformData = {
        profileImage: formData.profileImage,
        coverImage: formData.coverImage,
        logoImage: formData.logoImage, // إضافة الشعار للربط الكامل
        name: formData.userName,
        title: formData.companyName || 'وسيط عقاري معتمد'
      };
      localStorage.setItem('wasata_business_card_data', JSON.stringify(platformData));
      
      // إرسال حدث لتحديث البطاقة في نفس التبويب
      window.dispatchEvent(new CustomEvent('businessCardUpdated'));

      // الحصول على user id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // التحقق من اكتمال البيانات الأساسية (الاسم + الهاتف)
      const hasBasicFields = formData.userName?.trim() && formData.primaryPhone?.trim();
      
      // التحقق من حالة النشر الحالية للبطاقة الخاصة بالمستخدم
      const { data: currentCard } = await supabase
        .from('business_cards')
        .select('id, published, slug')
        .eq('user_id', authUser.id)
        .maybeSingle();

      // 1) التحقق من تفرد الـ slug في قاعدة البيانات
      // نتجاوز التحقق إذا كان المستخدم يحتفظ بنفس الـ slug الخاص به
      const isKeepingSameSlug = currentCard?.slug === selectedSlug;
      
      if (!isKeepingSameSlug) {
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
      }

      // ❌ لا نشر تلقائي - يجب استخدام زر النشر المنفصل
      // حفظ slug لا يغير حالة النشر

      // ✅ التحقق من عدم تكرار رخصة فال (لا يمكن تعديلها إلا بإذن المالك)
      if (formData.falLicense?.trim()) {
        const { data: existingFal } = await supabase
          .from('business_cards')
          .select('id, user_id')
          .eq('fal_license_number', formData.falLicense.trim())
          .neq('user_id', authUser.id)
          .maybeSingle();
        
        if (existingFal) {
          toast.error('رقم رخصة فال مستخدم في حساب آخر. لا يمكن استخدام نفس الرخصة في أكثر من حساب.');
          return;
        }
      }
      
      // ✅ التحقق من عدم تكرار رقم الهوية (لا يمكن تعديله إلا بإذن المالك)
      if (formData.nationalId?.trim()) {
        const { data: existingId } = await supabase
          .from('business_cards')
          .select('id, user_id')
          .eq('national_id', formData.nationalId.trim())
          .neq('user_id', authUser.id)
          .maybeSingle();
        
        if (existingId) {
          toast.error('رقم الهوية مستخدم في حساب آخر. لا يمكن استخدام نفس الرقم في أكثر من حساب.');
          return;
        }
      }

      // 2) إعداد بيانات الحفظ
      const cardDataPayload = JSON.parse(JSON.stringify({
        ...formData,
        swapState: localStorage.getItem(`business_card_swap_${user.id}`) === 'true',
      }));

      // تحديد طريقة الحفظ: تحديث إذا كان السجل موجوداً، إنشاء إذا لم يكن
      // إضافة المعرفات لربط النطاق بها (رخصة فال، بطاقة الأحوال، الإيميل، الجوال)
      const identifiers = {
        fal_license_number: formData.falLicense?.trim() || null,
        national_id: formData.nationalId?.trim() || null,
        email: authUser.email || formData.email?.trim() || null,
        phone: formData.primaryPhone?.trim() || null,
      };

      if (currentCard) {
        // ✅ قفل slug: إذا كانت البطاقة منشورة و slug الجديد مختلف -> رفض
        if (currentCard.published && currentCard.slug && currentCard.slug !== selectedSlug) {
          toast.error('لا يمكن تغيير الرابط بعد النشر. الرابط مقفل.');
          return;
        }
        
        // تحديث السجل الموجود (لا تغيير على published - استخدم زر النشر)
        const { error: updateError } = await supabase
          .from('business_cards')
          .update({
            slug: selectedSlug,
            data: cardDataPayload,
            updated_at: new Date().toISOString(),
            // ❌ لا تغيير تلقائي للنشر - يبقى كما هو
            // حفظ المعرفات لاسترداد البطاقة لاحقاً
            ...identifiers
          })
          .eq('user_id', authUser.id);

        if (updateError) {
          console.error('Error updating business card:', updateError);
          if (updateError.code === '23505' && updateError.message?.includes('slug')) {
            toast.error('هذا الرابط محجوز بالفعل. اختر رابطاً آخر.');
          } else {
            toast.error('حدث خطأ في حفظ البطاقة');
          }
          return;
        }
      } else {
        // إنشاء سجل جديد مع المعرفات (غير منشور افتراضياً)
        const { error: insertError } = await supabase
          .from('business_cards')
          .insert([{
            user_id: authUser.id,
            slug: selectedSlug,
            data: cardDataPayload,
            published: false, // ❌ لا نشر تلقائي - يجب استخدام زر النشر
            // حفظ المعرفات لاسترداد البطاقة لاحقاً
            ...identifiers
          }]);

        if (insertError) {
          console.error('Error creating business card:', insertError);
          if (insertError.code === '23505' && insertError.message?.includes('slug')) {
            toast.error('هذا الرابط محجوز بالفعل. اختر رابطاً آخر.');
          } else {
            toast.error('حدث خطأ في إنشاء البطاقة');
          }
          return;
        }
      }

      // تحديث حالة الـ onboarding في الـ context والـ database معاً
      await completeOnboarding();

      // حفظ الـ slug المستخدم للرابط العام
      localStorage.setItem('public_platform_slug', selectedSlug);

      // إرسال حدث لتحديث المنصة فوراً
      window.dispatchEvent(new CustomEvent('businessCardUpdated'));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);

      // تحديث الـ slug في الـ state
      setCurrentSlug(selectedSlug);

      toast.success("تم حفظ التغييرات بنجاح!");
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

      {/* نافذة النجاح التفصيلية عند أول نشر */}
      <AlertDialog open={showFirstPublishSuccess} onOpenChange={setShowFirstPublishSuccess}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl">🎉 تهانينا! صفحتك العامة جاهزة</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base">
                تم نشر بطاقة أعمالك بنجاح ويمكن لأي شخص زيارتها الآن!
              </p>
               <div className="bg-muted p-4 rounded-lg">
                 <p className="text-sm text-muted-foreground mb-2">رابط بطاقة أعمالك العامة:</p>
                 <a 
                   href={`https://wasataai.com/${firstPublishSlug}/card`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-primary font-bold text-lg hover:underline break-all"
                 >
                   wasataai.com/{firstPublishSlug}/card
                 </a>
               </div>
               <p className="text-sm text-muted-foreground">
                 يمكنك مشاركة هذا الرابط مع عملائك عبر واتساب أو وسائل التواصل الاجتماعي
               </p>
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
             <AlertDialogAction 
               className="w-full bg-primary"
               onClick={() => {
                 navigator.clipboard.writeText(`https://wasataai.com/${firstPublishSlug}/card`);
                 toast.success('تم نسخ الرابط!');
               }}
            >
              <Share2 className="w-4 h-4 ml-2" />
              نسخ الرابط
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">إغلاق</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] px-4 py-3 border-b-2 border-[#D4AF37]">
        {/* الهيدر للجوال: اسم الصفحة في سطر واحد + الأزرار أسفله */}
        <div className="flex flex-col gap-2">
          {/* اسم الصفحة وحالة النشر في الأعلى */}
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-white text-lg font-bold whitespace-nowrap">تعديل البطاقة</h1>
            {/* مؤشر حالة النشر */}
            {isPublished !== null && (
              isPublished ? (
                <div className="inline-flex items-center gap-1 bg-green-400/20 text-green-100 px-2 py-0.5 rounded-full border border-green-400/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <span className="text-xs font-bold">مباشر</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-100 border border-yellow-400/30">
                  <AlertCircle className="w-3 h-3" />
                  <span>غير منشورة</span>
                </div>
              )
            )}
          </div>
          
          {/* الأزرار في سطر منفصل */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20 h-8"
            >
              <ArrowRight className="w-3 h-3 ml-1" />
              عودة
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } catch (e) {
                  console.error('Logout error:', e);
                } finally {
                  window.location.href = '/app/login';
                }
              }}
              className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20 h-8"
            >
              <LogOut className="w-3 h-3 ml-1" />
              خروج
            </Button>
          </div>
        </div>
        
        {/* رابط الصفحة العامة إذا كانت منشورة */}
        {isPublished && currentSlug && (
          <div className="flex items-center justify-center mb-3">
            <a
              href={`https://wasataai.com/${currentSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37] text-sm hover:underline flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"
            >
              <Globe className="w-3.5 h-3.5" />
              wasataai.com/{currentSlug}
            </a>
          </div>
        )}
        
        {/* الصف الثاني: أزرار التحكم - منظمة بشكل أفقي */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* زر المعاينة المحلية */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-white hover:bg-white/20 h-8 text-xs border border-white/20"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5 ml-1" /> : <Eye className="w-3.5 h-3.5 ml-1" />}
            {showPreview ? 'إخفاء' : 'معاينة'}
          </Button>
          
          {/* زر نشر/إيقاف النشر */}
          {isPublished !== null && (
            <>
              {isPublished ? (
                <AlertDialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-destructive/15 text-red-200 hover:bg-destructive/25 border border-destructive/30 h-8 text-xs"
                    >
                      <EyeOff className="w-3.5 h-3.5 ml-1" />
                      إيقاف النشر
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد إيقاف النشر</AlertDialogTitle>
                      <AlertDialogDescription className="text-right">
                        هل أنت متأكد من إيقاف نشر صفحتك العامة؟
                        <br />
                        <span className="text-muted-foreground">لن يتمكن أحد من زيارة صفحتك على الرابط التالي:</span>
                        <br />
                        <span className="font-mono text-sm text-primary">wasataai.com/{currentSlug}</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          try {
                            const { data: { user: authUser } } = await supabase.auth.getUser();
                            if (!authUser) {
                              toast.error('يجب تسجيل الدخول أولاً');
                              return;
                            }
                            
                            const { error } = await supabase
                              .from('business_cards')
                              .update({ 
                                published: false,
                                updated_at: new Date().toISOString()
                              })
                              .eq('user_id', authUser.id);
                            
                            if (error) {
                              console.error('Error unpublishing:', error);
                              toast.error('حدث خطأ في إيقاف النشر');
                              return;
                            }
                            
                            setIsPublished(false);
                            toast.success('تم إيقاف نشر صفحتك');
                          } catch (err) {
                            console.error('Unpublish error:', err);
                            toast.error('حدث خطأ غير متوقع');
                          }
                        }}
                      >
                        إيقاف النشر
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { data: { user: authUser } } = await supabase.auth.getUser();
                      if (!authUser) {
                        toast.error('يجب تسجيل الدخول أولاً');
                        return;
                      }
                      
                      if (!currentSlug) {
                        toast.error('يجب حفظ الصفحة أولاً مع اختيار رابط متاح');
                        return;
                      }
                      
                      const { error } = await supabase
                        .from('business_cards')
                        .update({ 
                          published: true,
                          updated_at: new Date().toISOString()
                        })
                        .eq('user_id', authUser.id);
                      
                      if (error) {
                        console.error('Error publishing:', error);
                        toast.error('حدث خطأ في النشر');
                        return;
                      }
                      
                      setIsPublished(true);
                      toast.success(`تم نشر صفحتك ✨ رابطك: wasataai.com/${currentSlug}`);
                    } catch (err) {
                      console.error('Publish error:', err);
                      toast.error('حدث خطأ غير متوقع');
                    }
                  }}
                  className="bg-green-500/20 text-green-100 hover:bg-green-500/30 border border-green-400/30 h-8 text-xs"
                >
                  <Globe className="w-3.5 h-3.5 ml-1" />
                  نشر
                </Button>
              )}
            </>
          )}
          
          {/* زر معاينة الصفحة العامة */}
          {isPublished && currentSlug && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/${currentSlug}`, '_blank')}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/30 h-8 text-xs"
            >
              <Eye className="w-3.5 h-3.5 ml-1" />
              فتح الصفحة
            </Button>
          )}
          
          {/* زر الحفظ - مميز */}
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-[#D4AF37] text-[#01411C] hover:bg-[#f1c40f] h-8 text-xs font-bold"
          >
            <Save className="w-3.5 h-3.5 ml-1" />
            حفظ
          </Button>
        </div>
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
          <TabsList className={`grid w-full bg-gray-100 ${showOfficialCard ? 'grid-cols-6' : 'grid-cols-5'}`}>
            {showOfficialCard && (
              <TabsTrigger value="card" className="text-xs data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C]">
                البطاقة
              </TabsTrigger>
            )}
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

          {/* Card Display Options Tab - Only show if feature is enabled */}
          {showOfficialCard && (
          <TabsContent value="card" className="mt-4 space-y-4">
            <Card className="border-2 border-[#D4AF37]/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#01411C] flex items-center gap-2">
                  🎨 إعدادات عرض البطاقة المطبوعة
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  تحكم في ما يظهر على بطاقة الأعمال الرسمية وترتيبه
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-lg border border-blue-200">
                  💡 جميع المعلومات مقتبسة من بطاقة أعمالك الرقمية. أي تغيير هناك ينعكس هنا تلقائياً.
                </p>

                {/* Name English Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-sm">عرض الاسم بالإنجليزي</span>
                      <p className="text-xs text-muted-foreground">يظهر تحت الاسم العربي مباشرة</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showNameEnglish}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showNameEnglish: checked }
                    }))}
                  />
                </div>
                
                {formData.displayOptions.showNameEnglish && (
                  <div className="mr-6">
                    <Label className="text-xs">الاسم بالإنجليزي</Label>
                    <Input
                      value={formData.displayOptions.nameEnglish}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        displayOptions: { ...prev.displayOptions, nameEnglish: e.target.value }
                      }))}
                      placeholder="Your Name in English"
                      className="mt-1"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Primary Display Name Toggle - للمكاتب والشركات فقط */}
                {(formData.accountType === 'office' || formData.accountType === 'company') && (
                  <div className="py-2 border-b border-[#D4AF37]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-[#D4AF37]" />
                      <div>
                        <span className="text-sm font-medium">الاسم الرئيسي في الهيدر</span>
                        <p className="text-xs text-muted-foreground">اختر أي اسم يظهر بالأعلى بشكل كبير</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mr-6 mt-2">
                      <Button
                        type="button"
                        variant={formData.displayOptions.primaryDisplayName === 'company' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, primaryDisplayName: 'company' }
                        }))}
                        className={formData.displayOptions.primaryDisplayName === 'company' ? 'bg-[#01411C]' : ''}
                      >
                        <Building className="w-4 h-4 ml-1" />
                        اسم {formData.accountType === 'office' ? 'المكتب' : 'الشركة'}
                      </Button>
                      <Button
                        type="button"
                        variant={formData.displayOptions.primaryDisplayName === 'personal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          displayOptions: { ...prev.displayOptions, primaryDisplayName: 'personal' }
                        }))}
                        className={formData.displayOptions.primaryDisplayName === 'personal' ? 'bg-[#01411C]' : ''}
                      >
                        <User className="w-4 h-4 ml-1" />
                        اسم المستخدم
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 mr-6">
                      {formData.displayOptions.primaryDisplayName === 'company' 
                        ? `سيظهر "${formData.companyName || 'اسم الشركة'}" بالأعلى و "${formData.userName}" بالأسفل`
                        : `سيظهر "${formData.userName}" بالأعلى و "${formData.companyName || 'اسم الشركة'}" بالأسفل`
                      }
                    </p>
                  </div>
                )}

                {/* Job Title Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-sm">عرض المسمى الوظيفي</span>
                      <p className="text-xs text-muted-foreground">{formData.displayOptions.jobTitle || 'وسيط ومسوق عقاري'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showJobTitle}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showJobTitle: checked }
                    }))}
                  />
                </div>

                {formData.displayOptions.showJobTitle && (
                  <div className="mr-6">
                    <Label className="text-xs">تعديل المسمى الوظيفي</Label>
                    <Input
                      value={formData.displayOptions.jobTitle}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        displayOptions: { ...prev.displayOptions, jobTitle: e.target.value }
                      }))}
                      placeholder="وسيط ومسوق عقاري"
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Rating Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm">عرض التقييم</span>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showRating}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showRating: checked }
                    }))}
                  />
                </div>

                {/* Phone Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-sm">عرض رقم الجوال</span>
                      <p className="text-xs text-muted-foreground">{formData.primaryPhone || 'غير محدد'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showPhone}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showPhone: checked }
                    }))}
                  />
                </div>

                {/* WhatsApp Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <div>
                      <span className="text-sm">عرض رقم الواتساب</span>
                      <p className="text-xs text-muted-foreground">{formData.displayOptions.whatsappNumber || 'نفس رقم الجوال'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showWhatsapp}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showWhatsapp: checked }
                    }))}
                  />
                </div>

                {formData.displayOptions.showWhatsapp && (
                  <div className="mr-6">
                    <Label className="text-xs">رقم واتساب مختلف (اختياري)</Label>
                    <Input
                      value={formData.displayOptions.whatsappNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        displayOptions: { ...prev.displayOptions, whatsappNumber: e.target.value }
                      }))}
                      placeholder="اتركه فارغاً لاستخدام رقم الجوال"
                      className="mt-1"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Email Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-sm">عرض البريد الإلكتروني</span>
                      <p className="text-xs text-muted-foreground">{formData.email || 'غير محدد'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showEmail}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showEmail: checked }
                    }))}
                  />
                </div>

                {/* City Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-sm">عرض المدينة</span>
                      <p className="text-xs text-muted-foreground">{formData.location || 'غير محددة'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showCity}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showCity: checked }
                    }))}
                  />
                </div>

                {/* District Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <span className="text-sm">عرض الحي</span>
                      <p className="text-xs text-muted-foreground">{formData.district || 'غير محدد'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.displayOptions.showDistrict}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      displayOptions: { ...prev.displayOptions, showDistrict: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

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
                {/* مؤشر نوع الحساب */}
                <Card className={`border-2 ${
                  formData.accountType === 'office' || formData.accountType === 'company' 
                    ? 'border-[#01411C] bg-green-50' 
                    : 'border-dashed border-amber-400 bg-amber-50'
                }`}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          formData.accountType === 'office' || formData.accountType === 'company'
                            ? 'bg-[#01411C]'
                            : 'bg-amber-500'
                        }`}>
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`font-bold ${
                            formData.accountType === 'office' || formData.accountType === 'company'
                              ? 'text-[#01411C]'
                              : 'text-amber-800'
                          }`}>
                            نوع الحساب: {
                              formData.accountType === 'company' ? '🏢 شركة' :
                              formData.accountType === 'office' ? '🏬 مكتب' : '👤 فرد'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formData.accountType === 'office' || formData.accountType === 'company'
                              ? 'حسابك يتضمن ميزات المكتب والشركة'
                              : 'قم بترقية حسابك للوصول إلى ميزات المكتب والشركة'
                            }
                          </p>
                        </div>
                      </div>
                      {!(formData.accountType === 'office' || formData.accountType === 'company') && (
                        <Button
                          type="button"
                          onClick={() => window.location.href = '/app/choose-plan'}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          <Building className="w-4 h-4 ml-1" />
                          ترقية الحساب
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* حقول الشركة - تظهر فقط للمكاتب والشركات */}
                {(formData.accountType === 'office' || formData.accountType === 'company') && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>تغيير نوع الحساب</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.accountType === 'office' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleInputChange("accountType", "office")}
                          className={formData.accountType === 'office' ? 'bg-[#01411C]' : ''}
                        >
                          <Building className="w-4 h-4 ml-1" />
                          مكتب
                        </Button>
                        <Button
                          type="button"
                          variant={formData.accountType === 'company' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleInputChange("accountType", "company")}
                          className={formData.accountType === 'company' ? 'bg-[#01411C]' : ''}
                        >
                          <Building className="w-4 h-4 ml-1" />
                          شركة
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>اسم {formData.accountType === 'office' ? 'المكتب' : 'الشركة'}</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        className="mt-1"
                        placeholder={`اسم ${formData.accountType === 'office' ? 'المكتب' : 'الشركة'} العقاري${formData.accountType === 'company' ? 'ة' : ''}`}
                      />
                    </div>
                  </>
                )}
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
                
                {/* حقول السجل التجاري - تظهر فقط للمكاتب والشركات */}
                {(formData.accountType === 'office' || formData.accountType === 'company') && (
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
                )}
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
                <div>
                  <Label>الحي</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                    className="mt-1"
                    placeholder="مثال: حي الملقا"
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
