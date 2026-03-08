import { useState } from 'react';
import { Plus, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import { totalSavings, activeMembers, transactions } from '@/data/mockData';
import RecordDepositModal from '@/components/RecordDepositModal';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const recent = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-primary px-5 pb-16 pt-12">
        <p className="text-sm font-medium text-primary-foreground/70">Good morning 👋</p>
        <h1 className="mt-1 text-2xl font-bold text-primary-foreground">Welcome back, Admin.</h1>
      </div>

      {/* Summary Card */}
      <div className="mx-5 -mt-10">
        <div className="rounded-2xl bg-card p-5 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <TrendingUp size={14} />
                Total Savings
              </div>
              <p className="text-2xl font-extrabold text-foreground">₦{totalSavings.toLocaleString()}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Users size={14} />
                Active Members
              </div>
              <p className="text-2xl font-extrabold text-foreground">{activeMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 px-5">
        <h2 className="mb-3 text-lg font-bold text-foreground">Recent Activity</h2>
        <div className="space-y-2">
          {recent.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                <ArrowUpRight size={18} className="text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tx.memberName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">+₦{tx.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setDepositOpen(true)}
        className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-bold text-primary-foreground fab-shadow transition-transform active:scale-95"
      >
        <Plus size={20} strokeWidth={3} />
        Record New Deposit
      </button>

      <RecordDepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  );
};

export default Dashboard;
