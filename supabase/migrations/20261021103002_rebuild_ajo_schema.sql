/*
# Ajo — reconcile schema to match existing frontend

1. Purpose
   The existing Lovable frontend expects a specific schema (group_name, admin_id,
   monthly_contribution, cycle_length, trust_score, debt_balance, etc.) plus
   swap_requests table and swap RPC functions. An earlier migration created
   mismatched tables. This migration drops those empty mismatched tables and
   recreates the full correct schema with RLS, RPCs, trigger, and realtime.

2. Dropped (empty, no data loss)
   - public.profiles (mismatched columns)
   - public.groups (mismatched columns)
   - public.group_members (mismatched columns)

3. Recreated tables (matching frontend types.ts)
   - profiles: id, user_id, username, email, trust_score, created_at
   - groups: id, group_name, admin_id, monthly_contribution, cycle_length,
     payout_day, payout_schedule_generated, created_at
   - group_members: id, group_id, user_id, joined_at, trust_score, debt_balance
   - contributions: id, group_id, user_id, cycle_month, amount, status, paid_at
   - payout_schedule: id, group_id, user_id, payout_month, status
   - payout_history: id, group_id, recipient_id, cycle_month, amount, paid_at
   - swap_requests: id, group_id, requester_id, target_id, reason, status,
     created_at, responded_at

4. Functions
   - is_group_member, is_group_admin (helper checks)
   - handle_new_user (auto-create profile on signup)
   - update_contribution_status (mark paid/missed + trust/debt update)
   - complete_payout (record history, advance schedule, seed next cycle)
   - request_payout_swap, respond_payout_swap, cancel_payout_swap

5. Security
   - RLS on all tables. Groups/members/contributions/payouts scoped to group
     membership. Profiles: authenticated can view all (needed for member search).
     Swap requests: members can view; members can request; targets respond;
     requesters cancel.

6. Realtime
   - All seven tables added to supabase_realtime publication.
*/

-- ── Drop mismatched empty tables from earlier migration ──
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── profiles ──
CREATE TABLE public.profiles (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text NOT NULL,
  email       text NOT NULL,
  trust_score integer NOT NULL DEFAULT 100,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── groups ──
CREATE TABLE public.groups (
  id                        uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name                text NOT NULL,
  admin_id                  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_contribution      numeric NOT NULL,
  cycle_length              integer NOT NULL,
  payout_day                integer,
  payout_schedule_generated boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- ── group_members ──
CREATE TABLE public.group_members (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id     uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  trust_score  integer NOT NULL DEFAULT 100,
  debt_balance numeric NOT NULL DEFAULT 0,
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ── contributions ──
CREATE TABLE public.contributions (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_month integer NOT NULL,
  amount      numeric NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','missed')),
  paid_at     timestamptz
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- ── payout_schedule ──
CREATE TABLE public.payout_schedule (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id     uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_month integer NOT NULL,
  status       text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','current','completed')),
  UNIQUE(group_id, payout_month)
);
ALTER TABLE public.payout_schedule ENABLE ROW LEVEL SECURITY;

-- ── payout_history ──
CREATE TABLE public.payout_history (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id     uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_month  integer NOT NULL,
  amount       numeric NOT NULL,
  paid_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

-- ── swap_requests ──
CREATE TABLE public.swap_requests (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id     uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason       text NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;

-- ══════════ Helper functions ══════════
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE user_id = _user_id AND group_id = _group_id)
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id AND admin_id = _user_id)
$$;

-- ══════════ RLS policies ══════════

-- profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- groups
DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select" ON public.groups
  FOR SELECT TO authenticated USING (admin_id = auth.uid() OR public.is_group_member(auth.uid(), id));
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
CREATE POLICY "groups_insert" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (admin_id = auth.uid());
DROP POLICY IF EXISTS "groups_update" ON public.groups;
CREATE POLICY "groups_update" ON public.groups
  FOR UPDATE TO authenticated USING (admin_id = auth.uid());
DROP POLICY IF EXISTS "groups_delete" ON public.groups;
CREATE POLICY "groups_delete" ON public.groups
  FOR DELETE TO authenticated USING (admin_id = auth.uid());

-- group_members
DROP POLICY IF EXISTS "gm_select" ON public.group_members;
CREATE POLICY "gm_select" ON public.group_members
  FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "gm_insert" ON public.group_members;
CREATE POLICY "gm_insert" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "gm_update" ON public.group_members;
CREATE POLICY "gm_update" ON public.group_members
  FOR UPDATE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "gm_delete" ON public.group_members;
CREATE POLICY "gm_delete" ON public.group_members
  FOR DELETE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));

-- contributions
DROP POLICY IF EXISTS "contrib_select" ON public.contributions;
CREATE POLICY "contrib_select" ON public.contributions
  FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "contrib_insert" ON public.contributions;
CREATE POLICY "contrib_insert" ON public.contributions
  FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "contrib_update" ON public.contributions;
CREATE POLICY "contrib_update" ON public.contributions
  FOR UPDATE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));

-- payout_schedule
DROP POLICY IF EXISTS "ps_select" ON public.payout_schedule;
CREATE POLICY "ps_select" ON public.payout_schedule
  FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "ps_insert" ON public.payout_schedule;
CREATE POLICY "ps_insert" ON public.payout_schedule
  FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "ps_update" ON public.payout_schedule;
CREATE POLICY "ps_update" ON public.payout_schedule
  FOR UPDATE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));

-- payout_history
DROP POLICY IF EXISTS "ph_select" ON public.payout_history;
CREATE POLICY "ph_select" ON public.payout_history
  FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
DROP POLICY IF EXISTS "ph_insert" ON public.payout_history;
CREATE POLICY "ph_insert" ON public.payout_history
  FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(auth.uid(), group_id));

-- swap_requests
DROP POLICY IF EXISTS "sr_select" ON public.swap_requests;
CREATE POLICY "sr_select" ON public.swap_requests
  FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
DROP POLICY IF EXISTS "sr_insert" ON public.swap_requests;
CREATE POLICY "sr_insert" ON public.swap_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND public.is_group_member(auth.uid(), group_id));
DROP POLICY IF EXISTS "sr_update" ON public.swap_requests;
CREATE POLICY "sr_update" ON public.swap_requests
  FOR UPDATE TO authenticated USING (target_id = auth.uid() OR requester_id = auth.uid());

-- ══════════ Auto-create profile on signup ══════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════ Contribution / payout RPCs ══════════
CREATE OR REPLACE FUNCTION public.update_contribution_status(
  p_contribution_id uuid,
  p_status text,
  p_amount numeric DEFAULT 0
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_monthly numeric;
  v_trust integer;
  v_debt numeric;
  v_delta integer;
BEGIN
  UPDATE contributions
  SET status = p_status,
      amount = CASE WHEN p_status = 'paid' THEN p_amount ELSE 0 END,
      paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  WHERE id = p_contribution_id
  RETURNING user_id, group_id INTO v_user_id, v_group_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Contribution not found';
  END IF;

  SELECT trust_score, debt_balance INTO v_trust, v_debt
  FROM group_members WHERE group_id = v_group_id AND user_id = v_user_id;

  v_delta := CASE WHEN p_status = 'paid' THEN 2 ELSE -5 END;
  v_trust := GREATEST(0, LEAST(100, v_trust + v_delta));

  IF p_status = 'missed' THEN
    SELECT monthly_contribution INTO v_monthly FROM groups WHERE id = v_group_id;
    v_debt := v_debt + v_monthly;
  END IF;

  UPDATE group_members
  SET trust_score = v_trust, debt_balance = v_debt
  WHERE group_id = v_group_id AND user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_payout(
  p_group_id uuid,
  p_recipient_id uuid,
  p_cycle_month integer,
  p_amount numeric,
  p_next_cycle_month integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO payout_history (group_id, recipient_id, cycle_month, amount)
  VALUES (p_group_id, p_recipient_id, p_cycle_month, p_amount);

  UPDATE payout_schedule SET status = 'completed'
  WHERE group_id = p_group_id AND payout_month = p_cycle_month;

  UPDATE payout_schedule SET status = 'current'
  WHERE group_id = p_group_id AND payout_month = p_next_cycle_month;

  INSERT INTO contributions (group_id, user_id, cycle_month, amount, status)
  SELECT p_group_id, user_id, p_next_cycle_month, 0, 'pending'
  FROM group_members WHERE group_id = p_group_id;
END;
$$;

-- ══════════ Swap RPCs ══════════
CREATE OR REPLACE FUNCTION public.request_payout_swap(
  p_group_id uuid,
  p_target_id uuid,
  p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_group_member(auth.uid(), p_group_id) THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;
  INSERT INTO swap_requests (group_id, requester_id, target_id, reason)
  VALUES (p_group_id, auth.uid(), p_target_id, p_reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_payout_swap(
  p_request_id uuid,
  p_accept boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group_id uuid;
  v_requester_id uuid;
  v_target_id uuid;
  v_req_month integer;
  v_tgt_month integer;
BEGIN
  SELECT group_id, requester_id, target_id INTO v_group_id, v_requester_id, v_target_id
  FROM swap_requests WHERE id = p_request_id AND status = 'pending';

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Swap request not found or already resolved';
  END IF;
  IF auth.uid() <> v_target_id THEN
    RAISE EXCEPTION 'Only the target can respond';
  END IF;

  IF p_accept THEN
    UPDATE swap_requests SET status = 'accepted', responded_at = now() WHERE id = p_request_id;
    -- Swap payout months between requester and target
    SELECT payout_month INTO v_req_month FROM payout_schedule WHERE group_id = v_group_id AND user_id = v_requester_id;
    SELECT payout_month INTO v_tgt_month FROM payout_schedule WHERE group_id = v_group_id AND user_id = v_target_id;
    UPDATE payout_schedule SET user_id = v_target_id WHERE group_id = v_group_id AND payout_month = v_req_month;
    UPDATE payout_schedule SET user_id = v_requester_id WHERE group_id = v_group_id AND payout_month = v_tgt_month;
  ELSE
    UPDATE swap_requests SET status = 'declined', responded_at = now() WHERE id = p_request_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_payout_swap(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE swap_requests SET status = 'cancelled', responded_at = now()
  WHERE id = p_request_id AND requester_id = auth.uid() AND status = 'pending';
END;
$$;

-- ══════════ Realtime publication ══════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'groups') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'group_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contributions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payout_schedule') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_schedule;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payout_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_history;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'swap_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_requests;
  END IF;
END $$;
