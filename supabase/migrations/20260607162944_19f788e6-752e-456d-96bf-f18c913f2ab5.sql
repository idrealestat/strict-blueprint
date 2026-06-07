
DO $$ BEGIN
  CREATE TYPE public.regulatory_authority AS ENUM ('REGA','MOH','SAMA','EJAR','ZATCA','REDF','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.regulatory_severity AS ENUM ('mandatory','alert','info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.regulatory_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority public.regulatory_authority NOT NULL,
  title text NOT NULL,
  summary text,
  severity public.regulatory_severity NOT NULL DEFAULT 'info',
  source_url text NOT NULL,
  document_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  tags text[] DEFAULT '{}',
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (authority, external_id)
);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at
  ON public.regulatory_updates (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_authority
  ON public.regulatory_updates (authority);

GRANT SELECT ON public.regulatory_updates TO anon;
GRANT SELECT ON public.regulatory_updates TO authenticated;
GRANT ALL ON public.regulatory_updates TO service_role;

ALTER TABLE public.regulatory_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read regulatory updates"
  ON public.regulatory_updates FOR SELECT
  USING (true);

CREATE TRIGGER trg_regulatory_updates_updated_at
  BEFORE UPDATE ON public.regulatory_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.regulatory_reads (
  user_id uuid PRIMARY KEY,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.regulatory_reads TO authenticated;
GRANT ALL ON public.regulatory_reads TO service_role;

ALTER TABLE public.regulatory_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own read marker"
  ON public.regulatory_reads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_regulatory_reads_updated_at
  BEFORE UPDATE ON public.regulatory_reads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
