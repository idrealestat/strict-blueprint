-- Ensure each user has at most one business card row
ALTER TABLE public.business_cards
ADD CONSTRAINT business_cards_user_id_key UNIQUE (user_id);

-- Helpful index for slug lookups (if not already present)
CREATE INDEX IF NOT EXISTS idx_business_cards_slug ON public.business_cards (slug);