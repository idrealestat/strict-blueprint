import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BriefingEnabledCards {
  tasks: boolean;
  appointments: boolean;
  new_customers: boolean;
  offers_requests: boolean;
  smart_opportunities: boolean;
  vip_requests: boolean;
  market_analytics: boolean;
  team_updates: boolean;
  critical_alerts: boolean;
  yesterday_performance: boolean;
  smart_recommendation: boolean;
  potential_opportunity: boolean;
}

export interface BriefingSettings {
  user_id: string;
  enabled: boolean;
  briefing_time: string; // "HH:MM" or "HH:MM:SS"
  active_days: number[]; // 0=Sun .. 6=Sat
  enabled_cards: BriefingEnabledCards;
  send_push: boolean;
  send_whatsapp: boolean;
  show_instant_button: boolean;
  enable_cumulative: boolean;
  cumulative_after_days: number;
  last_shown_date: string | null;
}

const DEFAULT_CARDS: BriefingEnabledCards = {
  tasks: true,
  appointments: true,
  new_customers: true,
  offers_requests: true,
  smart_opportunities: true,
  vip_requests: true,
  market_analytics: true,
  team_updates: true,
  critical_alerts: true,
  yesterday_performance: true,
  smart_recommendation: true,
  potential_opportunity: true,
};

export const DEFAULT_SETTINGS: Omit<BriefingSettings, "user_id"> = {
  enabled: true,
  briefing_time: "07:00",
  active_days: [0, 1, 2, 3, 4, 6],
  enabled_cards: DEFAULT_CARDS,
  send_push: true,
  send_whatsapp: false,
  show_instant_button: true,
  enable_cumulative: true,
  cumulative_after_days: 3,
  last_shown_date: null,
};

export function useBriefingSettings() {
  const [settings, setSettings] = useState<BriefingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("daily_briefing_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.warn("[briefing] load settings error", error);
    }
    if (data) {
      setSettings({
        ...data,
        enabled_cards: { ...DEFAULT_CARDS, ...(data.enabled_cards as any) },
      } as BriefingSettings);
    } else {
      // Create default row
      const { data: inserted } = await supabase
        .from("daily_briefing_settings")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle();
      if (inserted) {
        setSettings({
          ...inserted,
          enabled_cards: { ...DEFAULT_CARDS, ...(inserted.enabled_cards as any) },
        } as BriefingSettings);
      } else {
        setSettings({ user_id: user.id, ...DEFAULT_SETTINGS });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("briefingSettingsChanged", handler);
    return () => window.removeEventListener("briefingSettingsChanged", handler);
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Omit<BriefingSettings, "user_id">>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("daily_briefing_settings")
        .update(patch as any)
        .eq("user_id", user.id);
      if (!error) {
        setSettings((prev) => (prev ? ({ ...prev, ...patch } as BriefingSettings) : prev));
        window.dispatchEvent(new CustomEvent("briefingSettingsChanged"));
      }
    },
    [],
  );

  return { settings, loading, update, reload: load };
}