-- Create scheduled_messages table
CREATE TABLE public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'sms',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is managed by edge functions)
CREATE POLICY "Allow all operations on scheduled_messages"
ON public.scheduled_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries on pending messages
CREATE INDEX idx_scheduled_messages_pending ON public.scheduled_messages (scheduled_time) 
WHERE status = 'pending';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_messages_updated_at
BEFORE UPDATE ON public.scheduled_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();