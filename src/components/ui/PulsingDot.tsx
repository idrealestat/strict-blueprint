/**
 * PulsingDot.tsx
 * النقطة الحمراء النابضة للعناصر الجديدة
 */

import { motion } from 'framer-motion';

interface PulsingDotProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export default function PulsingDot({
  show,
  size = 'md',
  position = 'top-right',
  className = '',
}: PulsingDotProps) {
  if (!show) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`absolute ${positionClasses[position]} ${className}`}
    >
      <span className="relative flex">
        <motion.span
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75`}
        />
        <span className={`relative inline-flex rounded-full bg-red-500 ${sizeClasses[size]}`} />
      </span>
    </motion.div>
  );
}
