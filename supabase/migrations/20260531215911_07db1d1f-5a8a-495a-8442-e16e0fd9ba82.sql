
-- 1) إعدادات الموجز الصباحي لكل مستخدم
CREATE TABLE public.daily_briefing_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  briefing_time time NOT NULL DEFAULT '07:00',
  active_days int[] NOT NULL DEFAULT '{0,1,2,3,4,6}'::int[],
  enabled_cards jsonb NOT NULL DEFAULT '{
    "tasks": true,
    "appointments": true,
    "new_customers": true,
    "offers_requests": true,
    "smart_opportunities": true,
    "vip_requests": true,
    "market_analytics": true,
    "team_updates": true,
    "critical_alerts": true,
    "yesterday_performance": true,
    "smart_recommendation": true,
    "potential_opportunity": true
  }'::jsonb,
  send_push boolean NOT NULL DEFAULT true,
  send_whatsapp boolean NOT NULL DEFAULT false,
  show_instant_button boolean NOT NULL DEFAULT true,
  enable_cumulative boolean NOT NULL DEFAULT true,
  cumulative_after_days int NOT NULL DEFAULT 3,
  last_shown_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_briefing_settings TO authenticated;
GRANT ALL ON public.daily_briefing_settings TO service_role;

ALTER TABLE public.daily_briefing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_briefing_settings"
  ON public.daily_briefing_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_daily_briefing_settings_updated_at
  BEFORE UPDATE ON public.daily_briefing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) سجل الموجز اليومي (لقطة + حالة القراءة)
CREATE TABLE public.daily_briefing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  briefing_date date NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened_at timestamptz,
  dismissed_at timestamptz,
  read_cards text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, briefing_date)
);

CREATE INDEX idx_daily_briefing_log_user_date
  ON public.daily_briefing_log (user_id, briefing_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_briefing_log TO authenticated;
GRANT ALL ON public.daily_briefing_log TO service_role;

ALTER TABLE public.daily_briefing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_briefing_log"
  ON public.daily_briefing_log
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3) آخر زيارة للمستخدم (للموجز التراكمي)
CREATE TABLE public.user_last_seen (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_last_seen TO authenticated;
GRANT ALL ON public.user_last_seen TO service_role;

ALTER TABLE public.user_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_last_seen"
  ON public.user_last_seen
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_last_seen_updated_at
  BEFORE UPDATE ON public.user_last_seen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
