-- Add user_id column to scheduled_messages table
ALTER TABLE public.scheduled_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on scheduled_messages" ON public.scheduled_messages;

-- Create user-scoped policies
CREATE POLICY "Users can view own scheduled messages"
ON public.scheduled_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled messages"
ON public.scheduled_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled messages"
ON public.scheduled_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled messages"
ON public.scheduled_messages FOR DELETE
USING (auth.uid() = user_id);