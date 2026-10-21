import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const useRealtime = (
  channelName: string,
  table: string,
  filter: string | undefined,
  queryKey: readonly unknown[],
  qc: QueryClient,
) => {
  useEffect(() => {
    const config: { event: "INSERT" | "UPDATE" | "DELETE" | "*"; schema: "public"; table: string; filter?: string } = {
      event: "*",
      schema: "public",
      table,
    };
    if (filter) config.filter = filter;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", config, () => qc.invalidateQueries({ queryKey }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelName, table, filter, queryKey, qc]);
};

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
  debt_balance: number;
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
  const qc = useQueryClient();
  const queryKey = ["groups", user?.id] as const;
  useRealtime("groups_realtime", "groups", undefined, queryKey, qc);
  return useQuery({
    queryKey,
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
  const qc = useQueryClient();
  const queryKey = ["group_members", groupId] as const;
  useRealtime(`gm_realtime_${groupId}`, "group_members", groupId ? `group_id=eq.${groupId}` : undefined, queryKey, qc);
  return useQuery({
    queryKey,
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
  const qc = useQueryClient();
  const queryKey = ["contributions", groupId, cycleMonth] as const;
  useRealtime(`contrib_realtime_${groupId}`, "contributions", groupId ? `group_id=eq.${groupId}` : undefined, queryKey, qc);
  return useQuery({
    queryKey,
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
      const { error } = await supabase.rpc("update_contribution_status", {
        p_contribution_id: contributionId,
        p_status: status,
        p_amount: amount ?? 0,
      });
      if (error) throw error;
    },
    onMutate: async ({ contributionId, status, amount }) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ["contributions"] });
      await qc.cancelQueries({ queryKey: ["group_members"] });

      // Snapshot previous values
      const prevContributions = qc.getQueriesData({ queryKey: ["contributions"] });
      const prevMembers = qc.getQueriesData({ queryKey: ["group_members"] });

      // Optimistically update contributions cache
      qc.setQueriesData({ queryKey: ["contributions"] }, (old: ContributionRow[] | undefined) => {
        if (!old) return old;
        return old.map((c) =>
          c.id === contributionId
            ? { ...c, status, amount: status === "paid" ? (amount ?? c.amount) : 0, paid_at: status === "paid" ? new Date().toISOString() : null }
            : c
        );
      });

      return { prevContributions, prevMembers };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.prevContributions) {
        for (const [key, data] of context.prevContributions) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.prevMembers) {
        for (const [key, data] of context.prevMembers) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
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
  const qc = useQueryClient();
  const queryKey = ["payout_schedule", groupId] as const;
  useRealtime(`ps_realtime_${groupId}`, "payout_schedule", groupId ? `group_id=eq.${groupId}` : undefined, queryKey, qc);
  return useQuery({
    queryKey,
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
      nextCycleMonth,
    }: {
      groupId: string;
      recipientId: string;
      cycleMonth: number;
      amount: number;
      nextCycleMonth: number;
    }) => {
      const { error } = await supabase.rpc("complete_payout", {
        p_group_id: groupId,
        p_recipient_id: recipientId,
        p_cycle_month: cycleMonth,
        p_amount: amount,
        p_next_cycle_month: nextCycleMonth,
      });
      if (error) throw error;
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
  const qc = useQueryClient();
  const queryKey = ["payout_history", groupId] as const;
  useRealtime(`ph_realtime_${groupId}`, "payout_history", groupId ? `group_id=eq.${groupId}` : undefined, queryKey, qc);
  return useQuery({
    queryKey,
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

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      newDebtBalance,
    }: {
      groupId: string;
      userId: string;
      newDebtBalance: number;
    }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ debt_balance: Math.max(0, newDebtBalance) })
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group_members"] });
      toast.success("Debt balance updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Emergency Turn Swap ──

export interface SwapRequestRow {
  id: string;
  group_id: string;
  requester_id: string;
  target_id: string;
  reason: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  responded_at: string | null;
}

export function useSwapRequests(groupId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["swap_requests", groupId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swap_requests")
        .select("*")
        .eq("group_id", groupId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SwapRequestRow[];
    },
    enabled: !!groupId && !!user,
  });

  // Realtime listener — cleaned up on unmount to avoid leaks
  useEffect(() => {
    if (!groupId || !user) return;
    const channel = supabase
      .channel(`swap_requests_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "swap_requests",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["swap_requests", groupId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, qc]);

  return query;
}

export function useRequestSwap(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, reason }: { targetId: string; reason: string }) => {
      const { error } = await supabase.rpc("request_payout_swap", {
        p_group_id: groupId!,
        p_target_id: targetId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["swap_requests", groupId] });
      toast.success("Swap request sent!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRespondSwap(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_payout_swap", {
        p_request_id: requestId,
        p_accept: accept,
      });
      if (error) throw error;
    },
    // Optimistic UI: reflect the response immediately
    onMutate: async ({ requestId, accept }) => {
      await qc.cancelQueries({ queryKey: ["swap_requests", groupId] });
      const prev = qc.getQueriesData({ queryKey: ["swap_requests", groupId] });
      qc.setQueriesData({ queryKey: ["swap_requests", groupId] }, (old: SwapRequestRow[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === requestId
                ? { ...r, status: (accept ? "accepted" : "declined") as SwapRequestRow["status"] }
                : r
            )
          : old
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        for (const [key, data] of context.prev) qc.setQueryData(key, data);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["swap_requests", groupId] });
      qc.invalidateQueries({ queryKey: ["payout_schedule", groupId] });
    },
  });
}

export function useCancelSwap(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const { error } = await supabase.rpc("cancel_payout_swap", {
        p_request_id: requestId,
      });
      if (error) throw error;
    },
    onMutate: async ({ requestId }) => {
      await qc.cancelQueries({ queryKey: ["swap_requests", groupId] });
      const prev = qc.getQueriesData({ queryKey: ["swap_requests", groupId] });
      qc.setQueriesData({ queryKey: ["swap_requests", groupId] }, (old: SwapRequestRow[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === requestId ? { ...r, status: "cancelled" as SwapRequestRow["status"] } : r
            )
          : old
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        for (const [key, data] of context.prev) qc.setQueryData(key, data);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["swap_requests", groupId] });
    },
  });
}
