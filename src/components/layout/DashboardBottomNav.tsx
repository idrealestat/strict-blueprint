/**
 * DashboardBottomNav.tsx
 * الشريط السفلي للواجهة الرئيسية
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BarChart3,
  Copy,
  CheckCircle2,
  Send,
  X,
  UserPlus,
  Link as LinkIcon,
  CalendarCheck,
  MessageSquare
} from 'lucide-react';
import { useBottomNavCustomization, BottomNavButtonId } from '@/hooks/useBottomNavCustomization';
import { CustomerForm } from '@/components/crm/CustomerForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  'publish-ad': 'dashboard-main-252', // اختصار لزر نشر إعلان داخل "منصتي"
  'quick-calculator': 'quick-calculator',
  'smart-opportunities': 'smart-matches',
  'calendar': 'calendar-system-complete',
  'my-platform': 'dashboard-main-252',
  'offers-tab': 'my-platform-offers',
  'requests-tab': 'my-platform-requests',
  'market-analytics': 'analytics-dashboard',
  'team-management': 'team-management',
  'publishing-platforms': 'social-media-post',
};

export default function DashboardBottomNav({ onNavigate }: DashboardBottomNavProps) {
  const { config, isButtonHidden, getButtonInfo } = useBottomNavCustomization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // جلب slug المستخدم
  useEffect(() => {
    const fetchUserSlug = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('business_cards')
          .select('slug')
          .eq('user_id', user.id)
          .eq('published', true)
          .maybeSingle();
        
        if (data?.slug) {
          setUserSlug(data.slug);
        }
      } catch (error) {
        console.error('Error fetching user slug:', error);
      }
    };

    fetchUserSlug();
  }, [user]);

  const baseDomain = 'https://wasataai.com';

  const quickOptions = [
    {
      id: 'add-customer',
      label: 'إضافة عميل',
      icon: UserPlus,
      action: 'form',
      url: '',
      color: 'bg-emerald-500'
    },
    {
      id: 'copy-card',
      label: 'بطاقة أعمالي',
      icon: Globe,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/card` : '',
      color: 'bg-[#01411C]'
    },
    {
      id: 'copy-offer',
      label: 'إرسال عرض',
      icon: Send,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/offer` : '',
      color: 'bg-blue-500'
    },
    {
      id: 'copy-request',
      label: 'إرسال طلب',
      icon: FileText,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/request` : '',
      color: 'bg-purple-500'
    },
    {
      id: 'copy-calendar',
      label: 'إنشاء موعد',
      icon: Calendar,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/calendar` : '',
      color: 'bg-orange-500'
    },
    {
      id: 'copy-quote',
      label: 'عرض سعر',
      icon: MessageSquare,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/quote` : '',
      color: 'bg-pink-500'
    },
    {
      id: 'copy-reminder',
      label: 'إرسال تذكير للعميل',
      icon: CalendarCheck,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/appointmentapproval/customer/{appointmentId}` : '',
      color: 'bg-teal-500'
    },
    {
      id: 'copy-sorry',
      label: 'إرسال اعتذار',
      icon: LinkIcon,
      action: 'copy',
      url: userSlug ? `${baseDomain}/${userSlug}/appointmentapproval/sorry` : '',
      color: 'bg-amber-500'
    },
  ];

  const handleButtonClick = (buttonId: BottomNavButtonId) => {
    if (buttonId === 'add-customer') {
      setShowQuickOptions(true);
      return;
    }

    // زر "نشر إعلان" في الفوتر يجب أن يفتح نفس نموذج النشر داخل "منصتي"
    if (buttonId === 'publish-ad') {
      onNavigate('dashboard-main-252');
      // بعد الانتقال، افتح نافذة النشر داخل منصتي
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wasata:openPublishAd'));
      }, 0);
      return;
    }

    // زر "الفرص الذكية" ينتقل مباشرة لصفحة الفرص الذكية
    if (buttonId === 'smart-opportunities') {
      navigate('/app/smart-opportunities');
      return;
    }

    const destination = BUTTON_NAVIGATION[buttonId];
    if (destination) {
      onNavigate(destination);
    }
  };

  const handleQuickOptionClick = async (option: typeof quickOptions[0]) => {
    if (option.action === 'form') {
      setShowQuickOptions(false);
      setShowAddCustomer(true);
      return;
    }

    if (option.action === 'copy') {
      if (!userSlug) {
        toast.error('يرجى نشر بطاقة أعمالك أولاً');
        return;
      }

      const urlToCopy = option.url;
      if (!urlToCopy) {
        toast.error('لا يوجد رابط للنسخ');
        return;
      }
      
      try {
        // محاولة استخدام clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(urlToCopy);
        } else {
          // fallback للمتصفحات القديمة
          const textArea = document.createElement('textarea');
          textArea.value = urlToCopy;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          textArea.style.top = '-9999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        setCopiedLink(option.id);
        toast.success('تم نسخ الرابط ✓');
        
        setTimeout(() => {
          setCopiedLink(null);
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('فشل في نسخ الرابط');
      }
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

    // الزر المركزي الكبير بدون نص
    if (isCenter) {
      return (
        <motion.button
          key={buttonId}
          onClick={() => handleButtonClick(buttonId)}
          className="relative flex items-center justify-center -mt-8"
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] shadow-[0_4px_20px_rgba(212,175,55,0.5)] flex items-center justify-center border-4 border-[#01411C]">
            <Plus className="w-8 h-8 text-[#01411C]" />
          </div>
        </motion.button>
      );
    }

    return (
      <motion.button
        key={buttonId}
        onClick={() => handleButtonClick(buttonId)}
        className="flex flex-col items-center gap-0.5 md:gap-0 px-1.5 md:px-2 py-1 md:py-0.5 rounded-lg hover:bg-white/10 transition-all group"
        whileTap={{ scale: 0.95 }}
      >
        <div 
          className="flex items-center justify-center transition-transform group-hover:scale-110 w-8 h-8 md:w-7 md:h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50"
        >
          <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#D4AF37]" />
        </div>
        <span className="text-[9px] md:text-[8px] text-white/80">
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
            <div className="flex items-center justify-around py-1.5 md:py-1" dir="rtl">
              {/* أقصى اليمين - الرئيسية */}
              <div className="flex-1 flex justify-center">
                {renderButton('right')}
              </div>
              
              {/* يمين الوسط - نشر إعلان */}
              <div className="flex-1 flex justify-center">
                {renderButton('right-center')}
              </div>
              
              {/* الوسط - الزر الكبير */}
              <div className="flex-1 flex justify-center">
                {renderButton('center')}
              </div>
              
              {/* يسار الوسط - حاسبة سريعة */}
              <div className="flex-1 flex justify-center">
                {renderButton('left-center')}
              </div>
              
              {/* أقصى اليسار - الفرص الذكية */}
              <div className="flex-1 flex justify-center">
                {renderButton('left')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة الخيارات السريعة */}
      <AnimatePresence>
        {showQuickOptions && (
          <>
            {/* خلفية معتمة */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setShowQuickOptions(false)}
            />
            
            {/* القائمة */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-20 left-4 right-4 z-[70] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">خيارات سريعة</h3>
                <button
                  onClick={() => setShowQuickOptions(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Options Grid - بطاقات صغيرة طولية */}
              <div className="grid grid-cols-4 gap-2">
                {quickOptions.map((option) => {
                  const Icon = option.icon;
                  const isCopied = copiedLink === option.id;
                  
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleQuickOptionClick(option)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                        isCopied 
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' 
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={`w-9 h-9 rounded-full ${option.color} flex items-center justify-center mb-1.5 ${
                        isCopied ? 'bg-green-500' : ''
                      }`}>
                        {isCopied ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Icon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                        {isCopied ? 'تم النسخ' : option.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* ملاحظة المس للنسخ */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                💡 المس لنسخ الروابط
              </p>

              {!userSlug && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                  ⚠️ انشر بطاقة أعمالك لتفعيل الروابط
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* نافذة إضافة عميل */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" />
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