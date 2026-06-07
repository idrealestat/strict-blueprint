CREATE TABLE public.bank_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'saibor',
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_pct NUMERIC,
  trend TEXT,
  unit TEXT DEFAULT '%',
  source TEXT,
  source_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bank_rates TO anon;
GRANT SELECT ON public.bank_rates TO authenticated;
GRANT ALL ON public.bank_rates TO service_role;

ALTER TABLE public.bank_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bank rates" ON public.bank_rates FOR SELECT USING (true);

-- Seed initial data
INSERT INTO public.bank_rates (code, name_ar, category, value, previous_value, change_pct, trend, unit, source, source_url) VALUES
('SAIBOR_1M', 'سايبور شهر', 'saibor', 5.42, 5.45, -0.55, 'down', '%', 'SAMA', 'https://www.sama.gov.sa'),
('SAIBOR_3M', 'سايبور 3 شهور', 'saibor', 5.58, 5.60, -0.36, 'down', '%', 'SAMA', 'https://www.sama.gov.sa'),
('SAIBOR_6M', 'سايبور 6 شهور', 'saibor', 5.65, 5.63, 0.36, 'up', '%', 'SAMA', 'https://www.sama.gov.sa'),
('SAIBOR_12M', 'سايبور سنة', 'saibor', 5.72, 5.70, 0.35, 'up', '%', 'SAMA', 'https://www.sama.gov.sa'),
('REPO', 'سعر الريبو', 'policy', 5.50, 5.50, 0, 'flat', '%', 'SAMA', 'https://www.sama.gov.sa'),
('REVERSE_REPO', 'الريبو العكسي', 'policy', 5.00, 5.00, 0, 'flat', '%', 'SAMA', 'https://www.sama.gov.sa'),
('MORTGAGE_RAJHI', 'رهن - الراجحي', 'mortgage', 6.85, 6.90, -0.72, 'down', '%', 'بنك الراجحي', 'https://www.alrajhibank.com.sa'),
('MORTGAGE_AHLI', 'رهن - الأهلي', 'mortgage', 6.95, 6.95, 0, 'flat', '%', 'البنك الأهلي', 'https://www.alahli.com'),
('MORTGAGE_RIYADH', 'رهن - الرياض', 'mortgage', 7.05, 7.10, -0.70, 'down', '%', 'بنك الرياض', 'https://www.riyadbank.com'),
('MORTGAGE_BILAD', 'رهن - البلاد', 'mortgage', 7.15, 7.10, 0.70, 'up', '%', 'بنك البلاد', 'https://www.bankalbilad.com');