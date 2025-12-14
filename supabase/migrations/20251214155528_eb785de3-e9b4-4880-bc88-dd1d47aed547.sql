-- جدول محادثات وساطه AI
CREATE TABLE public.wasata_ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل المحادثات
CREATE TABLE public.wasata_ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.wasata_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_wasata_messages_conversation ON public.wasata_ai_messages(conversation_id);
CREATE INDEX idx_wasata_conversations_user ON public.wasata_ai_conversations(user_id);

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_wasata_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wasata_ai_conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_wasata_conversation_timestamp
AFTER INSERT ON public.wasata_ai_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_wasata_conversation_updated_at();

-- RLS - السماح للجميع (بدون auth حالياً)
ALTER TABLE public.wasata_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wasata_ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for wasata_ai_conversations" 
ON public.wasata_ai_conversations 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for wasata_ai_messages" 
ON public.wasata_ai_messages 
FOR ALL USING (true) WITH CHECK (true);