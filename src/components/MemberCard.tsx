import { useState } from "react";
import { Bell, Check, XCircle, PlusCircle, Award, AlertOctagon, MinusCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getTrustTier, getTrustLabel } from "@/lib/members";

interface MemberCardMember {
  id: string;
  user_id: string;
  username: string;
  trust_score: number;
  contributionStatus: string;
  contributionId?: string;
  contributionAmount: number;
  debt_balance: number;
}

interface MemberCardProps {
  member: MemberCardMember;
  expectedAmount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkPaid: (contributionId: string, amount: number) => void;
  onMarkMissed: (contributionId: string) => void;
  onUpdateDebt?: (userId: string, newDebt: number) => void;
  hasReceivedPayout?: boolean;
  isUnpaid?: boolean;
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

const MemberCard = ({ member, expectedAmount, isExpanded, onToggle, onMarkPaid, onMarkMissed, onUpdateDebt, hasReceivedPayout, isUnpaid }: MemberCardProps) => {
  const [manualAmount, setManualAmount] = useState("");
  const [debtAdjustment, setDebtAdjustment] = useState("");
  const tier = getTrustTier(member.trust_score);
  const colors = trustColors[tier];
  const hasDebt = member.debt_balance > 0;

  const handleManualPayment = () => {
    const amt = parseFloat(manualAmount);
    if (!amt || amt <= 0 || !member.contributionId) return;
    onMarkPaid(member.contributionId, amt);
    setManualAmount("");
    toast.success(`Manual payment of ₦${amt.toLocaleString()} recorded for ${member.username}`);
  };

  const handleDebtAdjust = (mode: "clear" | "reduce") => {
    if (!onUpdateDebt) return;
    if (mode === "clear") {
      onUpdateDebt(member.user_id, 0);
      setDebtAdjustment("");
    } else {
      const amt = parseFloat(debtAdjustment);
      if (!amt || amt <= 0) return;
      onUpdateDebt(member.user_id, member.debt_balance - amt);
      setDebtAdjustment("");
    }
  };

  return (
    <div
      className={`rounded-2xl border shadow-sm transition-shadow hover:shadow-md cursor-pointer ${
        isUnpaid ? "border-warning/50 bg-warning-light/30" : "border-border/50 bg-card"
      }`}
      onClick={onToggle}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <Avatar className="h-10 w-10 sm:h-9 sm:w-9">
          <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
            {member.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{member.username}</p>
            {hasReceivedPayout && (
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-[10px] font-bold shrink-0">
                <Award className="h-3 w-3" />
                Received Payout
              </Badge>
            )}
            {member.contributionStatus === "missed" && (
              <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive text-[10px] font-bold shrink-0">
                <AlertOctagon className="h-3 w-3" />
                Missed Payment
              </Badge>
            )}
            {hasDebt && (
              <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive text-[10px] font-bold shrink-0">
                ₦{member.debt_balance.toLocaleString()} debt
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[member.contributionStatus] ?? statusStyle.pending}`}>
              {member.contributionStatus}
            </span>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] font-bold ${colors.badge}`}>
          {member.trust_score}% · {getTrustLabel(tier)}
        </Badge>
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
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
                  <span className="text-sm font-extrabold text-foreground">{member.trust_score}%</span>
                </div>
                <Progress value={member.trust_score} className={`h-2 rounded-full bg-secondary ${colors.progress}`} />
              </div>

              {/* Contribution Status */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contribution Status</span>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected</span>
                  <span className="font-bold text-foreground">₦{expectedAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Outstanding Debt */}
              {hasDebt && (
                <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Outstanding Debt</span>
                    <span className="text-sm font-extrabold text-destructive">₦{member.debt_balance.toLocaleString()}</span>
                  </div>
                  {onUpdateDebt && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Reduce amount"
                        value={debtAdjustment}
                        onChange={(e) => setDebtAdjustment(e.target.value)}
                        className="flex-1 rounded-xl text-xs h-8 bg-secondary/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDebtAdjust("reduce")}
                        disabled={!debtAdjustment || parseFloat(debtAdjustment) <= 0}
                      >
                        <MinusCircle className="h-3.5 w-3.5" />
                        Reduce
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded-xl text-xs font-semibold border-[hsl(var(--success))]/30 text-[hsl(var(--success))] hover:bg-[hsl(var(--success-light))]"
                        onClick={() => handleDebtAdjust("clear")}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              {member.contributionId && member.contributionStatus === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-xl text-xs font-semibold border-[hsl(var(--success))]/30 text-[hsl(var(--success))] hover:bg-[hsl(var(--success-light))]"
                    onClick={() => onMarkPaid(member.contributionId!, expectedAmount)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark as Paid
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => onMarkMissed(member.contributionId!)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Mark as Missed
                  </Button>
                </div>
              )}

              {/* Manual Payment */}
              {member.contributionId && member.contributionStatus === "pending" && (
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberCard;
