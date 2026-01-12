/**
 * DashboardBottomNav.tsx
 * الشريط السفلي للواجهة الرئيسية
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Plus, 
  Megaphone, 
  Calculator, 
  Sparkles, 
  Calendar, 
  Component, 
  TrendingUp, 
  FileText,
  Users,
  Globe,
  BarChart3
} from 'lucide-react';
import { useBottomNavCustomization, BottomNavButtonId } from '@/hooks/useBottomNavCustomization';
import { CustomerForm } from '@/components/crm/CustomerForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DashboardBottomNavProps {
  onNavigate: (page: string) => void;
}

// أيقونات الأزرار
const BUTTON_ICONS: Record<BottomNavButtonId, React.ElementType> = {
  'home': Home,
  'add-customer': Plus,
  'publish-ad': Megaphone,
  'quick-calculator': Calculator,
  'smart-opportunities': Sparkles,
  'calendar': Calendar,
  'my-platform': Component,
  'offers-tab': TrendingUp,
  'requests-tab': FileText,
  'market-analytics': BarChart3,
  'team-management': Users,
  'publishing-platforms': Globe,
};

// وجهات التنقل
const BUTTON_NAVIGATION: Record<BottomNavButtonId, string> = {
  'home': 'dashboard-main-252',
  'add-customer': '', // يفتح dialog
  'publish-ad': 'my-platform-publish',
  'quick-calculator': 'quick-calculator',
  'smart-opportunities': 'smart-matches',
  'calendar': 'calendar-system-complete',
  'my-platform': 'dashboard-main-252',
  'offers-tab': 'my-platform-offers',
  'requests-tab': 'my-platform-requests',
  'market-analytics': 'analytics-dashboard',
  'team-management': 'team-management',
  'publishing-platforms': 'advertising',
};

export default function DashboardBottomNav({ onNavigate }: DashboardBottomNavProps) {
  const { config, isButtonHidden, getButtonInfo } = useBottomNavCustomization();
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const handleButtonClick = (buttonId: BottomNavButtonId) => {
    if (buttonId === 'add-customer') {
      setShowAddCustomer(true);
      return;
    }
    
    const destination = BUTTON_NAVIGATION[buttonId];
    if (destination) {
      onNavigate(destination);
    }
  };

  const handleSaveCustomer = (data: any) => {
    try {
      // حفظ العميل في localStorage
      const existingCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const newCustomer = {
        id: `customer-${Date.now()}`,
        ...data,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      existingCustomers.push(newCustomer);
      localStorage.setItem('crm_customers', JSON.stringify(existingCustomers));
      
      toast.success('تم إضافة العميل بنجاح');
      setShowAddCustomer(false);
    } catch (error) {
      toast.error('فشل في إضافة العميل');
    }
  };

  const renderButton = (position: 'right' | 'right-center' | 'center' | 'left-center' | 'left') => {
    const buttonId = config[position];
    const buttonInfo = getButtonInfo(buttonId);
    
    if (!buttonInfo || isButtonHidden(buttonId)) {
      return null;
    }

    const Icon = BUTTON_ICONS[buttonId];
    const isCenter = position === 'center';
    const isFixed = buttonInfo.isFixed;

    return (
      <motion.button
        key={buttonId}
        onClick={() => handleButtonClick(buttonId)}
        className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all group"
        whileTap={{ scale: 0.95 }}
      >
        <div 
          className={`
            flex items-center justify-center transition-transform group-hover:scale-110
            ${isCenter 
              ? 'w-12 h-12 rounded-full bg-[#D4AF37] shadow-lg' 
              : 'w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50'
            }
          `}
        >
          <Icon 
            className={`
              ${isCenter ? 'w-6 h-6 text-[#01411C]' : 'w-4 h-4 text-[#D4AF37]'}
            `} 
          />
        </div>
        <span className={`text-[10px] ${isCenter ? 'text-white font-medium' : 'text-white/80'}`}>
          {buttonInfo.label}
        </span>
      </motion.button>
    );
  };

  return (
    <>
      {/* الشريط السفلي */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div 
          className="bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-t-2 border-[#D4AF37] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="container mx-auto px-2">
            <div className="flex items-center justify-between py-2" dir="rtl">
              {/* أقصى اليمين - الرئيسية */}
              {renderButton('right')}
              
              {/* يمين الوسط - نشر إعلان */}
              {renderButton('right-center')}
              
              {/* الوسط - إضافة عميل */}
              {renderButton('center')}
              
              {/* يسار الوسط - حاسبة سريعة */}
              {renderButton('left-center')}
              
              {/* أقصى اليسار - الفرص الذكية */}
              {renderButton('left')}
            </div>
          </div>
        </div>
      </div>

      {/* نافذة إضافة عميل */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#D4AF37]" />
              إضافة عميل جديد
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSave={handleSaveCustomer}
            onCancel={() => setShowAddCustomer(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
