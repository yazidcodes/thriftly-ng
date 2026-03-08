

# Performance Optimization Plan

## Problem
Every mutation (mark paid/missed, complete payout, etc.) makes **multiple sequential database calls** from the client. For example:
- `useUpdateContribution`: 4-5 sequential round-trips (update → fetch → fetch member → fetch group → update member)
- `useCompletePayout`: 5 steps + a **loop** that makes 2 calls **per member** sequentially (N members = 2N extra calls)
- No optimistic updates — UI waits for all calls to complete and refetch before updating

## Solution

### 1. Create server-side database functions to batch operations
Move multi-step logic into two database functions that execute in a single round-trip:

**`update_contribution_status(p_contribution_id, p_status, p_amount)`** — handles:
- Update contribution status/amount/paid_at
- Adjust trust score (+2 paid, -5 missed)
- Add to debt_balance if missed

**`complete_payout(p_group_id, p_recipient_id, p_cycle_month, p_amount, p_next_cycle_month)`** — handles:
- Insert payout history
- Mark current schedule as completed
- Promote next to current
- Create next cycle contributions
- Remove the per-member loop entirely (trust already handled by contribution updates)

### 2. Add optimistic updates to mutations
Use React Query's `onMutate` to instantly update the UI cache before the server responds, then reconcile on success/error. This makes button clicks feel instant.

### 3. Fix the duplicate key warning
The console shows duplicate keys in PayoutHistory — use `row.id` instead of `cycle_month` as the key.

### Files to change
- **New migration**: Two `CREATE FUNCTION` statements
- **`src/hooks/useSupabase.ts`**: Replace multi-call mutations with single `supabase.rpc()` calls + add optimistic updates
- **`src/components/PayoutHistory.tsx`**: Fix duplicate key

