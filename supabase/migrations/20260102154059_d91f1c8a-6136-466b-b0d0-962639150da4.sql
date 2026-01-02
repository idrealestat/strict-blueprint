-- Adjust OTP storage to match edge functions + allow pre-auth OTP
-- 1) Add identifier column (email/phone), keep user_id optional
ALTER TABLE public.verification_codes
ADD COLUMN IF NOT EXISTS identifier text;

-- 2) Ensure created_at has default
ALTER TABLE public.verification_codes
ALTER COLUMN created_at SET DEFAULT now();

-- 3) Ensure verified has default
ALTER TABLE public.verification_codes
ALTER COLUMN verified SET DEFAULT false;

-- 4) Drop FK that causes 500 when user_id doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verification_codes_user_id_fkey'
  ) THEN
    ALTER TABLE public.verification_codes
    DROP CONSTRAINT verification_codes_user_id_fkey;
  END IF;
END $$;

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_identifier_type
  ON public.verification_codes (identifier, type);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id_type
  ON public.verification_codes (user_id, type);
