-- إضافة حقول تفاصيل المالك الإضافية
ALTER TABLE public.platform_listings
ADD COLUMN IF NOT EXISTS owner_id_number TEXT,
ADD COLUMN IF NOT EXISTS owner_birth_date TEXT,
ADD COLUMN IF NOT EXISTS owner_city TEXT,
ADD COLUMN IF NOT EXISTS owner_district TEXT,
ADD COLUMN IF NOT EXISTS owner_national_address TEXT,
ADD COLUMN IF NOT EXISTS deed_city TEXT,
-- إضافة حقول معلومات التأجير
ADD COLUMN IF NOT EXISTS contract_duration INTEGER,
ADD COLUMN IF NOT EXISTS contract_start_date TEXT,
ADD COLUMN IF NOT EXISTS contract_end_date TEXT,
ADD COLUMN IF NOT EXISTS is_currently_rented BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_contract_file TEXT;