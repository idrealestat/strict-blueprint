-- Update the trigger function to use SECURITY INVOKER instead of SECURITY DEFINER
-- This prevents RLS bypass since the function will execute with the caller's privileges
CREATE OR REPLACE FUNCTION public.update_wasata_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wasata_ai_conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;