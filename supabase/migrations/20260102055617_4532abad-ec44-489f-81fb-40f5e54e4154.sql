-- إضافة حقول الأولوية والنوع لجدول domain_requests
ALTER TABLE public.domain_requests
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS official_domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alternative_suggestions TEXT[] DEFAULT '{}';

-- تعليق على مستويات الأولوية
COMMENT ON COLUMN public.domain_requests.priority_level IS 'مستوى الأولوية: 1=مالك نطاق رسمي مُحقق، 2=شركة/مكتب، 3=فرد';
COMMENT ON COLUMN public.domain_requests.owner_type IS 'نوع المالك: company, office, individual';
COMMENT ON COLUMN public.domain_requests.source IS 'مصدر الحجز: official-domain, paid, manual';
COMMENT ON COLUMN public.domain_requests.official_domain_verified IS 'هل تم التحقق من ملكية النطاق الرسمي';
COMMENT ON COLUMN public.domain_requests.alternative_suggestions IS 'اقتراحات بديلة عند السحب';