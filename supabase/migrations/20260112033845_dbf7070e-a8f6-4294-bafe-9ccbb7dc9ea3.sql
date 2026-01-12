-- جدول لتتبع الفرص المرفوضة
CREATE TABLE public.smart_opportunity_rejections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opportunity_key TEXT NOT NULL, -- مفتاح فريد للفرصة (my_listing_id-other_listing_id)
  rejection_count INTEGER NOT NULL DEFAULT 1,
  last_rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, opportunity_key)
);

-- Enable RLS
ALTER TABLE public.smart_opportunity_rejections ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "Users can view their own rejections"
ON public.smart_opportunity_rejections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rejections"
ON public.smart_opportunity_rejections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rejections"
ON public.smart_opportunity_rejections
FOR UPDATE
USING (auth.uid() = user_id);

-- إضافة فهرس للبحث السريع
CREATE INDEX idx_rejections_user_key ON public.smart_opportunity_rejections(user_id, opportunity_key);
CREATE INDEX idx_rejections_count ON public.smart_opportunity_rejections(user_id, rejection_count);