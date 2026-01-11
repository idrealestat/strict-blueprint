-- Add field-level privacy controls to business_cards table
-- These control which contact fields are publicly visible when card is published

ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "show_phone": true,
  "show_email": true,
  "show_whatsapp": true,
  "show_national_id": false,
  "show_fal_license": true,
  "show_office_address": true,
  "show_social_media": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.business_cards.privacy_settings IS 'Field-level privacy controls for public visibility of contact information';

-- Update existing RLS policy to use privacy settings for public access
-- Drop existing public select policy
DROP POLICY IF EXISTS "Published cards public view" ON public.business_cards;
DROP POLICY IF EXISTS "Anyone can view published cards" ON public.business_cards;

-- Create new policy that respects privacy settings
-- Note: The actual field masking happens in application code based on privacy_settings
CREATE POLICY "Published cards are publicly viewable"
ON public.business_cards
FOR SELECT
USING (
  published = true 
  OR auth.uid() = user_id 
  OR public.check_business_card_ownership(user_id, fal_license_number, national_id, email, phone)
);