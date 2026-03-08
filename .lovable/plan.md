
# Fix Payout Schedule Generation Logic

## Problem Analysis
The Samaru group shows the bug clearly:
- `cycle_length`: 5
- `payout_schedule` entries: only 2 (both completed)
- After month 2 completes, there's no "current" entry → stuck state

Current code: `shuffled.slice(0, cycleLength)` only creates entries up to the member count, not the full cycle.

## Solution

### 1. Fix Client-Side Schedule Generation (`useGeneratePayoutSchedule`)
Generate entries for the full `cycleLength` using modulo rotation:

```typescript
// Create entries for full cycle with member rotation
const entries = Array.from({ length: cycleLength }, (_, i) => ({
  group_id: groupId,
  user_id: shuffled[i % shuffled.length].userId,
  payout_month: i + 1,
  status: i === 0 ? "current" : "upcoming",
}));
```

### 2. Update `complete_payout` RPC
Add `ON CONFLICT DO NOTHING` for contributions insert (prevent duplicates), and ensure the "promote next to current" step handles the case when the entry exists.

### 3. Add Database Function to Repair Broken Groups
Create `repair_payout_schedule(p_group_id)` that:
- Gets the current highest completed payout_month
- Gets cycle_length and member list
- Generates missing entries from (last_completed + 1) to cycle_length using modulo rotation
- Sets the first missing entry as "current"

### 4. Add Unique Constraints (prevents duplicate data)
- `contributions`: unique on `(group_id, user_id, cycle_month)`
- `payout_schedule`: unique on `(group_id, payout_month)`

### Files to Change
| File | Change |
|------|--------|
| `src/hooks/useSupabase.ts` | Fix `useGeneratePayoutSchedule` to use modulo rotation |
| New migration | Add `repair_payout_schedule` function + unique constraints |
| `src/components/GroupDashboard.tsx` | Add "Repair Schedule" button for stuck groups |

### Edge Cases Handled
- **members < cycle_length**: Rotates members (A, B, A, B, A for 2 members over 5 months)
- **members = cycle_length**: Each member gets one payout month
- **members > cycle_length**: Only first `cycle_length` shuffled members get payouts
- **Stuck groups**: Repair function regenerates missing entries

