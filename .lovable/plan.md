

## Fix: Add Missing UPDATE Policy on group_members

### Problem
The `useCompletePayout` hook updates `trust_score` on `group_members` after each payout, but the table has no UPDATE RLS policy — so this operation silently fails.

### Database Migration
Add one RLS policy:

```sql
CREATE POLICY "Admins can update members"
ON public.group_members FOR UPDATE
USING (is_group_admin(auth.uid(), group_id));
```

### No Code Changes Needed
The hooks in `useSupabase.ts` and all components are already wired to use the database correctly. Once this policy is added, the full payout workflow (create group → add members → generate schedule → complete payout → advance cycle) will work end-to-end.

### Summary
- 1 database migration (add UPDATE policy on `group_members`)
- 0 code file changes

