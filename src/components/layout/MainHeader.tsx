import { Building2, Menu, Bell, PanelLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDomainNotifications } from "@/hooks/useDomainNotifications";
import { useNotificationSystem } from "@/hooks/useNotificationSystem";
import { useSmartOpportunities } from "@/hooks/useSmartOpportunities";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface MainHeaderProps {
  onRightMenuOpen: () => void;
  onLeftMenuOpen: () => void;
  onNotificationsOpen?: () => void;
}

const MainHeader = ({ onRightMenuOpen, onLeftMenuOpen, onNotificationsOpen }: MainHeaderProps) => {
  const { unreadCount: domainUnreadCount } = useDomainNotifications();
  const { unreadCount: systemUnreadCount } = useNotificationSystem();
  const { unviewedCount: smartOpportunityCount } = useSmartOpportunities();
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  
  const totalUnreadCount = domainUnreadCount + systemUnreadCount + smartOpportunityCount;

  // جلب حالة النشر من قاعدة البيانات
  useEffect(() => {
    const fetchPublishStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('business_cards')
          .select('published')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setIsPublished(data.published);
        }
      }
    };
    
    fetchPublishStatus();

    // الاستماع لتحديثات البطاقة
    const handleUpdate = () => fetchPublishStatus();
    window.addEventListener('businessCardUpdated', handleUpdate);
    
    return () => window.removeEventListener('businessCardUpdated', handleUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-wasata-green via-wasata-green-dark to-wasata-green backdrop-blur-md border-b-2 border-wasata-gold shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Right: Burger Menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onRightMenuOpen}
              className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white h-9 w-9"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Logo + Live Badge */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full shadow-lg border-2 border-wasata-gold backdrop-blur-sm">
              <Building2 className="w-5 h-5" />
              <span className="font-bold">عقاري</span>
              <span className="font-bold text-wasata-gold">AI</span>
              <span className="font-bold">Aqari</span>
            </div>
            
            {/* مؤشر مباشر النابض */}
            {isPublished && (
              <div className="inline-flex items-center gap-1.5 bg-green-400/20 text-green-300 px-3 py-1 rounded-full border border-green-400/40 animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-xs font-bold">مباشر</span>
              </div>
            )}
          </div>

          {/* Left: Icons */}
          <div className="flex items-center gap-2">
            {/* Left Sidebar Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={onLeftMenuOpen}
              className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white h-9 w-9"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="outline"
              size="icon"
              onClick={onNotificationsOpen}
              className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white relative h-9 w-9"
            >
              <Bell className="w-5 h-5" />
              {/* Notification Badge - عرض فقط إذا كان هناك إشعارات غير مقروءة */}
              {totalUnreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 animate-pulse">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
