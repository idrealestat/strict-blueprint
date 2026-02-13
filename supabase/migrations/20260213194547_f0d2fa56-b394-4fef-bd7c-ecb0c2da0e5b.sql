-- تحديث دالة is_owner_user لتشمل user_id المالك مباشرة
CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    auth.uid() = 'd7310404-2bab-4022-ab3d-811884aa062f'::uuid
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND account_type IN ('owner', 'admin')
    )
  );
END;
$$;