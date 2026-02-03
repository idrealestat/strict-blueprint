-- إصلاح خطأ infinite recursion في سياسات organization_members
-- حذف السياسة المسببة للمشكلة
DROP POLICY IF EXISTS "Managers can view organization members" ON public.organization_members;

-- إعادة إنشاء السياسة بطريقة لا تسبب recursion
-- باستخدام SECURITY DEFINER function بدلاً من الاستعلام المباشر
CREATE OR REPLACE FUNCTION public.is_org_manager_or_admin(org_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_user_id = org_user_id
    AND member_user_id = auth.uid()
    AND member_role IN ('admin', 'manager')
    AND status = 'active'
  )
$$;

-- إنشاء سياسة جديدة تستخدم الدالة
CREATE POLICY "Managers can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  auth.uid() = organization_user_id 
  OR auth.uid() = member_user_id
  OR public.is_org_manager_or_admin(organization_user_id)
);