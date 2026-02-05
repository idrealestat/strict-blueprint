
-- جدول سجل العقارات المركزي - يحفظ تلقائياً كل عقار منشور
CREATE TABLE public.property_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  user_id UUID,
  
  -- معلومات النشر
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- معلومات الترخيص الإعلاني
  ad_license TEXT,
  ad_license_date TEXT,
  ad_license_expires_at TEXT,
  
  -- معلومات المالك
  owner_name TEXT,
  owner_phone TEXT,
  owner_id_number TEXT,
  owner_city TEXT,
  owner_district TEXT,
  owner_national_address TEXT,
  owner_birth_date TEXT,
  
  -- معلومات الصك
  deed_number TEXT,
  deed_date TEXT,
  deed_city TEXT,
  
  -- معلومات الوسيط
  broker_phone TEXT,
  broker_fal_license TEXT,
  broker_name TEXT,
  
  -- معلومات العقار
  property_type TEXT,
  property_title TEXT,
  city TEXT,
  district TEXT,
  street TEXT,
  
  -- الموقع
  google_maps_link TEXT,
  national_address TEXT,
  plus_code TEXT,
  lat NUMERIC,
  lng NUMERIC,
  
  -- تفاصيل إضافية
  price NUMERIC,
  area NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  purpose TEXT,
  category TEXT,
  slug TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_property_registry_deed ON public.property_registry(deed_number);
CREATE INDEX idx_property_registry_owner_phone ON public.property_registry(owner_phone);
CREATE INDEX idx_property_registry_city_district ON public.property_registry(city, district);
CREATE INDEX idx_property_registry_published_at ON public.property_registry(published_at DESC);
CREATE INDEX idx_property_registry_listing_id ON public.property_registry(listing_id);

-- تفعيل RLS
ALTER TABLE public.property_registry ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للمالكين فقط (owners)
CREATE POLICY "Owners can view property registry" 
ON public.property_registry 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.real_estate_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner' 
    AND is_active = true
  )
);

-- دالة لتسجيل العقار تلقائياً عند النشر
CREATE OR REPLACE FUNCTION public.register_published_property()
RETURNS TRIGGER AS $$
DECLARE
  broker_profile RECORD;
BEGIN
  -- جلب معلومات الوسيط من الملف الشخصي
  SELECT full_name, phone, fal_license_number 
  INTO broker_profile 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;

  -- تسجيل العقار في السجل المركزي
  INSERT INTO public.property_registry (
    listing_id,
    user_id,
    published_at,
    ad_license,
    ad_license_date,
    ad_license_expires_at,
    owner_name,
    owner_phone,
    owner_id_number,
    owner_city,
    owner_district,
    owner_national_address,
    owner_birth_date,
    deed_number,
    deed_date,
    deed_city,
    broker_phone,
    broker_fal_license,
    broker_name,
    property_type,
    property_title,
    city,
    district,
    street,
    google_maps_link,
    national_address,
    plus_code,
    lat,
    lng,
    price,
    area,
    bedrooms,
    bathrooms,
    purpose,
    category,
    slug
  ) VALUES (
    NEW.id,
    NEW.user_id,
    NEW.created_at,
    NEW.ad_license,
    NEW.ad_license_date,
    NEW.ad_license_expires_at,
    NEW.owner_name,
    NEW.owner_phone,
    NEW.owner_id_number,
    NEW.owner_city,
    NEW.owner_district,
    NEW.owner_national_address,
    NEW.owner_birth_date,
    NEW.deed_number,
    NEW.deed_date,
    NEW.deed_city,
    COALESCE(NEW.broker_phone, broker_profile.phone),
    broker_profile.fal_license_number,
    broker_profile.full_name,
    NEW.property_type,
    NEW.title,
    NEW.city,
    NEW.district,
    NEW.street,
    NEW.google_maps_link,
    NEW.national_address,
    NEW.plus_code,
    NEW.lat,
    NEW.lng,
    NEW.price,
    NEW.area,
    NEW.bedrooms,
    NEW.bathrooms,
    NEW.purpose,
    NEW.category,
    NEW.slug
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تفعيل الـ trigger عند إضافة عقار جديد
CREATE TRIGGER on_listing_published
  AFTER INSERT ON public.platform_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.register_published_property();

-- دالة تحديث updated_at
CREATE TRIGGER update_property_registry_updated_at
  BEFORE UPDATE ON public.property_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
