-- Phase 4: Silent Assistant Alerts
CREATE TABLE public.silent_assistant_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  related_entity_type TEXT,
  related_entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.silent_assistant_alerts TO authenticated;
GRANT ALL ON public.silent_assistant_alerts TO service_role;

ALTER TABLE public.silent_assistant_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage silent alerts"
ON public.silent_assistant_alerts
FOR ALL TO authenticated
USING (auth.uid() = organization_user_id OR is_organization_admin(organization_user_id, auth.uid()))
WITH CHECK (auth.uid() = organization_user_id OR is_organization_admin(organization_user_id, auth.uid()));

CREATE INDEX idx_silent_alerts_org ON public.silent_assistant_alerts(organization_user_id, status);
CREATE INDEX idx_silent_alerts_target ON public.silent_assistant_alerts(target_user_id);

-- Phase 5: Auto Distribution Log + team_settings extension
CREATE TABLE public.auto_distribution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  assigned_to_user_id UUID NOT NULL,
  distribution_mode TEXT NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.auto_distribution_log TO authenticated;
GRANT ALL ON public.auto_distribution_log TO service_role;

ALTER TABLE public.auto_distribution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins view distribution log"
ON public.auto_distribution_log
FOR SELECT TO authenticated
USING (auth.uid() = organization_user_id OR is_organization_admin(organization_user_id, auth.uid()));

CREATE POLICY "Org admins insert distribution log"
ON public.auto_distribution_log
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = organization_user_id OR is_organization_admin(organization_user_id, auth.uid()));

CREATE INDEX idx_distribution_log_org ON public.auto_distribution_log(organization_user_id, created_at DESC);

-- Add lead_distribution_mode to team_settings (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_settings' AND column_name = 'lead_distribution_mode') THEN
      ALTER TABLE public.team_settings ADD COLUMN lead_distribution_mode TEXT NOT NULL DEFAULT 'manual';
    END IF;
  END IF;
END $$;

-- Trigger function for updated_at
CREATE TRIGGER update_silent_alerts_updated_at
BEFORE UPDATE ON public.silent_assistant_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();