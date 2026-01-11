import { useState, useCallback } from 'react';
import { useSessionErrorHandler } from './useSessionErrorHandler';

interface UseSpeechToTextReturn {
  isTranscribing: boolean;
  error: string | null;
  transcribe: (audioData: string, mimeType: string) => Promise<string | null>;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSessionError, getAccessToken, checkResponseStatus } = useSessionErrorHandler();

  const transcribe = useCallback(async (audioData: string, mimeType: string): Promise<string | null> => {
    setIsTranscribing(true);
    setError(null);

    try {
      const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wasata-speech-to-text`;

      console.log('Sending audio for transcription...');

      // IMPORTANT: لازم نرسل توكن المستخدم وليس publishable key
      const accessToken = await getAccessToken();

      if (!accessToken) {
        await handleSessionError();
        return null;
      }

      const response = await fetch(STT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ audioData, mimeType }),
      });

      // معالجة موحدة لخطأ 401
      if (await checkResponseStatus(response.status)) {
        return null;
      }

      if (response.status === 429) {
        setError('تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً');
        return null;
      }

      if (response.status === 402) {
        setError('يرجى إضافة رصيد للاستمرار');
        return null;
      }

      if (!response.ok) {
        throw new Error('فشل في تحويل الصوت إلى نص');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في تحويل الصوت');
      }

      console.log('Transcription result:', result.text);
      return result.text;

    } catch (e) {
      console.error('Speech-to-text error:', e);
      setError(e instanceof Error ? e.message : 'خطأ في تحويل الصوت');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [getAccessToken, handleSessionError, checkResponseStatus]);

  return {
    isTranscribing,
    error,
    transcribe
  };
}
