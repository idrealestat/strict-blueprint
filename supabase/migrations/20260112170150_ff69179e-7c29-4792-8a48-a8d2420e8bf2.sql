-- إنشاء enum لحالة الاشتراك
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired');

-- إنشاء enum لكود الباقة
CREATE TYPE public.plan_code AS ENUM ('INDIVIDUAL', 'OFFICE');

-- إنشاء جدول user_entitlements
CREATE TABLE public.user_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_code public.plan_code,
    status public.subscription_status NOT NULL DEFAULT 'trial',
    trial_starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للمستخدم
CREATE POLICY "Users can read their own entitlements"
ON public.user_entitlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- سياسة التحديث للمستخدم (فقط plan_code و onboarding_completed)
CREATE POLICY "Users can update their own plan"
ON public.user_entitlements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- سياسة للأدمن/المالك للقراءة الكاملة
CREATE POLICY "Admins can read all entitlements"
ON public.user_entitlements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- سياسة للأدمن/المالك للتحديث الكامل
CREATE POLICY "Admins can update all entitlements"
ON public.user_entitlements
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- إنشاء سجل تلقائي عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.create_user_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_entitlements (user_id, status, trial_starts_at, trial_ends_at)
    VALUES (NEW.id, 'trial', now(), now() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- ربط الـ trigger بجدول auth.users
CREATE TRIGGER on_auth_user_created_entitlements
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_entitlements();

-- دالة للتحقق من حالة الاشتراك وتحديثها
CREATE OR REPLACE FUNCTION public.get_user_entitlement_status(p_user_id UUID)
RETURNS TABLE (
    plan_code public.plan_code,
    status public.subscription_status,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed BOOLEAN,
    days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entitlement user_entitlements%ROWTYPE;
    v_new_status subscription_status;
BEGIN
    SELECT * INTO v_entitlement FROM user_entitlements WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- إنشاء سجل جديد إذا لم يكن موجوداً
        INSERT INTO user_entitlements (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        SELECT * INTO v_entitlement FROM user_entitlements WHERE user_id = p_user_id;
    END IF;
    
    -- تحديد الحالة الجديدة
    IF now() <= v_entitlement.trial_ends_at THEN
        v_new_status := 'trial';
    ELSIF v_entitlement.plan_code IS NOT NULL THEN
        v_new_status := 'active';
    ELSE
        v_new_status := 'expired';
    END IF;
    
    -- تحديث الحالة إذا تغيرت
    IF v_new_status != v_entitlement.status THEN
        UPDATE user_entitlements 
        SET status = v_new_status, updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN QUERY SELECT 
        v_entitlement.plan_code,
        v_new_status,
        v_entitlement.trial_ends_at,
        v_entitlement.onboarding_completed,
        GREATEST(0, EXTRACT(DAY FROM (v_entitlement.trial_ends_at - now()))::INTEGER);
END;
$$;

-- دالة للتحقق من صلاحية ميزة معينة
CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entitlement user_entitlements%ROWTYPE;
    v_is_trial BOOLEAN;
    v_is_expired BOOLEAN;
BEGIN
    SELECT * INTO v_entitlement FROM user_entitlements WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    v_is_trial := now() <= v_entitlement.trial_ends_at;
    v_is_expired := NOT v_is_trial AND v_entitlement.plan_code IS NULL;
    
    -- إذا منتهي بدون خطة - قراءة فقط
    IF v_is_expired THEN
        RETURN p_feature IN ('business_card_read', 'crm_read', 'analytics_basic');
    END IF;
    
    -- ميزات أساسية للجميع
    IF p_feature IN ('business_card', 'crm', 'requests_forms', 'offers_requests', 'publish_listings', 'analytics_basic', 'ai_assistant_basic') THEN
        RETURN true;
    END IF;
    
    -- ميزات متقدمة حسب الباقة والحالة
    IF p_feature = 'ai_assistant_advanced' THEN
        -- متاح في Trial للجميع، أو OFFICE في Active
        RETURN v_is_trial OR v_entitlement.plan_code = 'OFFICE';
    END IF;
    
    IF p_feature IN ('team_management', 'central_publishing') THEN
        -- متاح فقط لـ OFFICE
        RETURN v_entitlement.plan_code = 'OFFICE';
    END IF;
    
    RETURN false;
END;
$$;

-- إنشاء جدول إعدادات النظام للأدمن
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "Anyone can read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- سياسة التحديث للأدمن فقط
CREATE POLICY "Only admins can update system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- إدخال الإعدادات الافتراضية
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
('trial_duration_hours', '720'),
('features_config', '{
    "INDIVIDUAL": {
        "trial": ["business_card", "crm", "requests_forms", "offers_requests", "publish_listings", "analytics_basic", "ai_assistant_basic", "ai_assistant_advanced"],
        "active": ["business_card", "crm", "requests_forms", "offers_requests", "publish_listings", "analytics_basic", "ai_assistant_basic"]
    },
    "OFFICE": {
        "trial": ["business_card", "crm", "requests_forms", "offers_requests", "publish_listings", "analytics_basic", "ai_assistant_basic", "ai_assistant_advanced", "team_management", "central_publishing"],
        "active": ["business_card", "crm", "requests_forms", "offers_requests", "publish_listings", "analytics_basic", "ai_assistant_basic", "ai_assistant_advanced", "team_management", "central_publishing"]
    }
}')
ON CONFLICT (setting_key) DO NOTHING;

-- إضافة trigger لتحديث updated_at
CREATE TRIGGER update_user_entitlements_updated_at
BEFORE UPDATE ON public.user_entitlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء سجلات للمستخدمين الحاليين
INSERT INTO public.user_entitlements (user_id, status, trial_starts_at, trial_ends_at, onboarding_completed)
SELECT 
    id,
    'trial',
    created_at,
    created_at + INTERVAL '30 days',
    true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_entitlements)
ON CONFLICT (user_id) DO NOTHING;