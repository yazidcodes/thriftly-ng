import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export interface GroupData {
  name: string;
  contributionAmount: number;
  cycleLength: number;
  payoutDay?: number;
  members: string[];
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (group: GroupData) => void;
}

const CreateGroupDialog = ({ open, onOpenChange, onCreateGroup }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [cycleLength, setCycleLength] = useState("");
  const [payoutDay, setPayoutDay] = useState("");

  const handleSubmit = () => {
    if (!groupName.trim() || !contributionAmount || !cycleLength) return;
    onCreateGroup({
      name: groupName.trim(),
      contributionAmount: parseFloat(contributionAmount) || 500,
      cycleLength: parseInt(cycleLength) || 4,
      payoutDay: payoutDay ? parseInt(payoutDay) : undefined,
      members: [],
    });
    setGroupName("");
    setContributionAmount("");
    setCycleLength("");
    setPayoutDay("");
    onOpenChange(false);
  };

  const isValid = groupName.trim().length > 0 && !!contributionAmount && !!cycleLength;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/60 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />

        <div className="px-6 pt-4 pb-6 space-y-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
              Create New Group
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Set up a cooperative savings group. You'll add members after creation.
            </DialogDescription>
          </DialogHeader>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-sm font-semibold text-foreground">
              Group Name
            </Label>
            <Input
              id="group-name"
              placeholder="e.g. Office Savings Circle"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="rounded-xl border-input bg-secondary/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>

          {/* Monthly Contribution Amount */}
          <div className="space-y-2">
            <Label htmlFor="contribution-amount" className="text-sm font-semibold text-foreground">
              Monthly Contribution Amount (₦)
            </Label>
            <Input
              id="contribution-amount"
              type="number"
              placeholder="e.g. 25000"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="rounded-xl border-input bg-secondary/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>

          {/* Cycle Length */}
          <div className="space-y-2">
            <Label htmlFor="cycle-length" className="text-sm font-semibold text-foreground">
              Contribution Cycle Length (months)
            </Label>
            <Input
              id="cycle-length"
              type="number"
              placeholder="e.g. 4"
              min={2}
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              className="rounded-xl border-input bg-secondary/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              The number of months the savings cycle will run.
            </p>
          </div>

          {/* Payout Day (optional) */}
          <div className="space-y-2">
            <Label htmlFor="payout-day" className="text-sm font-semibold text-foreground">
              Payout Day of Month{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="payout-day"
              type="number"
              placeholder="e.g. 15"
              min={1}
              max={28}
              value={payoutDay}
              onChange={(e) => setPayoutDay(e.target.value)}
              className="rounded-xl border-input bg-secondary/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-md hover:shadow-lg transition-shadow disabled:opacity-40"
            size="lg"
          >
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
