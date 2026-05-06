ALTER TABLE public.owner_profiles
ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'basic';

ALTER TABLE public.owner_profiles
DROP CONSTRAINT IF EXISTS owner_profiles_plan_tier_check;

ALTER TABLE public.owner_profiles
ADD CONSTRAINT owner_profiles_plan_tier_check CHECK (plan_tier IN ('basic','developed'));