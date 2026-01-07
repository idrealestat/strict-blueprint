-- =============================================
-- A) تعيين Owner للبريد المحدد
-- =============================================

UPDATE public.user_roles 
SET role = 'owner', updated_at = now()
WHERE user_id = 'd7310404-2bab-4022-ab3d-811884aa062f';

INSERT INTO public.user_roles (user_id, role)
SELECT 'd7310404-2bab-4022-ab3d-811884aa062f', 'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = 'd7310404-2bab-4022-ab3d-811884aa062f'
);

-- =============================================
-- B) إنشاء جدول feature_flags
-- =============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  publishing_enabled BOOLEAN DEFAULT true,
  smart_paths_enabled BOOLEAN DEFAULT true,
  spatial_intelligence_enabled BOOLEAN DEFAULT true,
  offers_requests_enabled BOOLEAN DEFAULT true,
  quick_calculator_enabled BOOLEAN DEFAULT true,
  left_slider_enabled BOOLEAN DEFAULT true,
  right_slider_mediation_course_enabled BOOLEAN DEFAULT true,
  right_slider_team_management_enabled BOOLEAN DEFAULT true,
  right_slider_workspace_enabled BOOLEAN DEFAULT true,
  business_card_add_colleague_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature flags"
ON public.feature_flags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owner can view all feature flags"
ON public.feature_flags FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update all feature flags"
ON public.feature_flags FOR UPDATE
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can insert feature flags"
ON public.feature_flags FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'owner') OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_feature_flags_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.feature_flags (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =============================================
-- C) إنشاء جدول slug_registry (بدون foreign key للمرونة)
-- =============================================

CREATE TABLE IF NOT EXISTS public.slug_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'closed', 'blocked')),
  owner_user_id UUID,
  reserve_to_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slug_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage slug registry"
ON public.slug_registry FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

CREATE INDEX IF NOT EXISTS idx_slug_registry_slug ON public.slug_registry(slug);
CREATE INDEX IF NOT EXISTS idx_slug_registry_status ON public.slug_registry(status);

-- =============================================
-- D) إنشاء جدول slug_rules
-- =============================================

CREATE TABLE IF NOT EXISTS public.slug_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reject_first_name_slugs BOOLEAN DEFAULT true,
  reject_first_name_slugs_strict BOOLEAN DEFAULT false,
  min_slug_length INTEGER DEFAULT 3,
  max_slug_length INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slug_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slug rules"
ON public.slug_rules FOR SELECT
USING (true);

CREATE POLICY "Owner can update slug rules"
ON public.slug_rules FOR UPDATE
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can insert slug rules"
ON public.slug_rules FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'owner'));

INSERT INTO public.slug_rules (reject_first_name_slugs, reject_first_name_slugs_strict, min_slug_length, max_slug_length)
SELECT true, false, 3, 30
WHERE NOT EXISTS (SELECT 1 FROM public.slug_rules);

-- =============================================
-- E) إنشاء جدول slug_firstname_exceptions
-- =============================================

CREATE TABLE IF NOT EXISTS public.slug_firstname_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name_normalized TEXT NOT NULL,
  allowed_user_id UUID,
  allowed_email TEXT,
  allowed_plan TEXT,
  allowed_city TEXT,
  is_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slug_firstname_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage firstname exceptions"
ON public.slug_firstname_exceptions FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

CREATE INDEX IF NOT EXISTS idx_firstname_exceptions_name ON public.slug_firstname_exceptions(first_name_normalized);

-- =============================================
-- F) تحديث سياسات domain_requests للـ Owner
-- =============================================

DROP POLICY IF EXISTS "Owner can view all requests" ON public.domain_requests;
DROP POLICY IF EXISTS "Owner can update all requests" ON public.domain_requests;

CREATE POLICY "Owner can view all requests"
ON public.domain_requests FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update all requests"
ON public.domain_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'owner'));

-- =============================================
-- G) Triggers
-- =============================================

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_slug_registry_updated_at ON public.slug_registry;
CREATE TRIGGER update_slug_registry_updated_at
  BEFORE UPDATE ON public.slug_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_slug_rules_updated_at ON public.slug_rules;
CREATE TRIGGER update_slug_rules_updated_at
  BEFORE UPDATE ON public.slug_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_firstname_exceptions_updated_at ON public.slug_firstname_exceptions;
CREATE TRIGGER update_firstname_exceptions_updated_at
  BEFORE UPDATE ON public.slug_firstname_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- H) مزامنة الـ slugs الموجودة
-- =============================================

INSERT INTO public.slug_registry (slug, status, owner_user_id, notes)
SELECT DISTINCT 
  slug,
  CASE WHEN published = true THEN 'closed' ELSE 'reserved' END,
  CASE WHEN user_id = '00000000-0000-0000-0000-000000000000' THEN NULL ELSE user_id END,
  'تم الاستيراد من business_cards'
FROM public.business_cards
WHERE slug IS NOT NULL AND slug != ''
ON CONFLICT (slug) DO UPDATE SET
  status = EXCLUDED.status,
  owner_user_id = EXCLUDED.owner_user_id,
  updated_at = now();

INSERT INTO public.feature_flags (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;