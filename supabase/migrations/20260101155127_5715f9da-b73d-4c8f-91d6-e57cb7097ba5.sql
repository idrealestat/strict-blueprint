-- Business cards for public platform header
CREATE TABLE IF NOT EXISTS public.business_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Public can read published cards (for public platform pages)
CREATE POLICY "Public can view published business cards"
ON public.business_cards
FOR SELECT
USING (published = true);

-- Owner CRUD
CREATE POLICY "Users can create their own business card"
ON public.business_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business card"
ON public.business_cards
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business card"
ON public.business_cards
FOR DELETE
USING (auth.uid() = user_id);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_business_cards_slug ON public.business_cards (slug);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_business_cards_updated_at ON public.business_cards;
CREATE TRIGGER trg_business_cards_updated_at
BEFORE UPDATE ON public.business_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();