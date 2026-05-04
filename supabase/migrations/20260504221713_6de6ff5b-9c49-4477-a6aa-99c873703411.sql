
-- 1) owner_profiles
CREATE TABLE public.owner_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  national_id text,
  date_of_birth date,
  phone text NOT NULL UNIQUE,
  email text UNIQUE,
  city text,
  neighborhood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own profile"
ON public.owner_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own profile"
ON public.owner_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own profile"
ON public.owner_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER trg_owner_profiles_updated_at
BEFORE UPDATE ON public.owner_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) public_property_offers
CREATE TABLE public.public_property_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_kind text NOT NULL CHECK (offer_kind IN ('sale','rent')),
  property_type text,
  area_sqm numeric,
  price_sar numeric,
  city text,
  neighborhood text,
  description text,
  photos text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','published','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_property_offers_owner ON public.public_property_offers(owner_user_id);
CREATE INDEX idx_public_property_offers_status ON public.public_property_offers(status);

ALTER TABLE public.public_property_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own offers"
ON public.public_property_offers FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Authenticated can read published offers"
ON public.public_property_offers FOR SELECT
USING (status = 'published' AND auth.uid() IS NOT NULL);

CREATE TRIGGER trg_public_property_offers_updated_at
BEFORE UPDATE ON public.public_property_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Storage bucket for offer photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-offer-photos', 'property-offer-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read offer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-offer-photos');

CREATE POLICY "Owners upload own offer photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-offer-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners update own offer photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-offer-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners delete own offer photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-offer-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
