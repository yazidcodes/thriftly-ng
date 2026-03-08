import { useState, useRef, useEffect } from "react";
import { Search, UserPlus, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSearchProfiles } from "@/hooks/useSupabase";

interface MemberSearchBarProps {
  groupId: string;
  existingMemberIds: string[];
  onAddMember: (userId: string) => void;
}

function getTrustColor(score: number) {
  if (score >= 80) return "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]";
  if (score >= 60) return "border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]";
  return "border-destructive/30 text-destructive";
}

const MemberSearchBar = ({ groupId, existingMemberIds, onAddMember }: MemberSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useSearchProfiles(query, existingMemberIds);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const trimmed = query.trim();
  const showDropdown = isFocused && trimmed.length > 0;

  const handleAdd = (user: { user_id: string; username: string }) => {
    onAddMember(user.user_id);
    setQuery("");
    toast.success(`${user.username} added to the group`);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search users by username or email…"
          className="w-full rounded-xl border border-input bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm transition-shadow focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-20 mt-1.5 rounded-xl border border-border/50 bg-card shadow-lg"
          >
            {results.length > 0 ? (
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                {results.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {user.trust_score !== null && (
                      <Badge variant="outline" className={`shrink-0 text-[10px] font-bold ${getTrustColor(user.trust_score)}`}>
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {user.trust_score}%
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="shrink-0 gap-1 rounded-lg text-xs font-semibold shadow-sm"
                      onClick={() => handleAdd(user)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No users found. They need to sign up first.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberSearchBar;
