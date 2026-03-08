import { useState, useMemo } from "react";
import { Users, TrendingUp, ShieldCheck, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import type { GroupData } from "./CreateGroupDialog";
import MemberCard from "./MemberCard";
import MemberSearchBar from "./MemberSearchBar";
import { type MemberData, createMember, getTrustTier } from "@/lib/members";

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
    { name: "Active Members", score: Math.round((activeCount / Math.max(allMemberNames.length, 1)) * 100), trend: "up" as const },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6"
    >
      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, i) => (
          <Card key={i} className="relative overflow-hidden rounded-2xl border-border/50 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group</p>
              <p className="mt-1 text-lg font-extrabold text-foreground truncate">{group.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                  <Users className="h-3 w-3" />
                  {group.members.length + 1}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {scheduleLabels[group.schedule]} · ${expectedAmount}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Collected</p>
              <p className="text-xl font-extrabold text-foreground">${totalCollected.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Avg Trust Score</p>
              <p className="text-xl font-extrabold text-foreground">{avgTrust}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Active Members</p>
              <p className="text-xl font-extrabold text-foreground">{activeCount}</p>
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
            <CardContent className="space-y-2">
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
