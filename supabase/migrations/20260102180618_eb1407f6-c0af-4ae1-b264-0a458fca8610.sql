-- Allow owners to read their own business card even when not published
CREATE POLICY "Users can view their own business card"
ON public.business_cards
FOR SELECT
USING (auth.uid() = user_id);
