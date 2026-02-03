-- حذف السياسات المتضاربة على SELECT
DROP POLICY IF EXISTS "Public can view published business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Published cards are publicly viewable" ON public.business_cards;
DROP POLICY IF EXISTS "Users can view their own business card" ON public.business_cards;

-- إنشاء سياسة SELECT واحدة نظيفة:
-- 1. البطاقات المنشورة قابلة للقراءة من الجميع (بما في ذلك الزوار غير المسجلين)
-- 2. المستخدم المسجل يمكنه رؤية بطاقته الخاصة حتى لو غير منشورة
CREATE POLICY "Anyone can view published cards or owners view their own"
ON public.business_cards
FOR SELECT
USING (
  published = true 
  OR auth.uid() = user_id
);