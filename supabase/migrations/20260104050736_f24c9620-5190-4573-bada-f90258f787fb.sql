-- Drop the overly permissive policy on wasata_ai_conversations
DROP POLICY IF EXISTS "Allow all for wasata_ai_conversations" ON public.wasata_ai_conversations;

-- Create user-scoped policies for wasata_ai_conversations
CREATE POLICY "Users can view own conversations"
ON public.wasata_ai_conversations FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own conversations"
ON public.wasata_ai_conversations FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own conversations"
ON public.wasata_ai_conversations FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.wasata_ai_conversations FOR DELETE
USING (auth.uid()::text = user_id);

-- Drop the overly permissive policy on wasata_ai_messages
DROP POLICY IF EXISTS "Allow all for wasata_ai_messages" ON public.wasata_ai_messages;

-- Create user-scoped policies for wasata_ai_messages (via conversation ownership)
CREATE POLICY "Users can view own messages"
ON public.wasata_ai_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.wasata_ai_conversations c
  WHERE c.id = conversation_id AND c.user_id = auth.uid()::text
));

CREATE POLICY "Users can insert own messages"
ON public.wasata_ai_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wasata_ai_conversations c
  WHERE c.id = conversation_id AND c.user_id = auth.uid()::text
));

CREATE POLICY "Users can update own messages"
ON public.wasata_ai_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.wasata_ai_conversations c
  WHERE c.id = conversation_id AND c.user_id = auth.uid()::text
));

CREATE POLICY "Users can delete own messages"
ON public.wasata_ai_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.wasata_ai_conversations c
  WHERE c.id = conversation_id AND c.user_id = auth.uid()::text
));