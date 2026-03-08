import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ──
export interface GroupRow {
  id: string;
  group_name: string;
  admin_id: string;
  monthly_contribution: number;
  cycle_length: number;
  payout_day: number | null;
  payout_schedule_generated: boolean;
  created_at: string;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  trust_score: number;
  profiles?: { username: string; email: string } | null;
}

export interface ContributionRow {
  id: string;
  group_id: string;
  user_id: string;
  cycle_month: number;
  amount: number;
  status: string;
  paid_at: string | null;
}

export interface PayoutScheduleRow {
  id: string;
  group_id: string;
  user_id: string;
  payout_month: number;
  status: string;
  profiles?: { username: string } | null;
}

export interface PayoutHistoryRow {
  id: string;
  group_id: string;
  recipient_id: string;
  cycle_month: number;
  amount: number;
  paid_at: string;
  profiles?: { username: string } | null;
}

// ── Hooks ──

export function useGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GroupRow[];
    },
    enabled: !!user,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (group: {
      group_name: string;
      monthly_contribution: number;
      cycle_length: number;
      payout_day?: number;
    }) => {
      // Insert group
      const { data: newGroup, error } = await supabase
        .from("groups")
        .insert({
          group_name: group.group_name,
          admin_id: user!.id,
          monthly_contribution: group.monthly_contribution,
          cycle_length: group.cycle_length,
          payout_day: group.payout_day ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Add admin as first member
      await supabase.from("group_members").insert({
        group_id: newGroup.id,
        user_id: user!.id,
      });

      return newGroup as GroupRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group_members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId!)
        .order("joined_at");
      if (error) throw error;
      // Fetch profiles separately
      const userIds = (data ?? []).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, email")
        .in("user_id", userIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((m) => ({
        ...m,
        profiles: profileMap.get(m.user_id) ?? null,
      })) as GroupMemberRow[];
    },
    enabled: !!groupId,
  });
}

export function useAddMember(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId!, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group_members", groupId] });
      toast.success("Member added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useContributions(groupId: string | undefined, cycleMonth?: number) {
  return useQuery({
    queryKey: ["contributions", groupId, cycleMonth],
    queryFn: async () => {
      let query = supabase
        .from("contributions")
        .select("*")
        .eq("group_id", groupId!);
      if (cycleMonth !== undefined) {
        query = query.eq("cycle_month", cycleMonth);
      }
      const { data, error } = await query.order("cycle_month");
      if (error) throw error;
      return data as ContributionRow[];
    },
    enabled: !!groupId,
  });
}

export function useUpdateContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contributionId,
      status,
      amount,
    }: {
      contributionId: string;
      status: "paid" | "missed";
      amount?: number;
    }) => {
      // 1. Update the contribution
      const updates: Record<string, unknown> = { status };
      if (status === "paid") {
        updates.paid_at = new Date().toISOString();
        if (amount !== undefined) updates.amount = amount;
      }
      const { error } = await supabase
        .from("contributions")
        .update(updates)
        .eq("id", contributionId);
      if (error) throw error;

      // 2. Fetch the contribution to get user_id and group_id
      const { data: contrib } = await supabase
        .from("contributions")
        .select("user_id, group_id")
        .eq("id", contributionId)
        .single();
      if (!contrib) return;

      // 3. Adjust trust score
      const delta = status === "paid" ? 2 : -5;
      const { data: member } = await supabase
        .from("group_members")
        .select("trust_score")
        .eq("group_id", contrib.group_id)
        .eq("user_id", contrib.user_id)
        .single();
      if (member) {
        const newScore = Math.max(0, Math.min(100, member.trust_score + delta));
        await supabase
          .from("group_members")
          .update({ trust_score: newScore })
          .eq("group_id", contrib.group_id)
          .eq("user_id", contrib.user_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributions"] });
      qc.invalidateQueries({ queryKey: ["group_members"] });
    },
  });
}

export function useCreateContributionsForCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      cycleMonth,
      memberUserIds,
    }: {
      groupId: string;
      cycleMonth: number;
      memberUserIds: string[];
    }) => {
      const rows = memberUserIds.map((uid) => ({
        group_id: groupId,
        user_id: uid,
        cycle_month: cycleMonth,
        amount: 0,
        status: "pending" as const,
      }));
      const { error } = await supabase.from("contributions").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributions"] });
    },
  });
}

export function usePayoutSchedule(groupId: string | undefined) {
  return useQuery({
    queryKey: ["payout_schedule", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_schedule")
        .select("*")
        .eq("group_id", groupId!)
        .order("payout_month");
      if (error) throw error;
      const userIds = (data ?? []).map((d) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((d) => ({
        ...d,
        profiles: profileMap.get(d.user_id) ?? null,
      })) as PayoutScheduleRow[];
    },
    enabled: !!groupId,
  });
}

export function useGeneratePayoutSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      members,
      cycleLength,
    }: {
      groupId: string;
      members: { userId: string; username: string }[];
      cycleLength: number;
    }) => {
      // Shuffle
      const shuffled = [...members];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const entries = shuffled.slice(0, cycleLength).map((m, i) => ({
        group_id: groupId,
        user_id: m.userId,
        payout_month: i + 1,
        status: i === 0 ? "current" : "upcoming",
      }));

      const { error: insertErr } = await supabase
        .from("payout_schedule")
        .insert(entries);
      if (insertErr) throw insertErr;

      // Mark group
      const { error: updateErr } = await supabase
        .from("groups")
        .update({ payout_schedule_generated: true })
        .eq("id", groupId);
      if (updateErr) throw updateErr;

      // Create first cycle contributions
      const allMemberIds = members.map((m) => m.userId);
      const contribRows = allMemberIds.map((uid) => ({
        group_id: groupId,
        user_id: uid,
        cycle_month: 1,
        amount: 0,
        status: "pending" as const,
      }));
      await supabase.from("contributions").insert(contribRows);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payout_schedule"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["contributions"] });
      toast.success("Payout schedule generated and locked!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompletePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      recipientId,
      cycleMonth,
      amount,
      memberUserIds,
      nextCycleMonth,
    }: {
      groupId: string;
      recipientId: string;
      cycleMonth: number;
      amount: number;
      memberUserIds: string[];
      nextCycleMonth: number;
    }) => {
      // 1. Record payout history
      const { error: histErr } = await supabase.from("payout_history").insert({
        group_id: groupId,
        recipient_id: recipientId,
        cycle_month: cycleMonth,
        amount,
      });
      if (histErr) throw histErr;

      // 2. Mark current schedule entry as completed
      const { error: completeErr } = await supabase
        .from("payout_schedule")
        .update({ status: "completed" })
        .eq("group_id", groupId)
        .eq("payout_month", cycleMonth);
      if (completeErr) throw completeErr;

      // 3. Move next to current
      const { error: nextErr } = await supabase
        .from("payout_schedule")
        .update({ status: "current" })
        .eq("group_id", groupId)
        .eq("payout_month", nextCycleMonth);
      if (nextErr) throw nextErr;

      // 4. Create contributions for next cycle
      const contribRows = memberUserIds.map((uid) => ({
        group_id: groupId,
        user_id: uid,
        cycle_month: nextCycleMonth,
        amount: 0,
        status: "pending" as const,
      }));
      await supabase.from("contributions").insert(contribRows);

      // 5. Update member trust scores (bump for paid)
      for (const uid of memberUserIds) {
        await supabase.rpc("is_group_member", { _user_id: uid, _group_id: groupId });
        // Simple trust bump via group_members
        const { data: member } = await supabase
          .from("group_members")
          .select("trust_score")
          .eq("group_id", groupId)
          .eq("user_id", uid)
          .single();
        if (member) {
          await supabase
            .from("group_members")
            .update({ trust_score: Math.min(100, member.trust_score + 2) })
            .eq("group_id", groupId)
            .eq("user_id", uid);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payout_schedule"] });
      qc.invalidateQueries({ queryKey: ["payout_history"] });
      qc.invalidateQueries({ queryKey: ["contributions"] });
      qc.invalidateQueries({ queryKey: ["group_members"] });
      toast.success("Payout completed!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePayoutHistory(groupId: string | undefined) {
  return useQuery({
    queryKey: ["payout_history", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_history")
        .select("*")
        .eq("group_id", groupId!)
        .order("cycle_month");
      if (error) throw error;
      const recipientIds = (data ?? []).map((d) => d.recipient_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", recipientIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((d) => ({
        ...d,
        profiles: profileMap.get(d.recipient_id) ?? null,
      })) as PayoutHistoryRow[];
    },
    enabled: !!groupId,
  });
}

export function useSearchProfiles(query: string, excludeIds: string[]) {
  return useQuery({
    queryKey: ["search_profiles", query, excludeIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, email, trust_score")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return (data ?? []).filter((p) => !excludeIds.includes(p.user_id));
    },
    enabled: query.trim().length > 0,
  });
}
