CREATE TABLE public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  requester_id uuid not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint requester_not_target check (requester_id <> target_id)
);

CREATE UNIQUE INDEX unique_pending_swap_per_group
  ON public.swap_requests (group_id, requester_id)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.swap_requests TO authenticated;
GRANT ALL ON public.swap_requests TO service_role;

ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Swap parties can view requests"
  ON public.swap_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create their own swap requests"
  ON public.swap_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Swap parties can update requests"
  ON public.swap_requests FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR target_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Swap parties can delete requests"
  ON public.swap_requests FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE OR REPLACE FUNCTION public.request_payout_swap(p_group_id uuid, p_target_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requester uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_target_id = v_requester THEN
    RAISE EXCEPTION 'Cannot swap with yourself';
  END IF;
  IF NOT is_group_member(v_requester, p_group_id) AND NOT is_group_admin(v_requester, p_group_id) THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;
  IF NOT is_group_member(p_target_id, p_group_id) AND NOT is_group_admin(p_target_id, p_group_id) THEN
    RAISE EXCEPTION 'The selected member does not belong to this group';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM payout_schedule
    WHERE group_id = p_group_id AND user_id = v_requester AND status = 'upcoming'
  ) THEN
    RAISE EXCEPTION 'You do not have an upcoming payout turn to swap';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM payout_schedule
    WHERE group_id = p_group_id AND user_id = p_target_id AND status = 'upcoming'
  ) THEN
    RAISE EXCEPTION 'That member has no upcoming payout turn to swap';
  END IF;

  IF EXISTS (
    SELECT 1 FROM swap_requests
    WHERE group_id = p_group_id AND requester_id = v_requester AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending swap request in this group';
  END IF;

  INSERT INTO swap_requests (group_id, requester_id, target_id, reason)
  VALUES (p_group_id, v_requester, p_target_id, p_reason)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_payout_swap(p_request_id uuid, p_accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request swap_requests%ROWTYPE;
  v_slot_a uuid;
  v_slot_b uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_request FROM swap_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Swap request not found';
  END IF;
  IF v_request.target_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the swap target can respond';
  END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'This request has already been handled';
  END IF;

  IF NOT p_accept THEN
    UPDATE swap_requests SET status = 'declined', responded_at = now() WHERE id = p_request_id;
    RETURN;
  END IF;

  -- Re-validate both members still hold upcoming slots before swapping
  SELECT id INTO v_slot_a FROM payout_schedule
    WHERE group_id = v_request.group_id AND user_id = v_request.requester_id AND status = 'upcoming'
    ORDER BY payout_month LIMIT 1;
  SELECT id INTO v_slot_b FROM payout_schedule
    WHERE group_id = v_request.group_id AND user_id = v_request.target_id AND status = 'upcoming'
    ORDER BY payout_month LIMIT 1;

  IF v_slot_a IS NULL OR v_slot_b IS NULL THEN
    UPDATE swap_requests SET status = 'declined', responded_at = now() WHERE id = p_request_id;
    RAISE EXCEPTION 'Swap no longer possible: an upcoming turn changed since the request';
  END IF;

  -- Atomic swap of the two payout positions
  UPDATE payout_schedule SET user_id = v_request.target_id    WHERE id = v_slot_a;
  UPDATE payout_schedule SET user_id = v_request.requester_id WHERE id = v_slot_b;

  UPDATE swap_requests SET status = 'accepted', responded_at = now() WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_payout_swap(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request swap_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_request FROM swap_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Swap request not found';
  END IF;
  IF v_request.requester_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the requester can cancel';
  END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'This request has already been handled';
  END IF;

  UPDATE swap_requests SET status = 'cancelled', responded_at = now() WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_payout_swap(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.respond_payout_swap(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_payout_swap(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_payout_swap(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_payout_swap(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payout_swap(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_requests;