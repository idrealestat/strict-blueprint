-- إضافة سياسة تسمح بإدراج المشاهدات من الزوار العموميين
-- الزوار العموميين يسجلون المشاهدة باستخدام user_id صاحب العرض

-- حذف السياسة القديمة للإدراج
DROP POLICY IF EXISTS "Users can insert their own offer views" ON public.offer_views_log;

-- إنشاء سياسة جديدة تسمح بالإدراج للجميع (للمشاهدات العامة)
CREATE POLICY "Anyone can insert offer views" 
ON public.offer_views_log 
FOR INSERT 
WITH CHECK (true);

-- إضافة تعليق توضيحي
COMMENT ON POLICY "Anyone can insert offer views" ON public.offer_views_log IS 'يسمح للزوار العموميين بتسجيل مشاهداتهم للعروض';