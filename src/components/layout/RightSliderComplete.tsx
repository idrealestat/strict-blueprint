/**
 * RightSliderComplete.tsx
 * Right Sidebar Navigation Component - Main Menu (18 Items)
 * القائمة اليمنى للتطبيق - القائمة الرئيسية
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  MessageCircle,
  Star,
  Users,
  TrendingUp,
  CheckCircle,
  User,
  Activity,
  Home,
  Building2,
  BarChart3,
  Settings,
  Calendar,
  Plus,
  Archive,
  Crown,
  UserPlus,
  Receipt,
  BookOpen,
  Headphones,
  Info,
  UserCheck,
  Briefcase,
  LogOut,
  FileText,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags, FeatureFlags } from "@/context/FeatureFlagsContext";

interface Broker {
  id: number;
  name: string;
  offers: string[];
  rating: number;
  phone: string;
  whatsapp: string;
  profileImg?: string;
  commission?: number;
  experience?: string;
  specialties?: string[];
  completedDeals?: number;
  responseTime?: string;
  location?: string;
  verified?: boolean;
  premium?: boolean;
}

// Right Sidebar Menu Items - Main Navigation Items with Feature Flags
interface SidebarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  color: string;
  description?: string;
  badge?: string;
  flagKey?: keyof FeatureFlags;
}

const RIGHT_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    icon: Home,
    label: "الرئيسية",
    path: "/dashboard",
    color: "#01411C",
  },
  {
    id: "business-card",
    icon: UserCheck,
    label: "بطاقة أعمالي الرقمية",
    path: "/business-card-profile",
    color: "#D4AF37",
  },
  {
    id: "course",
    icon: BookOpen,
    label: "دورة الوساطة",
    path: "/course",
    color: "#065f41",
    flagKey: "right_slider_mediation_course_enabled",
  },
  {
    id: "colleagues",
    icon: Crown,
    label: "إدارة الفريق",
    path: "/colleagues",
    color: "#01411C",
    flagKey: "right_slider_team_management_enabled",
  },
  {
    id: "workspace",
    icon: Briefcase,
    label: "مساحة العمل",
    path: "/workspace",
    color: "#065f41",
    flagKey: "right_slider_workspace_enabled",
  },
  {
    id: "archive",
    icon: Archive,
    label: "الأرشيف",
    path: "/archive",
    color: "#10b981",
    description: "ملفات إضافية",
    badge: "📁",
  },
  {
    id: "calendar",
    icon: FileText,
    label: "عروض الأسعار",
    path: "/calendar",
    color: "#01411C",
  },
  {
    id: "receipts",
    icon: Receipt,
    label: "سندات القبض",
    path: "/receipts",
    color: "#D4AF37",
  },
  {
    id: "tasks-management",
    icon: Plus,
    label: "إدارة المهام",
    path: "/tasks-management",
    color: "#065f41",
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "التحليلات",
    path: "/analytics",
    color: "#D4AF37",
  },
  {
    id: "blog",
    icon: Info,
    label: "ما الجديد؟",
    path: "/blog",
    color: "#01411C",
  },
  {
    id: "support",
    icon: Headphones,
    label: "الدعم الفني",
    path: "/support",
    color: "#01411C",
  },
  {
    id: "settings",
    icon: Settings,
    label: "الإعدادات",
    path: "/settings",
    color: "#01411C",
  },
];

interface RightSliderCompleteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  mode?: "navigation" | "brokers";
  currentUser?: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    type?: string;
    plan?: string;
    profileImage?: string;
    companyName?: string;
    licenseNumber?: string;
    city?: string;
    district?: string;
    birthDate?: string;
  } | null;
}

// بيانات تجريبية للوسطاء
const SAMPLE_BROKERS: Broker[] = [
  {
    id: 1,
    name: "أحمد محمد العلي",
    offers: ["شقة في الرياض - 850,000 ريال", "فيلا في جدة - 1,200,000 ريال"],
    rating: 4.8,
    phone: "0501234567",
    whatsapp: "0501234567",
    commission: 2.5,
    experience: "8 سنوات",
    specialties: ["شقق سكنية", "فلل"],
    completedDeals: 156,
    responseTime: "خلال ساعة",
    location: "الرياض",
    verified: true,
    premium: true,
  },
  {
    id: 2,
    name: "فاطمة أحمد السالم",
    offers: ["محل تجاري - 500,000 ريال", "مكتب إداري - 300,000 ريال"],
    rating: 4.6,
    phone: "0507654321",
    whatsapp: "0507654321",
    commission: 2.0,
    experience: "5 سنوات",
    specialties: ["عقارات تجارية", "مكاتب"],
    completedDeals: 89,
    responseTime: "خلال 30 دقيقة",
    location: "جدة",
    verified: true,
    premium: false,
  },
  {
    id: 3,
    name: "محمد عبدالله الخالد",
    offers: ["أرض سكنية - 400,000 ريال"],
    rating: 4.4,
    phone: "0551239876",
    whatsapp: "0551239876",
    commission: 3.0,
    experience: "3 سنوات",
    specialties: ["أراضي", "استثمار"],
    completedDeals: 34,
    responseTime: "خلال ساعتين",
    location: "الدمام",
    verified: false,
    premium: false,
  },
];

export default function RightSliderComplete({
  isOpen,
  onClose,
  onNavigate,
  mode = "navigation",
  currentUser,
}: RightSliderCompleteProps) {
  const [currentTab, setCurrentTab] = useState(
    mode === "navigation" ? "navigation" : "list"
  );
  const [activeBroker, setActiveBroker] = useState<Broker | null>(null);
  const [brokers] = useState<Broker[]>(SAMPLE_BROKERS);
  const navigate = useNavigate();
  const { signOut, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { flags } = useFeatureFlags();

  // Filter menu items based on feature flags
  const visibleMenuItems = useMemo(() => {
    return RIGHT_SIDEBAR_ITEMS.filter(item => {
      if (!item.flagKey) return true;
      return flags[item.flagKey] === true;
    });
  }, [flags]);

  // Handle logout
  const handleLogout = async () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      const { error } = await signOut();
      if (error) {
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تسجيل الخروج',
          variant: 'destructive'
        });
        return;
      }
      toast({
        title: 'تم تسجيل الخروج',
        description: 'سنفتقدك! 👋'
      });
      onClose();
      navigate('/app/login');
    }
  };

  // مكونات فرعية
  const BrokerCard = ({ broker }: { broker: Broker }) => (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#D4AF37]"
      onClick={() => {
        setActiveBroker(broker);
        setCurrentTab("details");
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-[#D4AF37] text-[#01411C] font-bold">
              {broker.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">{broker.name}</h4>
              {broker.verified && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {broker.premium && (
                <Crown className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(broker.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600 mr-1">{broker.rating}</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {broker.experience} • {broker.completedDeals} صفقة
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${broker.phone}`, "_self");
                }}
              >
                <Phone className="w-3 h-3 ml-1" />
                اتصال
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://wa.me/${broker.whatsapp}`, "_blank");
                }}
              >
                <MessageCircle className="w-3 h-3 ml-1" />
                واتساب
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BrokerDetails = ({ broker }: { broker: Broker }) => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#D4AF37] text-[#01411C] font-bold text-xl">
                {broker.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{broker.name}</CardTitle>
                {broker.verified && <CheckCircle className="w-5 h-5 text-green-500" />}
                {broker.premium && <Crown className="w-5 h-5 text-[#D4AF37]" />}
              </div>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(broker.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 mr-1">{broker.rating}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  {broker.location} • {broker.experience}
                </p>
                <p>معدل الاستجابة: {broker.responseTime}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">التخصصات</h5>
            <div className="flex flex-wrap gap-2">
              {broker.specialties?.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-[#01411C]">
                {broker.completedDeals}
              </div>
              <div className="text-xs text-gray-600">صفقة مكتملة</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-[#D4AF37]">
                {broker.commission}%
              </div>
              <div className="text-xs text-gray-600">العمولة</div>
            </div>
          </div>

          <div>
            <h5 className="font-medium mb-2">العروض المتاحة ({broker.offers.length})</h5>
            <div className="space-y-2">
              {broker.offers.map((offer, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                  {offer}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => window.open(`tel:${broker.phone}`, "_self")}
            >
              <Phone className="w-4 h-4 ml-1" />
              اتصال مباشر
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`https://wa.me/${broker.whatsapp}`, "_blank")}
            >
              <MessageCircle className="w-4 h-4 ml-1" />
              واتساب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            إحصائيات الوسطاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{brokers.length}</div>
              <div className="text-sm text-gray-600">إجمالي الوسطاء</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {brokers.filter((b) => b.verified).length}
              </div>
              <div className="text-sm text-gray-600">موثق</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {brokers.filter((b) => b.premium).length}
              </div>
              <div className="text-sm text-gray-600">مميز</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {brokers.reduce((sum, b) => sum + (b.completedDeals || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">إجمالي الصفقات</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NavigationView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#01411C]">القائمة الرئيسية</h3>

      <div className="grid grid-cols-1 gap-3">
        {visibleMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-center text-xs bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-[#D4AF37] border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 group"
              style={{ borderLeftColor: item.color }}
              onClick={() => {
                if (item.path.startsWith("/")) {
                  onNavigate(item.path.substring(1));
                } else {
                  onNavigate(item.path);
                }
                onClose();
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 group-hover:text-[#01411C] transition-colors">
                      {item.label}
                    </span>
                    {(item as any).badge && (
                      <span className="text-sm">{(item as any).badge}</span>
                    )}
                  </div>
                  {(item as any).description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(item as any).description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* زر تسجيل الخروج */}
      <div className="pt-4 mt-4 border-t-2 border-gray-200">
        {isAuthenticated ? (
          <div
            className="flex items-center justify-center text-xs bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-[#D4AF37] border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-all duration-200 group bg-gradient-to-br from-red-50 to-white"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-red-600 group-hover:text-red-700 transition-colors">
                  تسجيل الخروج
                </span>
                <p className="text-xs text-red-500 mt-1">الخروج من الحساب</p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center text-xs bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-[#D4AF37] border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-all duration-200 group bg-gradient-to-br from-green-50 to-white"
            onClick={() => {
              onClose();
              navigate('/app/login');
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-green-600 group-hover:text-green-700 transition-colors">
                  تسجيل الدخول
                </span>
                <p className="text-xs text-green-500 mt-1">الدخول إلى حسابك</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Right Slider */}
          <motion.div
            dir="rtl"
            className="fixed top-0 right-0 z-50 h-full w-[90%] md:w-[400px] bg-gradient-to-br from-[#f0fdf4] via-white to-[#fffef7] shadow-2xl border-l-4 border-[#D4AF37] overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* زر الإغلاق الثابت */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all duration-200 border border-white/20 hover:border-[#D4AF37]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* محتوى قابل للتمرير */}
            <div className="h-full overflow-y-auto">
              {/* User Card Header */}
              <div className="bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] p-6 border-b-2 border-[#D4AF37]">
                {currentUser && (
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-3 border-[#D4AF37] shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#f1c40f] text-[#01411C] font-bold text-xl">
                        {currentUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
                      <p className="text-sm text-white/70">
                        {currentUser.phone || "مستخدم النظام"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i <= 4 ? "text-[#D4AF37] fill-current" : "text-white/30"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-[#D4AF37] mr-1">4.8</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* المحتوى الرئيسي */}
              <div className="bg-gradient-to-b from-transparent to-[#f0fdf4]/30 min-h-screen">
                <div className="px-4 py-6 space-y-4">
                  {currentTab === "list" && mode !== "navigation" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {brokers.length} وسيط متاح
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {brokers.filter((b) => b.verified).length} موثق
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {brokers.map((broker) => (
                          <BrokerCard key={broker.id} broker={broker} />
                        ))}
                      </div>
                    </div>
                  )}

                  {currentTab === "details" && activeBroker && mode !== "navigation" && (
                    <BrokerDetails broker={activeBroker} />
                  )}

                  {currentTab === "analytics" && mode !== "navigation" && <AnalyticsView />}

                  {currentTab === "navigation" && <NavigationView />}

                  {/* مساحة إضافية */}
                  <div className="h-20"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { RightSliderComplete };
