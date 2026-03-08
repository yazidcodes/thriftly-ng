import { useState, useRef, useEffect } from "react";
import { Search, UserPlus, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface MockUser {
  username: string;
  email: string;
  trustScore?: number;
}

const mockUserDirectory: MockUser[] = [
  { username: "Alice", email: "alice@thriftly.com", trustScore: 88 },
  { username: "Bob", email: "bob@thriftly.com", trustScore: 72 },
  { username: "Carol", email: "carol@thriftly.com", trustScore: 45 },
  { username: "David", email: "david@thriftly.com", trustScore: 91 },
  { username: "Eva", email: "eva@thriftly.com", trustScore: 76 },
  { username: "Frank", email: "frank@thriftly.com" },
  { username: "Grace", email: "grace@thriftly.com", trustScore: 95 },
  { username: "Henry", email: "henry@thriftly.com", trustScore: 63 },
  { username: "Iris", email: "iris@thriftly.com" },
  { username: "Jack", email: "jack@thriftly.com", trustScore: 82 },
];

interface MemberSearchBarProps {
  existingMembers: string[];
  onAddMember: (username: string) => void;
}

function getTrustColor(score: number) {
  if (score >= 80) return "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]";
  if (score >= 60) return "border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]";
  return "border-destructive/30 text-destructive";
}

const MemberSearchBar = ({ existingMembers, onAddMember }: MemberSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const trimmed = query.trim().toLowerCase();
  const showDropdown = isFocused && trimmed.length > 0;

  const results = trimmed
    ? mockUserDirectory.filter(
        (u) =>
          (u.username.toLowerCase().includes(trimmed) ||
            u.email.toLowerCase().includes(trimmed)) &&
          !existingMembers.includes(u.username) &&
          u.username !== "You"
      )
    : [];

  const handleAdd = (user: MockUser) => {
    onAddMember(user.username);
    setQuery("");
    toast.success(`${user.username} added to the group`, {
      description: "A new member card has been created with default trust score.",
    });
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
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

      {/* Results Dropdown */}
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
                    key={user.username}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {user.trustScore !== undefined && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] font-bold ${getTrustColor(user.trustScore)}`}
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {user.trustScore}%
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
                  No users found. Check the username or email.
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
