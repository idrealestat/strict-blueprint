-- إضافة أعمدة المعرفات لربط النطاق بها
ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS fal_license_number text,
ADD COLUMN IF NOT EXISTS national_id text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- إنشاء فهرس للبحث السريع عن المستخدم بواسطة المعرفات
CREATE INDEX IF NOT EXISTS idx_business_cards_fal_license ON public.business_cards(fal_license_number) WHERE fal_license_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_cards_national_id ON public.business_cards(national_id) WHERE national_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_cards_email ON public.business_cards(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_cards_phone ON public.business_cards(phone) WHERE phone IS NOT NULL;

-- تحديث RLS policies للسماح للمستخدمين باسترداد بطاقتهم عبر المعرفات
CREATE OR REPLACE FUNCTION public.check_business_card_ownership(
  card_user_id uuid,
  card_fal_license text,
  card_national_id text,
  card_email text,
  card_phone text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_profile profiles%ROWTYPE;
BEGIN
  -- المالك الأصلي
  IF current_user_id = card_user_id THEN
    RETURN true;
  END IF;
  
  -- جلب بيانات المستخدم الحالي
  SELECT * INTO current_profile 
  FROM profiles 
  WHERE user_id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- التحقق من رخصة فال (الأولوية الأولى)
  IF card_fal_license IS NOT NULL AND card_fal_license != '' 
     AND current_profile.fal_license_number = card_fal_license THEN
    RETURN true;
  END IF;
  
  -- التحقق من بطاقة الأحوال (الأولوية الثانية)
  IF card_national_id IS NOT NULL AND card_national_id != '' 
     AND current_profile.national_id = card_national_id THEN
    RETURN true;
  END IF;
  
  -- التحقق من الإيميل
  IF card_email IS NOT NULL AND card_email != '' THEN
    -- التحقق من الإيميل عبر auth.users
    IF EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = current_user_id AND email = card_email
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- التحقق من رقم الجوال
  IF card_phone IS NOT NULL AND card_phone != '' 
     AND current_profile.phone = card_phone THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- سياسة للسماح بالتحديث للمالك أو من يملك نفس المعرفات
DROP POLICY IF EXISTS "Users can update their own business card" ON public.business_cards;
CREATE POLICY "Users can update their own business card" 
ON public.business_cards 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR check_business_card_ownership(user_id, fal_license_number, national_id, email, phone)
);

-- سياسة للسماح بالمشاهدة للمالك
DROP POLICY IF EXISTS "Users can view their own business card" ON public.business_cards;
CREATE POLICY "Users can view their own business card" 
ON public.business_cards 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR check_business_card_ownership(user_id, fal_license_number, national_id, email, phone)
  OR published = true
);