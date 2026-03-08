
CREATE OR REPLACE FUNCTION public.update_contribution_status(
  p_contribution_id uuid,
  p_status text,
  p_amount numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_monthly numeric;
  v_trust integer;
  v_debt numeric;
  v_delta integer;
BEGIN
  -- 1. Update contribution
  UPDATE contributions
  SET status = p_status,
      amount = CASE WHEN p_status = 'paid' THEN p_amount ELSE 0 END,
      paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  WHERE id = p_contribution_id
  RETURNING user_id, group_id INTO v_user_id, v_group_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Contribution not found';
  END IF;

  -- 2. Get current member stats
  SELECT trust_score, debt_balance INTO v_trust, v_debt
  FROM group_members
  WHERE group_id = v_group_id AND user_id = v_user_id;

  -- 3. Calculate trust delta
  v_delta := CASE WHEN p_status = 'paid' THEN 2 ELSE -5 END;
  v_trust := GREATEST(0, LEAST(100, v_trust + v_delta));

  -- 4. If missed, add to debt
  IF p_status = 'missed' THEN
    SELECT monthly_contribution INTO v_monthly FROM groups WHERE id = v_group_id;
    v_debt := v_debt + v_monthly;
  END IF;

  -- 5. Update member
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
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Record payout history
  INSERT INTO payout_history (group_id, recipient_id, cycle_month, amount)
  VALUES (p_group_id, p_recipient_id, p_cycle_month, p_amount);

  -- 2. Mark current schedule entry as completed
  UPDATE payout_schedule
  SET status = 'completed'
  WHERE group_id = p_group_id AND payout_month = p_cycle_month;

  -- 3. Promote next to current
  UPDATE payout_schedule
  SET status = 'current'
  WHERE group_id = p_group_id AND payout_month = p_next_cycle_month;

  -- 4. Create contributions for next cycle from existing members
  INSERT INTO contributions (group_id, user_id, cycle_month, amount, status)
  SELECT p_group_id, user_id, p_next_cycle_month, 0, 'pending'
  FROM group_members
  WHERE group_id = p_group_id;
END;
$$;
