-- إنشاء جدول العروض العقارية المرتبطة بالمنصة
CREATE TABLE public.platform_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  property_type TEXT NOT NULL DEFAULT 'شقة',
  area NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  street TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  views INTEGER DEFAULT 0,
  age INTEGER,
  direction TEXT,
  features TEXT[] DEFAULT '{}',
  video_url TEXT,
  tour_3d_url TEXT,
  living_rooms TEXT,
  councils TEXT,
  floors TEXT,
  floor_number TEXT,
  corner_type TEXT,
  street_width TEXT,
  furnishing TEXT,
  entrances TEXT,
  balconies TEXT,
  ac_units TEXT,
  warehouses TEXT,
  has_laundry_room BOOLEAN DEFAULT false,
  curtains TEXT,
  has_extra_kitchen BOOLEAN DEFAULT false,
  extra_kitchen_appliances TEXT,
  category TEXT,
  purpose TEXT,
  smart_path TEXT,
  warranties JSONB DEFAULT '[]',
  payment_option TEXT,
  payment_prices JSONB DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  custom_hashtags TEXT[] DEFAULT '{}',
  deed_number TEXT,
  deed_date TEXT,
  ad_license TEXT,
  broker_phone TEXT,
  lat NUMERIC,
  lng NUMERIC,
  status TEXT NOT NULL DEFAULT 'published',
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس على slug للبحث السريع
CREATE INDEX idx_platform_listings_slug ON public.platform_listings(slug);
CREATE INDEX idx_platform_listings_status ON public.platform_listings(status);
CREATE INDEX idx_platform_listings_city ON public.platform_listings(city);

-- تفعيل RLS
ALTER TABLE public.platform_listings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة العامة للعروض المنشورة
CREATE POLICY "Anyone can view published listings"
ON public.platform_listings
FOR SELECT
USING (status = 'published' AND is_hidden = false);

-- سياسة الإدراج (للمستخدم المصادق فقط)
CREATE POLICY "Authenticated users can insert listings"
ON public.platform_listings
FOR INSERT
WITH CHECK (true);

-- سياسة التحديث
CREATE POLICY "Anyone can update their listings"
ON public.platform_listings
FOR UPDATE
USING (true);

-- سياسة الحذف
CREATE POLICY "Anyone can delete their listings"
ON public.platform_listings
FOR DELETE
USING (true);

-- تريجر لتحديث updated_at
CREATE TRIGGER update_platform_listings_updated_at
BEFORE UPDATE ON public.platform_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- تفعيل Realtime للتحديثات المباشرة
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_listings;