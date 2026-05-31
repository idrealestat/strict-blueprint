import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BriefingItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

export interface BriefingCardData {
  key: string;
  title: string;
  emoji: string;
  count: number;
  items: BriefingItem[];
  viewAllPath?: string;
  severity?: "info" | "warning" | "critical";
}

export interface BriefingSnapshot {
  generated_at: string;
  cards: BriefingCardData[];
  critical_alert?: { message: string; count: number } | null;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfTodayISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * MVP: يجمع 4 بطاقات أساسية (المهام، المواعيد، الفرص الذكية، التنبيهات الحرجة)
 * البطاقات الفارغة تُخفى تلقائياً.
 */
export function useDailyBriefing(enabledCards?: Record<string, boolean>) {
  const [snapshot, setSnapshot] = useState<BriefingSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (): Promise<BriefingSnapshot> => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const empty: BriefingSnapshot = { generated_at: new Date().toISOString(), cards: [] };
      setSnapshot(empty);
      setLoading(false);
      return empty;
    }
    const cards: BriefingCardData[] = [];
    const enabled = (k: string) => !enabledCards || enabledCards[k] !== false;

    // 1) المهام (اليوم + متأخرات 3 أيام)
    if (enabled("tasks")) {
      const threeDaysAgo = daysAgo(3);
      const endToday = endOfTodayISO();
      const { data: tasks } = await supabase
        .from("crm_tasks")
        .select("id,title,due_date,priority,status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .gte("due_date", threeDaysAgo)
        .lte("due_date", endToday)
        .order("due_date", { ascending: true })
        .limit(20);
      const list = tasks ?? [];
      cards.push({
        key: "tasks",
        title: "مهام اليوم والمتأخرة",
        emoji: "✅",
        count: list.length,
        items: list.slice(0, 3).map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.priority ? `الأولوية: ${t.priority}` : undefined,
          meta: t.due_date ? new Date(t.due_date).toLocaleDateString("ar-SA") : undefined,
        })),
        viewAllPath: "/app/tasks",
      });
    }

    // 2) مواعيد اليوم
    if (enabled("appointments")) {
      const { data: appts } = await supabase
        .from("calendar_appointments")
        .select("id,title,customer_name,appointment_date,appointment_time,location,status")
        .eq("user_id", user.id)
        .gte("appointment_date", startOfTodayISO())
        .lte("appointment_date", endOfTodayISO())
        .neq("status", "cancelled")
        .order("appointment_date", { ascending: true })
        .limit(20);
      const list = appts ?? [];
      cards.push({
        key: "appointments",
        title: "مواعيد اليوم",
        emoji: "📅",
        count: list.length,
        items: list.slice(0, 3).map((a) => ({
          id: a.id,
          title: a.title || a.customer_name || "موعد",
          subtitle: a.customer_name,
          meta: `${a.appointment_time ?? ""}${a.location ? ` • ${a.location}` : ""}`,
        })),
        viewAllPath: "/app/calendar",
      });
    }

    // 3) الفرص الذكية الجديدة (آخر 3 أيام – عملاء جدد كبديل عملي للـ MVP)
    if (enabled("smart_opportunities")) {
      const { data: newCustomers } = await supabase
        .from("crm_customers")
        .select("id,name,property_type,budget,location,created_at")
        .eq("user_id", user.id)
        .gte("created_at", daysAgo(3))
        .order("created_at", { ascending: false })
        .limit(20);
      const list = newCustomers ?? [];
      cards.push({
        key: "smart_opportunities",
        title: "فرص ذكية جديدة",
        emoji: "💎",
        count: list.length,
        items: list.slice(0, 3).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: [c.property_type, c.location].filter(Boolean).join(" • "),
          meta: c.budget ?? undefined,
        })),
        viewAllPath: "/app/smart-opportunities",
      });
    }

    // 4) التنبيهات الحرجة
    let criticalCount = 0;
    if (enabled("critical_alerts")) {
      // مهام متأخرة أكثر من 3 أيام
      const { count: overdueCount } = await supabase
        .from("crm_tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending")
        .lt("due_date", daysAgo(3));
      criticalCount = overdueCount ?? 0;

      const items: BriefingItem[] = [];
      if (criticalCount > 0) {
        items.push({
          id: "overdue-tasks",
          title: `لديك ${criticalCount} مهمة متأخرة أكثر من 3 أيام`,
          subtitle: "تحتاج مراجعة فورية",
        });
      }
      cards.push({
        key: "critical_alerts",
        title: "تنبيهات حرجة",
        emoji: "⚠️",
        count: items.length,
        items,
        viewAllPath: "/app/tasks",
        severity: items.length > 0 ? "critical" : "info",
      });
    }

    const visibleCards = cards.filter((c) => c.count > 0);
    const snap: BriefingSnapshot = {
      generated_at: new Date().toISOString(),
      cards: visibleCards,
      critical_alert:
        criticalCount > 0
          ? {
              message: `لديك ${criticalCount} مهمة متأخرة أكثر من 3 أيام – راجع بطاقة المهام فوراً.`,
              count: criticalCount,
            }
          : null,
    };
    setSnapshot(snap);
    setLoading(false);
    return snap;
  }, [enabledCards]);

  return { snapshot, loading, generate };
}

/**
 * يحفظ/يحدّث سجل الموجز اليومي مع snapshot.
 */
export async function persistBriefingLog(snapshot: BriefingSnapshot) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_briefing_log")
    .upsert(
      {
        user_id: user.id,
        briefing_date: today,
        snapshot: snapshot as any,
        opened_at: new Date().toISOString(),
      },
      { onConflict: "user_id,briefing_date" },
    )
    .select()
    .maybeSingle();
  if (error) console.warn("[briefing] persist log error", error);
  return data;
}

/**
 * يحدّث last_seen_at للمستخدم الحالي.
 */
export async function touchUserLastSeen() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_last_seen")
    .upsert({ user_id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: "user_id" });
}

/**
 * مفتاح حدث الفتح اليدوي للموجز.
 */
export const OPEN_BRIEFING_EVENT = "openDailyBriefing";

export function openBriefingManually() {
  window.dispatchEvent(new CustomEvent(OPEN_BRIEFING_EVENT));
}

export function useBriefingOpener(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(OPEN_BRIEFING_EVENT, handler);
    return () => window.removeEventListener(OPEN_BRIEFING_EVENT, handler);
  }, [callback]);
}