import { Bell, HelpCircle, ChevronDown, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  isAdmin: boolean;
  onCreateGroup: () => void;
  onSignOut: () => void;
  onNavigateGroups: () => void;
}

const DashboardHeader = ({ isAdmin, onCreateGroup, onSignOut, onNavigateGroups }: DashboardHeaderProps) => {
  const { user } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
          Thriftly
        </span>

        <div className="flex items-center gap-1 sm:gap-3">
          {isAdmin && (
            <Button
              size="sm"
              className="gap-1.5 rounded-xl font-bold shadow-sm"
              onClick={onCreateGroup}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Group</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onNavigateGroups}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">My Groups</span>
          </Button>

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-semibold text-foreground sm:inline">
                  {username}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
