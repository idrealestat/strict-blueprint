import { 
  X, Home, UserCheck, BookOpen, Crown, Briefcase, Archive, 
  FileText, Receipt, Plus, BarChart3, Info, Headphones, Settings,
  Users, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface RightSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const RIGHT_SIDEBAR_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'الرئيسية', path: '/', color: '#01411C' },
  { id: 'crm', icon: Users, label: 'إدارة العملاء', path: '/customers', color: '#065f41', badge: 'جديد' },
  { id: 'business-card', icon: UserCheck, label: 'بطاقة أعمالي الرقمية', path: '/business-card', color: '#D4AF37' },
  { id: 'course', icon: BookOpen, label: 'دورة الوساطة', path: '/course', color: '#065f41' },
  { id: 'colleagues', icon: Crown, label: 'إدارة الفريق', path: '/team', color: '#01411C' },
  { id: 'workspace', icon: Briefcase, label: 'مساحة العمل', path: '/workspace', color: '#065f41' },
  { id: 'archive', icon: Archive, label: 'الأرشيف', path: '/archive', color: '#10b981', badge: '📁' },
  { id: 'quotes', icon: FileText, label: 'عروض الأسعار', path: '/quotes', color: '#01411C' },
  { id: 'receipts', icon: Receipt, label: 'سندات القبض', path: '/receipts', color: '#D4AF37' },
  { id: 'tasks', icon: Plus, label: 'إدارة المهام', path: '/tasks', color: '#065f41' },
  { id: 'analytics', icon: BarChart3, label: 'التحليلات', path: '/analytics', color: '#D4AF37' },
  { id: 'blog', icon: Info, label: 'ما الجديد؟', path: '/blog', color: '#01411C' },
  { id: 'support', icon: Headphones, label: 'الدعم الفني', path: '/support', color: '#01411C' },
  { id: 'settings', icon: Settings, label: 'الإعدادات', path: '/settings', color: '#01411C' },
];

const mockUser = {
  name: 'أحمد محمد',
  phone: '0512345678',
  type: 'individual' as const,
  plan: 'المحترف'
};

const RightSlider = ({ isOpen, onClose }: RightSliderProps) => {
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
        className="fixed right-0 top-0 h-full w-80 bg-background shadow-2xl z-50 overflow-y-auto animate-slide-in-right"
        dir="rtl"
      >
        {/* Header with User Info */}
        <div className="sticky top-0 bg-gradient-to-r from-wasata-green to-wasata-green-dark p-6 border-b-4 border-wasata-gold">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold">القائمة الرئيسية</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Mini User Card */}
          <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
            <Avatar className="w-12 h-12 border-2 border-wasata-gold">
              <AvatarFallback className="bg-wasata-green text-white font-bold">
                {mockUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right">
              <p className="font-bold text-white">{mockUser.name}</p>
              <p className="text-sm text-white/80">{mockUser.phone}</p>
              <Badge className="bg-wasata-gold text-wasata-green text-xs mt-1">
                {mockUser.plan}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="navigation" className="w-full">
          <TabsList className="w-full grid grid-cols-2 p-2 bg-muted">
            <TabsTrigger value="navigation">التنقل</TabsTrigger>
            <TabsTrigger value="tools">الأدوات</TabsTrigger>
          </TabsList>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="p-4">
            <div className="space-y-2">
              {RIGHT_SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full text-right p-3 rounded-lg hover:bg-muted transition-colors group flex items-center gap-3"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs bg-wasata-gold text-wasata-green">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="p-4">
            <div className="text-center text-muted-foreground py-8">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>الأدوات قريباً...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default RightSlider;
