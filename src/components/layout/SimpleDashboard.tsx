/**
 * SimpleDashboard.tsx
 * الواجهة الرئيسية للتطبيق
 * Main Dashboard Component
 */

import { useState, useMemo, useEffect } from "react";
import LeftSliderComplete from "./LeftSliderComplete";
import RightSliderComplete from "./RightSliderComplete";
import NotificationsSidebar from "../NotificationsSidebar";
import NewsBar from "../NewsBar";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell, PanelLeft, Building2, Globe, Users, Star, Phone, Calendar, MessageSquare, Component, TrendingUp, Sparkles, Calculator, Layers, LucideIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type UserType = "individual" | "team" | "office" | "company" | "owner-buyer";
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  birthDate?: string;
  type: UserType;
  companyName?: string;
  licenseNumber?: string;
  licenseImage?: string;
  city?: string;
  district?: string;
  plan?: string;
  profileImage?: string;
  planExpiry?: string;
  licenseExpiry?: string;
  rating?: number;
}
interface SimpleDashboardProps {
  user: User | null;
  onNavigate: (page: string) => void;
}

// تعريف عناصر الخدمات مع ربط Feature Flags
interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  navigateTo: string;
  badge?: string;
  badgeClass?: string;
  flagKey?: keyof import("@/context/FeatureFlagsContext").FeatureFlags;
  iconBgClass?: string;
}

export default function SimpleDashboard({
  user,
  onNavigate
}: SimpleDashboardProps) {
  const [rightMenuOpen, setRightMenuOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const {
    flags,
    loading: flagsLoading
  } = useFeatureFlags();

  // رسالة الترحيب - تظهر فقط عند أول تسجيل دخول
  useEffect(() => {
    if (user) {
      const sessionKey = `welcome_shown_${user.id}`;
      const hasShownWelcome = sessionStorage.getItem(sessionKey);
      
      if (!hasShownWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem(sessionKey, 'true');
        
        // إخفاء الترحيب بعد 4 ثوانٍ
        const timer = setTimeout(() => {
          setShowWelcome(false);
        }, 4000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Get offers for notifications sidebar
  const getOffersForNotifications = () => {
    try {
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      return publishedAds.map((ad: any) => ({
        id: ad.id || String(Math.random()),
        title: ad.title || 'عرض',
        views: ad.views || 0,
        requests: ad.requests || 0,
        city: ad.city
      }));
    } catch {
      return [];
    }
  };
  const notificationOffers = getOffersForNotifications();

  // تعريف جميع الخدمات مع ربط الـ Feature Flags
  const allServices: ServiceItem[] = useMemo(() => [{
    id: "platform",
    title: "منصتي",
    description: "نظام متكامل مع CRM وإحصائيات متقدمة وإدارة العقارات",
    icon: Component,
    navigateTo: "dashboard-main-252",
    badge: "النظام الجديد",
    badgeClass: "bg-[#D4AF37] text-[#01411C]"
  }, {
    id: "smart-paths",
    title: "المسارات الذكية",
    description: "تجميع العقارات حسب المدينة والحي ونوع العقار",
    icon: Layers,
    navigateTo: "my-platform-smart",
    badge: "📁 مسارات ذكية",
    badgeClass: "bg-gradient-to-r from-[#01411C] to-[#065f41] text-[#D4AF37]",
    flagKey: "smart_paths_enabled"
  }, {
    id: "spatial-intelligence",
    title: "الذكاء المكاني",
    description: "اختبر تحليل المواقع العقارية وتقييم الجاذبية",
    icon: Sparkles,
    navigateTo: "spatial-intelligence",
    badge: "🧪 اختبار",
    badgeClass: "bg-gradient-to-r from-blue-600 to-blue-800 text-white",
    flagKey: "spatial_intelligence_enabled",
    iconBgClass: "bg-gradient-to-r from-blue-600 to-blue-800"
  }, {
    id: "publishing",
    title: "النشر على المنصات",
    description: "انشر عقاراتك على منصتك الخاصه وعلى المنصات العقارية من مكان واحد",
    icon: Globe,
    navigateTo: "advertising",
    flagKey: "publishing_enabled"
  }, {
    id: "customer-management",
    title: "إدارة العملاء",
    description: "نظام كانبان متقدم لإدارة العملاء مع السحب والإفلات",
    icon: Users,
    navigateTo: "customer-management-72",
    badge: "جديد",
    badgeClass: "bg-[#D4AF37] text-[#01411C]"
  }, {
    id: "offers-requests",
    title: "العروض والطلبات",
    description: "تواصل مع الملاك والباحثين عن عقارات وقدم خدماتك",
    icon: TrendingUp,
    navigateTo: "marketplace-page",
    badge: "جديد",
    badgeClass: "bg-gradient-to-r from-[#D4AF37] to-[#f1c40f] text-[#01411C] animate-pulse",
    flagKey: "offers_requests_enabled"
  }, {
    id: "analytics",
    title: "تحليلات السوق",
    description: "اكتشف اتجاهات السوق العقاري",
    icon: TrendingUp,
    navigateTo: "analytics-dashboard"
  }, {
    id: "smart-matches",
    title: "الفرص الذكية",
    description: "تطابق ذكي بين عروضك وطلباتك مع الوسطاء الآخرين",
    icon: Sparkles,
    navigateTo: "smart-matches",
    badge: "✨ ذكاء اصطناعي",
    badgeClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
  }, {
    id: "calendar",
    title: "التقويم والمواعيد",
    description: "جدولة المواعيد والمعاينات مع العملاء",
    icon: Calendar,
    navigateTo: "calendar-system-complete"
  }, {
    id: "quick-calculator",
    title: "حاسبة سريعة",
    description: "حساب العمولة، المساحة، ومسطح البناء",
    icon: Calculator,
    navigateTo: "quick-calculator",
    flagKey: "quick_calculator_enabled"
  }], []);
  // ملاحظة: تم إزالة بطاقة أعمالي الرقمية لأنها موجودة في Right Slider

  // فلترة الخدمات حسب Feature Flags
  const visibleServices = useMemo(() => {
    return allServices.filter(service => {
      if (!service.flagKey) return true; // الخدمات بدون flag تظهر دائمًا
      return flags[service.flagKey] === true;
    });
  }, [allServices, flags]);
  return <div dir="rtl" className="min-h-screen transition-all duration-300" style={{
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 25%, #fffef7 100%)"
  }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] backdrop-blur-md border-b-2 border-[#D4AF37] shadow-lg transition-all duration-300">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Right: Burger Menu */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setRightMenuOpen(true)} className="border-2 border-[#D4AF37] hover:bg-white/20 hover:shadow-lg transition-all bg-white/10 text-white h-9 w-9">
                <Menu className="w-4 h-4" />
              </Button>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full shadow-lg border-2 border-[#D4AF37] backdrop-blur-sm">
                <Building2 className="w-5 h-5" />
                <span className="font-bold">وساطه</span>
                <span className="font-bold text-[#D4AF37]">AI</span>
                <span className="font-bold">Wasata</span>
              </div>
            </div>

            {/* Left: Left Sidebar Icon + Bell - Conditional on left_slider_enabled */}
            <div className="flex items-center gap-2">
              {flags.left_slider_enabled && <Button variant="outline" size="icon" onClick={() => setLeftSidebarOpen(true)} className="border-2 border-[#D4AF37] hover:bg-white/20 hover:shadow-lg transition-all bg-white/10 text-white">
                  <PanelLeft className="w-5 h-5" />
                </Button>}
              <Button variant="outline" size="icon" onClick={() => setNotificationsOpen(true)} className="border-2 border-[#D4AF37] hover:bg-white/20 hover:shadow-lg transition-all relative bg-white/10 text-white">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* رسالة الترحيب المتحركة */}
        <AnimatePresence>
          {showWelcome && user && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="fixed inset-x-4 top-20 z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-lg"
            >
              <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] shadow-2xl overflow-hidden">
                <CardContent className="p-6 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowWelcome(false)}
                    className="absolute top-2 left-2 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 border-[#D4AF37] shadow-lg">
                      <AvatarFallback className="bg-[#D4AF37] text-[#01411C] text-xl font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-white">
                      <motion.h1 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl font-bold"
                      >
                        مرحباً، {user.name} 👋
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-white/80 mt-1"
                      >
                        {user.companyName || 'أهلاً بك في وساطة AI'}
                      </motion.p>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-1 mt-2"
                      >
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= (user.rating || 4) ? "text-[#D4AF37] fill-current" : "text-white/30"}`} 
                          />
                        ))}
                        <span className="text-xs text-white/70 mr-1">({user.rating || 4.0})</span>
                      </motion.div>
                    </div>
                  </div>
                  {/* شريط تقدم */}
                  <motion.div 
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] origin-left"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. شريط الأخبار العاجلة - 8 أخبار */}
        <NewsBar />

        {/* Services Grid - Dynamic based on Feature Flags */}
        <Card className="border-2 border-[#D4AF37] bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#01411C] text-center">الخدمات الرئيسية</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleServices.map(service => {
              const IconComponent = service.icon;
              return <Card key={service.id} onClick={() => onNavigate(service.navigateTo)} className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full">
                    <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                      {service.badge && <div className="absolute top-2 right-2">
                          <Badge className={`text-xs ${service.badgeClass || "bg-[#D4AF37] text-[#01411C]"}`}>
                            {service.badge}
                          </Badge>
                        </div>}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${service.iconBgClass || "bg-gradient-to-r from-[#01411C] to-[#065f41]"} shadow-lg`}>
                        <IconComponent className={`w-8 h-8 ${service.iconBgClass?.includes("from-[#D4AF37]") ? "text-[#01411C]" : service.iconBgClass?.includes("blue") ? "text-white" : "text-[#D4AF37]"}`} />
                      </div>
                      <h3 className="font-bold text-[#01411C] mb-2">{service.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>;
            })}
            </div>
          </CardContent>
        </Card>


        {/* Stats Box */}
        <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-white via-[#f0fdf4] to-white shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-[#01411C] mb-1">4</div>
                <div className="text-sm text-gray-600">مهام جديدة</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-[#01411C] mb-1">4</div>
                <div className="text-sm text-gray-600">أنشطة</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-[#01411C] mb-1">4</div>
                <div className="text-sm text-gray-600">عملاء جدد</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-[#01411C] mb-1">4</div>
                <div className="text-sm text-gray-600">إشعارات</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-3 transition-colors">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#01411C]">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#01411C]">اتصال</span>
              </div>
              <div className="flex flex-col items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-3 transition-colors">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#01411C]">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#01411C]">رسالة</span>
              </div>
              <div className="flex flex-col items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-3 transition-colors" onClick={() => onNavigate("calendar")}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#01411C] hover:bg-[#065f41] transition-colors">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#01411C]">موعد</span>
        
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Left Sidebar - أدوات */}
      <LeftSliderComplete isOpen={leftSidebarOpen} onClose={() => setLeftSidebarOpen(false)} currentUser={user ? {
      name: user.name,
      phone: user.phone,
      type: user.type
    } : undefined} onNavigate={onNavigate} mode="tools" />

      {/* Notifications Sidebar */}
      <NotificationsSidebar isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onNavigate={onNavigate} offers={notificationOffers} />

      {/* المساعد الذكي العائم يتم عرضه من App.tsx */}

      {/* Right Menu */}
      <RightSliderComplete isOpen={rightMenuOpen} onClose={() => setRightMenuOpen(false)} onNavigate={onNavigate} mode="navigation" currentUser={user ? {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      whatsapp: user.whatsapp,
      type: user.type,
      plan: user.plan,
      profileImage: user.profileImage,
      companyName: user.companyName,
      licenseNumber: user.licenseNumber,
      city: user.city,
      district: user.district,
      birthDate: user.birthDate
    } : undefined} />
    </div>;
}