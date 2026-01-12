-- تغيير القيمة الافتراضية للدور من 'user' إلى 'member'
ALTER TABLE public.user_roles 
ALTER COLUMN role SET DEFAULT 'member'::app_role;

-- تعليق توثيقي
COMMENT ON COLUMN public.user_roles.role IS 'الدور: owner (مالك النظام), admin (مدير مكتب), member (عضو فريق). لا تستخدم user!';