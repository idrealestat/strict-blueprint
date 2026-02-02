-- جدول لربط المستخدمين بالشركات والمكاتب كأعضاء/زملاء
CREATE TABLE public.workspace_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_user_id UUID NOT NULL,
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL CHECK (organization_type IN ('office', 'company')),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    fal_license_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_user_id)
);

-- فهرس للبحث السريع
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_org_user_id ON public.workspace_members(organization_user_id);
CREATE INDEX idx_workspace_members_fal_license ON public.workspace_members(fal_license_number);

-- تفعيل RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يرى عضوياته فقط
CREATE POLICY "Users can view their own memberships"
ON public.workspace_members
FOR SELECT
USING (auth.uid() = user_id);

-- سياسة: المؤسسة ترى أعضائها
CREATE POLICY "Organizations can view their members"
ON public.workspace_members
FOR SELECT
USING (auth.uid() = organization_user_id);

-- سياسة: المؤسسة يمكنها إضافة أعضاء
CREATE POLICY "Organizations can add members"
ON public.workspace_members
FOR INSERT
WITH CHECK (auth.uid() = organization_user_id);

-- سياسة: المؤسسة يمكنها تحديث بيانات أعضائها
CREATE POLICY "Organizations can update their members"
ON public.workspace_members
FOR UPDATE
USING (auth.uid() = organization_user_id);

-- سياسة: العضو يمكنه قبول الدعوة (تحديث حالته)
CREATE POLICY "Members can accept invitations"
ON public.workspace_members
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- سياسة: المؤسسة يمكنها إزالة أعضاء
CREATE POLICY "Organizations can delete members"
ON public.workspace_members
FOR DELETE
USING (auth.uid() = organization_user_id);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_workspace_members_updated_at
BEFORE UPDATE ON public.workspace_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;