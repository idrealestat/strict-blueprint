/**
 * FloatingAssistant.tsx
 * زر المساعد الذكي العائم - يظهر دائماً على الشاشة
 */

import { useState } from 'react';
import { X, MessageCircle, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartAssistant from './SmartAssistant';

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* الزر العائم */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-gradient-to-r from-[#01411C] to-[#065f41] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 group border-2 border-[#D4AF37]"
          title="المساعد الذكي"
        >
          <div className="relative">
            <span className="text-3xl">🤖</span>
            {/* نقطة الحالة */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          {/* تلميح */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            المساعد الذكي
          </div>
        </button>
      )}

      {/* نافذة المساعد */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 ${
            isMinimized 
              ? 'bottom-6 left-6 w-80 h-16' 
              : 'bottom-6 left-6 w-[90vw] max-w-2xl h-[80vh] max-h-[700px]'
          }`}
        >
          {isMinimized ? (
            // الحالة المصغرة
            <div 
              onClick={() => setIsMinimized(false)}
              className="w-full h-full bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-2xl border-2 border-[#D4AF37] flex items-center justify-between px-4 cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">المساعد الذكي</h4>
                  <p className="text-green-400 text-xs">متصل ونشط</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="text-white hover:bg-white/10 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // الحالة الكاملة
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden flex flex-col">
              {/* شريط العنوان */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b border-[#D4AF37]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-white font-bold">المساعد الذكي</h4>
                    <p className="text-[#D4AF37] text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      متصل - جاهز للمساعدة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMinimized(true)}
                    className="text-white hover:bg-white/10 h-8 w-8"
                    title="تصغير"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/10 h-8 w-8"
                    title="إغلاق"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* محتوى المساعد */}
              <div className="flex-1 overflow-hidden">
                <SmartAssistant />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingAssistant;
