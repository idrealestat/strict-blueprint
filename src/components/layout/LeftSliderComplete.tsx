/**
 * LeftSliderComplete.tsx
 * Left Sidebar Menu Component - Tools & Settings
 * القائمة اليسرى للتطبيق - أدوات وإعدادات المستخدم
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  Users,
  BarChart,
  Settings,
  Phone,
  HelpCircle,
  LogOut,
  LogIn,
  MessageCircle,
  TrendingUp,
  Calendar,
  FileText,
  Tag,
  Grid,
  Upload,
  Share2,
  FileSignature,
  Stamp,
  Calculator,
  PlusCircle,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Building,
  Target,
  Star,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LeftSliderCompleteProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name: string;
    phone?: string;
    type?: string;
  };
  onNavigate?: (page: string) => void;
  mode?: "menu" | "tools";
}

// قائمة البنوك السعودية للحاسبة
const banks = [
  { name: "بنك الراجحي", url: "https://www.alrajhibank.com.sa/personal/finance/calculator" },
  { name: "البنك الأهلي", url: "https://www.alahli.com/ar-sa/personal/Pages/finance-calculator.aspx" },
  { name: "بنك البلاد", url: "https://www.bankalbilad.com/ar/personal/Pages/FinanceCalculator.aspx" },
  { name: "بنك ساب", url: "https://www.sab.com/ar/personal/finance/calculators" },
  { name: "بنك الإنماء", url: "https://www.alinma.com/wps/portal/alinma/Personal/finance/finance-calculator" },
  { name: "بنك الرياض", url: "https://www.riyadbank.com/ar/personal/finance/calculators" },
  { name: "البنك العربي", url: "https://www.anb.com.sa/calculator" },
  { name: "بنك الجزيرة", url: "https://www.baj.com.sa/ar/personal/finance/calculator" },
];

export function LeftSliderComplete({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
  mode = "menu",
}: LeftSliderCompleteProps) {
  const [calcOpen, setCalcOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({ title: 'تم تسجيل الخروج', description: 'سنفتقدك! 👋' });
      onClose();
      navigate('/app/login');
    }
  };

  // القائمة الرئيسية للوضع العادي
  const menuItems = [
    {
      icon: Home,
      title: "الرئيسية",
      description: "العودة للصفحة الرئيسية",
      action: () => onNavigate?.("dashboard"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      title: "إدارة العملاء",
      description: "إدارة العملاء وقاعدة البيانات",
      action: () => onNavigate?.("enhanced-crm"),
      color: "text-green-600",
      bgColor: "bg-green-50",
      badge: "جديد",
    },
    {
      icon: Target,
      title: "الطلبات الخاصة",
      description: "اطلب عقار بمواصفات محددة",
      action: () => onNavigate?.("special-requests"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      badge: "VIP",
    },
    {
      icon: BarChart,
      title: "التحليلات",
      description: "إحصائيات وتقارير",
      action: () => onNavigate?.("analytics"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Calendar,
      title: "المواعيد",
      description: "جدولة المواعيد والمعاينات",
      action: () => onNavigate?.("calendar"),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: FileText,
      title: "العقود",
      description: "إدارة العقود والوثائق",
      action: () => onNavigate?.("contracts"),
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      icon: Tag,
      title: "العروض المحفوظة",
      description: "العروض التي أعجبتك",
      action: () => onNavigate?.("saved-offers"),
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      icon: Settings,
      title: "الإعدادات والزملاء",
      description: "إدارة الحساب",
      action: () => onNavigate?.("settings"),
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      icon: Settings2,
      title: "تخصيص الشريط السفلي",
      description: "اختر الأزرار التي تظهر في الشريط السفلي",
      action: () => onNavigate?.("bottom-nav-customization"),
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      badge: "جديد",
    },
  ];

  // قائمة الدعم
  const supportItems = [
    {
      icon: Phone,
      title: "اتصل بنا",
      description: "+966 50 123 4567",
      action: () => window.open("tel:+966501234567"),
      color: "text-green-600",
    },
    {
      icon: MessageCircle,
      title: "واتساب",
      description: "دعم فوري عبر واتساب",
      action: () => window.open("https://wa.me/966501234567"),
      color: "text-green-500",
    },
    {
      icon: HelpCircle,
      title: "مركز المساعدة",
      description: "الأسئلة الشائعة والدعم",
      action: () => onNavigate?.("help"),
      color: "text-blue-600",
    },
  ];

  // مكون البطاقة للأدوات
  const ToolCard = ({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-[#D4AF37] hover:bg-[#01411C] hover:text-white transition text-center group"
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-white">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  const MenuContent = () => (
    <div className="p-4 space-y-6">
      {/* Main Menu */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          القائمة الرئيسية
        </h3>
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full text-right p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.title}</span>
                    {item.badge && (
                      <Badge className="text-xs bg-[#D4AF37] text-[#01411C]">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 text-right">{item.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Statistics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          إحصائيات سريعة
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-xs text-blue-700">عروض نشطة</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-xs text-green-700">عملاء جدد</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-xs text-yellow-700">عروض معلقة</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-xs text-purple-700">معدل النجاح</div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Support */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          الدعم والمساعدة
        </h3>
        <div className="space-y-2">
          {supportItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full text-right p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 block text-right">
                    {item.title}
                  </span>
                  <p className="text-sm text-gray-500 text-right">{item.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  const ToolsContent = () => (
    <div className="p-5 overflow-y-auto flex-1 space-y-4">
      {/* الطلبات الخاصة VIP */}
      <div className="w-full">
        <button
          onClick={() => {
            onNavigate?.("special-requests");
            onClose();
          }}
          className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-[#D4AF37] transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-700 hover:text-white shadow-xl group relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #f3e5f5 0%, #ffffff 50%, #fff9e6 100%)",
          }}
        >
          <div className="absolute top-2 left-2">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#f1c40f] text-[#01411C] px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              ⭐ VIP
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-[#01411C] mb-1 group-hover:text-white">
              الطلبات الخاصة
            </h3>
            <p className="text-sm text-gray-600 group-hover:text-white/90">
              ابحث عن عقار بمواصفات دقيقة جداً
            </p>
          </div>
        </button>
      </div>

      {/* Finance Calculator */}
      <div className="w-full">
        <button
          onClick={() => setCalcOpen(!calcOpen)}
          className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-[#D4AF37] transition-all duration-300 hover:bg-[#01411C] hover:text-white shadow-lg"
          style={{
            backgroundColor: calcOpen ? "#f0fdf4" : "white",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#01411C] to-[#065f41] flex items-center justify-center shadow-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-[#01411C] mb-1">حاسبة التمويل</h3>
            <p className="text-sm text-gray-600">أداة شاملة لحساب التمويل العقاري</p>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-300 text-[#D4AF37] ${
              calcOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {calcOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-[#D4AF37] p-4 space-y-3 shadow-lg"
            >
              {/* الحاسبة الداخلية */}
              <button
                onClick={() => {
                  onNavigate?.("finance-calculator");
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-green-50 text-sm text-[#01411C] bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#01411C] flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#01411C]">حاسبة التمويل الذكية</div>
                    <div className="text-xs text-gray-600">حاسبة متطورة مع جميع البنوك</div>
                  </div>
                </div>
                <span className="text-xs bg-gradient-to-r from-[#01411C] to-[#065f41] text-white px-3 py-1 rounded-full font-bold">
                  جديد ✨
                </span>
              </button>

              {/* فاصل */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <Building className="w-4 h-4 text-[#D4AF37]" />
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* البنوك الخارجية */}
              <div className="text-center mb-3">
                <h4 className="text-sm font-bold text-[#01411C] mb-1">
                  حاسبات البنوك السعودية
                </h4>
                <p className="text-xs text-gray-500">
                  روابط مباشرة لحاسبات البنوك الرسمية
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {banks.map((bank, idx) => (
                  <a
                    key={idx}
                    href={bank.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 text-sm text-[#01411C] border border-transparent hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="font-medium">{bank.name}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* التحليلات */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            onNavigate?.("analytics");
            onClose();
          }}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-[#D4AF37] transition-all duration-300 hover:bg-[#01411C] hover:text-white shadow-lg group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:bg-white">
            <BarChart className="w-6 h-6 text-white group-hover:text-indigo-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#01411C] group-hover:text-white">
              التحليلات الشاملة
            </h3>
            <div className="text-lg mt-1">📊</div>
          </div>
        </button>

        <button
          onClick={() => {
            onNavigate?.("market-insights");
            onClose();
          }}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-[#D4AF37] transition-all duration-300 hover:bg-[#01411C] hover:text-white shadow-lg group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:bg-white">
            <TrendingUp className="w-6 h-6 text-white group-hover:text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#01411C] group-hover:text-white">
              تحليلات السوق
            </h3>
            <div className="text-lg mt-1">📈</div>
          </div>
        </button>
      </div>

      {/* باقي الأدوات */}
      <div className="grid grid-cols-2 gap-4">
        <ToolCard
          icon={<Upload className="w-6 h-6 text-[#01411C]" />}
          label="نشر عقار"
          onClick={() => {
            onNavigate?.("property-upload-complete");
            onClose();
          }}
        />
        <ToolCard
          icon={<Share2 className="w-6 h-6 text-[#01411C]" />}
          label="النشر على التواصل"
          onClick={() => {
            onNavigate?.("social-media-post");
            onClose();
          }}
        />
        <ToolCard
          icon={<FileText className="w-6 h-6 text-[#01411C]" />}
          label="عقد وساطة"
          onClick={() =>
            window.open(
              "https://rega.gov.sa/rega-services/platforms/fal-real-estate-brokerage/",
              "_blank"
            )
          }
        />
        <ToolCard
          icon={<FileSignature className="w-6 h-6 text-[#01411C]" />}
          label="عقد إيجاري"
          onClick={() => window.open("https://www.ejar.sa/ar", "_blank")}
        />
        <ToolCard
          icon={<Stamp className="w-6 h-6 text-[#01411C]" />}
          label="الإفراغ"
          onClick={() => window.open("https://najiz.sa", "_blank")}
        />
        <ToolCard
          icon={<PlusCircle className="w-6 h-6 text-[#01411C]" />}
          label="إضافات للوسيط"
          onClick={() => {
            onNavigate?.("broker-tools");
            onClose();
          }}
        />
        <ToolCard
          icon={<BookOpen className="w-6 h-6 text-[#01411C]" />}
          label="مدونة الوسطاء"
          onClick={() => {
            onNavigate?.("blog");
            onClose();
          }}
        />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          dir="rtl"
          className="fixed top-0 left-0 z-50 h-full bg-white shadow-2xl flex flex-col"
          initial={{ width: 0 }}
          animate={{ width: "350px" }}
          exit={{ width: 0 }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          {/* Header */}
          <div className="px-4 py-4 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] text-white relative overflow-hidden border-b-2 border-[#D4AF37]">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all duration-200 border border-white/20 hover:border-[#D4AF37]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                <Grid className="w-5 h-5 text-white" />
                {mode === "tools" ? "صندوق الأدوات" : "القائمة الرئيسية"}
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="h-full overflow-y-auto">
            <div className="bg-gradient-to-b from-transparent to-[#f0fdf4]/30 min-h-screen">
              <div className="p-4 space-y-4">
                {mode === "tools" ? <ToolsContent /> : <MenuContent />}
                <div className="h-20"></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {mode === "tools" ? (
              <div className="text-xs text-gray-500 text-center">
                ⚠️ ملاحظة: الروابط الحكومية والبنكية تفتح في نافذة جديدة.
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">الإعدادات</span>
                </div>
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    تسجيل خروج
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => {
                      onClose();
                      navigate('/app/login');
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    تسجيل دخول
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LeftSliderComplete;
