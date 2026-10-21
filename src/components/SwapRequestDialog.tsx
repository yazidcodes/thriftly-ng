import { useState } from "react";
import { ArrowLeft, ArrowRight, Send, Repeat2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface SwapCandidate {
  userId: string;
  username: string;
  upcomingMonth: number;
}

interface SwapRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: SwapCandidate[];
  onSubmit: (targetId: string, reason: string) => void;
  isSubmitting: boolean;
}

const SwapRequestDialog = ({
  open,
  onOpenChange,
  candidates,
  onSubmit,
  isSubmitting,
}: SwapRequestDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);

  const reasonValid = reason.trim().length >= 5;

  const resetAndClose = (next: boolean) => {
    if (!next) {
      setStep(1);
      setReason("");
      setTargetId(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!targetId || !reasonValid) return;
    onSubmit(targetId, reason.trim());
    setStep(1);
    setReason("");
    setTargetId(null);
  };

  const selected = candidates.find((c) => c.userId === targetId);

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                <Repeat2 className="h-4.5 w-4.5 text-primary" />
                Request a Turn Swap
              </DialogTitle>
              <DialogDescription>
                Explain why you need to swap your payout turn. The member you choose will see this
                reason and can accept or decline.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. I have unexpected school fees this month and can't receive my payout yet…"
              rows={4}
              className="rounded-xl resize-none"
              maxLength={280}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step 1 of 2 — Reason</span>
              <span>{reason.length}/280</span>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => resetAndClose(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!reasonValid}
                className="gap-2 rounded-xl font-bold"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                <Repeat2 className="h-4.5 w-4.5 text-primary" />
                Choose Who to Swap With
              </DialogTitle>
              <DialogDescription>
                Only members of this group with an upcoming payout turn are shown.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {candidates.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No eligible members right now — everyone with an upcoming turn has already swapped
                  or there are no other upcoming turns.
                </p>
              ) : (
                candidates.map((c) => (
                  <button
                    key={c.userId}
                    type="button"
                    onClick={() => setTargetId(c.userId)}
                    className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      targetId === c.userId
                        ? "border-primary bg-accent/50"
                        : "border-border/50 bg-card hover:bg-accent/30"
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                        {c.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{c.username}</p>
                      <p className="text-xs text-muted-foreground">Payout turn: Month {c.upcomingMonth}</p>
                    </div>
                    {targetId === c.userId && (
                      <Badge className="shrink-0 bg-accent text-[10px] font-bold text-primary">
                        Selected
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!targetId || isSubmitting}
                className="gap-2 rounded-xl font-bold"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Sending…" : selected ? `Send to ${selected.username}` : "Send Request"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SwapRequestDialog;
