-- إصلاح سياسة الإشعارات - تقييد INSERT للإشعارات
DROP POLICY IF EXISTS "System can insert notifications" ON public.special_request_notifications;

-- السماح فقط بإنشاء إشعارات للمستخدم نفسه أو من خلال دالة النظام
CREATE POLICY "Users can receive notifications"
  ON public.special_request_notifications
  FOR INSERT
  WITH CHECK (
    -- يمكن للمستخدم إنشاء إشعار لنفسه فقط
    auth.uid() = user_id
    OR 
    -- أو من خلال المالك/الإدارة
    is_owner_user()
  );