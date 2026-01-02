-- إضافة الحقول الجديدة لجدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fal_license_number TEXT,
ADD COLUMN IF NOT EXISTS fal_license_expiry DATE,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'office', 'company')),
ADD COLUMN IF NOT EXISTS commercial_reg_number TEXT,
ADD COLUMN IF NOT EXISTS commercial_reg_expiry DATE,
ADD COLUMN IF NOT EXISTS national_id TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS office_lat NUMERIC,
ADD COLUMN IF NOT EXISTS office_lng NUMERIC,
ADD COLUMN IF NOT EXISTS office_address TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp TEXT,
ADD COLUMN IF NOT EXISTS phone_otp TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- إنشاء جدول للتحقق من OTP
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view their own verification codes"
ON public.verification_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification codes"
ON public.verification_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification codes"
ON public.verification_codes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verification codes"
ON public.verification_codes FOR DELETE
USING (auth.uid() = user_id);