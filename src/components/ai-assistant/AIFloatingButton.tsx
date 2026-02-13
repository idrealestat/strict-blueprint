import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { MessageCircle, Sparkles, GripVertical, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AIChatPanel } from "./AIChatPanel";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { Capacitor } from "@capacitor/core";

// حساب الحجم الافتراضي بناءً على حجم الشاشة
const getDefaultSize = () => {
  if (typeof window === 'undefined') return { width: 400, height: 550 };
  
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // جوال
  if (screenWidth < 640) {
    return { 
      width: Math.min(screenWidth - 48, 350), 
      height: Math.min(screenHeight - 100, 500) 
    };
  }
  // تابلت
  if (screenWidth < 1024) {
    return { 
      width: Math.min(screenWidth - 80, 420), 
      height: Math.min(screenHeight - 120, 580) 
    };
  }
  // بي سي
  return { 
    width: Math.min(screenWidth - 100, 480), 
    height: Math.min(screenHeight - 140, 650) 
  };
};

export function AIFloatingButton() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);
  const [panelSize, setPanelSize] = useState(getDefaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);
  const [isUserEnabled, setIsUserEnabled] = useState(true);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // تحديد النظام الأساسي
  const platform = Capacitor.isNativePlatform() 
    ? Capacitor.getPlatform() as 'android' | 'ios' 
    : 'web';

  // 🔴 التحقق من إعداد المستخدم
  useEffect(() => {
    const checkUserSetting = () => {
      const userEnabled = localStorage.getItem('floating_bubble_user_enabled');
      const userExplicitlyDisabled = localStorage.getItem('floating_bubble_user_explicitly_disabled');
      
      // إذا لم يقم المستخدم بتعطيل الميزة يدوياً بشكل صريح، نعتبرها مفعلة
      if (userEnabled === 'false' && userExplicitlyDisabled !== 'true') {
        // إعادة تعيين - القيمة تم تعيينها بالخطأ من كود آخر
        localStorage.removeItem('floating_bubble_user_enabled');
        setIsUserEnabled(true);
        return;
      }
      
      setIsUserEnabled(userEnabled !== 'false');
    };

    checkUserSetting();

    // الاستماع لتغييرات إعدادات المستخدم
    const handleUserChange = () => checkUserSetting();
    window.addEventListener('floatingBubbleUserChanged', handleUserChange);
    return () => window.removeEventListener('floatingBubbleUserChanged', handleUserChange);
  }, []);

  // إخفاء الرسالة الترحيبية بعد 10 ثواني
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeBubble(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);
  // Threshold for distinguishing drag from click (in pixels)
  const DRAG_THRESHOLD = 10;

  // إعادة حساب الحجم عند تغيير حجم الشاشة أو الفتح
  useEffect(() => {
    const handleResize = () => {
      if (!isResizing) {
        setPanelSize(getDefaultSize());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isResizing]);

  // إعادة تعيين الحجم عند الفتح
  useEffect(() => {
    if (isOpen) {
      setPanelSize(getDefaultSize());
    }
  }, [isOpen]);

  // النقر خارج اللوحة يغلقها (لكن لا يمسح المحادثة)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const floatingButton = document.getElementById('wasata-floating-button');
        if (floatingButton && floatingButton.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // تركيز على حقل الإدخال عند الفتح
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const inputElement = panelRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
        inputElement?.focus();
      }, 300);
    }
  }, [isOpen]);

  // معالجة تغيير الحجم - تكبير وتصغير متناسق
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = panelSize.width;
    const startHeight = panelSize.height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      // حساب الفرق - السحب للأعلى واليمين يكبر، للأسفل واليسار يصغر
      const deltaX = currentX - startX; // سحب لليمين = موجب
      const deltaY = currentY - startY; // سحب للأسفل = موجب
      
      // الزاوية العلوية اليمنى: سحب لليمين وللأعلى يكبر
      const newWidth = Math.max(300, Math.min(window.innerWidth - 60, startWidth + deltaX));
      const newHeight = Math.max(350, Math.min(window.innerHeight - 80, startHeight - deltaY));
      
      setPanelSize({ width: newWidth, height: newHeight });
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  // 🔴 التحقق من ظهور الزر العائم
  const shouldShowBubble = () => {
    // إذا الخاصية معطلة من المالك → لا يظهر نهائياً
    if (!flags.floating_bubble_enabled) {
      console.log('[AIFloatingButton] Hidden: floating_bubble_enabled =', flags.floating_bubble_enabled);
      return false;
    }
    
    // إذا المستخدم عطّلها من إعداداته
    if (!isUserEnabled) {
      console.log('[AIFloatingButton] Hidden: isUserEnabled =', isUserEnabled, 'localStorage =', localStorage.getItem('floating_bubble_user_enabled'));
      return false;
    }

    return true;
  };

  // 🔴 إذا الخاصية معطلة → لا يظهر شيء
  if (flagsLoading) {
    console.log('[AIFloatingButton] Hidden: flagsLoading = true');
    return null;
  }

  if (!shouldShowBubble()) {
    return null;
  }

  return (
    <>
      {/* حاوية القيود للسحب */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            id="wasata-floating-button"
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={constraintsRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 left-6 z-50 cursor-grab active:cursor-grabbing touch-none"
            whileDrag={{ scale: 1.1 }}
            onDragStart={(event, info) => {
              setIsDragging(true);
              setDragStartPos({ x: info.point.x, y: info.point.y });
            }}
            onDragEnd={(event, info) => {
              const dragDistance = Math.sqrt(
                Math.pow(info.point.x - dragStartPos.x, 2) + 
                Math.pow(info.point.y - dragStartPos.y, 2)
              );
              // Only open if it was a tap (not a drag)
              if (dragDistance < DRAG_THRESHOLD) {
                setIsOpen(true);
              }
              setIsDragging(false);
            }}
          >
            <Button
              onClick={(e) => {
                // Prevent click if we just finished dragging
                if (isDragging) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setShowWelcomeBubble(false);
                setIsOpen(true);
              }}
              className="h-16 w-16 rounded-full shadow-2xl relative group pointer-events-auto"
              style={{
                background: "linear-gradient(135deg, #01411C 0%, #065f41 100%)",
                border: "3px solid #D4AF37"
              }}
            >
              <Sparkles className="w-7 h-7 text-[#D4AF37] absolute animate-pulse" />
              <MessageCircle className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></span>
              
              {/* مؤشر السحب */}
              <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-[#01411C]" />
              </div>
            </Button>

            {/* رسالة سحابية ترحيبية - بنمط فقاعات iMessage */}
            <AnimatePresence>
              {showWelcomeBubble && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: -20 }}
                  transition={{ type: "spring", damping: 15, stiffness: 400 }}
                  className="absolute bottom-2 left-[72px] pointer-events-auto"
                  onClick={() => {
                    setShowWelcomeBubble(false);
                    setIsOpen(true);
                  }}
                >
                  {/* فقاعة الرسالة بنمط آيفون */}
                  <div 
                    className="relative cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
                  >
                    {/* الفقاعة الرئيسية - خلفية خضراء فاتحة متدرجة */}
                    <div 
                      className="relative px-4 py-3 rounded-[20px] rounded-bl-[6px] max-w-[200px]"
                      style={{
                        background: 'linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
                        border: '2px solid #D4AF37',
                        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), 0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* الذيل المنحني بنمط آيفون */}
                      <svg 
                        className="absolute -left-[10px] bottom-0"
                        width="16" 
                        height="20" 
                        viewBox="0 0 16 20"
                        style={{ filter: 'drop-shadow(-1px 0 0 #D4AF37)' }}
                      >
                        <path 
                          d="M16 0 C16 0 14 4 10 8 C6 12 0 14 0 20 C4 18 10 16 14 10 C16 6 16 0 16 0Z"
                          fill="#a5d6a7"
                        />
                      </svg>
                      
                      {/* المحتوى - نص بالأخضر الملكي */}
                      <div className="relative z-10">
                        <p className="text-[15px] leading-snug font-semibold" style={{ color: '#01411C' }}>
                          أهلاً! 👋 معك <span className="text-amber-600 font-bold">المساعد الذكي</span>
                        </p>
                        <p className="text-[13px] mt-1.5 flex items-center gap-1" style={{ color: '#065f41' }}>
                          <span>انقر هنا للمساعدة</span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        </p>
                      </div>
                    </div>
                    
                    {/* زر إغلاق صغير */}
                    <button 
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border-2 border-amber-500"
                      style={{ color: '#01411C' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowWelcomeBubble(false);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50"
            style={{ 
              width: `${panelSize.width}px`, 
              height: `${panelSize.height}px`,
              maxWidth: 'calc(100vw - 3rem)',
              maxHeight: 'calc(100vh - 3rem)'
            }}
          >
            {/* مقبض تغيير الحجم - الزاوية العلوية اليمنى */}
            <div
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              className={`absolute -top-3 -right-3 w-8 h-8 bg-[#D4AF37] rounded-full cursor-nwse-resize z-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform touch-none ${isResizing ? 'scale-125 bg-[#01411C]' : ''}`}
            >
              <Maximize2 className={`w-4 h-4 ${isResizing ? 'text-[#D4AF37]' : 'text-[#01411C]'}`} />
            </div>

            <AIChatPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIFloatingButton;