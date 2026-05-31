import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBriefingSettings } from "@/hooks/useBriefingSettings";
import {
  useDailyBriefing,
  persistBriefingLog,
  touchUserLastSeen,
  useBriefingOpener,
  ensureBriefingNotification,
  type BriefingSnapshot,
} from "@/hooks/useDailyBriefing";
import DailyBriefingModal from "./DailyBriefingModal";

const SNOOZE_KEY = "briefing_snooze_until";
const LAST_SHOWN_KEY = "briefing_last_shown_date";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function timeStringToMinutes(t: string) {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Controller global يدير:
 * - فتح الموجز تلقائياً صباحاً
 * - فتح يدوي عبر حدث openDailyBriefing
 * - فتح من إشعار (?openBriefing=ID)
 */
export default function DailyBriefingController() {
  const { settings } = useBriefingSettings();
  const { snapshot, loading, generate } = useDailyBriefing(
    settings?.enabled_cards as any,
    settings?.cumulative_after_days ?? 3,
    settings?.enable_cumulative ?? true,
  );
  const [open, setOpen] = useState(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<BriefingSnapshot | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // ملاحظة: لا نُحدّث last_seen عند التركيب فوراً لأن منطق "ما فاتك"
  // يعتمد عليه — نُحدّثه فقط بعد توليد الموجز.

  const openBriefing = useCallback(
    async (logId?: string) => {
      // فتح من إشعار/رابط: حمّل snapshot من السجل
      if (logId) {
        const { data } = await supabase
          .from("daily_briefing_log")
          .select("snapshot")
          .eq("id", logId)
          .maybeSingle();
        if (data?.snapshot) {
          setCurrentSnapshot(data.snapshot as any);
          setOpen(true);
          return;
        }
      }
      // توليد موجز حي
      const snap = await generate();
      setCurrentSnapshot(snap);
      setOpen(true);
      const log = await persistBriefingLog(snap);
      if (log?.id) await ensureBriefingNotification(log.id, snap);
      await touchUserLastSeen();
      localStorage.setItem(LAST_SHOWN_KEY, todayStr());
      localStorage.removeItem(SNOOZE_KEY);
    },
    [generate],
  );

  useBriefingOpener(openBriefing);

  // فتح تلقائي صباحاً
  useEffect(() => {
    if (!settings || !settings.enabled) return;
    const today = todayStr();
    const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    if (lastShown === today) return;
    // تحقق Snooze
    const snoozeUntil = parseInt(localStorage.getItem(SNOOZE_KEY) || "0", 10);
    if (snoozeUntil && Date.now() < snoozeUntil) return;
    // تحقق اليوم الأسبوعي
    const dow = new Date().getDay();
    if (settings.active_days && !settings.active_days.includes(dow)) return;
    // تحقق وقت الظهور
    const briefingMins = timeStringToMinutes(settings.briefing_time);
    if (nowMinutes() < briefingMins) return;

    // كل الشروط تحققت
    const timer = setTimeout(openBriefing, 1200); // تأخير صغير ليكتمل تحميل الصفحة
    return () => clearTimeout(timer);
  }, [settings, openBriefing]);

  // فتح من رابط الإشعار ?openBriefing=ID
  useEffect(() => {
    const id = searchParams.get("openBriefing");
    if (!id) return;
    (async () => {
      await openBriefing(id);
      // امسح الباراميتر
      const next = new URLSearchParams(searchParams);
      next.delete("openBriefing");
      setSearchParams(next, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleMarkRead = useCallback(async (cardKey: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = todayStr();
    const { data: existing } = await supabase
      .from("daily_briefing_log")
      .select("read_cards")
      .eq("user_id", user.id)
      .eq("briefing_date", today)
      .maybeSingle();
    const read = new Set(existing?.read_cards ?? []);
    read.add(cardKey);
    await supabase
      .from("daily_briefing_log")
      .update({ read_cards: Array.from(read) })
      .eq("user_id", user.id)
      .eq("briefing_date", today);
  }, []);

  const handleSnooze = useCallback(() => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 60 * 60 * 1000));
    setOpen(false);
  }, []);

  const handleClose = useCallback(async () => {
    setOpen(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("daily_briefing_log")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("briefing_date", todayStr());
    }
  }, []);

  return (
    <DailyBriefingModal
      open={open}
      onClose={handleClose}
      snapshot={currentSnapshot ?? snapshot}
      loading={loading}
      onSnoozeOneHour={handleSnooze}
      onMarkRead={handleMarkRead}
    />
  );
}