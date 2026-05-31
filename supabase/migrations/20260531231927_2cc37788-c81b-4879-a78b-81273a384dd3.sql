
-- ===== Phase 1: Customer Assignments =====
CREATE TABLE IF NOT EXISTS public.customer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  assigned_to_user_id uuid NOT NULL,
  assigned_by_user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_assignments_unique UNIQUE (organization_user_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_assignments_org
  ON public.customer_assignments (organization_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_member
  ON public.customer_assignments (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer
  ON public.customer_assignments (customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_assignments TO authenticated;
GRANT ALL ON public.customer_assignments TO service_role;

ALTER TABLE public.customer_assignments ENABLE ROW LEVEL SECURITY;

-- المسؤول/المالك في المنظمة يدير كل التعيينات
CREATE POLICY "Org admins manage assignments"
ON public.customer_assignments
FOR ALL
TO authenticated
USING (
  auth.uid() = organization_user_id
  OR public.is_organization_admin(organization_user_id, auth.uid())
)
WITH CHECK (
  auth.uid() = organization_user_id
  OR public.is_organization_admin(organization_user_id, auth.uid())
);

-- العضو يرى التعيينات الخاصة به فقط
CREATE POLICY "Members can view own assignments"
ON public.customer_assignments
FOR SELECT
TO authenticated
USING (assigned_to_user_id = auth.uid());

-- trigger للتحديث التلقائي
CREATE TRIGGER customer_assignments_updated_at
BEFORE UPDATE ON public.customer_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- دالة مساعدة: إرجاع IDs العملاء المعينين لعضو
CREATE OR REPLACE FUNCTION public.get_assigned_customer_ids(_member_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id
  FROM public.customer_assignments
  WHERE assigned_to_user_id = _member_user_id
    AND is_active = true;
$$;
