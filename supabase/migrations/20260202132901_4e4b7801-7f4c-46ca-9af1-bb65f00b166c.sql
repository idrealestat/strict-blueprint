-- =============================================
-- نظام إدارة الفريق للمكاتب والشركات العقارية
-- Team Management System for Real Estate Offices/Companies
-- =============================================

-- 1. جدول أعضاء المنظمة (الزملاء في الشركة/المكتب)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL, -- صاحب الشركة/المكتب
  member_user_id UUID, -- المستخدم الفعلي (قد يكون null إذا لم يسجل بعد)
  member_email TEXT,
  member_phone TEXT,
  member_whatsapp TEXT,
  member_fal_license TEXT,
  member_name TEXT,
  member_role TEXT NOT NULL DEFAULT 'member' CHECK (member_role IN ('admin', 'manager', 'member')),
  -- الصلاحيات
  can_publish_properties BOOLEAN DEFAULT true,
  can_view_all_customers BOOLEAN DEFAULT false,
  can_manage_customers BOOLEAN DEFAULT true,
  can_view_smart_opportunities BOOLEAN DEFAULT true,
  can_accept_opportunities BOOLEAN DEFAULT true,
  can_view_analytics BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,
  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  removed_at TIMESTAMP WITH TIME ZONE,
  -- بيانات إضافية
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. جدول إعدادات الفريق
CREATE TABLE IF NOT EXISTS public.team_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL UNIQUE,
  -- إعدادات مشاركة العملاء
  share_customers_enabled BOOLEAN DEFAULT false,
  customer_visibility TEXT DEFAULT 'private' CHECK (customer_visibility IN ('private', 'shared', 'admin_only')),
  -- إعدادات الفرص الذكية
  smart_opportunities_rotation BOOLEAN DEFAULT true, -- تدوير الفرص بين الزملاء
  opportunity_timeout_hours INTEGER DEFAULT 24, -- مدة انتظار الفرصة قبل تمريرها
  -- إعدادات النشر
  require_approval_for_publishing BOOLEAN DEFAULT false,
  -- إعدادات الإشعارات
  notify_admin_on_customer_add BOOLEAN DEFAULT true,
  notify_admin_on_opportunity_action BOOLEAN DEFAULT true,
  notify_admin_on_property_publish BOOLEAN DEFAULT true,
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. جدول العملاء المشتركين/المعينين
CREATE TABLE IF NOT EXISTS public.shared_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL, -- الزميل المعين له العميل
  assigned_by_user_id UUID NOT NULL, -- المسؤول الذي عين العميل
  original_owner_user_id UUID, -- المالك الأصلي للعميل
  assignment_type TEXT DEFAULT 'shared' CHECK (assignment_type IN ('shared', 'transferred', 'temporary')),
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, assigned_to_user_id)
);

-- 4. جدول إشعارات الفريق
CREATE TABLE IF NOT EXISTS public.team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL,
  sender_user_id UUID,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'member_invited', 'member_accepted', 'member_removed',
    'customer_assigned', 'customer_shared',
    'opportunity_passed', 'opportunity_assigned',
    'property_published', 'property_pending_approval'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. جدول سجل نشاط الفريق (للتحليلات)
CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL,
  user_id UUID NOT NULL, -- الزميل الذي قام بالنشاط
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'customer_added', 'customer_updated', 'customer_contacted',
    'opportunity_accepted', 'opportunity_rejected', 'opportunity_passed',
    'property_published', 'property_updated',
    'offer_created', 'request_created',
    'call_made', 'meeting_scheduled'
  )),
  entity_type TEXT,
  entity_id TEXT,
  entity_title TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. جدول تدوير الفرص الذكية
CREATE TABLE IF NOT EXISTS public.smart_opportunity_rotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL,
  opportunity_key TEXT NOT NULL,
  opportunity_data JSONB NOT NULL,
  current_member_index INTEGER DEFAULT 0,
  members_order UUID[] DEFAULT '{}',
  passed_by UUID[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'all_passed')),
  accepted_by UUID,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_opportunity_rotation ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- organization_members policies
CREATE POLICY "Organization owners can manage members"
ON public.organization_members FOR ALL
USING (auth.uid() = organization_user_id)
WITH CHECK (auth.uid() = organization_user_id);

CREATE POLICY "Members can view their own membership"
ON public.organization_members FOR SELECT
USING (auth.uid() = member_user_id);

CREATE POLICY "Managers can view organization members"
ON public.organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_user_id = organization_members.organization_user_id
    AND om.member_user_id = auth.uid()
    AND om.member_role IN ('admin', 'manager')
    AND om.status = 'active'
  )
);

-- team_settings policies
CREATE POLICY "Organization owners can manage settings"
ON public.team_settings FOR ALL
USING (auth.uid() = organization_user_id)
WITH CHECK (auth.uid() = organization_user_id);

CREATE POLICY "Members can view team settings"
ON public.team_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_user_id = team_settings.organization_user_id
    AND om.member_user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- shared_customers policies
CREATE POLICY "Organization owners can manage shared customers"
ON public.shared_customers FOR ALL
USING (auth.uid() = organization_user_id)
WITH CHECK (auth.uid() = organization_user_id);

CREATE POLICY "Assigned users can view their customers"
ON public.shared_customers FOR SELECT
USING (auth.uid() = assigned_to_user_id);

CREATE POLICY "Admins can manage shared customers"
ON public.shared_customers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_user_id = shared_customers.organization_user_id
    AND om.member_user_id = auth.uid()
    AND om.member_role = 'admin'
    AND om.status = 'active'
  )
);

-- team_notifications policies
CREATE POLICY "Users can view their notifications"
ON public.team_notifications FOR SELECT
USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can update their notifications"
ON public.team_notifications FOR UPDATE
USING (auth.uid() = recipient_user_id);

CREATE POLICY "Organization owners can create notifications"
ON public.team_notifications FOR INSERT
WITH CHECK (auth.uid() = organization_user_id OR auth.uid() = sender_user_id);

-- team_activity_log policies
CREATE POLICY "Organization owners can view all activity"
ON public.team_activity_log FOR SELECT
USING (auth.uid() = organization_user_id);

CREATE POLICY "Admins can view organization activity"
ON public.team_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_user_id = team_activity_log.organization_user_id
    AND om.member_user_id = auth.uid()
    AND om.member_role IN ('admin', 'manager')
    AND om.status = 'active'
  )
);

CREATE POLICY "Members can insert their activity"
ON public.team_activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- smart_opportunity_rotation policies
CREATE POLICY "Organization owners can manage rotations"
ON public.smart_opportunity_rotation FOR ALL
USING (auth.uid() = organization_user_id)
WITH CHECK (auth.uid() = organization_user_id);

CREATE POLICY "Members can view their assigned opportunities"
ON public.smart_opportunity_rotation FOR SELECT
USING (auth.uid() = ANY(members_order));

CREATE POLICY "Members can update rotation when assigned"
ON public.smart_opportunity_rotation FOR UPDATE
USING (auth.uid() = members_order[current_member_index + 1]);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON public.organization_members(organization_user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_member_user ON public.organization_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON public.organization_members(status);
CREATE INDEX IF NOT EXISTS idx_shared_customers_org ON public.shared_customers(organization_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_customers_assigned ON public.shared_customers(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_recipient ON public.team_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_org ON public.team_activity_log(organization_user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_user ON public.team_activity_log(user_id);

-- Function to check if user is organization admin
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_user_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_user_id = org_user_id
    AND member_user_id = check_user_id
    AND member_role = 'admin'
    AND status = 'active'
  ) OR org_user_id = check_user_id
$$;

-- Function to get organization members
CREATE OR REPLACE FUNCTION public.get_organization_members(org_user_id UUID)
RETURNS SETOF public.organization_members
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.organization_members
  WHERE organization_user_id = org_user_id
  AND status = 'active'
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_notifications;