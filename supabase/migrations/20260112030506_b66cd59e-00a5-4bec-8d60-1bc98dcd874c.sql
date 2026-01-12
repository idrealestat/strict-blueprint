-- جدول قبول الفرص الذكية
CREATE TABLE public.smart_opportunity_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('offer_to_request', 'request_to_offer')),
  owner_user_id UUID NOT NULL,
  other_user_id UUID,
  owner_item_id TEXT NOT NULL,
  other_item_id TEXT NOT NULL,
  similarity_score NUMERIC DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 100),
  matched_features JSONB DEFAULT '[]'::jsonb,
  source TEXT DEFAULT 'smart_opportunities',
  status TEXT DEFAULT 'pending' CHECK (status IN ('accepted', 'rejected', 'pending')),
  viewed_by_owner BOOLEAN DEFAULT false,
  owner_item_data JSONB DEFAULT '{}'::jsonb,
  other_item_data JSONB DEFAULT '{}'::jsonb,
  other_broker_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.smart_opportunity_acceptances ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view their own acceptances"
ON public.smart_opportunity_acceptances
FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own acceptances"
ON public.smart_opportunity_acceptances
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own acceptances"
ON public.smart_opportunity_acceptances
FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own acceptances"
ON public.smart_opportunity_acceptances
FOR DELETE
USING (auth.uid() = owner_user_id);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_smart_opportunity_acceptances_updated_at
BEFORE UPDATE ON public.smart_opportunity_acceptances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();