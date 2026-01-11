/**
 * PublicBusinessCardView.tsx
 * مكون عرض البطاقة الرقمية العامة - نفس تصميم BusinessCardProfile بدون أزرار التحرير
 */

import React, { useState } from "react";
import { 
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
  Building,
  Calendar,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface BusinessCardData {
  userName?: string;
  companyName?: string;
  primaryPhone?: string;
  phone?: string;
  email?: string;
  location?: string;
  officeAddress?: string;
  bio?: string;
  domain?: string;
  websiteUrl?: string;
  website?: string;
  googleMapsLocation?: string;
  profileImage?: string;
  logoImage?: string;
  coverImage?: string;
  falLicense?: string;
  commercialRegistration?: string;
  userTitle?: string;
  workingHours?: Record<string, { open: string; close: string; isOpen: boolean }>;
  achievements?: {
    totalDeals: number;
    totalProperties: number;
    totalClients: number;
    yearsOfExperience: number;
    awards: string[];
    certifications: string[];
    topPerformer: boolean;
    verified: boolean;
  };
  socialMedia?: {
    tiktok?: string;
    twitter?: string;
    instagram?: string;
    snapchat?: string;
    youtube?: string;
    facebook?: string;
  };
}

interface PublicBusinessCardViewProps {
  data: Record<string, any>;
  slug: string;
}

const BASE_DOMAIN = "wasataai.com";

const daysArabic: Record<string, string> = {
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت"
};

const PublicBusinessCardView: React.FC<PublicBusinessCardViewProps> = ({ data, slug }) => {
  const [showSwappedImage, setShowSwappedImage] = useState(false);

  const userName = data.userName || "";
  const companyName = data.companyName || "";
  const phone = data.primaryPhone || data.phone || "";
  const email = data.email || "";
  const location = data.location || data.officeAddress || "";
  const bio = data.bio || "";
  const domain = data.domain || data.websiteUrl || data.website || "";
  const googleMapsLocation = data.googleMapsLocation || "";
  const profileImage = data.profileImage || "";
  const logoImage = data.logoImage || "";
  const coverImage = data.coverImage || "";
  const falLicense = data.falLicense || "";
  const commercialRegistration = data.commercialRegistration || "";
  // إذا كان userTitle يساوي الـ slug أو فارغ، نستخدم المسمى الافتراضي
  const userTitle = (data.userTitle && data.userTitle !== slug) ? data.userTitle : "وسيط عقاري معتمد";
  
  const achievements = data.achievements || {
    totalDeals: 0,
    totalProperties: 0,
    totalClients: 0,
    yearsOfExperience: 0,
    awards: [],
    certifications: [],
    topPerformer: false,
    verified: false
  };

  const workingHours = data.workingHours || {};
  const socialMedia = data.socialMedia || {};

  const PLATFORM_BASE_URL = `https://${BASE_DOMAIN}`;

  // Get badge level based on deals and experience
  const getBadgeLevel = () => {
    const deals = achievements.totalDeals;
    const years = achievements.yearsOfExperience;
    
    if (deals >= 100 && years >= 10) return { name: "ماسي", icon: "👑", color: "bg-purple-100 text-purple-800" };
    if (deals >= 50 && years >= 5) return { name: "بلاتيني", icon: "🏆", color: "bg-gray-100 text-gray-800" };
    if (deals >= 30 && years >= 3) return { name: "ذهبي", icon: "🥇", color: "bg-yellow-100 text-yellow-800" };
    if (deals >= 15 && years >= 2) return { name: "فضي", icon: "🥈", color: "bg-gray-200 text-gray-700" };
    if (deals >= 5 && years >= 1) return { name: "برونزي", icon: "🥉", color: "bg-orange-100 text-orange-800" };
    return { name: "مبتدئ", icon: "⚡", color: "bg-blue-100 text-blue-800" };
  };

  const badge = getBadgeLevel();

  // Handle download vCard
  const handleDownloadVCard = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${userName}
ORG:${companyName}
TEL;TYPE=CELL:${phone}
EMAIL:${email}
URL:${domain}
ADR;TYPE=WORK:;;${location}
TITLE:${userTitle}
END:VCARD`;
    
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${userName}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تحميل البطاقة!");
  };

  // Share business card
  const cardLink = `${PLATFORM_BASE_URL}/${slug}/card`;

  const shareBusinessCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `بطاقة أعمال - ${userName}`,
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

  return (
    <div className="min-h-screen bg-gray-50 pb-16" dir="rtl">
      {/* Full Header Section with Green Background */}
      <div 
        className="relative bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-6 shadow-2xl border-b-4 border-[#D4AF37] bg-cover bg-center transition-all duration-500"
        style={coverImage ? {
          backgroundImage: `url(${coverImage})`,
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(1, 65, 28, 0.85)'
        } : undefined}
      >
        {/* Pattern overlay - only when no cover image */}
        {!coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>
        )}

        {/* Current Slug Display with Copy Button */}
        <div className="relative z-10 mx-4 mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Globe className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span className="text-xs text-white/70">الرابط:</span>
              <span className="text-sm font-medium text-white truncate" dir="ltr">
                {cardLink}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(cardLink);
                toast.success("تم نسخ الرابط!");
              }}
              className="text-white hover:bg-white/20 px-2 py-1 h-auto flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Profile Image */}
        <div className="relative z-10 flex justify-center pt-6">
          <div 
            className="relative cursor-pointer group select-none"
            onClick={() => {
              if (profileImage && logoImage) {
                setShowSwappedImage(!showSwappedImage);
              }
            }}
          >
            {/* Main Profile Image */}
            <div className="w-36 h-36 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-white/20 to-white/10">
              {(showSwappedImage ? logoImage : profileImage) ? (
                <img 
                  src={showSwappedImage ? logoImage : profileImage} 
                  alt={showSwappedImage ? "Logo" : "Profile"} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-[#D4AF37] transition-all duration-300">
                  {showSwappedImage ? "🏢" : userName.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Small Logo/Profile Badge */}
            <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg bg-[#D4AF37] flex items-center justify-center text-white text-sm overflow-hidden transition-all duration-300 ease-out transform hover:scale-110">
              {(showSwappedImage ? profileImage : logoImage) ? (
                <img 
                  src={showSwappedImage ? profileImage : logoImage} 
                  alt={showSwappedImage ? "Profile" : "Logo"} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
              ) : (
                <span className="transition-all duration-300">
                  {showSwappedImage ? userName.charAt(0) : "🏢"}
                </span>
              )}
            </div>
            
            {/* Swap indicator */}
            {profileImage && logoImage && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white/90 text-[#01411C] text-xs px-2 py-0.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                اضغط للتبديل
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="relative z-10 pt-4 pb-8 px-4 text-center">
          {/* Name and Badge */}
          <h1 className="text-2xl font-bold text-white">{userName}</h1>
          <p className="text-white/80 mt-1">{userTitle}</p>
          
          <div className="mt-2 inline-flex items-center gap-2 flex-wrap justify-center">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white cursor-pointer transition-transform hover:scale-110 backdrop-blur-sm"
              title={`${badge.name} - ${achievements.totalDeals} صفقة - ${achievements.yearsOfExperience} سنوات خبرة`}
            >
              {badge.icon} {badge.name}
            </span>
            {achievements.verified && (
              <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                ✅ موثق
              </span>
            )}
            {achievements.topPerformer && (
              <span className="px-2 py-1 rounded-full text-xs bg-[#D4AF37] text-white">
                ⭐ أفضل أداء
              </span>
            )}
          </div>

          {/* Company */}
          {companyName && (
            <p className="mt-2 text-white/90 flex items-center justify-center gap-1">
              <Building className="w-4 h-4" />
              {companyName}
            </p>
          )}

          {/* Licenses */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {falLicense && (
              <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                📜 رخصة فال: {falLicense}
              </span>
            )}
            {commercialRegistration && (
              <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                📋 السجل: {commercialRegistration}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-white/90">
            {phone && (
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                {phone}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                {email}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                {location}
              </span>
            )}
          </div>

          {/* Website/Domain if available */}
          {domain && (
            <div className="mt-3">
              <a 
                href={domain.startsWith('http') ? domain : `https://${domain}`} 
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
      <div className="px-4 mt-6 space-y-4 max-w-2xl mx-auto">
        {/* Bio Section */}
        {bio && (
          <Card className="border-2 border-[#D4AF37] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-[#01411C]">
                📝 نبذة عني
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Achievements Card */}
        {(achievements.totalDeals > 0 || achievements.yearsOfExperience > 0) && (
          <Card className="border-2 border-[#D4AF37] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#01411C]">🏆 الإنجازات والإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01411C]">🤝 {achievements.totalDeals}</div>
                  <div className="text-xs text-gray-600">صفقة مكتملة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01411C]">🏢 {achievements.totalProperties}</div>
                  <div className="text-xs text-gray-600">عقار مدرج</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01411C]">👥 {achievements.totalClients}</div>
                  <div className="text-xs text-gray-600">عميل</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01411C]">⏱️ {achievements.yearsOfExperience}</div>
                  <div className="text-xs text-gray-600">سنوات خبرة</div>
                </div>
              </div>

              {/* Awards */}
              {achievements.awards && achievements.awards.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">🏅 الجوائز</p>
                  <div className="flex flex-wrap gap-2">
                    {achievements.awards.map((award: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded-full text-xs">
                        {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {achievements.certifications && achievements.certifications.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">📜 الشهادات</p>
                  <div className="flex flex-wrap gap-2">
                    {achievements.certifications.map((cert: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Working Hours Card */}
        {Object.keys(workingHours).length > 0 && (
          <Card className="border-2 border-[#D4AF37] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#01411C]">⏰ ساعات العمل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(workingHours).map(([day, hours]) => {
                  const h = hours as { open?: string; close?: string; isOpen?: boolean };
                  return (
                    <div key={day} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-700">{daysArabic[day] || day}</span>
                      {h.isOpen ? (
                        <span className="text-green-600 text-sm">
                          ✅ {h.open} - {h.close}
                        </span>
                      ) : (
                        <span className="text-red-600 text-sm">❌ مغلق</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons Card - نفس ترتيب BusinessCardProfile */}
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
                asChild
              >
                <Link to={`/${slug}`}>
                  <Home className="w-6 h-6" />
                  <span className="text-sm font-bold">منصتي</span>
                </Link>
              </Button>

              {/* Website */}
              {domain && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                  asChild
                >
                  <a href={domain.startsWith('http') ? domain : `https://${domain}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-5 h-5" />
                    <span className="text-xs">الموقع</span>
                  </a>
                </Button>
              )}

              {/* Google Maps */}
              {googleMapsLocation && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                  asChild
                >
                  <a href={googleMapsLocation} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-5 h-5" />
                    <span className="text-xs">خرائط جوجل</span>
                  </a>
                </Button>
              )}

              {/* Direct Call */}
              {phone && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                  asChild
                >
                  <a href={`tel:${phone}`}>
                    <Phone className="w-5 h-5" />
                    <span className="text-xs">اتصال مباشر</span>
                  </a>
                </Button>
              )}

              {/* WhatsApp */}
              {phone && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                  asChild
                >
                  <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs">واتساب</span>
                  </a>
                </Button>
              )}

              {/* Email */}
              {email && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                  asChild
                >
                  <a href={`mailto:${email}`}>
                    <Mail className="w-5 h-5" />
                    <span className="text-xs">إيميل</span>
                  </a>
                </Button>
              )}

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
                asChild
              >
                <Link to={`/${slug}/offer`}>
                  <Home className="w-5 h-5" />
                  <span className="text-xs">إرسال عرض</span>
                </Link>
              </Button>

              {/* Send Request */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                asChild
              >
                <Link to={`/${slug}/request`}>
                  <Search className="w-5 h-5" />
                  <span className="text-xs">إرسال طلب</span>
                </Link>
              </Button>

              {/* Price Quote */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                asChild
              >
                <Link to={`/${slug}/quote`}>
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">عرض سعر</span>
                </Link>
              </Button>

              {/* Appointment */}
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-2 border-[#D4AF37] bg-gradient-to-br from-[#01411C] to-[#065f41] text-white hover:opacity-90"
                asChild
              >
                <Link to={`/${slug}/calendar`}>
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs">حجز موعد</span>
                </Link>
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

        {/* Share Buttons - نفس ترتيب BusinessCardProfile */}
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
            onClick={() => toast.info("مشاركة التقييم - قريباً")}
          >
            <Star className="w-5 h-5 ml-2" />
            مشاركة التقييم
          </Button>
        </div>

        {/* Social Media Links */}
        {socialMedia && Object.values(socialMedia).some(v => v) && (
          <Card className="border-2 border-[#D4AF37] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#01411C]">📱 تابعني على</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-3">
                {socialMedia.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xl hover:scale-110 transition-transform">
                    ⚫
                  </a>
                )}
                {socialMedia.twitter && (
                  <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center text-xl hover:scale-110 transition-transform">
                    🐦
                  </a>
                )}
                {socialMedia.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl hover:scale-110 transition-transform"
                     style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
                    📸
                  </a>
                )}
                {socialMedia.snapchat && (
                  <a href={socialMedia.snapchat} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center text-xl hover:scale-110 transition-transform">
                    👻
                  </a>
                )}
                {socialMedia.youtube && (
                  <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-xl hover:scale-110 transition-transform">
                    ▶️
                  </a>
                )}
                {socialMedia.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" 
                     className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl hover:scale-110 transition-transform">
                    📘
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicBusinessCardView;
