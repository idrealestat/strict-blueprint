import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Edit2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  MessageSquare,
  Download,
  Home,
  Search,
  Calculator,
  FileText,
  Share2,
  Star,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  Users,
  Building,
  Calendar,
  Copy,
  Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getPublicPlatformSlug } from "@/utils/publicPlatform";

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

interface BusinessCardProfileProps {
  onBack: () => void;
  onEditClick: () => void;
  user: User;
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

interface BusinessCardData {
  userName: string;
  companyName: string;
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
}

const BusinessCardProfile: React.FC<BusinessCardProfileProps> = ({ onBack, onEditClick, user }) => {
  const STORAGE_KEY = `business_card_${user.id}`;
  const SWAP_KEY = `business_card_swap_${user.id}`;
  
  // تحميل حالة التبديل من localStorage
  const [showSwappedImage, setShowSwappedImage] = useState(() => {
    const saved = localStorage.getItem(SWAP_KEY);
    return saved === 'true';
  });
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Default form data
  const defaultFormData: BusinessCardData = {
    userName: user.name,
    companyName: user.companyName || "",
    falLicense: "1234567890",
    falExpiry: "2025-12-31",
    commercialRegistration: "1010123456",
    commercialExpiryDate: "2025-06-30",
    primaryPhone: user.phone,
    email: user.email,
    domain: "https://wasata.ai/broker/ahmed",
    googleMapsLocation: "https://maps.google.com/?q=24.7136,46.6753",
    location: user.city,
    officialPlatform: "wasata.ai",
    bio: "وسيط عقاري معتمد من الهيئة العامة للعقار، متخصص في العقارات السكنية والتجارية في منطقة الرياض. أسعى دائماً لتقديم أفضل الخدمات العقارية لعملائي الكرام مع الالتزام بالشفافية والمصداقية.",
    socialMedia: {
      tiktok: "https://tiktok.com/@broker",
      twitter: "https://twitter.com/broker",
      instagram: "https://instagram.com/broker",
      snapchat: "https://snapchat.com/add/broker",
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
      totalDeals: 45,
      totalProperties: 120,
      totalClients: 89,
      yearsOfExperience: 8,
      awards: ["أفضل وسيط 2024", "وسيط متميز 2023"],
      certifications: ["رخصة فال", "شهادة التسويق العقاري"],
      topPerformer: true,
      verified: true
    },
    profileImage: "",
    coverImage: "",
    logoImage: ""
  };

  const [formData, setFormData] = useState<BusinessCardData>(defaultFormData);

  // Load data from localStorage - runs on mount and when returning from edit
  useEffect(() => {
    const loadData = () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Merge with defaults to ensure all fields exist
          setFormData(prev => ({
            ...defaultFormData,
            ...parsed,
            // Ensure images are properly loaded
            profileImage: parsed.profileImage || "",
            coverImage: parsed.coverImage || "",
            logoImage: parsed.logoImage || ""
          }));
        } catch (error) {
          console.error("Error loading saved data:", error);
        }
      }
    };
    
    loadData();
    
    // Listen for storage changes (when edit page saves)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [STORAGE_KEY]);

  // Get badge level based on deals and experience
  const getBadgeLevel = () => {
    const deals = formData.achievements.totalDeals;
    const years = formData.achievements.yearsOfExperience;
    
    if (deals >= 100 && years >= 10) return { name: "ماسي", icon: "👑", color: "bg-purple-100 text-purple-800" };
    if (deals >= 50 && years >= 5) return { name: "بلاتيني", icon: "🏆", color: "bg-gray-100 text-gray-800" };
    if (deals >= 30 && years >= 3) return { name: "ذهبي", icon: "🥇", color: "bg-yellow-100 text-yellow-800" };
    if (deals >= 15 && years >= 2) return { name: "فضي", icon: "🥈", color: "bg-gray-200 text-gray-700" };
    if (deals >= 5 && years >= 1) return { name: "برونزي", icon: "🥉", color: "bg-orange-100 text-orange-800" };
    return { name: "مبتدئ", icon: "⚡", color: "bg-blue-100 text-blue-800" };
  };

  // Get license expiry status color
  const getExpiryColor = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft > 90) return "bg-green-100 text-green-800";
    if (daysLeft > 30) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Handle manual save
  const handleManualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
      toast.success("تم حفظ التغييرات بنجاح!");
    } catch (error) {
      setShowError(true);
      setErrorMessage("حدث خطأ في الحفظ");
      toast.error("فشل الحفظ!");
    }
  };

  // Handle bio save
  const handleBioSave = () => {
    handleManualSave();
    setIsEditingBio(false);
  };

  // Handle download vCard
  const handleDownloadVCard = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${formData.userName}
ORG:${formData.companyName}
TEL;TYPE=CELL:${formData.primaryPhone}
EMAIL:${formData.email}
URL:${formData.domain}
ADR;TYPE=WORK:;;${formData.location}
TITLE:وسيط عقاري
END:VCARD`;
    
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formData.userName}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تحميل البطاقة!");
  };

  const PLATFORM_BASE_URL = 'https://wasataai.com';

  // Get slug (الأولوية للـ slug المنشور للمنصة العامة)
  const getSlug = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    let fromSaved: any = undefined;
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        fromSaved = data.userTitle || data.slug;
      } catch (e) {}
    }

    // لا نسمح أبداً بإظهار رقم مثل /1 كرابط عام
    return getPublicPlatformSlug([fromSaved]);
  };

  // Share business card
  const shareBusinessCard = async () => {
    const slug = getSlug();
    const cardLink = `${PLATFORM_BASE_URL}/${slug}/businesscard`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `بطاقة أعمال - ${formData.userName}`,
          text: `تفضل بزيارة بطاقتي الرقمية`,
          url: cardLink,
        });
      } catch (error) {
        navigator.clipboard.writeText(cardLink);
        toast.success("تم نسخ الرابط!");
      }
    } else {
      navigator.clipboard.writeText(cardLink);
      toast.success("تم نسخ الرابط!");
    }
  };

  const badge = getBadgeLevel();

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
      {/* Welcome Message Toast */}
      {showWelcomeMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>مرحباً بعودتك! 🎉 تم استعادة بياناتك المحفوظة بنجاح</span>
          </div>
        </div>
      )}

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

      {/* Full Header Section with Green Background */}
      <div 
        className="relative bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-6 shadow-2xl border-b-4 border-[#D4AF37] bg-cover bg-center transition-all duration-500"
        style={formData.coverImage ? {
          backgroundImage: `url(${formData.coverImage})`,
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(1, 65, 28, 0.85)'
        } : undefined}
      >
        {/* Pattern overlay - only when no cover image */}
        {!formData.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>
        )}
        
        {/* Top Navigation */}
        <div className="relative z-10 px-4 pt-4 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            عودة
          </Button>
          <Button
            variant="ghost"
            onClick={onEditClick}
            className="text-white hover:bg-white/20"
          >
            <Edit2 className="w-5 h-5 ml-2" />
            تحرير
          </Button>
        </div>

        {/* Current Slug Display with Copy Button */}
        {(() => {
          const currentSlug = getSlug();
          const fullUrl = `${PLATFORM_BASE_URL}/${currentSlug}`;
          return (
            <div className="relative z-10 mx-4 mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Link className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-xs text-white/70">رابطك العام:</span>
                  <span className="text-sm font-medium text-white truncate" dir="ltr">
                    {fullUrl}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(fullUrl);
                    toast.success("تم نسخ الرابط!");
                  }}
                  className="text-white hover:bg-white/20 px-2 py-1 h-auto flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Profile Image - Bigger size with improved touch swap */}
        <div className="relative z-10 flex justify-center pt-6">
          <div 
            className="relative cursor-pointer group select-none"
            onClick={() => {
              // تبديل الصور عند اللمس/النقر وحفظ الحالة
              if (formData.profileImage && formData.logoImage) {
                const newState = !showSwappedImage;
                setShowSwappedImage(newState);
                localStorage.setItem(SWAP_KEY, String(newState));
                // إرسال حدث لتحديث منصتي
                window.dispatchEvent(new CustomEvent('businessCardSwapped'));
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (formData.profileImage && formData.logoImage) {
                const newState = !showSwappedImage;
                setShowSwappedImage(newState);
                localStorage.setItem(SWAP_KEY, String(newState));
                window.dispatchEvent(new CustomEvent('businessCardSwapped'));
              }
            }}
          >
            {/* Main Profile Image - Increased size with smooth transitions */}
            <div className="w-36 h-36 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 bg-gradient-to-br from-white/20 to-white/10">
              {(showSwappedImage ? formData.logoImage : formData.profileImage) ? (
                <img 
                  src={showSwappedImage ? formData.logoImage : formData.profileImage} 
                  alt={showSwappedImage ? "Logo" : "Profile"} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-[#D4AF37] transition-all duration-300">
                  {showSwappedImage ? "🏢" : formData.userName.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Small Logo/Profile Badge - Shows opposite of main */}
            <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg bg-[#D4AF37] flex items-center justify-center text-white text-sm overflow-hidden transition-all duration-300 ease-out transform hover:scale-110 active:scale-95">
              {(showSwappedImage ? formData.profileImage : formData.logoImage) ? (
                <img 
                  src={showSwappedImage ? formData.profileImage : formData.logoImage} 
                  alt={showSwappedImage ? "Profile" : "Logo"} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
              ) : (
                <span className="transition-all duration-300">
                  {showSwappedImage ? formData.userName.charAt(0) : "🏢"}
                </span>
              )}
            </div>
            
            {/* Swap indicator - only shows when both images exist */}
            {formData.profileImage && formData.logoImage && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white/90 text-[#01411C] text-xs px-2 py-0.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                اضغط للتبديل
              </div>
            )}
          </div>
        </div>

        {/* Profile Info - All on green background */}
        <div className="relative z-10 pt-4 pb-8 px-4 text-center">
          {/* Name and Badge */}
          <h1 className="text-2xl font-bold text-white">{formData.userName}</h1>
          <div className="mt-2 inline-flex items-center gap-2 flex-wrap justify-center">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white cursor-pointer transition-transform hover:scale-110 backdrop-blur-sm"
              title={`${badge.name} - ${formData.achievements.totalDeals} صفقة - ${formData.achievements.yearsOfExperience} سنوات خبرة`}
            >
              {badge.icon} {badge.name}
            </span>
            {formData.achievements.verified && (
              <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                ✅ موثق
              </span>
            )}
            {formData.achievements.topPerformer && (
              <span className="px-2 py-1 rounded-full text-xs bg-[#D4AF37] text-white">
                ⭐ أفضل أداء
              </span>
            )}
          </div>

          {/* Company */}
          {formData.companyName && (
            <p className="mt-2 text-white/90 flex items-center justify-center gap-1">
              <Building className="w-4 h-4" />
              {formData.companyName}
            </p>
          )}

          {/* Licenses */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {formData.falLicense && (
              <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                📜 رخصة فال: {formData.falLicense}
              </span>
            )}
            {formData.commercialRegistration && (
              <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                📋 السجل: {formData.commercialRegistration}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-white/90">
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              {formData.primaryPhone}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              {formData.email}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              {formData.location}
            </span>
          </div>

          {/* Website/Domain if available */}
          {formData.domain && (
            <div className="mt-3">
              <a 
                href={formData.domain} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-[#D4AF37] text-[#01411C] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#f1c40f] transition-colors"
              >
                <Globe className="w-4 h-4" />
                زيارة الموقع
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6 space-y-4">
        {/* Bio Section */}
        <Card className="border-2 border-[#D4AF37] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-[#01411C]">
              📝 نبذة عني
              {!isEditingBio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingBio(true)}
                  className="text-[#D4AF37]"
                >
                  ✏️ تعديل
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingBio ? (
              <div className="space-y-3">
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 500) })}
                  className="min-h-24"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{formData.bio.length}/500</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditingBio(false)}>
                      إلغاء
                    </Button>
                    <Button size="sm" className="bg-[#01411C]" onClick={handleBioSave}>
                      حفظ
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{formData.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Achievements Card */}
        <Card className="border-2 border-[#D4AF37] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-[#01411C]">🏆 الإنجازات والإحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#01411C]">🤝 {formData.achievements.totalDeals}</div>
                <div className="text-xs text-gray-600">صفقة مكتملة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#01411C]">🏢 {formData.achievements.totalProperties}</div>
                <div className="text-xs text-gray-600">عقار مدرج</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#01411C]">👥 {formData.achievements.totalClients}</div>
                <div className="text-xs text-gray-600">عميل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#01411C]">⏱️ {formData.achievements.yearsOfExperience}</div>
                <div className="text-xs text-gray-600">سنوات خبرة</div>
              </div>
            </div>

            {/* Awards */}
            {formData.achievements.awards.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">🏅 الجوائز</p>
                <div className="flex flex-wrap gap-2">
                  {formData.achievements.awards.map((award, i) => (
                    <span key={i} className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded-full text-xs">
                      {award}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {formData.achievements.certifications.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">📜 الشهادات</p>
                <div className="flex flex-wrap gap-2">
                  {formData.achievements.certifications.map((cert, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Working Hours Card */}
        <Card className="border-2 border-[#D4AF37] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-[#01411C]">⏰ ساعات العمل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(formData.workingHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-700">{daysArabic[day]}</span>
                  {hours.isOpen ? (
                    <span className="text-green-600 text-sm">
                      ✅ {hours.open} - {hours.close}
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm">❌ مغلق</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons Card */}
        <Card className="border-2 border-[#D4AF37] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-[#01411C]">🎯 خدماتي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* My Platform - First Button */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37] to-[#b8941f] text-[#01411C] hover:opacity-90 col-span-2 md:col-span-4"
                onClick={() => {
                  const slug = getSlug();
                  window.open(`${PLATFORM_BASE_URL}/${slug}`, '_blank');
                }}
              >
                <Home className="w-6 h-6" />
                <span className="text-sm font-bold">منصتي</span>
              </Button>

              {/* Website */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => window.open(formData.domain, "_blank")}
                disabled={!formData.domain}
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs">الموقع</span>
              </Button>

              {/* Google Maps */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => window.open(formData.googleMapsLocation, "_blank")}
                disabled={!formData.googleMapsLocation}
              >
                <MapPin className="w-5 h-5" />
                <span className="text-xs">خرائط جوجل</span>
              </Button>

              {/* Direct Call */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => window.open(`tel:${formData.primaryPhone}`)}
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">اتصال مباشر</span>
              </Button>

              {/* WhatsApp */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => window.open(`https://wa.me/${formData.primaryPhone.replace(/\D/g, "")}`)}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs">واتساب</span>
              </Button>

              {/* Email */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => window.open(`mailto:${formData.email}`)}
                disabled={!formData.email}
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs">إيميل</span>
              </Button>

              {/* Download vCard */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={handleDownloadVCard}
              >
                <Download className="w-5 h-5" />
                <span className="text-xs">تحميل بطاقة</span>
              </Button>

              {/* Send Offer */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => {
                  const slug = getSlug();
                  const link = `${PLATFORM_BASE_URL}/${slug}/offer`;
                  navigator.clipboard.writeText(link);
                  toast.success("تم نسخ رابط إرسال العرض");
                  window.open(link, '_blank');
                }}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">إرسال عرض</span>
              </Button>

              {/* Send Request */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => {
                  const slug = getSlug();
                  const link = `${PLATFORM_BASE_URL}/${slug}/request`;
                  navigator.clipboard.writeText(link);
                  toast.success("تم نسخ رابط إرسال الطلب");
                  window.open(link, '_blank');
                }}
              >
                <Search className="w-5 h-5" />
                <span className="text-xs">إرسال طلب</span>
              </Button>

              {/* Price Quote */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => {
                  const slug = getSlug();
                  const link = `${PLATFORM_BASE_URL}/${slug}/quote`;
                  navigator.clipboard.writeText(link);
                  toast.success("تم نسخ رابط عرض السعر");
                  window.open(link, '_blank');
                }}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">عرض سعر</span>
              </Button>

              {/* Appointment */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => {
                  const slug = getSlug();
                  const link = `${PLATFORM_BASE_URL}/${slug}/calendar`;
                  navigator.clipboard.writeText(link);
                  toast.success("تم نسخ رابط إنشاء موعد");
                  window.open(link, '_blank');
                }}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs">إنشاء موعد</span>
              </Button>

              {/* Finance Calculator */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                onClick={() => toast.info("حاسبة تمويل - قريباً")}
              >
                <Calculator className="w-5 h-5" />
                <span className="text-xs">حاسبة تمويل</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            className="h-16 bg-gradient-to-br from-[#01411C] to-[#065f41] border-2 border-[#D4AF37] text-white hover:from-[#065f41] hover:to-[#01411C]"
            onClick={shareBusinessCard}
          >
            <Share2 className="w-5 h-5 ml-2" />
            مشاركة البطاقة
          </Button>
          <Button
            className="h-16 bg-gradient-to-br from-[#D4AF37] to-[#f1c40f] border-2 border-[#01411C] text-[#01411C] font-bold hover:from-[#f1c40f] hover:to-[#D4AF37]"
            onClick={() => toast.info("مشاركة التقييم - TODO")}
          >
            <Star className="w-5 h-5 ml-2" />
            مشاركة التقييم
          </Button>
        </div>

        {/* Social Media Card */}
        {Object.values(formData.socialMedia).some(link => link) && (
          <Card className="border-2 border-[#D4AF37] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#01411C]">📱 تابعني على</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4 flex-wrap">
                {formData.socialMedia.tiktok && (
                  <button
                    onClick={() => window.open(formData.socialMedia.tiktok, "_blank")}
                    className="p-3 bg-black text-white rounded-full hover:scale-110 transition-transform"
                  >
                    ⚫
                  </button>
                )}
                {formData.socialMedia.twitter && (
                  <button
                    onClick={() => window.open(formData.socialMedia.twitter, "_blank")}
                    className="p-3 bg-gray-200 text-gray-800 rounded-full hover:scale-110 transition-transform"
                  >
                    🐦
                  </button>
                )}
                {formData.socialMedia.instagram && (
                  <button
                    onClick={() => window.open(formData.socialMedia.instagram, "_blank")}
                    className="p-3 rounded-full hover:scale-110 transition-transform"
                    style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
                  >
                    📸
                  </button>
                )}
                {formData.socialMedia.snapchat && (
                  <button
                    onClick={() => window.open(formData.socialMedia.snapchat, "_blank")}
                    className="p-3 bg-yellow-400 text-black rounded-full hover:scale-110 transition-transform"
                  >
                    👻
                  </button>
                )}
                {formData.socialMedia.youtube && (
                  <button
                    onClick={() => window.open(formData.socialMedia.youtube, "_blank")}
                    className="p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
                  >
                    ▶️
                  </button>
                )}
                {formData.socialMedia.facebook && (
                  <button
                    onClick={() => window.open(formData.socialMedia.facebook, "_blank")}
                    className="p-3 bg-blue-600 text-white rounded-full hover:scale-110 transition-transform"
                  >
                    📘
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Save Button */}
      <button
        onClick={handleManualSave}
        className="fixed bottom-24 left-4 z-40 p-4 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] border-2 border-[#D4AF37] text-white shadow-2xl hover:scale-110 transition-transform"
      >
        <Save className="w-6 h-6" />
      </button>
    </div>
  );
};

export default BusinessCardProfile;
