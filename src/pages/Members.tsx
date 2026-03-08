import { useState } from 'react';
import { Search } from 'lucide-react';
import { members } from '@/data/mockData';

const Members = () => {
  const [search, setSearch] = useState('');
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground">{members.length} cooperative members</p>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm font-medium text-foreground outline-none ring-ring focus:ring-2 transition-shadow"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 px-5">
        {filtered.map(member => {
          const progress = Math.round((member.balance / member.goal) * 100);
          return (
            <div key={member.id} className="rounded-xl bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${member.color}`}>
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">₦{member.balance.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">of ₦{member.goal.toLocaleString()}</p>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{progress}% of monthly goal</p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No members found</p>
        )}
      </div>
    </div>
  );
};

export default Members;
