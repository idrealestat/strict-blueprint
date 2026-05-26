
-- 1) جدول خاص لرقم الهوية (لا يقرأه إلا صاحب البطاقة)
CREATE TABLE IF NOT EXISTS public.business_card_private (
  user_id uuid PRIMARY KEY,
  national_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_card_private TO authenticated;
GRANT ALL ON public.business_card_private TO service_role;

ALTER TABLE public.business_card_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner only access to private card data" ON public.business_card_private;
CREATE POLICY "Owner only access to private card data"
ON public.business_card_private
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_business_card_private_updated_at ON public.business_card_private;
CREATE TRIGGER trg_business_card_private_updated_at
BEFORE UPDATE ON public.business_card_private
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) نقل القيم الموجودة
INSERT INTO public.business_card_private (user_id, national_id)
SELECT user_id, national_id
FROM public.business_cards
WHERE national_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET national_id = EXCLUDED.national_id;

-- 3) إعادة بناء سياسة UPDATE بدون national_id
DROP POLICY IF EXISTS "Users can update their own business card" ON public.business_cards;

-- نسخة جديدة من دالة التحقّق بدون national_id
CREATE OR REPLACE FUNCTION public.check_business_card_ownership_v2(
  card_user_id uuid,
  card_fal_license text,
  card_email text,
  card_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_profile profiles%ROWTYPE;
BEGIN
  IF current_user_id = card_user_id THEN
    RETURN true;
  END IF;

  SELECT * INTO current_profile FROM profiles WHERE user_id = current_user_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF card_fal_license IS NOT NULL AND card_fal_license <> ''
     AND current_profile.fal_license_number = card_fal_license THEN
    RETURN true;
  END IF;

  IF card_email IS NOT NULL AND card_email <> '' THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = current_user_id AND email = card_email) THEN
      RETURN true;
    END IF;
  END IF;

  IF card_phone IS NOT NULL AND card_phone <> ''
     AND current_profile.phone = card_phone THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_business_card_ownership_v2(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_business_card_ownership_v2(uuid, text, text, text) TO authenticated;

CREATE POLICY "Users can update their own business card"
ON public.business_cards
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_business_card_ownership_v2(user_id, fal_license_number, email, phone)
)
WITH CHECK (auth.uid() = user_id);

-- 4) إزالة العمود الحساس من الجدول العام
DROP INDEX IF EXISTS public.idx_business_cards_national_id;
ALTER TABLE public.business_cards DROP COLUMN IF EXISTS national_id;

-- 5) إزالة أي رقم هوية مخزّن داخل JSONB
UPDATE public.business_cards
SET data = data - 'nationalId' - 'national_id' - 'idNumber' - 'national_id_number';

-- 6) إحكام صلاحيات الجدول الأساسي: anon ممنوع تماماً
DROP POLICY IF EXISTS "Anyone can view published cards or owners view their own" ON public.business_cards;

CREATE POLICY "Authenticated can view published or own card"
ON public.business_cards
FOR SELECT
TO authenticated
USING (published = true OR auth.uid() = user_id);

REVOKE ALL ON public.business_cards FROM anon;

-- 7) View عام آمن
DROP VIEW IF EXISTS public.public_business_cards;

CREATE VIEW public.public_business_cards
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  bc.id,
  bc.user_id,
  bc.slug,
  bc.published,
  bc.created_at,
  bc.updated_at,
  bc.fal_license_number,
  bc.privacy_settings,
  CASE WHEN COALESCE((bc.privacy_settings->>'show_email')::boolean, false)
       THEN bc.email ELSE NULL END AS email,
  CASE WHEN COALESCE((bc.privacy_settings->>'show_phone')::boolean, false)
       THEN bc.phone ELSE NULL END AS phone,
  (
    CASE WHEN COALESCE((bc.privacy_settings->>'show_email')::boolean, false)
         THEN bc.data ELSE bc.data - 'email' END
  )
  - (CASE WHEN COALESCE((bc.privacy_settings->>'show_phone')::boolean, false)
          THEN ARRAY[]::text[] ELSE ARRAY['phone','primaryPhone'] END)
  - (CASE WHEN COALESCE((bc.privacy_settings->>'show_whatsapp')::boolean, false)
          THEN ARRAY[]::text[] ELSE ARRAY['whatsapp'] END)
  AS data
FROM public.business_cards bc
WHERE bc.published = true;

REVOKE ALL ON public.public_business_cards FROM PUBLIC;
GRANT SELECT ON public.public_business_cards TO anon, authenticated;
