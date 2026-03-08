import { useState, useMemo } from "react";
import { Users, TrendingUp, ShieldCheck, DollarSign, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import type { GroupData } from "./CreateGroupDialog";
import MemberCard from "./MemberCard";
import MemberSearchBar from "./MemberSearchBar";
import { type MemberData, createMember, getTrustTier, getTrustLabel } from "@/lib/members";

interface GroupDashboardProps {
  groups: GroupData[];
}

const scheduleLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const GroupDashboard = ({ groups }: GroupDashboardProps) => {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const latestGroup = groups[groups.length - 1];
  const expectedAmount = latestGroup.contributionAmount ?? 500;

  // Initialize members state from group data
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
  const paidCount = allMembers.filter((m) => m.payments.length > 0 && m.payments[0]?.status === "paid").length;
  const activeCount = memberNames.length;

  // Trust insights
  const trustInsights = [
    { name: "Overall Trust", score: avgTrust, trend: avgTrust >= 80 ? "up" as const : "down" as const },
    { name: "Payment Reliability", score: allMembers.length ? Math.round((paidCount / allMembers.length) * 100) : 0, trend: paidCount >= allMembers.length / 2 ? "up" as const : "down" as const },
    { name: "Active Members", score: Math.round((activeCount / Math.max(memberNames.length, 1)) * 100), trend: "up" as const },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6"
    >
      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Group Card */}
        <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
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
              <span>{scheduleLabels[latestGroup.schedule]} cycle · ${expectedAmount}/round</span>
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
            <p className="text-2xl font-extrabold text-foreground">${totalCollected.toLocaleString()}</p>
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

        {/* Active Members */}
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
      </motion.div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
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

        {/* Trust Score Insights */}
        <motion.div variants={fadeUp}>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trust Score Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trustInsights.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                      {item.score}%
                      {item.trend === "up" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </span>
                  </div>
                  <Progress value={item.score} className="h-2 rounded-full bg-secondary" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GroupDashboard;
