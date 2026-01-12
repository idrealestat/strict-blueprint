-- ============================================
-- تحديث سياسات RLS للسماح لـ Owner بإدارة الجداول
-- ============================================

-- 1. domain_blacklist - تحديث السياسة لتشمل Owner
DROP POLICY IF EXISTS "Only admins can modify blacklist" ON public.domain_blacklist;
CREATE POLICY "Owner can manage blacklist"
ON public.domain_blacklist
FOR ALL
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 2. forbidden_patterns - تحديث السياسة لتشمل Owner
DROP POLICY IF EXISTS "Only admins can modify patterns" ON public.forbidden_patterns;
CREATE POLICY "Owner can manage patterns"
ON public.forbidden_patterns
FOR ALL
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 3. domain_settings - تحديث السياسة لتشمل Owner
DROP POLICY IF EXISTS "Only admins can modify domain settings" ON public.domain_settings;
CREATE POLICY "Owner can manage domain settings"
ON public.domain_settings
FOR ALL
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 4. domain_requests - إضافة صلاحية Owner للإدارة الكاملة
DROP POLICY IF EXISTS "Owner can manage domain requests" ON public.domain_requests;
CREATE POLICY "Owner can manage domain requests"
ON public.domain_requests
FOR ALL
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 5. domain_notifications - إضافة صلاحية Owner للقراءة
DROP POLICY IF EXISTS "Owner can view all domain notifications" ON public.domain_notifications;
CREATE POLICY "Owner can view all domain notifications"
ON public.domain_notifications
FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- 6. settings_change_log - إضافة صلاحية DELETE للـ Owner
DROP POLICY IF EXISTS "Owners can delete settings log" ON public.settings_change_log;
CREATE POLICY "Owners can delete settings log"
ON public.settings_change_log
FOR DELETE
USING (public.has_role(auth.uid(), 'owner'));