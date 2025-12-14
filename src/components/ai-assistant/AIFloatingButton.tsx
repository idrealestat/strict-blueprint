import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { MessageCircle, Sparkles, GripVertical } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { AIChatPanel } from "./AIChatPanel";

export function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 }); // من الأسفل واليسار
  const [panelSize, setPanelSize] = useState({ width: 450, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // النقر خارج اللوحة يغلقها (لكن لا يمسح المحادثة)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // لا تغلق إذا كان النقر على زر العائم نفسه
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

  // معالجة تغيير الحجم
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
      
      // تغيير الحجم من الزاوية العلوية اليمنى
      const deltaX = startX - currentX;
      const deltaY = startY - currentY;
      
      const newWidth = Math.max(350, Math.min(700, startWidth + deltaX));
      const newHeight = Math.max(400, Math.min(800, startHeight + deltaY));
      
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
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

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
            dragElastic={0.1}
            dragConstraints={constraintsRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 left-6 z-50 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            whileDrag={{ scale: 1.1 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
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
              className={`absolute -top-2 -right-2 w-6 h-6 bg-[#D4AF37] rounded-full cursor-nwse-resize z-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${isResizing ? 'scale-125' : ''}`}
              style={{ touchAction: 'none' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#01411C]">
                <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            <AIChatPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIFloatingButton;