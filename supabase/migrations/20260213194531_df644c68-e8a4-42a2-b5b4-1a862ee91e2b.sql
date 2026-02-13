-- حذف السياسة القديمة التي تعتمد على real_estate_roles
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;

-- إنشاء سياسة جديدة تستخدم دالة is_owner_user الموجودة
CREATE POLICY "Owners can view all profiles"
ON public.profiles
FOR SELECT
USING (is_owner_user());