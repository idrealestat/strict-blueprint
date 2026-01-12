import { useState, useCallback, useRef } from 'react';
import { useSessionErrorHandler } from './useSessionErrorHandler';

type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'male' | 'female';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  speak: (text: string, voice?: Voice, speed?: number) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * تلخيص النص الطويل للقراءة الصوتية
 * يستخرج الجوهر ويحذف التفاصيل الزائدة
 */
function summarizeForSpeech(text: string, maxLength: number = 300): string {
  // إزالة الإيموجي والرموز الخاصة
  let cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[•\-\*#]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // إذا كان النص قصير، نعيده كما هو
  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // استخراج الجمل الأساسية
  const sentences = cleanText.split(/[.،!؟]+/).filter(s => s.trim().length > 10);
  
  // الأولوية للترحيب والخلاصة
  const priorityKeywords = ['حياك', 'أهلاً', 'مرحباً', 'أنا', 'أستطيع', 'كيف أقدر', 'خدمتك'];
  const skipKeywords = ['معلوماتي من', 'المصادر', 'أقدر أحسب', 'الإحصائيات', 'العقود', 'منصة'];
  
  const prioritySentences: string[] = [];
  const otherSentences: string[] = [];
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length < 5) return;
    
    // تخطي الجمل التفصيلية
    if (skipKeywords.some(kw => trimmed.includes(kw))) {
      return;
    }
    
    // إضافة جمل الأولوية
    if (priorityKeywords.some(kw => trimmed.includes(kw))) {
      prioritySentences.push(trimmed);
    } else if (prioritySentences.length + otherSentences.length < 3) {
      otherSentences.push(trimmed);
    }
  });
  
  // تجميع النتيجة
  let result = [...prioritySentences, ...otherSentences].join('. ');
  
  // إذا لا زال طويلاً، نقطع
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
    const lastPeriod = result.lastIndexOf('.');
    if (lastPeriod > maxLength * 0.5) {
      result = result.substring(0, lastPeriod + 1);
    }
  }
  
  // إضافة ختام مناسب إذا تم الاختصار
  if (result.length < cleanText.length * 0.5) {
    result += ' كيف أقدر أخدمك؟';
  }
  
  return result || 'حياك الله، كيف أقدر أخدمك؟';
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { handleSessionError, getAccessToken, checkResponseStatus } = useSessionErrorHandler();

  const speak = useCallback(async (text: string, voice: Voice = 'male', speed: number = 1.0): Promise<void> => {
    // إيقاف أي صوت سابق
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wasata-text-to-speech`;

      // تلخيص النص الطويل للقراءة الصوتية
      const textForSpeech = summarizeForSpeech(text, 350);
      console.log('TTS - Original length:', text.length, '| Summarized:', textForSpeech.length);

      // IMPORTANT: لازم نرسل توكن المستخدم وليس publishable key
      const accessToken = await getAccessToken();

      if (!accessToken) {
        await handleSessionError();
        return;
      }

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: textForSpeech, voice, speed }),
      });

      // معالجة موحدة لخطأ 401
      if (await checkResponseStatus(response.status)) {
        setIsLoading(false);
        return;
      }

      if (response.status === 429) {
        setError('تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً');
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        setError('يرجى إضافة رصيد للاستمرار');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('فشل في توليد الصوت');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'فشل في توليد الصوت');
      }

      // تشغيل الصوت
      const audioData = result.audioContent;
      const audioBlob = base64ToBlob(audioData, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('خطأ في تشغيل الصوت');
        setIsSpeaking(false);
        setIsLoading(false);
      };

      await audio.play();

    } catch (e) {
      console.error('Text-to-speech error:', e);
      setError(e instanceof Error ? e.message : 'خطأ في توليد الصوت');
      setIsLoading(false);
    }
  }, [getAccessToken, handleSessionError, checkResponseStatus]);
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsSpeaking(true);
    }
  }, []);

  return {
    isSpeaking,
    isLoading,
    error,
    speak,
    stop,
    pause,
    resume
  };
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
