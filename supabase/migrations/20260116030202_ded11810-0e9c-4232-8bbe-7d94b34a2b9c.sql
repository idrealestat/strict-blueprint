
-- Re-apply REVOKE to ensure anon cannot execute sensitive functions
-- (Sometimes grants need to be explicitly revoked from PUBLIC role too)

-- Revoke from PUBLIC (which includes anon)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_business_card_ownership(uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_use_feature(uuid, text) FROM PUBLIC;

-- Explicitly grant only to authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_business_card_ownership(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_feature(uuid, text) TO authenticated;

-- Remove duplicate SELECT policy for property media
DROP POLICY IF EXISTS "Property media is publicly accessible" ON storage.objects;
