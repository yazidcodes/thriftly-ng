import { useState } from "react";
import { Users, TrendingUp, ShieldCheck, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import type { GroupData } from "./CreateGroupDialog";
import MemberCard from "./MemberCard";

interface GroupDashboardProps {
  groups: GroupData[];
}

const scheduleLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const mockTrustScores = [
  { name: "Overall Trust", score: 82, trend: "up" as const },
  { name: "Payment Reliability", score: 91, trend: "up" as const },
  { name: "Engagement", score: 68, trend: "down" as const },
];

const mockContributions = [
  { member: "You", amount: 500, status: "paid" },
  { member: "Alice", amount: 500, status: "paid" },
  { member: "Bob", amount: 500, status: "pending" },
  { member: "Carol", amount: 0, status: "overdue" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const GroupDashboard = ({ groups }: GroupDashboardProps) => {
  const latestGroup = groups[groups.length - 1];
  const allMembers = ["You", ...latestGroup.members];

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
          <Card
            key={i}
            className="relative overflow-hidden rounded-2xl border-border/50 shadow-sm"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground truncate">
                {group.name}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                  <Users className="h-3 w-3" />
                  {group.members.length + 1}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {scheduleLabels[group.schedule]}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Stats cards */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Collected</p>
              <p className="text-xl font-extrabold text-foreground">$1,500</p>
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
              <p className="text-xl font-extrabold text-foreground">82%</p>
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
              <p className="text-xl font-extrabold text-foreground">{allMembers.length}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main grid: Members + Contributions + Trust */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members */}
        <motion.div variants={fadeUp}>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {allMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                      {member.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{member}</p>
                    <p className="text-xs text-muted-foreground">
                      {i === 0 ? "Admin" : "Member"}
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-primary" title="Active" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contributions */}
        <motion.div variants={fadeUp}>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <DollarSign className="h-4 w-4 text-primary" />
                Track Contributions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockContributions.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                        {c.member.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{c.member}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      ${c.amount}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        c.status === "paid"
                          ? "bg-accent text-accent-foreground"
                          : c.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
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
              {mockTrustScores.map((item, i) => (
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
                  <Progress
                    value={item.score}
                    className="h-2 rounded-full bg-secondary"
                  />
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
