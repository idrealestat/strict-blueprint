import { 
  X, Home, Users, Target, BarChart, Calendar, FileText, 
  Tag, Settings, HelpCircle, MessageCircle, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

interface LeftSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { icon: Home, title: 'الرئيسية', description: 'العودة للصفحة الرئيسية', path: '/', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { icon: Users, title: 'إدارة العملاء', description: 'إدارة العملاء وقاعدة البيانات', path: '/customers', color: 'text-green-600', bgColor: 'bg-green-50', badge: 'جديد' },
  { icon: Target, title: 'الطلبات الخاصة', description: 'اطلب عقار بمواصفات محددة', path: '/special-requests', color: 'text-purple-600', bgColor: 'bg-purple-50', badge: 'VIP' },
  { icon: BarChart, title: 'التحليلات', description: 'إحصائيات وتقارير', path: '/analytics', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { icon: Calendar, title: 'المواعيد', description: 'جدولة المواعيد والمعاينات', path: '/calendar', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { icon: FileText, title: 'العقود', description: 'إدارة العقود والوثائق', path: '/contracts', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { icon: Tag, title: 'العروض المحفوظة', description: 'العروض التي أعجبتك', path: '/saved-offers', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { icon: Settings, title: 'الإعدادات والزملاء', description: 'إدارة الحساب • إدارة الفريق', path: '/settings', color: 'text-gray-600', bgColor: 'bg-gray-50', badge: 'فريق' },
];

const SUPPORT_ITEMS = [
  { icon: HelpCircle, title: 'مركز المساعدة', description: 'دليل الاستخدام والأسئلة الشائعة', color: 'text-blue-500' },
  { icon: MessageCircle, title: 'تواصل معنا', description: 'الدعم الفني والاستفسارات', color: 'text-green-500' },
  { icon: Shield, title: 'الخصوصية والأمان', description: 'سياسة الخصوصية والشروط', color: 'text-red-500' },
];

const mockUser = {
  name: 'أحمد محمد',
  phone: '0512345678',
};

const LeftSlider = ({ isOpen, onClose }: LeftSliderProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className="fixed left-0 top-0 h-full w-80 bg-background shadow-2xl z-50 overflow-y-auto"
        dir="rtl"
        style={{ animation: 'slideInLeft 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-l from-wasata-green to-wasata-green-dark p-4 flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">القائمة</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b-2 border-wasata-gold">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-wasata-gold">
              <AvatarFallback className="bg-wasata-green text-white font-bold">
                {mockUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right">
              <p className="font-bold text-wasata-green">{mockUser.name}</p>
              <p className="text-sm text-muted-foreground">{mockUser.phone}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              القائمة الرئيسية
            </h3>
            <div className="space-y-2">
              {MENU_ITEMS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full text-right p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs bg-wasata-gold text-wasata-green">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground text-right">{item.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              الدعم والمساعدة
            </h3>
            <div className="space-y-2">
              {SUPPORT_ITEMS.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-right p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftSlider;
