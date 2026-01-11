-- Create received_documents table for storing public form submissions
CREATE TABLE public.received_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  document_type TEXT NOT NULL,
  property_type TEXT,
  city TEXT,
  district TEXT,
  notes TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offer_views_log table for analytics tracking
CREATE TABLE public.offer_views_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  offer_id TEXT NOT NULL,
  offer_title TEXT,
  city TEXT,
  country TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  ip_address TEXT,
  session_id TEXT,
  view_duration INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.received_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_views_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for received_documents
CREATE POLICY "Users can view their own received documents"
ON public.received_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own received documents"
ON public.received_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own received documents"
ON public.received_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own received documents"
ON public.received_documents
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for offer_views_log
CREATE POLICY "Users can view their own offer views"
ON public.offer_views_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offer views"
ON public.offer_views_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offer views"
ON public.offer_views_log
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger for received_documents
CREATE TRIGGER update_received_documents_updated_at
BEFORE UPDATE ON public.received_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.received_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_views_log;