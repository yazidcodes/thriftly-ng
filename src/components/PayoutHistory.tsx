import { CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface PayoutRecord {
  cycleMonth: number;
  recipientName: string;
  amount: number;
  datePaid: string;
  status: "Completed";
}

interface PayoutHistoryProps {
  records: PayoutRecord[];
}

const PayoutHistory = ({ records }: PayoutHistoryProps) => {
  if (records.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Cycle</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Recipient</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Amount</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Date Paid</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.cycleMonth}>
              <TableCell className="font-semibold text-foreground">Month {record.cycleMonth}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-accent text-[8px] font-bold text-accent-foreground">
                      {record.recipientName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{record.recipientName}</span>
                </div>
              </TableCell>
              <TableCell className="font-semibold text-foreground">₦{record.amount.toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">{record.datePaid}</TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1 border-success/30 text-success text-[10px] font-bold">
                  <CheckCircle2 className="h-3 w-3" />
                  {record.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayoutHistory;
