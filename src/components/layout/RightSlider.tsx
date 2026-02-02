import { useState, useEffect } from 'react';
import { 
  X, Home, UserCheck, BookOpen, Crown, Briefcase, Archive, 
  FileText, Receipt, Plus, BarChart3, Info, Headphones, Settings,
  Users, Building2, Bell, MessageCircle, Sparkles, Shield, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useFloatingBubblePermission } from "@/hooks/useFloatingBubblePermission";
import { toast } from "sonner";

interface RightSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const RIGHT_SIDEBAR_ITEMS = [
  { id: 'profile', icon: Home, label: 'الملف الشخصي', path: '/', color: '#3b82f6', count: 12 },
  { id: 'documents', icon: FileText, label: 'المستندات', path: '/documents', color: '#22c55e', count: 45 },
  { id: 'wallet', icon: Receipt, label: 'المحفظة', path: '/wallet', color: '#f59e0b', count: '8,450' },
  { id: 'achievements', icon: Crown, label: 'الإنجازات', path: '/achievements', color: '#a855f7', count: 15 },
  { id: 'notifications', icon: Info, label: 'الإشعارات', path: '/notifications', color: '#ef4444', count: 23, badge: 'جديد' },
  { id: 'notification-settings', icon: Bell, label: 'إعدادات الإشعارات', action: 'notification-settings', color: '#f97316' },
  { id: 'favorites', icon: UserCheck, label: 'المفضلة', path: '/favorites', color: '#eab308', count: 34 },
  { id: 'analytics', icon: BarChart3, label: 'الإحصائيات', path: '/analytics', color: '#6366f1', count: '12K' },
  { id: 'appointments', icon: BookOpen, label: 'المواعيد', path: '/appointments', color: '#ec4899', count: 8 },
  { id: 'messages', icon: Users, label: 'المحادثات', path: '/messages', color: '#14b8a6', count: 56 },
  { id: 'goals', icon: Plus, label: 'الأهداف', path: '/goals', color: '#f97316', count: 7 },
  { id: 'tasks', icon: Briefcase, label: 'المهام', path: '/tasks', color: '#06b6d4', count: 19 },
  { id: 'projects', icon: Building2, label: 'المشاريع', path: '/projects', color: '#84cc16', count: 6 },
  { id: 'team', icon: Users, label: 'الفريق', path: '/team', color: '#f43f5e', count: 24 },
  { id: 'apps', icon: Settings, label: 'التطبيقات', path: '/apps', color: '#8b5cf6', count: 12 },
  { id: 'security', icon: Archive, label: 'الأمان', path: '/security', color: '#6b7280', count: 5 },
  { id: 'links', icon: Info, label: 'الروابط', path: '/links', color: '#10b981', count: 32 },
  { id: 'customize', icon: Settings, label: 'التخصيص', path: '/customize', color: '#d946ef', count: 18 },
  { id: 'updates', icon: Headphones, label: 'التحديثات', path: '/updates', color: '#0ea5e9', count: 3 },
];

const mockUser = {
  name: 'أحمد محمد',
  phone: '0512345678',
  type: 'individual' as const,
  plan: 'المحترف'
};

/**
 * 🔴 مكون إعدادات المساعد الذكي العائم في الـ Right Slider
 * يظهر فقط إذا فعّل المالك الخاصية
 */
function FloatingBubbleQuickSettings() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const {
    isOwnerEnabled,
    hasPermission,
    isActive,
    platform,
    isLoading,
    requestPermission,
    toggleBubble,
  } = useFloatingBubblePermission();

  // إذا الخاصية معطلة من المالك أو جاري التحميل → لا يظهر أي شيء
  if (flagsLoading || isLoading) {
    return null;
  }

  // 🔴 الخاصية معطلة من لوحة تحكم المالك → لا يظهر الزر نهائياً
  if (!isOwnerEnabled || !flags.floating_bubble_enabled) {
    return null;
  }

  const handleToggle = async () => {
    // Android: التحقق من الصلاحيات أولاً
    if (platform === 'android' && !hasPermission && !isActive) {
      const opened = await requestPermission();
      if (opened) {
        toast.info('يرجى تفعيل صلاحية العرض فوق التطبيقات ثم العودة للتطبيق');
      }
      return;
    }
    
    await toggleBubble();
  };

  return (
    <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#01411C]/5 to-[#01411C]/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <CardTitle className="text-sm">المساعد الذكي العائم</CardTitle>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
            {isActive ? 'مفعّل' : 'معطّل'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {platform === 'android' ? 'فقاعة عائمة فوق جميع التطبيقات' : 'زر عائم داخل التطبيق'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Android: حالة الصلاحية */}
        {platform === 'android' && !hasPermission && (
          <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>صلاحية العرض فوق التطبيقات مطلوبة</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={requestPermission}
              className="h-6 text-xs px-2"
            >
              <ExternalLink className="w-3 h-3 ml-1" />
              تفعيل
            </Button>
          </div>
        )}
        
        {/* زر التفعيل/التعطيل */}
        <div className="flex items-center justify-between p-2 border rounded-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#01411C]" />
            <span className="text-sm">إظهار المساعد الذكي كبابل</span>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={platform === 'android' && !hasPermission}
          />
        </div>
      </CardContent>
    </Card>
  );
}

const RightSlider = ({ isOpen, onClose }: RightSliderProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('navigateFromAssistant', { 
      detail: { page: action } 
    }));
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
            {/* 🔴 إعدادات المساعد الذكي - يظهر فقط إذا فعّلها المالك */}
            <div className="mb-4">
              <FloatingBubbleQuickSettings />
            </div>
            
            <div className="space-y-2">
              {RIGHT_SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.action ? handleAction(item.action) : handleNavigate(item.path)}
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
