-- إلغاء صلاحيات Admin من domain_requests
DROP POLICY IF EXISTS "Admins can view all requests" ON public.domain_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.domain_requests;

-- إلغاء صلاحيات Admin من الجداول الأخرى المرتبطة
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.domain_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.domain_notifications;

-- إضافة صلاحيات Owner للإشعارات إذا لم تكن موجودة
DO $$ 
BEGIN
  -- Owner can view all domain notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'domain_notifications' AND policyname = 'Owner can view all notifications'
  ) THEN
    CREATE POLICY "Owner can view all notifications" 
    ON public.domain_notifications 
    FOR SELECT 
    USING (has_role(auth.uid(), 'owner'));
  END IF;

  -- Owner can update all domain notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'domain_notifications' AND policyname = 'Owner can update all notifications'
  ) THEN
    CREATE POLICY "Owner can update all notifications" 
    ON public.domain_notifications 
    FOR UPDATE 
    USING (has_role(auth.uid(), 'owner'));
  END IF;

  -- Owner can insert domain notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'domain_notifications' AND policyname = 'Owner can insert notifications'
  ) THEN
    CREATE POLICY "Owner can insert notifications" 
    ON public.domain_notifications 
    FOR INSERT 
    WITH CHECK (has_role(auth.uid(), 'owner'));
  END IF;
END $$;