/**
 * LiveViewersBadge.tsx
 * شارة عرض عدد الزوار المتصلين حالياً
 */

import React from 'react';
import { Users, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveViewersBadgeProps {
  count: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'floating' | 'minimal';
  className?: string;
}

const LiveViewersBadge: React.FC<LiveViewersBadgeProps> = ({
  count,
  label = 'متصل الآن',
  size = 'md',
  variant = 'default',
  className = '',
}) => {
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
      <div className={`flex items-center gap-1.5 text-muted-foreground ${className}`}>
        <div className="relative">
          <Eye className={iconSizes[size]} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className={sizeClasses[size]}>{count}</span>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`fixed bottom-6 left-6 z-50 ${className}`}
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
              <div className="relative">
                <Users className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="font-bold">{count}</span>
              <span className="text-green-100 text-sm">{label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Default variant
  return (
    <div
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 
        border border-green-500/30 rounded-full ${sizeClasses[size]} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
        <span className="relative w-2 h-2 bg-green-500 rounded-full" />
      </div>
      <Users className={`${iconSizes[size]} text-green-600`} />
      <span className="font-bold text-green-700 dark:text-green-400">{count}</span>
      <span className="text-green-600/80 dark:text-green-400/80">{label}</span>
    </div>
  );
};

export default LiveViewersBadge;
