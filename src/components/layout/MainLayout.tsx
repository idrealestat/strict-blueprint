import { useState, ReactNode } from "react";
import MainHeader from "./MainHeader";
import RightSlider from "./RightSlider";
import LeftSlider from "./LeftSlider";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [rightSliderOpen, setRightSliderOpen] = useState(false);
  const [leftSliderOpen, setLeftSliderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <MainHeader 
        onRightMenuOpen={() => setRightSliderOpen(true)}
        onLeftMenuOpen={() => setLeftSliderOpen(true)}
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
    </div>
  );
};

export default MainLayout;
