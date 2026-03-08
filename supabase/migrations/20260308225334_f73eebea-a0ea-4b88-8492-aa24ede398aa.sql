
-- جدول حدود الباقات (الفرص الذكية + أقسام منصتي)
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT NOT NULL, -- 'individual', 'office', 'company'
  plan_tier INTEGER NOT NULL DEFAULT 1, -- 1, 2, 3 (باقات مختلفة)
  plan_name TEXT NOT NULL DEFAULT 'أساسي',
  
  -- حدود الفرص الذكية اليومية
  daily_opportunities INTEGER NOT NULL DEFAULT 5,
  daily_opportunities_trained INTEGER NOT NULL DEFAULT 10, -- بعد إكمال التدريب
  
  -- حدود أقسام منصتي
  max_cities INTEGER NOT NULL DEFAULT 3,
  max_districts INTEGER NOT NULL DEFAULT 10,
  max_cities_trained INTEGER NOT NULL DEFAULT 6, -- بعد التدريب (مضاعفة)
  max_districts_trained INTEGER NOT NULL DEFAULT 20,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(account_type, plan_tier)
);

-- تفعيل RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع (authenticated)
CREATE POLICY "Anyone can read plan limits"
  ON public.plan_limits FOR SELECT
  TO authenticated
  USING (true);

-- فقط المالك يمكنه التعديل
CREATE POLICY "Only owner can modify plan limits"
  ON public.plan_limits FOR ALL
  TO authenticated
  USING (public.is_owner_user())
  WITH CHECK (public.is_owner_user());

-- إدخال البيانات الافتراضية
INSERT INTO public.plan_limits (account_type, plan_tier, plan_name, daily_opportunities, daily_opportunities_trained, max_cities, max_districts, max_cities_trained, max_districts_trained) VALUES
  ('individual', 1, 'أساسي', 5, 10, 3, 10, 6, 20),
  ('individual', 2, 'متقدم', 8, 16, 4, 12, 8, 24),
  ('individual', 3, 'احترافي', 12, 24, 5, 15, 10, 30),
  ('office', 1, 'أساسي', 15, 30, 5, 15, 10, 30),
  ('office', 2, 'متقدم', 20, 40, 7, 20, 14, 40),
  ('office', 3, 'احترافي', 30, 60, 10, 30, 20, 60),
  ('company', 1, 'أساسي', 30, 60, 8, 25, 16, 50),
  ('company', 2, 'متقدم', 40, 80, 12, 35, 24, 70),
  ('company', 3, 'احترافي', 50, 100, 15, 50, 30, 100);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_plan_limits_updated_at
  BEFORE UPDATE ON public.plan_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
