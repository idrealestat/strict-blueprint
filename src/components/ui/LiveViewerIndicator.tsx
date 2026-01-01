/**
 * LiveViewerIndicator.tsx
 * مكون لعرض مؤشر المشاهدات المباشرة
 * - عين خضراء فاتحة في دائرة ذهبية إذا لا توجد مشاهدة مباشرة
 * - عين حمراء نابضة مع عدد المشاهدين إذا يوجد مشاهدة مباشرة
 */

import React from 'react';
import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveViewerIndicatorProps {
  liveViewers: number;
  totalViews?: number;
  showTotalViews?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LiveViewerIndicator({
  liveViewers,
  totalViews = 0,
  showTotalViews = false,
  size = 'md',
  className = '',
}: LiveViewerIndicatorProps) {
  const hasLiveViewers = liveViewers > 0;

  const sizeClasses = {
    sm: {
      container: 'w-7 h-7',
      icon: 'w-3.5 h-3.5',
      badge: 'text-[10px] min-w-4 h-4 -top-1 -right-1',
      totalViews: 'text-[10px]',
    },
    md: {
      container: 'w-9 h-9',
      icon: 'w-4 h-4',
      badge: 'text-xs min-w-5 h-5 -top-1.5 -right-1.5',
      totalViews: 'text-xs',
    },
    lg: {
      container: 'w-11 h-11',
      icon: 'w-5 h-5',
      badge: 'text-sm min-w-6 h-6 -top-2 -right-2',
      totalViews: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* حاوية العين */}
      <div className="relative">
        <motion.div
          animate={hasLiveViewers ? { 
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0)',
              '0 0 0 8px rgba(239, 68, 68, 0.3)',
              '0 0 0 0 rgba(239, 68, 68, 0)'
            ]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: hasLiveViewers ? Infinity : 0,
            ease: 'easeInOut',
          }}
          className={`
            ${classes.container}
            rounded-full flex items-center justify-center
            transition-all duration-300
            ${hasLiveViewers 
              ? 'bg-red-500/90 shadow-lg shadow-red-500/30' 
              : 'bg-emerald-100 border-2 border-[#D4AF37]'
            }
          `}
        >
          <Eye 
            className={`
              ${classes.icon}
              ${hasLiveViewers ? 'text-white' : 'text-emerald-500'}
            `} 
          />
        </motion.div>

        {/* شارة عدد المشاهدين المباشرين */}
        <AnimatePresence>
          {hasLiveViewers && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`
                absolute ${classes.badge}
                bg-red-600 text-white rounded-full
                flex items-center justify-center px-1
                font-bold shadow-md
              `}
            >
              {liveViewers}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* عرض إجمالي المشاهدات */}
      {showTotalViews && (
        <span className={`${classes.totalViews} text-gray-500 flex items-center gap-0.5`}>
          {totalViews.toLocaleString('ar-SA')}
        </span>
      )}
    </div>
  );
}
