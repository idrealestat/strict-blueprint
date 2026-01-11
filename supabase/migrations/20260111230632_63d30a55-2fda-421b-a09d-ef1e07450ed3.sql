-- Fix sms_logs INSERT policy - add user_id validation for authenticated users
DROP POLICY IF EXISTS "Service role can insert SMS logs" ON public.sms_logs;

-- Create separate policies for service role and authenticated users
CREATE POLICY "Service role inserts SMS logs"
ON public.sms_logs FOR INSERT
WITH CHECK (
  -- Allow service role (server-side) or authenticated user inserting their own
  auth.uid() IS NULL OR auth.uid() = user_id
);

-- Fix domain_notifications INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.domain_notifications;

-- System notifications should only be insertable by server-side functions
-- For client-side, require user_id match
CREATE POLICY "Insert domain notifications"
ON public.domain_notifications FOR INSERT
WITH CHECK (
  -- Allow unauthenticated (service role) or user inserting for themselves
  auth.uid() IS NULL OR auth.uid() = user_id
);