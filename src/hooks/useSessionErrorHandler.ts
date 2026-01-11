import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook موحد للتعامل مع أخطاء انتهاء الجلسة (401)
 * يعرض تنبيه ويقوم بتسجيل الخروج تلقائياً
 */
export function useSessionErrorHandler() {
  /**
   * معالجة خطأ 401 - انتهاء الجلسة
   * يظهر تنبيه ويسجّل خروج المستخدم
   */
  const handleSessionError = useCallback(async () => {
    toast.error('انتهت صلاحية الجلسة - جاري تسجيل الخروج...', {
      description: 'يرجى تسجيل الدخول مرة أخرى',
      duration: 4000,
    });

    // انتظار قليل لعرض التنبيه
    await new Promise(resolve => setTimeout(resolve, 1500));

    // تسجيل الخروج
    await supabase.auth.signOut();

    // إعادة التوجيه لصفحة الدخول
    window.location.href = '/auth';
  }, []);

  /**
   * الحصول على توكن المستخدم الحالي
   * يرجع null إذا لم يوجد توكن صالح
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token || null;
  }, []);

  /**
   * فحص حالة الاستجابة للتعامل مع أخطاء الجلسة
   * يرجع true إذا كان يجب إيقاف العملية
   */
  const checkResponseStatus = useCallback(async (status: number): Promise<boolean> => {
    if (status === 401) {
      await handleSessionError();
      return true; // يجب إيقاف العملية
    }
    return false; // متابعة العملية
  }, [handleSessionError]);

  return {
    handleSessionError,
    getAccessToken,
    checkResponseStatus,
  };
}

/**
 * دالة مساعدة للاستخدام خارج React hooks
 */
export async function handleGlobalSessionError() {
  toast.error('انتهت صلاحية الجلسة - جاري تسجيل الخروج...', {
    description: 'يرجى تسجيل الدخول مرة أخرى',
    duration: 4000,
  });

  await new Promise(resolve => setTimeout(resolve, 1500));
  await supabase.auth.signOut();
  window.location.href = '/auth';
}
