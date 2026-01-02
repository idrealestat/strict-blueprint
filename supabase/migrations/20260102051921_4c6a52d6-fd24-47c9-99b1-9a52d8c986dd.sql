-- جدول القائمة السوداء للشركات العقارية السعودية
CREATE TABLE public.domain_blacklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_name_en TEXT,
  domain TEXT,
  domain_root TEXT,
  city TEXT,
  category TEXT DEFAULT 'مكتب عقاري',
  source TEXT,
  confidence_level INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_domain_blacklist_domain ON public.domain_blacklist(domain_root);
CREATE INDEX idx_domain_blacklist_company ON public.domain_blacklist(company_name);

-- جدول طلبات النطاقات التي تحتاج موافقة
CREATE TABLE public.domain_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_title TEXT NOT NULL,
  company_name TEXT,
  website_url TEXT,
  account_type TEXT DEFAULT 'individual',
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  matched_company TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_domain_requests_status ON public.domain_requests(status);
CREATE INDEX idx_domain_requests_user ON public.domain_requests(user_id);

-- جدول أنماط الكلمات المحظورة
CREATE TABLE public.forbidden_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern TEXT NOT NULL,
  pattern_type TEXT DEFAULT 'keyword',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج الأنماط الأساسية المحظورة
INSERT INTO public.forbidden_patterns (pattern, pattern_type, description) VALUES
('عقار', 'keyword', 'كلمة عقار العامة'),
('عقارات', 'keyword', 'كلمة عقارات'),
('ايجار', 'keyword', 'كلمة إيجار'),
('تمليك', 'keyword', 'كلمة تمليك'),
('استثمار', 'keyword', 'كلمة استثمار'),
('تطوير', 'keyword', 'كلمة تطوير عقاري'),
('اراضي', 'keyword', 'كلمة أراضي'),
('فلل', 'keyword', 'كلمة فلل'),
('شقق', 'keyword', 'كلمة شقق');

-- إدراج بعض الشركات العقارية الكبرى المعروفة
INSERT INTO public.domain_blacklist (company_name, company_name_en, domain, domain_root, city, category, source, confidence_level) VALUES
('شركة دار الأركان للتطوير العقاري', 'Dar Al Arkan', 'daralarkan.com', 'daralarkan', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100),
('شركة إعمار العقارية', 'Emaar', 'emaar.com.sa', 'emaar', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100),
('شركة جبل عمر للتطوير', 'Jabal Omar', 'jabalomar.com.sa', 'jabalomar', 'مكة', 'شركة تطوير', 'موقع رسمي', 100),
('شركة المراكز العربية', 'Cenomi', 'cenomi.com', 'cenomi', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100),
('شركة رتال للتطوير العمراني', 'Retal', 'retal.com.sa', 'retal', 'الدمام', 'شركة تطوير', 'موقع رسمي', 100),
('شركة روشن العقارية', 'ROSHN', 'roshn.sa', 'roshn', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100),
('الشركة الوطنية للإسكان', 'NHC', 'nhc.sa', 'nhc', 'الرياض', 'شركة حكومية', 'موقع رسمي', 100),
('شركة سمو العقارية', 'Sumou', 'sumou.sa', 'sumou', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100),
('شركة التعمير والأعمار', 'Tatweer', 'tatweer.com.sa', 'tatweer', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100),
('شركة رافال للتطوير العقاري', 'Rafal', 'rafal.com.sa', 'rafal', 'الرياض', 'شركة تطوير', 'موقع رسمي', 100);

-- Enable RLS
ALTER TABLE public.domain_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forbidden_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies للقائمة السوداء (قراءة عامة)
CREATE POLICY "Anyone can view blacklist" ON public.domain_blacklist FOR SELECT USING (true);
CREATE POLICY "Only admins can modify blacklist" ON public.domain_blacklist FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'admin')
);

-- RLS Policies لطلبات النطاقات
CREATE POLICY "Users can view their own requests" ON public.domain_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own requests" ON public.domain_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all requests" ON public.domain_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'admin')
);
CREATE POLICY "Admins can update all requests" ON public.domain_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'admin')
);

-- RLS Policies للأنماط المحظورة (قراءة عامة)
CREATE POLICY "Anyone can view patterns" ON public.forbidden_patterns FOR SELECT USING (true);
CREATE POLICY "Only admins can modify patterns" ON public.forbidden_patterns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'admin')
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_domain_blacklist_updated_at
  BEFORE UPDATE ON public.domain_blacklist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domain_requests_updated_at
  BEFORE UPDATE ON public.domain_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();