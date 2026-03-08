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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export interface GroupData {
  name: string;
  schedule: string;
  members: string[];
  contributionAmount?: number;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (group: GroupData) => void;
}

const CreateGroupDialog = ({ open, onOpenChange, onCreateGroup }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const addMember = () => {
    const trimmed = memberInput.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers((prev) => [...prev, trimmed]);
      setMemberInput("");
    }
  };

  const removeMember = (member: string) => {
    setMembers((prev) => prev.filter((m) => m !== member));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
  };

  const handleSubmit = () => {
    if (!groupName.trim() || !schedule) return;
    onCreateGroup({
      name: groupName.trim(),
      schedule,
      members,
      contributionAmount: parseFloat(contributionAmount) || 500,
    });
    setGroupName("");
    setSchedule("");
    setContributionAmount("");
    setMembers([]);
    setMemberInput("");
    onOpenChange(false);
  };

  const isValid = groupName.trim().length > 0 && schedule.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/60 p-0 overflow-hidden">
        {/* Header accent bar */}
        <div className="h-1.5 w-full bg-primary" />

        <div className="px-6 pt-4 pb-6 space-y-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
              Create New Group
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Set up a cooperative savings group and invite members.
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

          {/* Contribution Schedule */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Contribution Schedule
            </Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="rounded-xl border-input bg-secondary/50 focus:ring-primary">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contribution Amount */}
          <div className="space-y-2">
            <Label htmlFor="contribution-amount" className="text-sm font-semibold text-foreground">
              Contribution Amount ($)
            </Label>
            <Input
              id="contribution-amount"
              type="number"
              placeholder="e.g. 500"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="rounded-xl border-input bg-secondary/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>

          {/* Members */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Add Members
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Name or email"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-xl border-input bg-secondary/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={addMember}
                disabled={!memberInput.trim()}
                className="shrink-0 rounded-xl border-primary/30 text-primary hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Member chips */}
            <AnimatePresence>
              {members.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {members.map((member) => (
                    <motion.span
                      key={member}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
                    >
                      {member}
                      <button
                        onClick={() => removeMember(member)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {members.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                You can also add members later.
              </p>
            )}
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
