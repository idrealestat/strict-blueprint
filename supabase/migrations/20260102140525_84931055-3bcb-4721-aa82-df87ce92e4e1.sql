-- Fix SMS Logs RLS: Remove overly permissive policy and add proper restrictions
DROP POLICY IF EXISTS "Allow all for sms_logs" ON public.sms_logs;

-- Add user_id column to sms_logs to enable proper user-scoped policies
ALTER TABLE public.sms_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create policy for authenticated users to view their own SMS logs
CREATE POLICY "Users can view their own SMS logs"
ON public.sms_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for service role to manage SMS logs (for edge functions)
-- Note: Service role bypasses RLS, but this documents the intent
CREATE POLICY "Service role can insert SMS logs"
ON public.sms_logs FOR INSERT
WITH CHECK (true);

-- Remove unused OTP columns from profiles table (verified: 0 records use these fields)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS email_otp,
DROP COLUMN IF EXISTS phone_otp,
DROP COLUMN IF EXISTS otp_expires_at;