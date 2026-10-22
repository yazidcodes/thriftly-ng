-- Revoke EXECUTE from anon and public for all SECURITY DEFINER functions
-- These are authenticated-only operations (contributions, payouts, swaps)
REVOKE EXECUTE ON FUNCTION public.update_contribution_status(uuid, text, numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_payout(uuid, uuid, integer, numeric, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_payout_swap(uuid, uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_payout_swap(uuid, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_payout_swap(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, PUBLIC;

-- Grant EXECUTE only to authenticated
GRANT EXECUTE ON FUNCTION public.update_contribution_status(uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payout(uuid, uuid, integer, numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_payout_swap(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_payout_swap(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payout_swap(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;
