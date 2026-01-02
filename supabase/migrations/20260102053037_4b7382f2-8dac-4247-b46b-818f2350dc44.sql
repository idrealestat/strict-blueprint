-- إضافة حقول السعر والأولوية لجدول domain_requests
ALTER TABLE public.domain_requests
ADD COLUMN IF NOT EXISTS price_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS priority_revoked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_owner_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.domain_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_id UUID REFERENCES public.domain_requests(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'new_request', 'approved', 'rejected', 'revoked', 'price_set'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.domain_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للإشعارات
CREATE POLICY "Users can view their own notifications"
ON public.domain_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.domain_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.domain_notifications
FOR INSERT
WITH CHECK (true);

-- جدول إعدادات النطاقات للأدمن
CREATE TABLE IF NOT EXISTS public.domain_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_enabled BOOLEAN DEFAULT false,
  default_price NUMERIC DEFAULT 0,
  priority_warning_enabled BOOLEAN DEFAULT true,
  priority_warning_message TEXT DEFAULT 'تنبيه: أولوية اختيار النطاق دائماً ستكون لمن يملك النطاق الأصلي حتى لو تم اختيارك له قبله أو تم دفع رسوم عليه',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة إعدادات افتراضية
INSERT INTO public.domain_settings (pricing_enabled, default_price, priority_warning_enabled)
VALUES (false, 0, true)
ON CONFLICT DO NOTHING;

-- تفعيل RLS لإعدادات النطاقات
ALTER TABLE public.domain_settings ENABLE ROW LEVEL SECURITY;

-- سياسة قراءة الإعدادات للجميع
CREATE POLICY "Anyone can view domain settings"
ON public.domain_settings
FOR SELECT
USING (true);

-- سياسة تعديل الإعدادات للأدمن فقط
CREATE POLICY "Only admins can modify domain settings"
ON public.domain_settings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.account_type = 'admin'
));