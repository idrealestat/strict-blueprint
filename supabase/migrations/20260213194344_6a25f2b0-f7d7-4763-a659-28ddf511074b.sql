-- إضافة سياسة تتيح للمالك (owner) عرض جميع الملفات الشخصية
CREATE POLICY "Owners can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.real_estate_roles
    WHERE real_estate_roles.user_id = auth.uid()
    AND real_estate_roles.role = 'owner'
    AND real_estate_roles.is_active = true
  )
);