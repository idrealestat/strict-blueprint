-- Add official_business_card_enabled column to all feature tables

-- Layer 1: Global Defaults
ALTER TABLE public.global_feature_defaults 
ADD COLUMN IF NOT EXISTS official_business_card_enabled boolean DEFAULT true;

-- Layer 2: User Overrides
ALTER TABLE public.user_feature_overrides 
ADD COLUMN IF NOT EXISTS official_business_card_enabled boolean DEFAULT null;

-- Layer 3: Business Rules
ALTER TABLE public.business_feature_rules 
ADD COLUMN IF NOT EXISTS official_business_card_enabled boolean DEFAULT null;

-- Layer 4: Feature Flags (per-user legacy table)
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS official_business_card_enabled boolean DEFAULT null;