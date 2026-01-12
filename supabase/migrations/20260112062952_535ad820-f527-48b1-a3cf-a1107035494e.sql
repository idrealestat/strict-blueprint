-- Create table for behavioral signals
CREATE TABLE public.behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'freeze', 'exit', 'hesitation', 'rapid_navigation', 'repeated_errors', 'typing_hesitation'
  page_path TEXT NOT NULL,
  page_name TEXT,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  assistant_intervened BOOLEAN DEFAULT false,
  intervention_result TEXT, -- 'continued', 'exited', 'completed', null
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for assistant conversations
CREATE TABLE public.assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  signal_id UUID REFERENCES public.behavioral_signals(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  trigger_reason TEXT NOT NULL, -- why assistant appeared
  messages JSONB DEFAULT '[]', -- array of {role, content, timestamp}
  analysis JSONB DEFAULT '{}', -- {intent, problem_type, confidence_level}
  outcome TEXT, -- 'helped', 'dismissed', 'ignored', 'silent_mode'
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Create table for session summaries (for overview stats)
CREATE TABLE public.behavioral_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_signals INTEGER DEFAULT 0,
  assistant_interventions INTEGER DEFAULT 0,
  was_stuck BOOLEAN DEFAULT false,
  was_rescued BOOLEAN DEFAULT false,
  exit_type TEXT, -- 'silent', 'explained', 'completed', 'ongoing'
  exit_reason TEXT,
  pages_visited TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Create table for smart insights (generated periodically)
CREATE TABLE public.behavioral_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL, -- 'friction_page', 'common_issue', 'ux_problem', 'feature_confusion'
  title TEXT NOT NULL,
  description TEXT,
  page_path TEXT,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  occurrence_count INTEGER DEFAULT 1,
  suggested_improvement TEXT,
  implementation_priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'planned', 'implemented', 'dismissed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.behavioral_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for behavioral_signals
CREATE POLICY "Users can insert their own signals"
ON public.behavioral_signals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view all signals"
ON public.behavioral_signals FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for assistant_conversations
CREATE POLICY "Users can manage their own conversations"
ON public.assistant_conversations FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all conversations"
ON public.assistant_conversations FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for behavioral_sessions
CREATE POLICY "Users can manage their own sessions"
ON public.behavioral_sessions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all sessions"
ON public.behavioral_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for behavioral_insights (owner only)
CREATE POLICY "Owners can manage all insights"
ON public.behavioral_insights FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

-- Create indexes for performance
CREATE INDEX idx_behavioral_signals_user ON public.behavioral_signals(user_id);
CREATE INDEX idx_behavioral_signals_session ON public.behavioral_signals(session_id);
CREATE INDEX idx_behavioral_signals_type ON public.behavioral_signals(signal_type);
CREATE INDEX idx_behavioral_signals_page ON public.behavioral_signals(page_path);
CREATE INDEX idx_behavioral_signals_created ON public.behavioral_signals(created_at DESC);

CREATE INDEX idx_assistant_conversations_user ON public.assistant_conversations(user_id);
CREATE INDEX idx_assistant_conversations_session ON public.assistant_conversations(session_id);

CREATE INDEX idx_behavioral_sessions_user ON public.behavioral_sessions(user_id);
CREATE INDEX idx_behavioral_sessions_session ON public.behavioral_sessions(session_id);

CREATE INDEX idx_behavioral_insights_type ON public.behavioral_insights(insight_type);
CREATE INDEX idx_behavioral_insights_status ON public.behavioral_insights(status);

-- Enable realtime for sessions (for live dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.behavioral_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.behavioral_sessions;