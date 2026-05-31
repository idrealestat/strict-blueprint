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
  cumulative?: {
    days_away: number;
    since: string;
  } | null;
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
function startOfYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * يجمع كل بطاقات الموجز (12 بطاقة + بطاقة "ما فاتك" التراكمية).
 * البطاقات الفارغة تُخفى تلقائياً.
 */
export function useDailyBriefing(
  enabledCards?: Record<string, boolean>,
  cumulativeAfterDays: number = 3,
  enableCumulative: boolean = true,
) {
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

    // ============ ما فاتك (تراكمي) ============
    let cumulative: BriefingSnapshot["cumulative"] = null;
    if (enableCumulative) {
      const { data: lastSeen } = await supabase
        .from("user_last_seen")
        .select("last_seen_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (lastSeen?.last_seen_at) {
        const lastSeenMs = new Date(lastSeen.last_seen_at).getTime();
        const diffDays = Math.floor((Date.now() - lastSeenMs) / (1000 * 60 * 60 * 24));
        if (diffDays >= cumulativeAfterDays) {
          const sinceISO = lastSeen.last_seen_at;
          const [{ count: missedTasks }, { count: missedAppts }, { count: missedCustomers }, { count: missedSubmissions }] =
            await Promise.all([
              supabase.from("crm_tasks").select("id", { count: "exact", head: true })
                .eq("user_id", user.id).gte("created_at", sinceISO),
              supabase.from("calendar_appointments").select("id", { count: "exact", head: true })
                .eq("user_id", user.id).gte("appointment_date", sinceISO),
              supabase.from("crm_customers").select("id", { count: "exact", head: true })
                .eq("user_id", user.id).gte("created_at", sinceISO),
              supabase.from("owner_submissions").select("id", { count: "exact", head: true })
                .eq("assigned_broker_user_id", user.id).gte("created_at", sinceISO),
            ]);
          cumulative = { days_away: diffDays, since: sinceISO };
          const items: BriefingItem[] = [];
          if ((missedTasks ?? 0) > 0) items.push({ id: "m-tasks", title: `${missedTasks} مهمة جديدة` });
          if ((missedAppts ?? 0) > 0) items.push({ id: "m-appts", title: `${missedAppts} موعد جديد` });
          if ((missedCustomers ?? 0) > 0) items.push({ id: "m-cust", title: `${missedCustomers} عميل جديد` });
          if ((missedSubmissions ?? 0) > 0) items.push({ id: "m-sub", title: `${missedSubmissions} عرض/طلب جديد` });
          const totalMissed = (missedTasks ?? 0) + (missedAppts ?? 0) + (missedCustomers ?? 0) + (missedSubmissions ?? 0);
          cards.push({
            key: "cumulative",
            title: `ما فاتك خلال ${diffDays} يوم`,
            emoji: "📌",
            count: totalMissed,
            items,
            severity: totalMissed > 0 ? "warning" : "info",
          });
        }
      }
    }

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

    // 3) عملاء جدد (آخر 3 أيام)
    if (enabled("new_customers")) {
      const { data: newCustomers } = await supabase
        .from("crm_customers")
        .select("id,name,property_type,budget,location,priority,created_at")
        .eq("user_id", user.id)
        .gte("created_at", daysAgo(3))
        .order("created_at", { ascending: false })
        .limit(20);
      const list = newCustomers ?? [];
      cards.push({
        key: "new_customers",
        title: "عملاء جدد (آخر 3 أيام)",
        emoji: "👤",
        count: list.length,
        items: list.slice(0, 3).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: [c.property_type, c.location].filter(Boolean).join(" • "),
          meta: c.budget ?? undefined,
        })),
        viewAllPath: "/app/customer-management",
      });
    }

    // 4) فرص ذكية (عملاء بأولوية عالية بدون متابعة)
    if (enabled("smart_opportunities")) {
      const { data: hot } = await supabase
        .from("crm_customers")
        .select("id,name,property_type,budget,location,priority,next_follow_up")
        .eq("user_id", user.id)
        .in("priority", ["عالي", "عاجل", "high", "urgent"])
        .is("next_follow_up", null)
        .order("created_at", { ascending: false })
        .limit(20);
      const list = hot ?? [];
      cards.push({
        key: "smart_opportunities",
        title: "فرص ذهبية – تحتاج متابعة",
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

    // 5) عروض وطلبات جديدة
    if (enabled("offers_requests")) {
      const since = daysAgo(3);
      const [{ data: subs }, { data: offers }] = await Promise.all([
        supabase.from("owner_submissions")
          .select("id,submission_type,purpose,city,district,created_at")
          .eq("assigned_broker_user_id", user.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("public_property_offers")
          .select("id,offer_kind,property_type,city,neighborhood,price_sar,created_at")
          .eq("owner_user_id", user.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      const items: BriefingItem[] = [];
      (subs ?? []).slice(0, 2).forEach((s: any) =>
        items.push({
          id: s.id,
          title: `${s.submission_type} - ${s.purpose}`,
          subtitle: [s.city, s.district].filter(Boolean).join(" • "),
          meta: new Date(s.created_at).toLocaleDateString("ar-SA"),
        }),
      );
      (offers ?? []).slice(0, 2).forEach((o: any) =>
        items.push({
          id: o.id,
          title: `${o.offer_kind} - ${o.property_type ?? ""}`,
          subtitle: [o.city, o.neighborhood].filter(Boolean).join(" • "),
          meta: o.price_sar ? `${o.price_sar} ر.س` : undefined,
        }),
      );
      cards.push({
        key: "offers_requests",
        title: "عروض وطلبات جديدة",
        emoji: "📨",
        count: (subs?.length ?? 0) + (offers?.length ?? 0),
        items,
        viewAllPath: "/app/offers-requests",
      });
    }

    // 6) طلبات VIP
    if (enabled("vip_requests")) {
      const { data: vip } = await supabase
        .from("special_requests")
        .select("id,property_type,city,district,urgency,status,created_at")
        .eq("user_id", user.id)
        .gte("created_at", daysAgo(7))
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(10);
      const list = vip ?? [];
      cards.push({
        key: "vip_requests",
        title: "طلبات VIP نشطة",
        emoji: "⭐",
        count: list.length,
        items: list.slice(0, 3).map((v: any) => ({
          id: v.id,
          title: `${v.property_type} في ${v.city}`,
          subtitle: v.district ?? undefined,
          meta: v.urgency ? `الإلحاح: ${v.urgency}` : undefined,
        })),
        viewAllPath: "/app/special-requests",
        severity: list.some((v: any) => ["high", "urgent", "عالي", "عاجل"].includes(v.urgency)) ? "warning" : "info",
      });
    }

    // 7) تحليلات سوق (مشاهدات الإعلانات هذا الأسبوع مقابل السابق)
    if (enabled("market_analytics")) {
      const sevenDaysAgo = daysAgo(7);
      const fourteenDaysAgo = daysAgo(14);
      const [{ count: viewsThisWeek }, { count: viewsLastWeek }] = await Promise.all([
        supabase.from("offer_views_log").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).gte("created_at", sevenDaysAgo),
        supabase.from("offer_views_log").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
      ]);
      const cur = viewsThisWeek ?? 0;
      const prev = viewsLastWeek ?? 0;
      const delta = cur - prev;
      const pct = prev > 0 ? Math.round((delta / prev) * 100) : (cur > 0 ? 100 : 0);
      const items: BriefingItem[] = [
        { id: "v-cur", title: `${cur} مشاهدة لإعلاناتك هذا الأسبوع` },
        { id: "v-prev", title: `${prev} مشاهدة الأسبوع الماضي`, subtitle: `التغيّر: ${delta >= 0 ? "+" : ""}${delta} (${pct >= 0 ? "+" : ""}${pct}%)` },
      ];
      cards.push({
        key: "market_analytics",
        title: "تحليلات السوق",
        emoji: "📊",
        count: cur,
        items,
        viewAllPath: "/app/analytics",
      });
    }

    // 8) تحديثات الفريق
    if (enabled("team_updates")) {
      const { data: members } = await supabase
        .from("organization_members")
        .select("id,member_name,member_role,status,created_at")
        .eq("organization_user_id", user.id)
        .gte("created_at", daysAgo(7))
        .order("created_at", { ascending: false })
        .limit(10);
      const list = members ?? [];
      cards.push({
        key: "team_updates",
        title: "تحديثات الفريق",
        emoji: "👥",
        count: list.length,
        items: list.slice(0, 3).map((m: any) => ({
          id: m.id,
          title: m.member_name ?? "عضو جديد",
          subtitle: m.member_role,
          meta: m.status,
        })),
        viewAllPath: "/app/team",
      });
    }

    // 9) أداء الأمس
    if (enabled("yesterday_performance")) {
      const yStart = startOfYesterdayISO();
      const yEnd = endOfYesterdayISO();
      const [{ count: viewsY }, { count: tasksDoneY }, { count: apptsY }] = await Promise.all([
        supabase.from("offer_views_log").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).gte("created_at", yStart).lte("created_at", yEnd),
        supabase.from("crm_tasks").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).eq("status", "completed")
          .gte("completed_at", yStart).lte("completed_at", yEnd),
        supabase.from("calendar_appointments").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).gte("appointment_date", yStart).lte("appointment_date", yEnd),
      ]);
      const total = (viewsY ?? 0) + (tasksDoneY ?? 0) + (apptsY ?? 0);
      cards.push({
        key: "yesterday_performance",
        title: "أداؤك أمس",
        emoji: "📈",
        count: total,
        items: [
          { id: "y-views", title: `${viewsY ?? 0} مشاهدة على إعلاناتك` },
          { id: "y-tasks", title: `${tasksDoneY ?? 0} مهمة أنجزتها` },
          { id: "y-appts", title: `${apptsY ?? 0} موعد أمس` },
        ],
      });
    }

    // 10) التنبيهات الحرجة
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
      cumulative,
    };
    setSnapshot(snap);
    setLoading(false);
    return snap;
  }, [enabledCards, cumulativeAfterDays, enableCumulative]);

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
 * يُنشئ إشعاراً في الجرس مرتبطاً بسجل الموجز اليوم (إن لم يكن موجوداً).
 */
export async function ensureBriefingNotification(logId: string, snapshot: BriefingSnapshot) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("notification_type", "daily_briefing")
    .eq("related_entity_id", logId)
    .maybeSingle();
  if (existing) return;
  const totalCards = snapshot.cards.length;
  const critical = snapshot.critical_alert?.count ?? 0;
  await supabase.from("notifications").insert({
    user_id: user.id,
    notification_type: "daily_briefing",
    category: "system",
    priority: critical > 0 ? "high" : "normal",
    title: "موجزك الصباحي جاهز ☀️",
    message: totalCards > 0
      ? `لديك ${totalCards} بطاقة جديدة${critical > 0 ? ` و${critical} تنبيه حرج` : ""}`
      : "يوم هادئ – لا توجد مستجدات اليوم",
    related_entity_type: "daily_briefing_log",
    related_entity_id: logId,
    action_url: `?openBriefing=${logId}`,
    metadata: { logId },
  });
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

export function openBriefingManually(logId?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_BRIEFING_EVENT, { detail: { logId } }));
}

export function useBriefingOpener(callback: (logId?: string) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      callback(detail?.logId);
    };
    window.addEventListener(OPEN_BRIEFING_EVENT, handler);
    return () => window.removeEventListener(OPEN_BRIEFING_EVENT, handler);
  }, [callback]);
}