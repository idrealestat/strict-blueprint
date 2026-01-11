import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, Loader2 } from 'lucide-react';

interface AudioProcessingOverlayProps {
  isTranscribing: boolean;
  isTTSLoading: boolean;
  isRecording: boolean;
  recordingDuration?: number;
}

export function AudioProcessingOverlay({
  isTranscribing,
  isTTSLoading,
  isRecording,
  recordingDuration = 0
}: AudioProcessingOverlayProps) {
  if (!isTranscribing && !isTTSLoading && !isRecording) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // تحديد الحالة والنص
  const getStatus = () => {
    if (isRecording) {
      return {
        icon: <Mic className="w-8 h-8 text-red-500" />,
        title: 'جاري التسجيل...',
        subtitle: formatDuration(recordingDuration),
        color: 'from-red-500/20 to-red-600/20',
        pulseColor: 'bg-red-500',
      };
    }
    if (isTranscribing) {
      return {
        icon: <Mic className="w-8 h-8 text-[#01411C]" />,
        title: 'جاري تحويل الصوت إلى نص...',
        subtitle: 'يرجى الانتظار',
        color: 'from-[#01411C]/20 to-[#065f41]/20',
        pulseColor: 'bg-[#01411C]',
      };
    }
    if (isTTSLoading) {
      return {
        icon: <Volume2 className="w-8 h-8 text-[#D4AF37]" />,
        title: 'جاري توليد الصوت...',
        subtitle: 'Wasata AI يتحدث قريباً',
        color: 'from-[#D4AF37]/20 to-[#B8941F]/20',
        pulseColor: 'bg-[#D4AF37]',
      };
    }
    return null;
  };

  const status = getStatus();
  if (!status) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-white/60"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={`bg-gradient-to-br ${status.color} rounded-2xl p-6 shadow-xl border border-white/50 max-w-xs text-center`}
      >
        {/* أيقونة متحركة */}
        <div className="relative mx-auto w-20 h-20 mb-4">
          {/* الدوائر المتموجة */}
          <motion.div
            className={`absolute inset-0 rounded-full ${status.pulseColor}/30`}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={`absolute inset-2 rounded-full ${status.pulseColor}/40`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className={`absolute inset-4 rounded-full ${status.pulseColor}/50`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
          
          {/* الأيقونة المركزية */}
          <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full shadow-lg">
            {status.icon}
          </div>
        </div>

        {/* العنوان */}
        <h4 className="text-[#01411C] font-bold text-lg mb-1">{status.title}</h4>
        <p className="text-[#01411C]/60 text-sm">{status.subtitle}</p>

        {/* شريط التقدم المتحرك */}
        <div className="mt-4 h-1.5 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${status.pulseColor} rounded-full`}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: '50%' }}
          />
        </div>

        {/* مؤشر Loader إضافي */}
        <div className="mt-4 flex justify-center">
          <Loader2 className="w-5 h-5 text-[#01411C]/60 animate-spin" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AudioProcessingOverlay;
