
-- =====================================================
-- A) تقوية صلاحيات تنفيذ الدوال SECURITY DEFINER
-- =====================================================

-- 1. منع anon من تنفيذ الدوال الحساسة
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_business_card_ownership(uuid, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_use_feature(uuid, text) FROM anon;

-- 2. التأكد من أن authenticated فقط يمكنه التنفيذ
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_business_card_ownership(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_feature(uuid, text) TO authenticated;

-- 3. دوال الـ trigger تبقى للنظام فقط (لا تحتاج تغيير لأنها triggers)

-- =====================================================
-- B) إصلاح سياسات التخزين property-media
-- =====================================================

-- حذف السياسات القديمة المتضاربة
DROP POLICY IF EXISTS "Anyone can upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete property media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property media" ON storage.objects;

-- سياسة الرفع: المستخدم المُصادق عليه فقط، والمسار يبدأ بـ user_id
CREATE POLICY "Authenticated users upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- سياسة العرض: الجميع يمكنهم رؤية الملفات (لأن الـ bucket عام للعروض العقارية)
CREATE POLICY "Public can view property media"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-media');

-- سياسة التحديث: المالك فقط
CREATE POLICY "Owners can update their media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- سياسة الحذف: المالك فقط
CREATE POLICY "Owners can delete their media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- C) تعليق توضيحي للأمان
-- =====================================================
COMMENT ON FUNCTION public.has_role IS 'SECURITY DEFINER - checks user role without RLS recursion. Restricted to authenticated only.';
COMMENT ON FUNCTION public.get_user_role IS 'SECURITY DEFINER - returns user primary role. Restricted to authenticated only.';
COMMENT ON FUNCTION public.check_business_card_ownership IS 'SECURITY DEFINER - verifies business card ownership via auth.uid(). Restricted to authenticated only.';
COMMENT ON FUNCTION public.can_use_feature IS 'SECURITY DEFINER - checks feature entitlement. Restricted to authenticated only.';
