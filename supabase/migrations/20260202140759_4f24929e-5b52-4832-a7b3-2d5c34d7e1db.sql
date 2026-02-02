-- جدول الدعوات للفريق
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id UUID NOT NULL,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_name TEXT,
  invited_email TEXT,
  invited_whatsapp TEXT,
  invited_fal_license TEXT,
  invited_role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(invitation_token)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Organization owners can manage invitations"
ON public.team_invitations
FOR ALL
USING (auth.uid() = organization_user_id OR auth.uid() = invited_by);

-- سياسة للقراءة العامة بالتوكن (للدعوات)
CREATE POLICY "Anyone can read invitation by token"
ON public.team_invitations
FOR SELECT
USING (true);

-- فهرس للبحث السريع بالتوكن
CREATE INDEX idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_org ON public.team_invitations(organization_user_id);

-- تحديث updated_at
CREATE TRIGGER update_team_invitations_updated_at
BEFORE UPDATE ON public.team_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();