-- Create the update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create SMS logs table for tracking sent messages
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general',
  appointment_id VARCHAR(100),
  twilio_message_sid VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since no auth is implemented)
CREATE POLICY "Allow all for sms_logs" ON public.sms_logs
FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_sms_logs_recipient ON public.sms_logs(recipient_phone);
CREATE INDEX idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX idx_sms_logs_created_at ON public.sms_logs(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_sms_logs_updated_at
  BEFORE UPDATE ON public.sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();