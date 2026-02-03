-- Fix linter finding: avoid WITH CHECK (true) on public inserts
DROP POLICY IF EXISTS "Anyone can insert offer views" ON public.offer_views_log;

CREATE POLICY "Public can insert offer views for published brokers"
ON public.offer_views_log
FOR INSERT
TO public
WITH CHECK (
  user_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.business_cards bc
    WHERE bc.user_id = offer_views_log.user_id
      AND bc.published = true
  )
);
