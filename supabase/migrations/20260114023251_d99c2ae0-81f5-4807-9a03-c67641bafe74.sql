-- إضافة أعمدة الترخيص الإعلاني (تاريخ ومدة)
ALTER TABLE public.platform_listings
ADD COLUMN IF NOT EXISTS ad_license_date date,
ADD COLUMN IF NOT EXISTS ad_license_duration integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS ad_license_expires_at date;

-- إنشاء دالة لحساب تاريخ انتهاء الترخيص تلقائياً
CREATE OR REPLACE FUNCTION public.calculate_ad_license_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ad_license_date IS NOT NULL AND NEW.ad_license_duration IS NOT NULL THEN
    NEW.ad_license_expires_at := NEW.ad_license_date + (NEW.ad_license_duration || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- إنشاء trigger لحساب تاريخ الانتهاء تلقائياً
DROP TRIGGER IF EXISTS trigger_calculate_ad_license_expiry ON public.platform_listings;
CREATE TRIGGER trigger_calculate_ad_license_expiry
  BEFORE INSERT OR UPDATE OF ad_license_date, ad_license_duration
  ON public.platform_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ad_license_expiry();

-- إنشاء index لتسريع البحث عن الإعلانات المنتهية
CREATE INDEX IF NOT EXISTS idx_platform_listings_license_expiry ON public.platform_listings(ad_license_expires_at);

-- إنشاء view للعروض النشطة فقط (الترخيص ساري)
CREATE OR REPLACE VIEW public.active_platform_listings AS
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