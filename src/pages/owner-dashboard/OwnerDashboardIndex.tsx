/**
 * OwnerDashboardIndex.tsx
 * الصفحة الرئيسية للوحة تحكم المالك - شبكة أزرار مربعة للتنقل
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, ChevronLeft, RefreshCw, Brain, Target, Globe, User, 
  Building2, Clock, Layers, Ban, FileWarning, History, Shield, Database
} from "lucide-react";

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
  color: string;
}

const OwnerDashboardIndex: React.FC = () => {
  const navigate = useNavigate();
  
  // سيتم تحميل عدد الطلبات المعلقة من قاعدة البيانات
  const [pendingRequestsCount, setPendingRequestsCount] = React.useState(0);
  
  React.useEffect(() => {
    // جلب عدد الطلبات المعلقة
    const fetchPendingCount = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { count } = await supabase
          .from('domain_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingRequestsCount(count || 0);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };
    fetchPendingCount();
  }, []);

  const sections: DashboardSection[] = [
    {
      id: "behavioral",
      title: "الذكاء السلوكي",
      description: "تحليل سلوك المستخدمين والإشارات",
      icon: <Brain className="w-8 h-8" />,
      route: "/app/owner-dashboard/behavioral",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "special-requests",
      title: "طلبات VIP",
      description: "إدارة الطلبات الخاصة للوسطاء",
      icon: <Target className="w-8 h-8" />,
      route: "/app/owner-dashboard/special-requests",
      color: "from-amber-500 to-amber-600"
    },
    {
      id: "global",
      title: "الإعدادات العامة",
      description: "التحكم في ميزات جميع المستخدمين",
      icon: <Globe className="w-8 h-8" />,
      route: "/app/owner-dashboard/global-settings",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      id: "users",
      title: "استثناءات المستخدمين",
      description: "إعدادات خاصة لمستخدمين محددين",
      icon: <User className="w-8 h-8" />,
      route: "/app/owner-dashboard/user-overrides",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "business",
      title: "قواعد الأعمال",
      description: "إعدادات المكاتب والشركات",
      icon: <Building2 className="w-8 h-8" />,
      route: "/app/owner-dashboard/business-rules",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      id: "requests",
      title: "طلبات النطاقات",
      description: "مراجعة والموافقة على الطلبات",
      icon: <Clock className="w-8 h-8" />,
      route: "/app/owner-dashboard/domain-requests",
      badge: pendingRequestsCount,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "slugs",
      title: "إدارة Slugs",
      description: "عرض وإدارة النطاقات",
      icon: <Layers className="w-8 h-8" />,
      route: "/app/owner-dashboard/slugs",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      id: "exceptions",
      title: "استثناءات الأسماء",
      description: "إدارة الأسماء المستثناة",
      icon: <Shield className="w-8 h-8" />,
      route: "/app/owner-dashboard/exceptions",
      color: "from-teal-500 to-teal-600"
    },
    {
      id: "blacklist",
      title: "القائمة السوداء",
      description: "الشركات المحظورة",
      icon: <Ban className="w-8 h-8" />,
      route: "/app/owner-dashboard/blacklist",
      color: "from-red-500 to-red-600"
    },
    {
      id: "patterns",
      title: "الأنماط المحظورة",
      description: "أنماط النصوص الممنوعة",
      icon: <FileWarning className="w-8 h-8" />,
      route: "/app/owner-dashboard/patterns",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      id: "changelog",
      title: "سجل التغييرات",
      description: "تتبع جميع التعديلات",
      icon: <History className="w-8 h-8" />,
      route: "/app/owner-dashboard/changelog",
      color: "from-gray-500 to-gray-600"
    },
    {
      id: "property-registry",
      title: "سجل العقارات",
      description: "جميع العقارات المنشورة",
      icon: <Database className="w-8 h-8" />,
      route: "/app/owner-dashboard/property-registry",
      color: "from-emerald-600 to-emerald-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b-2 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <h1 className="text-lg md:text-xl font-bold text-white whitespace-nowrap">لوحة تحكم المالك</h1>
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app/dashboard')}
                className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-3 h-3 ml-1" />
                العودة
              </Button>

              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-3 h-3 ml-1" />
                تحديث
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Grid of Cards */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sections.map((section) => (
            <Card 
              key={section.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden group"
              onClick={() => navigate(section.route)}
            >
              <CardContent className="p-0">
                {/* Icon Section with Gradient */}
                <div className={`bg-gradient-to-br ${section.color} p-4 flex items-center justify-center relative`}>
                  <div className="text-white">
                    {section.icon}
                  </div>
                  {section.badge && section.badge > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                
                {/* Text Section */}
                <div className="p-3 text-center">
                  <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-[#01411C] transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {section.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboardIndex;
