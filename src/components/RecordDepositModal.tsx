import { useState } from 'react';
import { Mic, X, Check } from 'lucide-react';
import { members } from '@/data/mockData';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

const RecordDepositModal = ({ open, onClose }: Props) => {
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');

  if (!open) return null;

  const handleSave = () => {
    if (!selectedMember || !amount) {
      toast.error('Please select a member and enter an amount');
      return;
    }
    const member = members.find(m => m.id === selectedMember);
    toast.success(`₦${Number(amount).toLocaleString()} deposited for ${member?.name}`);
    setSelectedMember('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Record New Deposit</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Member select */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Select Member</label>
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-base font-medium text-foreground outline-none ring-ring focus:ring-2 transition-shadow"
            >
              <option value="">Choose a member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Amount (₦)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₦</span>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-3.5 pl-10 pr-4 text-lg font-bold text-foreground outline-none ring-ring focus:ring-2 transition-shadow"
                />
              </div>
              <button
                className="pulse-mic flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
                title="Tap to Speak (e.g., Add 2000 for Amina)"
                onClick={() => toast.info('Voice input: "Add 2000 for Amina"', { description: 'Voice-to-text feature coming soon!' })}
              >
                <Mic size={22} />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">💡 Tap the mic to speak, e.g. "Add 2000 for Amina"</p>
          </div>

          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] fab-shadow"
          >
            <Check size={20} />
            Save Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordDepositModal;
