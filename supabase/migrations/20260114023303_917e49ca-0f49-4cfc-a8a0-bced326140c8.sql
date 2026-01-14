-- إصلاح الـ View بإزالة SECURITY DEFINER وإضافة SECURITY INVOKER
DROP VIEW IF EXISTS public.active_platform_listings;

CREATE VIEW public.active_platform_listings 
WITH (security_invoker = true) AS
SELECT *
FROM public.platform_listings
WHERE 
  deleted_at IS NULL
  AND is_hidden = false
  AND status = 'active'
  AND (
    ad_license_expires_at IS NULL 
    OR ad_license_expires_at >= CURRENT_DATE
  );