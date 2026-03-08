import { useState, useMemo, useCallback } from "react";
import {
  Users, TrendingUp, ShieldCheck, DollarSign, Calendar, Shuffle,
  AlertTriangle, CheckCircle2, Timer, History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGroupMembers,
  useContributions,
  usePayoutSchedule,
  usePayoutHistory,
  useGeneratePayoutSchedule,
  useCompletePayout,
  useUpdateContribution,
  useAddMember,
  useUpdateDebt,
  type GroupRow,
} from "@/hooks/useSupabase";
import MemberCard from "./MemberCard";
import MemberSearchBar from "./MemberSearchBar";
import PayoutTimeline, { type PayoutEntry } from "./PayoutTimeline";
import ConfirmPayoutDialog from "./ConfirmPayoutDialog";
import PayoutHistory from "./PayoutHistory";
import { getTrustTier, getTrustLabel } from "@/lib/members";

interface GroupDashboardProps {
  group: GroupRow;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const GroupDashboard = ({ group }: GroupDashboardProps) => {
  const { user } = useAuth();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: members = [] } = useGroupMembers(group.id);
  const { data: payoutScheduleData = [] } = usePayoutSchedule(group.id);
  const { data: payoutHistoryData = [] } = usePayoutHistory(group.id);
  const generatePayout = useGeneratePayoutSchedule();
  const completePayout = useCompletePayout();
  const updateContribution = useUpdateContribution();
  const addMember = useAddMember(group.id);
  const updateDebt = useUpdateDebt();

  const expectedAmount = group.monthly_contribution;
  const cycleLength = group.cycle_length;

  // Current cycle month = last completed + 1, or first current entry
  const currentEntry = payoutScheduleData.find((e) => e.status === "current");
  const currentPayoutMonth = currentEntry?.payout_month ?? 1;

  const { data: contributions = [] } = useContributions(group.id, currentPayoutMonth);

  // Map members with their contribution status
  const memberList = useMemo(() => {
    return members.map((m) => {
      const contrib = contributions.find((c) => c.user_id === m.user_id);
      return {
        ...m,
        username: m.profiles?.username ?? "Unknown",
        email: m.profiles?.email ?? "",
        contributionStatus: contrib?.status ?? "pending",
        contributionId: contrib?.id,
        contributionAmount: contrib?.amount ?? 0,
        debt_balance: m.debt_balance ?? 0,
      };
    });
  }, [members, contributions]);

  // Payout entries for timeline
  const payoutEntries: PayoutEntry[] = useMemo(() => {
    return payoutScheduleData.map((e) => ({
      month: e.payout_month,
      memberName: e.profiles?.username ?? "Unknown",
      status: e.status as "completed" | "current" | "upcoming",
    }));
  }, [payoutScheduleData]);

  // Stats
  const totalCollected = contributions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Number(c.amount), 0);
  const avgTrust = memberList.length
    ? Math.round(memberList.reduce((s, m) => s + m.trust_score, 0) / memberList.length)
    : 0;
  const paidContributions = contributions.filter((c) => c.status === "paid");
  const payoutAmount = paidContributions.reduce((s, c) => s + Number(c.amount), 0) || expectedAmount * members.length;

  const canGeneratePayout = members.length >= 2 && !group.payout_schedule_generated;
  const atLeastOnePaid = memberList.some((m) => m.contributionStatus === "paid");
  const allResolved = memberList.length > 0 && memberList.every((m) => m.contributionStatus === "paid" || m.contributionStatus === "missed");
  const currentCycleCompleted = payoutHistoryData.some((r) => r.cycle_month === currentPayoutMonth);
  const unpaidMembers = memberList.filter((m) => m.contributionStatus === "pending");
  const paidOutUserIds = new Set(payoutHistoryData.map((r) => r.recipient_id));

  const payoutReady = payoutScheduleData.length > 0 && currentEntry && allResolved && atLeastOnePaid && !currentCycleCompleted;
  const showPayoutWarning = payoutScheduleData.length > 0 && currentEntry && !allResolved && !currentCycleCompleted && unpaidMembers.length > 0;
  const cycleFullyCompleted = payoutScheduleData.length > 0 && !currentEntry && payoutHistoryData.length > 0;

  // Payout countdown
  const payoutDay = group.payout_day ?? 15;
  const now = new Date();
  const nextPayoutDate = new Date(now.getFullYear(), now.getMonth(), payoutDay);
  if (nextPayoutDate <= now) nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
  const daysUntilPayout = Math.ceil((nextPayoutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handleGeneratePayout = useCallback(() => {
    const memberData = members.map((m) => ({
      userId: m.user_id,
      username: m.profiles?.username ?? "Unknown",
    }));
    generatePayout.mutate({
      groupId: group.id,
      members: memberData,
      cycleLength,
    });
  }, [members, cycleLength, group.id, generatePayout]);

  const handleCompletePayout = useCallback(() => {
    if (!currentEntry) return;
    const actualPayoutAmount = paidContributions.reduce((s, c) => s + Number(c.amount), 0);
    completePayout.mutate({
      groupId: group.id,
      recipientId: currentEntry.user_id,
      cycleMonth: currentPayoutMonth,
      amount: actualPayoutAmount,
      nextCycleMonth: currentPayoutMonth + 1,
    });
  }, [currentEntry, group.id, currentPayoutMonth, paidContributions, members, completePayout]);

  const handleMarkPaid = useCallback(
    (contributionId: string, amount: number) => {
      updateContribution.mutate({ contributionId, status: "paid", amount });
    },
    [updateContribution]
  );

  const handleMarkMissed = useCallback(
    (contributionId: string) => {
      updateContribution.mutate({ contributionId, status: "missed" });
    },
    [updateContribution]
  );

  const handleAddMember = useCallback(
    (userId: string) => {
      addMember.mutate(userId);
    },
    [addMember]
  );

  const handleUpdateDebt = useCallback(
    (userId: string, newDebt: number) => {
      updateDebt.mutate({ groupId: group.id, userId, newDebtBalance: newDebt });
    },
    [updateDebt, group.id]
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6"
    >
      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Group Card */}
        <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-border" />
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                <Users className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Group</span>
            </div>
            <p className="text-xl font-extrabold text-foreground truncate">{group.group_name}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{cycleLength}-month cycle · ₦{expectedAmount.toLocaleString()}/mo</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                <Users className="h-3 w-3" />
                {members.length} members
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-success" />
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-light">
                <DollarSign className="h-4.5 w-4.5 text-success" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Collected</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">₦{totalCollected.toLocaleString()}</p>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Collection progress</span>
                <span className="font-bold">{Math.min(100, Math.round((totalCollected / Math.max(expectedAmount * members.length, 1)) * 100))}%</span>
              </div>
              <Progress
                value={Math.min(100, Math.round((totalCollected / Math.max(expectedAmount * members.length, 1)) * 100))}
                className="h-1.5 rounded-full bg-secondary [&>div]:bg-success"
              />
            </div>
          </CardContent>
        </Card>

        {/* Average Trust Score */}
        {(() => {
          const trustTier = getTrustTier(avgTrust);
          const trustLabel = getTrustLabel(trustTier);
          const trustBadgeClass = trustTier === "high"
            ? "bg-success-light text-success border-success/20"
            : trustTier === "moderate"
            ? "bg-warning-light text-warning border-warning/20"
            : "bg-destructive/10 text-destructive border-destructive/20";
          return (
            <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-stat-trust" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stat-trust-light">
                    <ShieldCheck className="h-4.5 w-4.5 text-stat-trust" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Trust Score</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-foreground">{avgTrust}%</p>
                  <Badge variant="outline" className={`text-[10px] font-bold border ${trustBadgeClass}`}>
                    {trustLabel}
                  </Badge>
                </div>
                <div className="mt-3">
                  <Progress
                    value={avgTrust}
                    className={`h-1.5 rounded-full bg-secondary ${
                      trustTier === "high" ? "[&>div]:bg-success" : trustTier === "moderate" ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Next Payout / Active Members */}
        {payoutScheduleData.length > 0 && currentEntry ? (
          <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                  <Timer className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Payout</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                    {(currentEntry.profiles?.username ?? "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-foreground truncate">{currentEntry.profiles?.username ?? "Unknown"}</p>
                  <p className="text-lg font-extrabold text-primary">₦{payoutAmount.toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Cycle Month: {currentPayoutMonth}</p>

              {currentCycleCompleted ? (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-success font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  Payout for this cycle has already been completed.
                </div>
              ) : showPayoutWarning ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-1.5 text-xs text-warning font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Pending contributions detected. Mark all members as paid or missed to enable payout.</span>
                  </div>
                  <Button disabled className="w-full gap-2 rounded-xl font-bold shadow-md opacity-50 cursor-not-allowed" size="sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Payout
                  </Button>
                </div>
              ) : payoutReady ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
                    <CheckCircle2 className="h-3 w-3" />
                    Status: Ready for Payout
                  </div>
                  <Button
                    onClick={() => setConfirmDialogOpen(true)}
                    className="w-full gap-2 rounded-xl font-bold shadow-md hover:shadow-lg transition-shadow"
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Payout
                  </Button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span className="font-semibold">Payout in {daysUntilPayout} days</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : cycleFullyCompleted ? (
          <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-success" />
            <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-sm font-extrabold text-foreground">All Payouts Complete</p>
              <p className="text-xs text-muted-foreground">The full cycle has been completed.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-stat-members" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stat-members-light">
                  <Users className="h-4.5 w-4.5 text-stat-members" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Members</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{members.length}</p>
              <div className="mt-3 flex items-center -space-x-2">
                {memberList.slice(0, 5).map((m) => (
                  <Avatar key={m.id} className="h-7 w-7 border-2 border-card">
                    <AvatarFallback className="bg-accent text-[9px] font-bold text-accent-foreground">
                      {m.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 5 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Implement Payout Schedule Button */}
      {canGeneratePayout && (
        <motion.div variants={fadeUp}>
          <Card className="rounded-2xl border-primary/20 bg-accent/30 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between sm:py-5">
              <div className="text-center sm:text-left">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Shuffle className="h-4.5 w-4.5 text-primary" />
                  Ready to Generate Payouts
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                  Generate a fair payout order for all {members.length} members in this group.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleGeneratePayout}
                disabled={generatePayout.isPending}
                className="gap-2 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-shadow min-h-[48px]"
              >
                <Shuffle className="h-5 w-5" />
                {generatePayout.isPending ? "Generating…" : "Implement Payout Schedule"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Members */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MemberSearchBar
                groupId={group.id}
                existingMemberIds={members.map((m) => m.user_id)}
                onAddMember={handleAddMember}
              />
              {memberList.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  expectedAmount={expectedAmount}
                  isExpanded={expandedMember === member.id}
                  onToggle={() =>
                    setExpandedMember((prev) => (prev === member.id ? null : member.id))
                  }
                  onMarkPaid={handleMarkPaid}
                  onMarkMissed={handleMarkMissed}
                  hasReceivedPayout={paidOutUserIds.has(member.user_id)}
                  isUnpaid={showPayoutWarning ? member.contributionStatus === "pending" : false}
                  onUpdateDebt={handleUpdateDebt}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payout Timeline */}
        <motion.div variants={fadeUp} className="space-y-4 sm:space-y-6">
          {payoutEntries.length > 0 ? (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Payout Timeline
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Payout schedule locked for this cycle.
                </p>
              </CardHeader>
              <CardContent>
                <PayoutTimeline entries={payoutEntries} />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Shuffle className="h-4 w-4 text-primary" />
                  Payout Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                    <Shuffle className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[200px]">
                    {members.length < 2
                      ? "Add at least 2 members to generate a payout schedule."
                      : "Click the button above to generate and lock a payout order."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout History */}
          {payoutHistoryData.length > 0 && (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <History className="h-4 w-4 text-primary" />
                  Payout History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PayoutHistory
                  records={payoutHistoryData.map((r) => ({
                    cycleMonth: r.cycle_month,
                    recipientName: r.profiles?.username ?? "Unknown",
                    amount: r.amount,
                    datePaid: new Date(r.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    status: "Completed" as const,
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Confirm Payout Dialog */}
      {currentEntry && (
        <ConfirmPayoutDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          recipientName={currentEntry.profiles?.username ?? "Unknown"}
          payoutAmount={payoutAmount}
          cycleMonth={currentPayoutMonth}
          memberCount={members.length}
          onConfirm={handleCompletePayout}
        />
      )}
    </motion.div>
  );
};

export default GroupDashboard;
