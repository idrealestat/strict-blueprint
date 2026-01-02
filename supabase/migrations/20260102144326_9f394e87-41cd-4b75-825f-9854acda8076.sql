-- السماح بـ NULL على slug في business_cards
ALTER TABLE public.business_cards ALTER COLUMN slug DROP NOT NULL;

-- إضافة comment للتوضيح
COMMENT ON COLUMN public.business_cards.slug IS 'يُختار من قبل المستخدم في /app/businesscard/edit - يمكن أن يكون NULL حتى يختار المستخدم';