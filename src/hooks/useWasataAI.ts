import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseWasataAIReturn {
  isLoading: boolean;
  error: string | null;
  sendMessage: (messages: Message[], userName: string, onDelta: (delta: string) => void) => Promise<void>;
}

export function useWasataAI(): UseWasataAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    messages: Message[],
    userName: string,
    onDelta: (delta: string) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wasata-ai-chat`;

      // IMPORTANT: يجب إرسال توكن المستخدم (وليس publishable key)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError('جلسة غير صالحة - يرجى تسجيل الدخول مرة أخرى');
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages, userName }),
      });

      if (response.status === 429) {
        setError('تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً');
        return;
      }

      if (response.status === 402) {
        setError('يرجى إضافة رصيد للاستمرار في استخدام وساطه AI');
        return;
      }

      if (response.status === 401) {
        // التوكن انتهى/غير صالح
        setError('جلسة غير صالحة - يرجى تسجيل الدخول مرة أخرى');
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('فشل في بدء المحادثة');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch { /* ignore */ }
        }
      }

    } catch (e) {
      console.error('Wasata AI error:', e);
      setError(e instanceof Error ? e.message : 'خطأ غير معروف');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    sendMessage
  };
}
