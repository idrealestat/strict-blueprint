-- Create table for custom CRM tags per user
CREATE TABLE public.crm_custom_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for tag name per user
ALTER TABLE public.crm_custom_tags 
ADD CONSTRAINT crm_custom_tags_user_name_unique UNIQUE (user_id, name);

-- Enable RLS
ALTER TABLE public.crm_custom_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tags"
ON public.crm_custom_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
ON public.crm_custom_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.crm_custom_tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.crm_custom_tags FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_crm_custom_tags_updated_at
BEFORE UPDATE ON public.crm_custom_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();