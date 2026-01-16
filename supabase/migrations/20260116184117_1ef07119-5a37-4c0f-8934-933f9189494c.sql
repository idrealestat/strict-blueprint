-- إصلاح سياسة رفع الصور للعملاء غير المسجلين
-- المشكلة: السياسة الحالية تتحقق من [2] لكن client-offers في الموقع [2] صحيح
-- المسار: {ownerId}/client-offers/{filename}
-- foldername تعيد: [ownerId, client-offers]
-- [1] = ownerId, [2] = client-offers

-- حذف السياسة القديمة وإعادة إنشائها بشكل صحيح
DROP POLICY IF EXISTS "Public can upload client offers" ON storage.objects;

-- سياسة تسمح لأي شخص برفع ملفات في مجلد client-offers
CREATE POLICY "Public can upload client offers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-media'
  AND (storage.foldername(name))[2] = 'client-offers'
);

-- التأكد من وجود سياسة للقراءة العامة
DROP POLICY IF EXISTS "Public can view property media" ON storage.objects;

CREATE POLICY "Public can view property media"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-media');