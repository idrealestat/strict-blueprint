-- جدول الطلبات الخاصة (special_requests)
-- طلبات الوسطاء للبحث عن عقارات محددة

CREATE TABLE public.special_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- معلومات العقار المطلوب
  property_type TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  specific_location TEXT,
  google_maps_link TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  
  -- العنوان الوطني
  street TEXT,
  building_number TEXT,
  postal_code TEXT,
  national_address TEXT,
  
  -- المساحة والمواصفات
  min_area DECIMAL,
  max_area DECIMAL,
  description TEXT,
  
  -- مدى الاستعجال
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'very_urgent')),
  
  -- حالة الطلب
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'searching', 'found', 'paid', 'completed', 'cancelled')),
  
  -- الرد من الإدارة
  admin_response TEXT,
  admin_notes TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  
  -- نتائج البحث
  matching_listings JSONB DEFAULT '[]',
  found_count INTEGER DEFAULT 0,
  
  -- الدفع
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
  payment_amount DECIMAL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  
  -- المعلومات المرسلة بعد الدفع
  broker_info_sent BOOLEAN DEFAULT FALSE,
  broker_info_sent_at TIMESTAMPTZ,
  
  -- التواريخ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.special_requests ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للمستخدمين
CREATE POLICY "Users can view their own requests"
  ON public.special_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON public.special_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.special_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- سياسة للإدارة (المالكين) - يمكنهم رؤية جميع الطلبات
-- نستخدم دالة للتحقق من صلاحيات المالك
CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- يمكن تعديل هذه الدالة لاحقاً لإضافة المزيد من المالكين
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND account_type IN ('owner', 'admin')
  );
END;
$$;

CREATE POLICY "Owners can view all requests"
  ON public.special_requests
  FOR SELECT
  USING (is_owner_user());

CREATE POLICY "Owners can update all requests"
  ON public.special_requests
  FOR UPDATE
  USING (is_owner_user());

-- جدول إشعارات الطلبات الخاصة
CREATE TABLE public.special_request_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_id UUID REFERENCES public.special_requests(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.special_request_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.special_request_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.special_request_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.special_request_notifications
  FOR INSERT
  WITH CHECK (true);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_special_requests_updated_at
  BEFORE UPDATE ON public.special_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- تفعيل Realtime للإشعارات
ALTER PUBLICATION supabase_realtime ADD TABLE public.special_request_notifications;

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_special_requests_user_id ON public.special_requests(user_id);
CREATE INDEX idx_special_requests_status ON public.special_requests(status);
CREATE INDEX idx_special_requests_city ON public.special_requests(city);
CREATE INDEX idx_special_request_notifications_user_id ON public.special_request_notifications(user_id);
CREATE INDEX idx_special_request_notifications_unread ON public.special_request_notifications(user_id, is_read) WHERE is_read = FALSE;