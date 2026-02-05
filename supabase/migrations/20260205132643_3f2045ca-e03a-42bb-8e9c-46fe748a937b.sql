-- إضافة حقول إضافية لدعم البحث المتقدم في platform_listings
ALTER TABLE public.platform_listings 
ADD COLUMN IF NOT EXISTS national_address TEXT,
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS plus_code TEXT;

-- إضافة index للبحث الأسرع
CREATE INDEX IF NOT EXISTS idx_platform_listings_city ON public.platform_listings(city);
CREATE INDEX IF NOT EXISTS idx_platform_listings_district ON public.platform_listings(district);
CREATE INDEX IF NOT EXISTS idx_platform_listings_property_type ON public.platform_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_platform_listings_national_address ON public.platform_listings(national_address);
CREATE INDEX IF NOT EXISTS idx_platform_listings_plus_code ON public.platform_listings(plus_code);

-- تمكين البحث النصي الكامل
CREATE INDEX IF NOT EXISTS idx_platform_listings_search ON public.platform_listings 
USING GIN (to_tsvector('arabic', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(district, '') || ' ' || coalesce(national_address, '')));