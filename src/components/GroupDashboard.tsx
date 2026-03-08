import { useState, useMemo, useCallback } from "react";
import {
  Users, TrendingUp, ShieldCheck, DollarSign, Calendar, Shuffle,
  AlertTriangle, CheckCircle2, Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { GroupData } from "./CreateGroupDialog";
import MemberCard from "./MemberCard";
import MemberSearchBar from "./MemberSearchBar";
import PayoutTimeline, { type PayoutEntry } from "./PayoutTimeline";
import { type MemberData, createMember, getTrustTier, getTrustLabel } from "@/lib/members";

interface GroupDashboardProps {
  groups: GroupData[];
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GroupDashboard = ({ groups }: GroupDashboardProps) => {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const latestGroup = groups[groups.length - 1];
  const expectedAmount = latestGroup.contributionAmount ?? 500;
  const cycleLength = latestGroup.cycleLength ?? 4;

  const [membersMap, setMembersMap] = useState<Record<string, MemberData>>(() => {
    const map: Record<string, MemberData> = {};
    map["You"] = createMember("You", "Admin");
    latestGroup.members.forEach((name) => {
      map[name] = createMember(name);
    });
    return map;
  });

  const [memberNames, setMemberNames] = useState<string[]>(() => ["You", ...latestGroup.members]);
  const allMembers = memberNames.map((n) => membersMap[n]).filter(Boolean);

  // Payout state
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutEntry[] | null>(null);
  const [currentPayoutMonth, setCurrentPayoutMonth] = useState(1);

  const handleUpdateMember = (updated: MemberData) => {
    setMembersMap((prev) => ({ ...prev, [updated.name]: updated }));
  };

  const handleAddMember = (username: string) => {
    if (membersMap[username]) return;
    setMembersMap((prev) => ({ ...prev, [username]: createMember(username) }));
    setMemberNames((prev) => [...prev, username]);
  };

  // Computed stats
  const totalCollected = allMembers.reduce((s, m) => s + m.totalContributed, 0);
  const avgTrust = allMembers.length
    ? Math.round(allMembers.reduce((s, m) => s + m.trustScore, 0) / allMembers.length)
    : 0;
  const activeCount = memberNames.length;
  const canGeneratePayout = memberNames.length >= 2 && !payoutSchedule;

  // Payout amount = contribution × number of members
  const payoutAmount = expectedAmount * memberNames.length;

  // Generate payout schedule
  const handleGeneratePayout = useCallback(() => {
    const shuffled = shuffle(memberNames);
    const entries: PayoutEntry[] = shuffled.slice(0, cycleLength).map((name, i) => ({
      month: i + 1,
      memberName: name,
      status: i === 0 ? "current" as const : "upcoming" as const,
    }));
    setPayoutSchedule(entries);
    setCurrentPayoutMonth(1);
    toast.success("Payout schedule successfully generated and locked.", {
      description: `${entries.length}-month rotation created for ${latestGroup.name}.`,
    });
  }, [memberNames, cycleLength, latestGroup.name]);

  // Current payout recipient
  const currentRecipient = payoutSchedule?.find((e) => e.status === "current");

  // Days until payout (mock)
  const payoutDay = latestGroup.payoutDay ?? 15;
  const now = new Date();
  const nextPayoutDate = new Date(now.getFullYear(), now.getMonth(), payoutDay);
  if (nextPayoutDate <= now) nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
  const daysUntilPayout = Math.ceil((nextPayoutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6"
    >
      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
            <p className="text-xl font-extrabold text-foreground truncate">{latestGroup.name}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{cycleLength}-month cycle · ₦{expectedAmount.toLocaleString()}/mo</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                <Users className="h-3 w-3" />
                {memberNames.length} members
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
                <span className="font-bold">{Math.min(100, Math.round((totalCollected / Math.max(expectedAmount * memberNames.length, 1)) * 100))}%</span>
              </div>
              <Progress
                value={Math.min(100, Math.round((totalCollected / Math.max(expectedAmount * memberNames.length, 1)) * 100))}
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
        {payoutSchedule && currentRecipient ? (
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
                    {currentRecipient.memberName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-foreground truncate">{currentRecipient.memberName}</p>
                  <p className="text-lg font-extrabold text-primary">₦{payoutAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                <span className="font-semibold">Payout in {daysUntilPayout} days</span>
              </div>
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
              <p className="text-2xl font-extrabold text-foreground">{activeCount}</p>
              <div className="mt-3 flex items-center -space-x-2">
                {allMembers.slice(0, 5).map((m) => (
                  <Avatar key={m.name} className="h-7 w-7 border-2 border-card">
                    <AvatarFallback className="bg-accent text-[9px] font-bold text-accent-foreground">
                      {m.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {allMembers.length > 5 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground">
                    +{allMembers.length - 5}
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
                  Generate a fair payout order for all {memberNames.length} members in this group.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleGeneratePayout}
                className="gap-2 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-shadow min-h-[48px]"
              >
                <Shuffle className="h-5 w-5" />
                Implement Payout Schedule
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Contribution Verification Warning */}
      {hasUnpaidWarning && (
        <motion.div variants={fadeUp}>
          <Card className="rounded-2xl border-warning/30 bg-warning-light shadow-sm">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Pending contributions detected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unpaidMembers.map((m) => m.name).join(", ")} {unpaidMembers.length === 1 ? "has" : "have"} not marked contributions as paid this cycle.
                </p>
              </div>
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
                existingMembers={memberNames}
                onAddMember={handleAddMember}
              />
              {allMembers.map((member) => (
                <MemberCard
                  key={member.name}
                  member={member}
                  expectedAmount={expectedAmount}
                  isExpanded={expandedMember === member.name}
                  onToggle={() =>
                    setExpandedMember((prev) => (prev === member.name ? null : member.name))
                  }
                  onUpdate={handleUpdateMember}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payout Timeline (replaces Trust Score Insights) */}
        <motion.div variants={fadeUp}>
          {payoutSchedule ? (
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
                <PayoutTimeline entries={payoutSchedule} />
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
                    {memberNames.length < 2
                      ? "Add at least 2 members to generate a payout schedule."
                      : "Click the button above to generate and lock a payout order."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GroupDashboard;
