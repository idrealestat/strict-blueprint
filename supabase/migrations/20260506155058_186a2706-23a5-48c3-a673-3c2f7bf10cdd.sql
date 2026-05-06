CREATE TABLE public.owner_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  submission_type text NOT NULL CHECK (submission_type IN ('offer','request')),
  purpose text NOT NULL CHECK (purpose IN ('sale','rent','buy','lease')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','saved','pending_acceptance','broker_assigned','completed')),
  source text NOT NULL DEFAULT 'direct' CHECK (source IN ('direct','link')),
  city text,
  district text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_broker_slug text,
  assigned_broker_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own submissions"
ON public.owner_submissions FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Authenticated brokers view pending submissions"
ON public.owner_submissions FOR SELECT
USING (status = 'pending_acceptance' AND auth.uid() IS NOT NULL);

CREATE POLICY "Assigned broker sees own submission"
ON public.owner_submissions FOR SELECT
USING (auth.uid() = assigned_broker_user_id);

CREATE POLICY "Owner role can view all submissions"
ON public.owner_submissions FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER trg_owner_submissions_updated
BEFORE UPDATE ON public.owner_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_owner_submissions_owner ON public.owner_submissions(owner_user_id);
CREATE INDEX idx_owner_submissions_status_city ON public.owner_submissions(status, city);

CREATE TABLE public.owner_broker_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.owner_submissions(id) ON DELETE CASCADE,
  broker_user_id uuid NOT NULL,
  broker_slug text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  commission_percent numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, broker_user_id)
);

ALTER TABLE public.owner_broker_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers manage own proposals"
ON public.owner_broker_proposals FOR ALL
USING (auth.uid() = broker_user_id)
WITH CHECK (auth.uid() = broker_user_id);

CREATE POLICY "Submission owner sees proposals"
ON public.owner_broker_proposals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.owner_submissions s
  WHERE s.id = owner_broker_proposals.submission_id
    AND s.owner_user_id = auth.uid()
));

CREATE POLICY "Submission owner can update proposal status"
ON public.owner_broker_proposals FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.owner_submissions s
  WHERE s.id = owner_broker_proposals.submission_id
    AND s.owner_user_id = auth.uid()
));

CREATE POLICY "Owner role views all proposals"
ON public.owner_broker_proposals FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER trg_owner_broker_proposals_updated
BEFORE UPDATE ON public.owner_broker_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_proposals_submission ON public.owner_broker_proposals(submission_id);
CREATE INDEX idx_proposals_broker ON public.owner_broker_proposals(broker_user_id);