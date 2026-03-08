import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, Users, Calendar, DollarSign } from "lucide-react";

interface ConfirmPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  payoutAmount: number;
  cycleMonth: number;
  memberCount: number;
  onConfirm: () => void;
}

const ConfirmPayoutDialog = ({
  open,
  onOpenChange,
  recipientName,
  payoutAmount,
  cycleMonth,
  memberCount,
  onConfirm,
}: ConfirmPayoutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/60 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="px-6 pt-4 pb-6 space-y-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Confirm Payout
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You are about to release the group payout.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                  {recipientName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Recipient</p>
                <p className="text-sm font-extrabold text-foreground">{recipientName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="text-sm font-bold text-foreground">₦{payoutAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cycle Month</p>
                  <p className="text-sm font-bold text-foreground">{cycleMonth}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Members Contributing</p>
                  <p className="text-sm font-bold text-foreground">{memberCount}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-bold shadow-md hover:shadow-lg transition-shadow"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Confirm Payout
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmPayoutDialog;
