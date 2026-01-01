ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS publish_token_hash TEXT;

-- Ensure it's present for new rows (null allowed for backward compatibility)
CREATE INDEX IF NOT EXISTS idx_business_cards_published ON public.business_cards (published);