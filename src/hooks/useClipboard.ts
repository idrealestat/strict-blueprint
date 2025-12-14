// ملف: src/hooks/useClipboard.ts
// Hook لنسخ النص - حرفي من البرومبت

import { useState } from 'react';
import { toast } from 'sonner';

export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('تم نسخ الرابط');
      
      // إعادة تعيين بعد 2 ثانية
      setTimeout(() => setCopied(false), 2000);
      
      return true;
    } catch (error) {
      toast.error('فشل في نسخ الرابط');
      return false;
    }
  };

  return {
    copied,
    copyToClipboard,
  };
};
