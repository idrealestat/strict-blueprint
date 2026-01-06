-- Trigger لمنع تغيير slug بعد النشر
CREATE OR REPLACE FUNCTION public.prevent_slug_change_after_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا كانت البطاقة منشورة سابقاً ويحاول تغيير الـ slug
  IF OLD.published = true AND OLD.slug IS NOT NULL AND OLD.slug != '' THEN
    IF NEW.slug IS DISTINCT FROM OLD.slug THEN
      RAISE EXCEPTION 'لا يمكن تغيير الرابط بعد النشر. الرابط مقفل.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS enforce_slug_lock_after_publish ON public.business_cards;

-- إنشاء الـ trigger
CREATE TRIGGER enforce_slug_lock_after_publish
  BEFORE UPDATE ON public.business_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_slug_change_after_publish();