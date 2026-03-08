import { CheckCircle2, Clock, CircleDot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export interface PayoutEntry {
  month: number;
  memberName: string;
  status: "completed" | "current" | "upcoming";
}

interface PayoutTimelineProps {
  entries: PayoutEntry[];
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    line: "bg-success",
    dot: "bg-success text-success",
    label: "Completed",
    labelClass: "bg-success-light text-success",
  },
  current: {
    icon: CircleDot,
    line: "bg-primary",
    dot: "bg-primary text-primary",
    label: "Current",
    labelClass: "bg-accent text-primary",
  },
  upcoming: {
    icon: Clock,
    line: "bg-border",
    dot: "bg-muted-foreground/30 text-muted-foreground",
    label: "Upcoming",
    labelClass: "bg-secondary text-muted-foreground",
  },
};

const PayoutTimeline = ({ entries }: PayoutTimelineProps) => {
  return (
    <div className="space-y-0">
      {entries.map((entry, i) => {
        const config = statusConfig[entry.status];
        const Icon = config.icon;
        const isLast = i === entries.length - 1;

        return (
          <motion.div
            key={entry.month}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3"
          >
            {/* Timeline rail */}
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                entry.status === "current" ? "border-primary bg-accent" :
                entry.status === "completed" ? "border-success bg-success-light" :
                "border-border bg-secondary"
              }`}>
                <Icon className={`h-4 w-4 ${
                  entry.status === "current" ? "text-primary" :
                  entry.status === "completed" ? "text-success" :
                  "text-muted-foreground"
                }`} />
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${config.line}`} />
              )}
            </div>

            {/* Content */}
            <div className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2 mb-1 ${
              entry.status === "current" ? "bg-accent/50" : ""
            }`}>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-accent text-[9px] font-bold text-accent-foreground">
                  {entry.memberName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  entry.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {entry.memberName}
                </p>
                <p className="text-xs text-muted-foreground">Month {entry.month}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${config.labelClass}`}>
                {config.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PayoutTimeline;
