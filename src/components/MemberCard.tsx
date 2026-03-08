import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Payment {
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
}

interface MemberCardProps {
  name: string;
  role: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const mockMemberData: Record<string, { trustScore: number; totalContributed: number; payments: Payment[] }> = {
  You: {
    trustScore: 95,
    totalContributed: 1500,
    payments: [
      { date: "Mar 1", amount: 500, status: "paid" },
      { date: "Feb 1", amount: 500, status: "paid" },
      { date: "Jan 1", amount: 500, status: "paid" },
    ],
  },
  Alice: {
    trustScore: 88,
    totalContributed: 1000,
    payments: [
      { date: "Mar 1", amount: 500, status: "paid" },
      { date: "Feb 1", amount: 500, status: "paid" },
      { date: "Jan 1", amount: 0, status: "pending" },
    ],
  },
  Bob: {
    trustScore: 72,
    totalContributed: 500,
    payments: [
      { date: "Mar 1", amount: 500, status: "pending" },
      { date: "Feb 1", amount: 500, status: "paid" },
      { date: "Jan 1", amount: 0, status: "overdue" },
    ],
  },
  Carol: {
    trustScore: 45,
    totalContributed: 0,
    payments: [
      { date: "Mar 1", amount: 0, status: "overdue" },
      { date: "Feb 1", amount: 0, status: "overdue" },
      { date: "Jan 1", amount: 0, status: "overdue" },
    ],
  },
};

const fallbackData = {
  trustScore: 70,
  totalContributed: 0,
  payments: [] as Payment[],
};

const statusColor: Record<string, string> = {
  paid: "bg-accent text-accent-foreground",
  pending: "bg-[hsl(var(--warning-light))] text-[hsl(var(--warning))]",
  overdue: "bg-destructive/10 text-destructive",
};

const MemberCard = ({ name, role, isExpanded, onToggle }: MemberCardProps) => {
  const data = mockMemberData[name] ?? fallbackData;
  const hasOverdue = data.payments.some((p) => p.status === "overdue");

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Reminder sent to ${name}`, {
      description: "A payment reminder notification has been triggered.",
    });
  };

  return (
    <div
      className="rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={onToggle}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-bold border-primary/30 text-primary"
        >
          {data.trustScore}%
        </Badge>
        <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="Active" />
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
          >
            <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4">
              {/* Trust Score */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trust Score
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    {data.trustScore}%
                  </span>
                </div>
                <Progress value={data.trustScore} className="h-2 rounded-full bg-secondary" />
              </div>

              {/* Contribution summary */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Payments
                </span>
                <div className="space-y-1.5">
                  {data.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          ${p.amount}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Total contributed:{" "}
                  <span className="font-bold text-foreground">${data.totalContributed}</span>
                </p>
              </div>

              {/* Bell notification */}
              {hasOverdue && (
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
