
-- 1) فحص تكرار رقم الهوية (بدون كشف هوية المالك)
CREATE OR REPLACE FUNCTION public.is_national_id_taken(p_national_id text, p_exclude_user uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_card_private
    WHERE national_id = p_national_id
      AND (p_exclude_user IS NULL OR user_id <> p_exclude_user)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_national_id_taken(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_national_id_taken(text, uuid) TO authenticated;

-- 2) بحث استرداد النطاق برقم الهوية (يُعيد فقط معرّف البطاقة)
CREATE OR REPLACE FUNCTION public.find_card_for_recovery(p_national_id text, p_email text)
RETURNS TABLE (card_id uuid, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bc.id, bc.slug
  FROM public.business_card_private pr
  JOIN public.business_cards bc ON bc.user_id = pr.user_id
  WHERE pr.national_id = p_national_id
    AND bc.email = p_email
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_card_for_recovery(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_card_for_recovery(text, text) TO anon, authenticated;

-- 3) حفظ/تحديث رقم هوية صاحب البطاقة
CREATE OR REPLACE FUNCTION public.upsert_my_national_id(p_national_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.business_card_private (user_id, national_id)
  VALUES (auth.uid(), p_national_id)
  ON CONFLICT (user_id) DO UPDATE
    SET national_id = EXCLUDED.national_id,
        updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_my_national_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_my_national_id(text) TO authenticated;
