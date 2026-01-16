-- إضافة سياسة تسمح للزوار غير المسجلين برفع الملفات في مجلد public-submissions
CREATE POLICY "Public can upload to public-submissions folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'property-media' 
  AND (storage.foldername(name))[1] = 'public-submissions'
);

-- إضافة سياسة تسمح للزوار برفع الملفات في مجلد client-offers للوسيط
-- هذا ضروري لأن نموذج إرسال العرض يرفع الملفات باسم الوسيط
CREATE POLICY "Public can upload client offers"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'property-media' 
  AND (storage.foldername(name))[2] = 'client-offers'
);