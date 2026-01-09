-- =====================================================
-- THREE-LAYER FEATURE CONTROL SYSTEM
-- Layer 1: Global Defaults (System Level)
-- Layer 2: User Overrides (Individual Exceptions)
-- Layer 3: Business Rules (Office/Company Level)
-- =====================================================

-- 1. Create global_feature_defaults table (Layer 1)
CREATE TABLE IF NOT EXISTS public.global_feature_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dashboard Features
  publishing_enabled boolean DEFAULT true,
  smart_paths_enabled boolean DEFAULT true,
  spatial_intelligence_enabled boolean DEFAULT true,
  offers_requests_enabled boolean DEFAULT true,
  quick_calculator_enabled boolean DEFAULT true,
  -- Left Slider
  left_slider_enabled boolean DEFAULT true,
  -- Right Slider
  right_slider_mediation_course_enabled boolean DEFAULT true,
  right_slider_team_management_enabled boolean DEFAULT true,
  right_slider_workspace_enabled boolean DEFAULT true,
  right_slider_owner_panel_enabled boolean DEFAULT true,
  -- Business Card
  business_card_add_colleague_enabled boolean DEFAULT true,
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create user_feature_overrides table (Layer 2)
CREATE TABLE IF NOT EXISTS public.user_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  fal_license_number text,
  email text,
  -- Dashboard Features (NULL = follow global, true/false = override)
  publishing_enabled boolean DEFAULT NULL,
  smart_paths_enabled boolean DEFAULT NULL,
  spatial_intelligence_enabled boolean DEFAULT NULL,
  offers_requests_enabled boolean DEFAULT NULL,
  quick_calculator_enabled boolean DEFAULT NULL,
  -- Left Slider
  left_slider_enabled boolean DEFAULT NULL,
  -- Right Slider
  right_slider_mediation_course_enabled boolean DEFAULT NULL,
  right_slider_team_management_enabled boolean DEFAULT NULL,
  right_slider_workspace_enabled boolean DEFAULT NULL,
  right_slider_owner_panel_enabled boolean DEFAULT NULL,
  -- Business Card
  business_card_add_colleague_enabled boolean DEFAULT NULL,
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Create business_feature_rules table (Layer 3)
CREATE TABLE IF NOT EXISTS public.business_feature_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type text NOT NULL CHECK (account_type IN ('office', 'company')),
  -- Dashboard Features (NULL = follow global, true/false = override)
  publishing_enabled boolean DEFAULT NULL,
  smart_paths_enabled boolean DEFAULT NULL,
  spatial_intelligence_enabled boolean DEFAULT NULL,
  offers_requests_enabled boolean DEFAULT NULL,
  quick_calculator_enabled boolean DEFAULT NULL,
  -- Left Slider
  left_slider_enabled boolean DEFAULT NULL,
  -- Right Slider
  right_slider_mediation_course_enabled boolean DEFAULT NULL,
  right_slider_team_management_enabled boolean DEFAULT NULL,
  right_slider_workspace_enabled boolean DEFAULT NULL,
  right_slider_owner_panel_enabled boolean DEFAULT NULL,
  -- Business Card
  business_card_add_colleague_enabled boolean DEFAULT NULL,
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(account_type)
);

-- 4. Add new column to feature_flags for owner panel
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS right_slider_owner_panel_enabled boolean DEFAULT false;

-- 5. Enable RLS on new tables
ALTER TABLE public.global_feature_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_feature_rules ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for global_feature_defaults
CREATE POLICY "Anyone can view global defaults"
  ON public.global_feature_defaults
  FOR SELECT
  USING (true);

CREATE POLICY "Owner can manage global defaults"
  ON public.global_feature_defaults
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

-- 7. RLS Policies for user_feature_overrides
CREATE POLICY "Owner can manage user overrides"
  ON public.user_feature_overrides
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can view own overrides"
  ON public.user_feature_overrides
  FOR SELECT
  USING (auth.uid() = user_id);

-- 8. RLS Policies for business_feature_rules
CREATE POLICY "Anyone can view business rules"
  ON public.business_feature_rules
  FOR SELECT
  USING (true);

CREATE POLICY "Owner can manage business rules"
  ON public.business_feature_rules
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

-- 9. Insert default global settings
INSERT INTO public.global_feature_defaults (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 10. Insert default business rules for office and company
INSERT INTO public.business_feature_rules (account_type)
VALUES ('office'), ('company')
ON CONFLICT (account_type) DO NOTHING;

-- 11. Triggers for updated_at
CREATE TRIGGER update_global_feature_defaults_updated_at
  BEFORE UPDATE ON public.global_feature_defaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_feature_overrides_updated_at
  BEFORE UPDATE ON public.user_feature_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_feature_rules_updated_at
  BEFORE UPDATE ON public.business_feature_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_feature_defaults;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_feature_overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_feature_rules;