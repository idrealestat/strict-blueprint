/**
 * HelpHintsContext.tsx
 * نظام العلامات الدليلية (Help Hints / Tooltips Guidance)
 *
 * - تظهر دائرة زرقاء صغيرة بداخلها حرف i بجانب كل زر/حقل.
 * - عند التحويم (ديسكتوب) أو اللمس (جوال) تظهر رسالة سحابية تشرح وظيفة الزر.
 * - تعمل تلقائياً لمدة 7 أيام للحساب الجديد ثم تختفي تلقائياً.
 * - عند انتهاء الأسبوع يصل إشعار في الجرس بإمكانية إعادة التفعيل من الإعدادات.
 * - يمكن للمستخدم تفعيلها/إخفائها يدوياً من "إعدادات التطبيق الشامل".
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'help_hints_settings_v1';
const TRIAL_DAYS = 7;
const NOTIFICATION_FLAG_KEY = 'help_hints_expiry_notified_v1';

interface HelpHintsSettings {
  /** تفعيل يدوي صريح من المستخدم (يتجاوز انتهاء الفترة التجريبية) */
  manuallyEnabled: boolean | null;
  /** تاريخ بدء فترة التجريب التلقائية (ISO) */
  trialStartedAt: string | null;
}

interface HelpHintsContextValue {
  /** هل العلامات الدليلية مفعّلة الآن؟ */
  isEnabled: boolean;
  /** هل المستخدم في فترة التجريب التلقائية الـ 7 أيام؟ */
  isInTrial: boolean;
  /** عدد الأيام المتبقية من الفترة التجريبية (0 إذا انتهت) */
  daysRemaining: number;
  /** تفعيل يدوي */
  enable: () => void;
  /** إخفاء يدوي */
  disable: () => void;
  /** التبديل */
  toggle: () => void;
}

const HelpHintsContext = createContext<HelpHintsContextValue | undefined>(undefined);

function readSettings(): HelpHintsSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { manuallyEnabled: null, trialStartedAt: null };
    return JSON.parse(raw);
  } catch {
    return { manuallyEnabled: null, trialStartedAt: null };
  }
}

function writeSettings(s: HelpHintsSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('helpHintsChanged'));
  } catch {
    // ignore
  }
}

function calcDaysRemaining(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0;
  const start = new Date(trialStartedAt).getTime();
  const now = Date.now();
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsedDays));
}

export function HelpHintsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<HelpHintsSettings>(() => {
    const s = readSettings();
    // أول مرة → ابدأ فترة التجريب
    if (!s.trialStartedAt) {
      const next = { ...s, trialStartedAt: new Date().toISOString() };
      writeSettings(next);
      return next;
    }
    return s;
  });

  const [, force] = useState(0);

  // إعادة الحساب كل دقيقة (للعد التنازلي)
  useEffect(() => {
    const id = setInterval(() => force(x => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // مزامنة بين التبويبات
  useEffect(() => {
    const handler = () => setSettings(readSettings());
    window.addEventListener('helpHintsChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('helpHintsChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const daysRemaining = calcDaysRemaining(settings.trialStartedAt);
  const isInTrial = daysRemaining > 0;

  // التفعيل: يدوي صريح (true) > تجريب تلقائي > مغلق
  let isEnabled: boolean;
  if (settings.manuallyEnabled === true) isEnabled = true;
  else if (settings.manuallyEnabled === false) isEnabled = false;
  else isEnabled = isInTrial;

  // إرسال إشعار بانتهاء الفترة التجريبية (مرة واحدة)
  useEffect(() => {
    const sendExpiryNotificationOnce = async () => {
      if (isInTrial) return;
      if (settings.manuallyEnabled !== null) return; // المستخدم اتخذ قراراً يدوياً
      if (localStorage.getItem(NOTIFICATION_FLAG_KEY) === '1') return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('notifications').insert({
          user_id: user.id,
          notification_type: 'system',
          category: 'help_hints',
          priority: 'normal',
          title: 'انتهت فترة العلامات الدليلية 💡',
          message:
            'انتهت فترة الأسبوع التجريبية للعلامات الدليلية (دائرة الـ i الزرقاء). يمكنك إعادة تفعيلها في أي وقت من: الإعدادات → إعدادات التطبيق الشامل → العلامات الدليلية.',
        });

        localStorage.setItem(NOTIFICATION_FLAG_KEY, '1');
      } catch (err) {
        console.warn('[HelpHints] Failed to send expiry notification:', err);
      }
    };

    sendExpiryNotificationOnce();
  }, [isInTrial, settings.manuallyEnabled]);

  const enable = useCallback(() => {
    const next = { ...readSettings(), manuallyEnabled: true };
    writeSettings(next);
    setSettings(next);
  }, []);

  const disable = useCallback(() => {
    const next = { ...readSettings(), manuallyEnabled: false };
    writeSettings(next);
    setSettings(next);
  }, []);

  const toggle = useCallback(() => {
    if (isEnabled) disable();
    else enable();
  }, [isEnabled, enable, disable]);

  return (
    <HelpHintsContext.Provider value={{ isEnabled, isInTrial, daysRemaining, enable, disable, toggle }}>
      {children}
    </HelpHintsContext.Provider>
  );
}

export function useHelpHints(): HelpHintsContextValue {
  const ctx = useContext(HelpHintsContext);
  if (!ctx) {
    // fallback آمن إذا استُخدم خارج Provider
    return {
      isEnabled: false,
      isInTrial: false,
      daysRemaining: 0,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}