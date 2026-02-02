-- إضافة عمود التحكم في الفقاعة العائمة للمساعد الذكي
-- يتحكم المالك في ظهور هذه الخاصية لجميع المستخدمين

-- Layer 1: Global Feature Defaults
ALTER TABLE public.global_feature_defaults 
ADD COLUMN IF NOT EXISTS floating_bubble_enabled boolean DEFAULT true;

-- Layer 2: Feature Flags (User specific overrides)
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS floating_bubble_enabled boolean DEFAULT NULL;

-- Layer 3: Business Feature Rules (For office/company accounts)
ALTER TABLE public.business_feature_rules 
ADD COLUMN IF NOT EXISTS floating_bubble_enabled boolean DEFAULT NULL;

-- تحديث القيمة الافتراضية للإعدادات العامة
UPDATE public.global_feature_defaults 
SET floating_bubble_enabled = true 
WHERE floating_bubble_enabled IS NULL;