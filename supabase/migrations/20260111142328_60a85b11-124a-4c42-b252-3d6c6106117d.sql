-- جدول سجل تغييرات الإعدادات
CREATE TABLE public.settings_change_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  changed_by_user_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'global_default' | 'user_override' | 'business_rule'
  feature_key TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  target_user_id UUID, -- للتغييرات على مستخدم معين
  target_account_type TEXT, -- للتغييرات على نوع حساب
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings_change_log ENABLE ROW LEVEL SECURITY;

-- السماح للمالك فقط بقراءة وإضافة السجلات
CREATE POLICY "Owners can view settings log" 
ON public.settings_change_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'owner'
  )
);

CREATE POLICY "Owners can insert settings log" 
ON public.settings_change_log 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'owner'
  )
);

-- فهرس للبحث السريع
CREATE INDEX idx_settings_log_created_at ON public.settings_change_log(created_at DESC);
CREATE INDEX idx_settings_log_feature_key ON public.settings_change_log(feature_key);
CREATE INDEX idx_settings_log_change_type ON public.settings_change_log(change_type);