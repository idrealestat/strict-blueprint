-- إنشاء جدول المواعيد
CREATE TABLE public.calendar_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  appointment_time TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  appointment_type TEXT NOT NULL DEFAULT 'viewing',
  status TEXT NOT NULL DEFAULT 'scheduled',
  location TEXT,
  property_id TEXT,
  property_title TEXT,
  notes TEXT,
  reminder BOOLEAN DEFAULT true,
  reminder_time INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.calendar_appointments ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة والكتابة للجميع (تطبيق محلي)
CREATE POLICY "Allow all for calendar_appointments"
ON public.calendar_appointments
FOR ALL
USING (true)
WITH CHECK (true);

-- تفعيل Realtime للجدول
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_appointments;

-- Trigger لتحديث updated_at
CREATE TRIGGER update_calendar_appointments_updated_at
BEFORE UPDATE ON public.calendar_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();