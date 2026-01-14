-- جدول المعاملات للعملاء
CREATE TABLE public.customer_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  customer_phone TEXT,
  transaction_type TEXT NOT NULL, -- شراء، دفعة، استرداد، عمولة
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'مكتمل', -- مكتمل، معلق، ملغي
  invoice_number TEXT,
  description TEXT,
  related_property_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول التفاعلات للعملاء
CREATE TABLE public.customer_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  customer_phone TEXT,
  interaction_type TEXT NOT NULL, -- call, whatsapp, email, meeting, note, status_change
  description TEXT,
  sentiment TEXT DEFAULT 'محايد', -- إيجابي، سلبي، محايد
  duration_seconds INTEGER,
  outcome TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الفواتير للعملاء (سندات القبض)
CREATE TABLE public.customer_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  customer_phone TEXT,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'معلقة', -- مدفوعة، معلقة، متأخرة، ملغاة
  due_date DATE,
  paid_date DATE,
  description TEXT,
  related_transaction_id UUID REFERENCES public.customer_transactions(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX idx_customer_transactions_user_id ON public.customer_transactions(user_id);
CREATE INDEX idx_customer_transactions_customer_id ON public.customer_transactions(customer_id);
CREATE INDEX idx_customer_transactions_customer_phone ON public.customer_transactions(customer_phone);

CREATE INDEX idx_customer_interactions_user_id ON public.customer_interactions(user_id);
CREATE INDEX idx_customer_interactions_customer_id ON public.customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_customer_phone ON public.customer_interactions(customer_phone);

CREATE INDEX idx_customer_invoices_user_id ON public.customer_invoices(user_id);
CREATE INDEX idx_customer_invoices_customer_id ON public.customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_customer_phone ON public.customer_invoices(customer_phone);

-- تمكين RLS
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمعاملات
CREATE POLICY "Users can view their own transactions" ON public.customer_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.customer_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.customer_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.customer_transactions FOR DELETE USING (auth.uid() = user_id);

-- سياسات RLS للتفاعلات
CREATE POLICY "Users can view their own interactions" ON public.customer_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interactions" ON public.customer_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interactions" ON public.customer_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.customer_interactions FOR DELETE USING (auth.uid() = user_id);

-- سياسات RLS للفواتير
CREATE POLICY "Users can view their own invoices" ON public.customer_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON public.customer_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.customer_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.customer_invoices FOR DELETE USING (auth.uid() = user_id);

-- Triggers لتحديث updated_at
CREATE TRIGGER update_customer_transactions_updated_at
  BEFORE UPDATE ON public.customer_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_invoices_updated_at
  BEFORE UPDATE ON public.customer_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();