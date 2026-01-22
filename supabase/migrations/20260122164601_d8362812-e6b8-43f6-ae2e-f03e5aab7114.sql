-- ============================================
-- جدول تدقيق المحتوى العقاري (Audit Log)
-- من أنشأ - من عدّل - متى - لماذا
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- المحتوى المستهدف
    entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'request', 'business_card', 'ai_output')),
    entity_id UUID NOT NULL,
    
    -- نوع العملية
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'publish', 'unpublish', 'ai_generate')),
    
    -- من قام بالعملية
    performed_by UUID NOT NULL,
    performed_by_role TEXT, -- broker, owner, client
    
    -- التفاصيل
    field_changed TEXT, -- اسم الحقل الذي تغير (إن وجد)
    old_value TEXT, -- القيمة السابقة
    new_value TEXT, -- القيمة الجديدة
    change_reason TEXT, -- سبب التغيير (اختياري)
    
    -- هل المحتوى من الذكاء الاصطناعي
    is_ai_generated BOOLEAN DEFAULT false,
    ai_model_used TEXT, -- اسم نموذج الذكاء الاصطناعي
    
    -- بيانات وصفية
    ip_address TEXT,
    user_agent TEXT,
    
    -- الطوابع الزمنية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_content_audit_entity ON public.content_audit_log(entity_type, entity_id);
CREATE INDEX idx_content_audit_user ON public.content_audit_log(performed_by);
CREATE INDEX idx_content_audit_time ON public.content_audit_log(created_at DESC);

-- تفعيل RLS
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة - المستخدم يرى سجلاته فقط
CREATE POLICY "Users can view their own audit logs"
ON public.content_audit_log
FOR SELECT
USING (auth.uid() = performed_by);

-- سياسة الإضافة - أي مستخدم مسجل يمكنه الإضافة
CREATE POLICY "Authenticated users can create audit logs"
ON public.content_audit_log
FOR INSERT
WITH CHECK (auth.uid() = performed_by);

-- Owner يمكنه رؤية كل السجلات
CREATE POLICY "Owner can view all audit logs"
ON public.content_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- ============================================
-- جدول أدوار العقارات (Broker, Owner, Client)
-- منفصل عن أدوار النظام (owner, admin, member)
-- ============================================

CREATE TABLE IF NOT EXISTS public.real_estate_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- الدور العقاري
    role TEXT NOT NULL CHECK (role IN ('broker', 'landlord', 'client')),
    
    -- رخصة فال (للوسطاء فقط)
    fal_license_number TEXT,
    fal_license_expiry DATE,
    
    -- هل مفعّل
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, role)
);

-- فهرس
CREATE INDEX idx_real_estate_roles_user ON public.real_estate_roles(user_id);

-- تفعيل RLS
ALTER TABLE public.real_estate_roles ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "Users can view their own real estate roles"
ON public.real_estate_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own real estate roles"
ON public.real_estate_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own real estate roles"
ON public.real_estate_roles
FOR UPDATE
USING (auth.uid() = user_id);

-- Owner يمكنه إدارة كل الأدوار
CREATE POLICY "Owner can manage all real estate roles"
ON public.real_estate_roles
FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

-- ============================================
-- دالة للتحقق من الدور العقاري
-- ============================================

CREATE OR REPLACE FUNCTION public.has_real_estate_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.real_estate_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- ============================================
-- دالة للحصول على الدور العقاري الرئيسي
-- ============================================

CREATE OR REPLACE FUNCTION public.get_real_estate_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.real_estate_roles
  WHERE user_id = _user_id
    AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'broker' THEN 1 
      WHEN 'landlord' THEN 2 
      WHEN 'client' THEN 3 
    END
  LIMIT 1
$$;

-- ============================================
-- Trigger لتسجيل تغييرات platform_listings تلقائياً
-- ============================================

CREATE OR REPLACE FUNCTION public.log_listing_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action_type TEXT;
    v_old_json JSONB;
    v_new_json JSONB;
BEGIN
    -- تحديد نوع العملية
    IF TG_OP = 'INSERT' THEN
        v_action_type := 'create';
        v_new_json := to_jsonb(NEW);
        
        INSERT INTO content_audit_log (
            entity_type, entity_id, action_type, performed_by,
            new_value, is_ai_generated
        ) VALUES (
            'listing', NEW.id, v_action_type, COALESCE(auth.uid(), NEW.user_id),
            v_new_json::text, false
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- فقط إذا تغيرت حقول مهمة
        IF OLD.title IS DISTINCT FROM NEW.title OR
           OLD.description IS DISTINCT FROM NEW.description OR
           OLD.price IS DISTINCT FROM NEW.price OR
           OLD.status IS DISTINCT FROM NEW.status THEN
            
            v_action_type := CASE 
                WHEN OLD.status != 'published' AND NEW.status = 'published' THEN 'publish'
                WHEN OLD.status = 'published' AND NEW.status != 'published' THEN 'unpublish'
                ELSE 'update'
            END;
            
            v_old_json := jsonb_build_object(
                'title', OLD.title,
                'description', OLD.description,
                'price', OLD.price,
                'status', OLD.status
            );
            
            v_new_json := jsonb_build_object(
                'title', NEW.title,
                'description', NEW.description,
                'price', NEW.price,
                'status', NEW.status
            );
            
            INSERT INTO content_audit_log (
                entity_type, entity_id, action_type, performed_by,
                old_value, new_value, is_ai_generated
            ) VALUES (
                'listing', NEW.id, v_action_type, COALESCE(auth.uid(), NEW.user_id),
                v_old_json::text, v_new_json::text, false
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_action_type := 'delete';
        v_old_json := to_jsonb(OLD);
        
        INSERT INTO content_audit_log (
            entity_type, entity_id, action_type, performed_by,
            old_value, is_ai_generated
        ) VALUES (
            'listing', OLD.id, v_action_type, COALESCE(auth.uid(), OLD.user_id),
            v_old_json::text, false
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء الـ Trigger
DROP TRIGGER IF EXISTS trigger_log_listing_changes ON public.platform_listings;
CREATE TRIGGER trigger_log_listing_changes
AFTER INSERT OR UPDATE OR DELETE ON public.platform_listings
FOR EACH ROW
EXECUTE FUNCTION public.log_listing_changes();