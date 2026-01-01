/**
 * SimpleDashboard.tsx
 * الواجهة الرئيسية للتطبيق
 * Main Dashboard Component
 */

import { useState, useEffect } from "react";
import LeftSliderComplete from "./LeftSliderComplete";
import RightSliderComplete from "./RightSliderComplete";
import NotificationsSidebar from "../NotificationsSidebar";
import NewsBar from "../NewsBar";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Bell,
  PanelLeft,
  Building2,
  Globe,
  Users,
  Star,
  Phone,
  Calendar,
  MessageSquare,
  Component,
  TrendingUp,
  Sparkles,
  Calculator,
  UserCheck,
  Layers,
} from "lucide-react";

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

export default function SimpleDashboard({ user, onNavigate }: SimpleDashboardProps) {
  const [rightMenuOpen, setRightMenuOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Get offers for notifications sidebar
  const getOffersForNotifications = () => {
    try {
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      return publishedAds.map((ad: any) => ({
        id: ad.id || String(Math.random()),
        title: ad.title || 'عرض',
        views: ad.views || 0,
        requests: ad.requests || 0,
        city: ad.city,
      }));
    } catch {
      return [];
    }
  };
  
  const notificationOffers = getOffersForNotifications();

  return (
    <div
      dir="rtl"
      className="min-h-screen transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 25%, #fffef7 100%)",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] backdrop-blur-md border-b-2 border-[#D4AF37] shadow-lg transition-all duration-300">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Right: Burger Menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRightMenuOpen(true)}
                className="border-2 border-[#D4AF37] hover:bg-white/20 hover:shadow-lg transition-all bg-white/10 text-white h-9 w-9"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full shadow-lg border-2 border-[#D4AF37] backdrop-blur-sm">
                <Building2 className="w-5 h-5" />
                <span className="font-bold">عقاري</span>
                <span className="font-bold text-[#D4AF37]">AI</span>
                <span className="font-bold">Aqari</span>
              </div>
            </div>

            {/* Left: Left Sidebar Icon + Bell */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLeftSidebarOpen(true)}
                className="border-2 border-[#D4AF37] hover:bg-white/20 hover:shadow-lg transition-all bg-white/10 text-white"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNotificationsOpen(true)}
                className="border-2 border-[#D4AF37] hover:bg-white/20 hover:shadow-lg transition-all relative bg-white/10 text-white"
              >
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* 1. شريط الأخبار العاجلة - 8 أخبار */}
        <NewsBar />


        {/* Profile Card */}
        {user && (
          <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-white to-[#f0fdf4] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                {/* الصورة */}
                <Avatar className="w-16 h-16 border-4 border-[#D4AF37] shadow-lg flex-shrink-0">
                  <AvatarFallback className="bg-[#01411C] text-white text-xl font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* الاسم والشركة */}
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-[#01411C] text-right">
                    مرحباً، {user.name}
                  </h1>
                  {user.companyName && (
                    <p className="text-sm md:text-base text-gray-600 text-right">
                      {user.companyName}
                    </p>
                  )}
                </div>

                {/* النجوم */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (user.rating || 4)
                            ? "text-[#D4AF37] fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm text-gray-600">
                    ({user.rating || 4.0})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <Card className="border-2 border-[#D4AF37] bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#01411C] text-center">الخدمات الرئيسية</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* منصتي */}
              <Card
                onClick={() => onNavigate("dashboard-main-252")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[#D4AF37] text-[#01411C] text-xs">النظام الجديد</Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <Component className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">منصتي</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    نظام متكامل مع CRM وإحصائيات متقدمة وإدارة العقارات
                  </p>
                </CardContent>
              </Card>

              {/* 🆕 منصتي - المسارات الذكية */}
              <Card
                onClick={() => onNavigate("my-platform-smart")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-[#D4AF37] text-xs">
                      📁 مسارات ذكية
                    </Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <Layers className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">المسارات الذكية</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    تجميع العقارات حسب المدينة والحي ونوع العقار
                  </p>
                </CardContent>
              </Card>

              {/* 🧪 اختبار الذكاء المكاني */}
              <Card
                onClick={() => onNavigate("spatial-intelligence")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-800 text-white text-xs">
                      🧪 اختبار
                    </Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-blue-600 to-blue-800">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">الذكاء المكاني</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    اختبر تحليل المواقع العقارية وتقييم الجاذبية
                  </p>
                </CardContent>
              </Card>

              {/* النشر على المنصات */}
              <Card
                onClick={() => onNavigate("advertising")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center h-full min-h-[220px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <Globe className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">النشر على المنصات</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    انشر عقاراتك على منصتك الخاصه وعلى المنصات العقارية من مكان واحد
                  </p>
                </CardContent>
              </Card>

              {/* إدارة العملاء */}
              <Card
                onClick={() => onNavigate("customer-management-72")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[#D4AF37] text-[#01411C] text-xs">جديد</Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41] shadow-lg">
                    <Users className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">إدارة العملاء</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    نظام كانبان متقدم لإدارة العملاء مع السحب والإفلات
                  </p>
                </CardContent>
              </Card>

              {/* العروض والطلبات */}
              <Card
                onClick={() => onNavigate("marketplace-page")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#f1c40f] text-[#01411C] text-xs animate-pulse">
                      جديد
                    </Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41] shadow-lg">
                    <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">العروض والطلبات</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    تواصل مع الملاك والباحثين عن عقارات وقدم خدماتك
                  </p>
                </CardContent>
              </Card>

              {/* تحليلات السوق */}
              <Card
                onClick={() => onNavigate("analytics-dashboard")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center h-full min-h-[220px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">تحليلات السوق</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    اكتشف اتجاهات السوق العقاري
                  </p>
                </CardContent>
              </Card>

              {/* الفرص الذكية */}
              <Card
                onClick={() => onNavigate("smart-matches")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs animate-pulse">
                      ✨ ذكاء اصطناعي
                    </Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <Sparkles className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">الفرص الذكية</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    تطابق ذكي بين عروضك وطلباتك مع الوسطاء الآخرين
                  </p>
                </CardContent>
              </Card>

              {/* التقويم والمواعيد */}
              <Card
                onClick={() => onNavigate("calendar-system-complete")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center h-full min-h-[220px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <Calendar className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">التقويم والمواعيد</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    جدولة المواعيد والمعاينات مع العملاء
                  </p>
                </CardContent>
              </Card>

              {/* حاسبة سريعة */}
              <Card
                onClick={() => onNavigate("quick-calculator")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center h-full min-h-[220px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#01411C] to-[#065f41]">
                    <Calculator className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">حاسبة سريعة</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    حساب العمولة، المساحة، ومسطح البناء
                  </p>
                </CardContent>
              </Card>

              {/* بطاقة أعمالي الرقمية */}
              <Card
                onClick={() => onNavigate("business-card-profile")}
                className="border-2 border-[#D4AF37] bg-gradient-to-br from-[#fffef7] to-white hover:border-[#01411C] transition-all hover:shadow-xl cursor-pointer group h-full"
              >
                <CardContent className="p-6 text-center relative h-full min-h-[220px] flex flex-col justify-center">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[#D4AF37] text-[#01411C] text-xs">🔒 محمي</Badge>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-[#D4AF37] to-[#f1c40f] shadow-lg">
                    <UserCheck className="w-8 h-8 text-[#01411C]" />
                  </div>
                  <h3 className="font-bold text-[#01411C] mb-2">بطاقة أعمالي الرقمية</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    بطاقة رقمية احترافية للوسيط العقاري
                  </p>
                </CardContent>
              </Card>
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
              <div
                className="flex flex-col items-center gap-2 cursor-pointer hover:bg-white rounded-lg p-3 transition-colors"
                onClick={() => onNavigate("calendar")}
              >
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
      <LeftSliderComplete
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        currentUser={
          user
            ? {
                name: user.name,
                phone: user.phone,
                type: user.type,
              }
            : undefined
        }
        onNavigate={onNavigate}
        mode="tools"
      />

      {/* Notifications Sidebar */}
      <NotificationsSidebar
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={onNavigate}
        offers={notificationOffers}
      />

      {/* المساعد الذكي العائم يتم عرضه من App.tsx */}

      {/* Right Menu */}
      <RightSliderComplete
        isOpen={rightMenuOpen}
        onClose={() => setRightMenuOpen(false)}
        onNavigate={onNavigate}
        mode="navigation"
        currentUser={
          user
            ? {
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
                birthDate: user.birthDate,
              }
            : undefined
        }
      />
    </div>
  );
}
