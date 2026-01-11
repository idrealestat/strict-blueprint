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

      console.log('Converting text to speech:', text.substring(0, 50) + '...');

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
        body: JSON.stringify({ text, voice, speed }),
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
