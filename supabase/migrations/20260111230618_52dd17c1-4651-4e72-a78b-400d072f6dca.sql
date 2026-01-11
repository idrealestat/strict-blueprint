-- Fix notifications table RLS policy - require auth.uid() = user_id for INSERT
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add a comment to document the security fix
COMMENT ON POLICY "Users can insert own notifications" ON public.notifications IS 'Security fix: Users can only insert notifications for themselves';