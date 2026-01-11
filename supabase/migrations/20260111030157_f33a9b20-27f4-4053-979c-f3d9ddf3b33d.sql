-- Fix overly permissive RLS policies

-- Drop and recreate events INSERT policy with proper check
DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;

-- Events: Allow authenticated users to insert their own events, or anonymous with viewer_id
CREATE POLICY "Users can insert events"
ON public.events
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
  OR 
  (auth.uid() IS NULL AND viewer_id IS NOT NULL AND user_id IS NULL)
);

-- Drop and recreate notifications INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Notifications: Only authenticated users can insert notifications for themselves
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);