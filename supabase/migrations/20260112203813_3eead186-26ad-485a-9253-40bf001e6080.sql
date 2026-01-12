-- إضافة قيمة member إلى enum (يجب commit قبل الاستخدام)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- إضافة تعليق للتوثيق
COMMENT ON TYPE public.app_role IS 'الأدوار المستخدمة: owner (مالك النظام), admin (مدير مكتب), member (عضو فريق). ⚠️ لا تستخدم user بعد الآن';