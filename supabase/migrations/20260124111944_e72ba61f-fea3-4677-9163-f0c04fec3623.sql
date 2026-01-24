-- إضافة حقل مدة رخصة فال للمكاتب والشركات (من 1 إلى 5 سنوات)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fal_license_duration_years INTEGER DEFAULT 1 CHECK (fal_license_duration_years >= 1 AND fal_license_duration_years <= 5);

-- إضافة نفس الحقل لجدول business_cards في حقل البيانات JSON
COMMENT ON COLUMN public.profiles.fal_license_duration_years IS 'مدة رخصة فال بالسنوات (1-5 سنوات للمكاتب والشركات، سنة واحدة للأفراد)';