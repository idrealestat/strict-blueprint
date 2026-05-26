/**
 * LiveViewersBadge.tsx
 * شارة عرض عدد الزوار المتصلين حالياً (نظام ألوان موحد حسب العدد)
 */

import React from 'react';
import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveViewersBadgeProps {
  liveViewers: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'floating' | 'minimal';
  className?: string;
}

const getColorByLiveCount = (count: number): string => {
  if (count === 0) return '#22c55e';
  if (count < 50) return '#eab308';
  if (count < 100) return '#ef4444';
  if (count < 500) return '#a855f7';
  return '#3b82f6';
};

const LiveViewersBadge: React.FC<LiveViewersBadgeProps> = ({
  liveViewers,
  label = 'متصل الآن',
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const count = liveViewers;
  const bgColor = getColorByLiveCount(count);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} style={{ color: bgColor }}>
        <div className="relative">
          <Eye className={iconSizes[size]} />
          {count > 0 && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: bgColor }}
            />
          )}
        </div>
        <span className={sizeClasses[size]}>{count}</span>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className={`fixed bottom-6 left-6 z-50 ${className}`}
        >
          <div
            className="text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2"
            style={{ backgroundColor: bgColor }}
          >
            <div className="relative">
              <Eye className="w-5 h-5" />
              {count > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full" />
                </>
              )}
            </div>
            <span className="font-bold">{count}</span>
            <span className="text-white/90 text-sm">{label}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default variant
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${bgColor}1a`,
        border: `1px solid ${bgColor}4d`,
        color: bgColor,
      }}
    >
      {count > 0 && (
        <div className="relative flex items-center justify-center">
          <span
            className="absolute w-2 h-2 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: bgColor }}
          />
          <span
            className="relative w-2 h-2 rounded-full"
            style={{ backgroundColor: bgColor }}
          />
        </div>
      )}
      <Eye className={iconSizes[size]} />
      <span className="font-bold">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
};

export default LiveViewersBadge;