import { ArrowUpRight } from 'lucide-react';
import { transactions } from '@/data/mockData';
import { format } from 'date-fns';

const History = () => {
  // Group by date
  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
    const key = format(tx.timestamp, 'MMM d, yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="text-sm text-muted-foreground">{transactions.length} total transactions</p>
      </div>

      <div className="px-5 space-y-5">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{date}</p>
            <div className="space-y-2">
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                    <ArrowUpRight size={18} className="text-accent-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{tx.memberName}</p>
                    <p className="text-xs text-muted-foreground">{format(tx.timestamp, 'h:mm a')}</p>
                  </div>
                  <p className="text-sm font-bold text-primary">+₦{tx.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
