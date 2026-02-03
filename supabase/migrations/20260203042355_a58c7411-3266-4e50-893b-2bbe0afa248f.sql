-- Fix publish failure: allow authenticated users to execute ownership check function
GRANT EXECUTE ON FUNCTION public.check_business_card_ownership(uuid, text, text, text, text) TO authenticated;

-- Prevent anonymous updates from invoking the function (and keep UPDATE restricted to logged-in users)
DROP POLICY IF EXISTS "Users can update their own business card" ON public.business_cards;
CREATE POLICY "Users can update their own business card"
ON public.business_cards
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_business_card_ownership(user_id, fal_license_number, national_id, email, phone)
)
WITH CHECK (auth.uid() = user_id);
