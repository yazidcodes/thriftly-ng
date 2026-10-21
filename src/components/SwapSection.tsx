import { useMemo, useState } from "react";
import { Repeat2, Check, X, Clock, Send, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGroupMembers,
  usePayoutSchedule,
  useSwapRequests,
  useRequestSwap,
  useRespondSwap,
  useCancelSwap,
  type GroupRow,
} from "@/hooks/useSupabase";
import SwapRequestDialog, { type SwapCandidate } from "./SwapRequestDialog";

const SwapSection = ({ group }: { group: GroupRow }) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: members = [] } = useGroupMembers(group.id);
  const { data: payoutScheduleData = [] } = usePayoutSchedule(group.id);
  const { data: swapRequests = [] } = useSwapRequests(group.id);

  const requestSwap = useRequestSwap(group.id);
  const respondSwap = useRespondSwap(group.id);
  const cancelSwap = useCancelSwap(group.id);

  const me = user?.id ?? "";

  // Names for request banners
  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.user_id, m.profiles?.username ?? "Unknown");
    return map;
  }, [members]);

  // My upcoming slot?
  const myUpcomingMonth = useMemo(() => {
    const entry = payoutScheduleData.find(
      (e) => e.user_id === me && e.status === "upcoming"
    );
    return entry?.payout_month ?? null;
  }, [payoutScheduleData, me]);

  // Eligible candidates: same group, upcoming (unpaid) turn, not me
  const candidates: SwapCandidate[] = useMemo(() => {
    return members
      .filter((m) => m.user_id !== me)
      .filter((m) =>
        payoutScheduleData.some(
          (e) => e.user_id === m.user_id && e.status === "upcoming"
        )
      )
      .map((m) => ({
        userId: m.user_id,
        username: m.profiles?.username ?? "Unknown",
        upcomingMonth:
          payoutScheduleData.find((e) => e.user_id === m.user_id && e.status === "upcoming")
            ?.payout_month ?? 0,
      }))
      .sort((a, b) => a.upcomingMonth - b.upcomingMonth);
  }, [members, payoutScheduleData, me]);

  // Incoming pending requests addressed to me
  const incoming = useMemo(
    () => swapRequests.filter((r) => r.status === "pending" && r.target_id === me),
    [swapRequests, me]
  );

  // My most recent outgoing request (for status display)
  const myLatest = useMemo(() => {
    const mine = swapRequests
      .filter((r) => r.requester_id === me)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return mine[0] ?? null;
  }, [swapRequests, me]);

  if (!user) return null;

  const canRequest = myUpcomingMonth !== null && candidates.length > 0;

  return (
    <>
      {/* Incoming requests */}
      {incoming.map((req) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-2xl border-primary/30 bg-accent/40 shadow-md">
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Repeat2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-foreground">
                    {nameMap.get(req.requester_id) ?? "A member"} requested a swap with you
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reason: <span className="font-medium text-foreground">{req.reason}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={respondSwap.isPending}
                  onClick={() => respondSwap.mutate({ requestId: req.id, accept: false })}
                  className="min-h-[44px] gap-2 rounded-xl font-bold"
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  disabled={respondSwap.isPending}
                  onClick={() => respondSwap.mutate({ requestId: req.id, accept: true })}
                  className="min-h-[44px] gap-2 rounded-xl font-bold shadow-md"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* My outgoing request status */}
      {myLatest && myLatest.status === "pending" && (
        <Card className="rounded-2xl border-border/50 bg-secondary/50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              Waiting for{" "}
              <span className="font-semibold text-foreground">
                {nameMap.get(myLatest.target_id) ?? "member"}
              </span>{" "}
              to respond to your swap request.
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={cancelSwap.isPending}
              onClick={() => cancelSwap.mutate({ requestId: myLatest.id })}
              className="min-h-[44px] shrink-0 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
      {myLatest && myLatest.status === "declined" && (
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {nameMap.get(myLatest.target_id) ?? "Member"}
              </span>{" "}
              declined your swap request.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Request swap trigger */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Repeat2 className="h-4 w-4 text-primary" />
              Emergency Turn Swap
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {myUpcomingMonth === null
                ? "You have no upcoming payout turn to swap."
                : candidates.length === 0
                ? "No other members have an upcoming turn to swap with right now."
                : `Your payout turn is Month ${myUpcomingMonth}. Request to swap it with another member.`}
            </p>
          </div>
          <Button
            size="sm"
            disabled={!canRequest || requestSwap.isPending}
            onClick={() => setDialogOpen(true)}
            className="min-h-[44px] shrink-0 gap-2 rounded-xl font-bold shadow-md"
          >
            <Send className="h-4 w-4" />
            Request Swap
          </Button>
        </CardContent>
      </Card>

      <SwapRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidates={candidates}
        isSubmitting={requestSwap.isPending}
        onSubmit={(targetId, reason) => {
          requestSwap.mutate(
            { targetId, reason },
            { onSuccess: () => setDialogOpen(false) }
          );
        }}
      />
    </>
  );
};

export default SwapSection;
