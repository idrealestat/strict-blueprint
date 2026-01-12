import { useState, ReactNode } from "react";
import MainHeader from "./MainHeader";
import RightSlider from "./RightSlider";
import LeftSlider from "./LeftSlider";
import NotificationsSidebar from "@/components/NotificationsSidebar";
import { SecurityWarningBanner } from "@/components/security/SecurityWarningBanner";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTaskReminders } from "@/hooks/useTaskReminders";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [rightSliderOpen, setRightSliderOpen] = useState(false);
  const [leftSliderOpen, setLeftSliderOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  // تفعيل فحص تذكيرات المهام
  useTaskReminders();

  const handleSecurityLogout = async () => {
    await signOut();
    navigate('/app/login');
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Security Warning Banner */}
      <SecurityWarningBanner onLogout={handleSecurityLogout} />
      
      <MainHeader 
        onRightMenuOpen={() => setRightSliderOpen(true)}
        onLeftMenuOpen={() => setLeftSliderOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      
      <main>
        {children}
      </main>

      {/* Right Slider (القائمة الرئيسية) */}
      <RightSlider 
        isOpen={rightSliderOpen} 
        onClose={() => setRightSliderOpen(false)} 
      />

      {/* Left Slider (الإعدادات) */}
      <LeftSlider 
        isOpen={leftSliderOpen} 
        onClose={() => setLeftSliderOpen(false)} 
      />

      {/* Notifications Sidebar */}
      <NotificationsSidebar
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
