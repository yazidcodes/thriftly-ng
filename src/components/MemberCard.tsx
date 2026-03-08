import { useState } from "react";
import { Bell, Check, XCircle, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  type MemberData,
  type Payment,
  getTrustTier,
  getTrustLabel,
  applyTrustDelta,
  formatDate,
} from "@/lib/members";

interface MemberCardProps {
  member: MemberData;
  expectedAmount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updated: MemberData) => void;
}

const trustColors: Record<string, { badge: string; progress: string }> = {
  high: {
    badge: "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]",
    progress: "[&>div]:bg-[hsl(var(--success))]",
  },
  moderate: {
    badge: "border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]",
    progress: "[&>div]:bg-[hsl(var(--warning))]",
  },
  low: {
    badge: "border-destructive/30 text-destructive",
    progress: "[&>div]:bg-destructive",
  },
};

const statusStyle: Record<string, string> = {
  paid: "bg-[hsl(var(--success-light))] text-[hsl(var(--success))]",
  pending: "bg-[hsl(var(--warning-light))] text-[hsl(var(--warning))]",
  missed: "bg-destructive/10 text-destructive",
};

const MemberCard = ({ member, expectedAmount, isExpanded, onToggle, onUpdate }: MemberCardProps) => {
  const [manualAmount, setManualAmount] = useState("");
  const tier = getTrustTier(member.trustScore);
  const colors = trustColors[tier];
  const hasMissed = member.payments.some((p) => p.status === "missed");

  const addPayment = (status: "paid" | "missed", amount?: number) => {
    const payment: Payment = {
      date: formatDate(),
      amount: status === "paid" ? (amount ?? expectedAmount) : 0,
      status,
    };
    const newScore = applyTrustDelta(member.trustScore, status);
    onUpdate({
      ...member,
      trustScore: newScore,
      totalContributed: member.totalContributed + payment.amount,
      payments: [payment, ...member.payments].slice(0, 10),
    });
    toast.success(
      status === "paid"
        ? `Marked ${member.name} as paid`
        : `Marked ${member.name} as missed`
    );
  };

  const handleManualPayment = () => {
    const amt = parseFloat(manualAmount);
    if (!amt || amt <= 0) return;
    const payment: Payment = { date: formatDate(), amount: amt, status: "paid" };
    const newScore = applyTrustDelta(member.trustScore, "paid");
    onUpdate({
      ...member,
      trustScore: newScore,
      totalContributed: member.totalContributed + amt,
      payments: [payment, ...member.payments].slice(0, 10),
    });
    setManualAmount("");
    toast.success(`Manual payment of $${amt} recorded for ${member.name}`);
  };

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Reminder sent to ${member.name}`, {
      description: "A contribution reminder notification has been triggered.",
    });
  };

  return (
    <div
      className="rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={onToggle}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <Avatar className="h-10 w-10 sm:h-9 sm:w-9">
          <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
            {member.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.role}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] font-bold ${colors.badge}`}>
          {member.trustScore}% · {getTrustLabel(tier)}
        </Badge>
        {hasMissed && (
          <button
            onClick={handleBellClick}
            className="relative shrink-0 rounded-full p-1 text-destructive hover:bg-destructive/10 transition-colors"
            title="Send reminder"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          </button>
        )}
      </div>

      {/* Expanded card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-t border-border/50 px-3 pb-4 pt-3 space-y-4 sm:px-4">
              {/* Trust Score */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trust Score
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {member.trustScore}%
                  </span>
                </div>
                <Progress
                  value={member.trustScore}
                  className={`h-2 rounded-full bg-secondary ${colors.progress}`}
                />
              </div>

              {/* Contribution Status */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contribution Status
                </span>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected</span>
                  <span className="font-bold text-foreground">${expectedAmount}</span>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl text-xs font-semibold border-[hsl(var(--success))]/30 text-[hsl(var(--success))] hover:bg-[hsl(var(--success-light))]"
                  onClick={() => addPayment("paid")}
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark as Paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => addPayment("missed")}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Mark as Missed
                </Button>
              </div>

              {/* Manual Payment */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Manual amount"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="flex-1 rounded-xl text-xs h-8 bg-secondary/50"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-accent"
                  onClick={handleManualPayment}
                  disabled={!manualAmount || parseFloat(manualAmount) <= 0}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {/* Payment History */}
              {member.payments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment History
                  </span>
                  <div className="space-y-1.5">
                    {member.payments.slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{p.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">${p.amount}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[p.status]}`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Total contributed:{" "}
                    <span className="font-bold text-foreground">${member.totalContributed}</span>
                  </p>
                </div>
              )}

              {member.payments.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No payment history yet.</p>
              )}

              {/* Bell reminder at bottom-right */}
              {hasMissed && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={handleBellClick}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Send Reminder
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberCard;
