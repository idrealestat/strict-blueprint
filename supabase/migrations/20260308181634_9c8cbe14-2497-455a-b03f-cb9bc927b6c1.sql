
-- جدول الدورات التدريبية
CREATE TABLE public.training_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تقدم المستخدم في الدورات
CREATE TABLE public.user_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- تفعيل RLS
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

-- سياسات training_courses: الجميع يمكنهم القراءة
CREATE POLICY "Anyone can view active courses" ON public.training_courses
  FOR SELECT USING (is_active = true);

-- Owner يمكنه إدارة الدورات
CREATE POLICY "Owner can manage courses" ON public.training_courses
  FOR ALL USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- سياسات user_training_progress
CREATE POLICY "Users can view their own progress" ON public.user_training_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_training_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_training_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- إدراج دورات تجريبية
INSERT INTO public.training_courses (title, description, video_url, order_index, duration_minutes) VALUES
  ('مقدمة في الوساطة العقارية', 'تعرف على أساسيات العمل كوسيط عقاري محترف', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1, 15),
  ('القوانين والأنظمة العقارية', 'فهم الأنظمة واللوائح المنظمة للسوق العقاري السعودي', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2, 20),
  ('فن التفاوض العقاري', 'تقنيات واستراتيجيات التفاوض الناجح', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3, 25),
  ('التسويق العقاري الرقمي', 'كيف تسوق العقارات عبر المنصات الرقمية', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 4, 20),
  ('تقييم العقارات', 'أساسيات تقييم العقارات وتحديد الأسعار', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 30);
