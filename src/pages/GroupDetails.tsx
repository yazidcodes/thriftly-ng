import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, DollarSign, Calendar, ShieldCheck,
  CheckCircle2, Clock, CircleDot, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGroups, useGroupMembers, useContributions,
  usePayoutSchedule, usePayoutHistory,
} from "@/hooks/useSupabase";
import { getTrustTier, getTrustLabel } from "@/lib/members";
import PayoutTimeline, { type PayoutEntry } from "@/components/PayoutTimeline";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const group = groups.find((g) => g.id === groupId);

  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(groupId);
  const { data: payoutScheduleData = [] } = usePayoutSchedule(groupId);
  const { data: payoutHistoryData = [] } = usePayoutHistory(groupId);

  const currentEntry = payoutScheduleData.find((e) => e.status === "current");
  const currentPayoutMonth = currentEntry?.payout_month ?? 1;
  const { data: contributions = [] } = useContributions(groupId, currentPayoutMonth);

  const isLoading = loadingGroups || loadingMembers;

  // Find admin profile
  const adminProfile = members.find((m) => m.user_id === group?.admin_id);

  // Member list with contribution data
  const memberList = useMemo(() => {
    return members.map((m) => {
      const contrib = contributions.find((c) => c.user_id === m.user_id);
      return {
        ...m,
        username: m.profiles?.username ?? "Unknown",
        email: m.profiles?.email ?? "",
        contributionStatus: (contrib?.status ?? "pending") as "paid" | "pending" | "missed",
        contributionAmount: contrib?.amount ?? 0,
        debtBalance: m.debt_balance ?? 0,
      };
    });
  }, [members, contributions]);

  // Stats
  const avgTrust = memberList.length
    ? Math.round(memberList.reduce((s, m) => s + m.trust_score, 0) / memberList.length)
    : 0;
  const totalCollected = contributions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Number(c.amount), 0);

  // Payout timeline entries
  const payoutEntries: (PayoutEntry & { isCurrentUser?: boolean })[] = useMemo(() => {
    return payoutScheduleData.map((e) => ({
      month: e.payout_month,
      memberName: e.profiles?.username ?? "Unknown",
      status: e.status as "completed" | "current" | "upcoming",
      isCurrentUser: e.user_id === user?.id,
    }));
  }, [payoutScheduleData, user?.id]);

  // Current user's position in schedule
  const userScheduleEntry = payoutScheduleData.find((e) => e.user_id === user?.id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">Group not found or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate("/my-groups")}>
          Back to My Groups
        </Button>
      </div>
    );
  }

  const trustTier = getTrustTier(avgTrust);
  const trustLabel = getTrustLabel(trustTier);

  const statusColor = (status: string) => {
    if (status === "paid") return "bg-success-light text-success";
    if (status === "missed") return "bg-destructive/10 text-destructive";
    return "bg-warning-light text-warning";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/my-groups")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground truncate">
              {group.group_name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Admin: {adminProfile?.profiles?.username ?? "Unknown"}
            </p>
          </div>
        </div>
      </header>

      <motion.main
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6"
      >
        {/* Summary Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Monthly Contribution */}
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-light">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Monthly Amount
                </span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                ₦{group.monthly_contribution.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Cycle Progress */}
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Cycle Progress
                </span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {currentPayoutMonth} <span className="text-sm font-semibold text-muted-foreground">/ {group.cycle_length}</span>
              </p>
              <Progress
                value={(currentPayoutMonth / group.cycle_length) * 100}
                className="mt-2 h-1.5 rounded-full bg-secondary [&>div]:bg-primary"
              />
            </CardContent>
          </Card>

          {/* Members */}
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stat-members-light">
                  <Users className="h-4 w-4 text-stat-members" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Members
                </span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{members.length}</p>
              <div className="mt-2 flex items-center -space-x-2">
                {memberList.slice(0, 5).map((m) => (
                  <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                    <AvatarFallback className="bg-accent text-[8px] font-bold text-accent-foreground">
                      {m.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 5 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] font-bold text-muted-foreground">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Avg Trust */}
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stat-trust-light">
                  <ShieldCheck className="h-4 w-4 text-stat-trust" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Avg Trust
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-foreground">{avgTrust}%</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold border ${
                    trustTier === "high"
                      ? "bg-success-light text-success border-success/20"
                      : trustTier === "moderate"
                      ? "bg-warning-light text-warning border-warning/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {trustLabel}
                </Badge>
              </div>
              <Progress
                value={avgTrust}
                className={`mt-2 h-1.5 rounded-full bg-secondary ${
                  trustTier === "high" ? "[&>div]:bg-success" : trustTier === "moderate" ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                }`}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Your Position Banner */}
        {userScheduleEntry && (
          <motion.div variants={fadeUp}>
            <Card className="rounded-2xl border-primary/20 bg-accent/40 shadow-sm">
              <CardContent className="flex items-center gap-3 py-4 px-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CircleDot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Your payout is scheduled for Month {userScheduleEntry.payout_month}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="font-semibold capitalize">{userScheduleEntry.status}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Contributions */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Contributions — Month {currentPayoutMonth}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Total collected: ₦{totalCollected.toLocaleString()} of ₦{(group.monthly_contribution * members.length).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent>
                {/* Mobile card layout */}
                <div className="space-y-3 sm:hidden">
                  {memberList.map((m) => {
                    const isMe = m.user_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border p-3 ${
                          isMe ? "border-primary/30 bg-accent/40" : "border-border/50 bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-accent text-[10px] font-bold text-accent-foreground">
                              {m.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {m.username}
                              {isMe && <span className="ml-1 text-[10px] font-bold text-primary">(You)</span>}
                            </p>
                          </div>
                          <Badge className={`text-[10px] font-bold border-0 shrink-0 ${statusColor(m.contributionStatus)}`}>
                            {m.contributionStatus === "paid" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                            {m.contributionStatus === "missed" && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {m.contributionStatus === "pending" && <Clock className="mr-1 h-3 w-3" />}
                            {m.contributionStatus.charAt(0).toUpperCase() + m.contributionStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5">Paid</p>
                            <p className="text-sm font-bold text-foreground">₦{m.contributionAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5">Debt</p>
                            <p className={`text-sm font-bold ${m.debtBalance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                              {m.debtBalance > 0 ? `₦${m.debtBalance.toLocaleString()}` : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5">Trust</p>
                            <p className={`text-sm font-bold ${
                              m.trust_score >= 80 ? "text-success" : m.trust_score >= 60 ? "text-warning" : "text-destructive"
                            }`}>
                              {m.trust_score}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Debt</TableHead>
                        <TableHead className="text-right">Trust</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberList.map((m) => {
                        const isMe = m.user_id === user?.id;
                        return (
                          <TableRow
                            key={m.id}
                            className={isMe ? "bg-accent/40 font-medium" : ""}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-accent text-[9px] font-bold text-accent-foreground">
                                    {m.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {m.username}
                                    {isMe && (
                                      <span className="ml-1.5 text-[10px] font-bold text-primary">(You)</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] font-bold border-0 ${statusColor(m.contributionStatus)}`}>
                                {m.contributionStatus === "paid" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                {m.contributionStatus === "missed" && <AlertTriangle className="mr-1 h-3 w-3" />}
                                {m.contributionStatus === "pending" && <Clock className="mr-1 h-3 w-3" />}
                                {m.contributionStatus.charAt(0).toUpperCase() + m.contributionStatus.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold">
                              ₦{m.contributionAmount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {m.debtBalance > 0 ? (
                                <span className="text-sm font-semibold text-destructive">
                                  ₦{m.debtBalance.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-sm font-semibold ${
                                m.trust_score >= 80 ? "text-success" :
                                m.trust_score >= 60 ? "text-warning" :
                                "text-destructive"
                              }`}>
                                {m.trust_score}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payout Schedule Sidebar */}
          <motion.div variants={fadeUp} className="space-y-4">
            {payoutEntries.length > 0 ? (
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Payout Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PayoutTimeline entries={payoutEntries} />
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Payout schedule hasn't been generated yet.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Payout History */}
            {payoutHistoryData.length > 0 && (
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Payout History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {payoutHistoryData.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        r.recipient_id === user?.id ? "bg-accent/40" : "bg-secondary/50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {r.profiles?.username ?? "Unknown"}
                          {r.recipient_id === user?.id && (
                            <span className="ml-1.5 text-[10px] font-bold text-primary">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">Month {r.cycle_month}</p>
                      </div>
                      <p className="text-sm font-bold text-success">₦{r.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default GroupDetails;
