import { Users, Bell, HelpCircle, ChevronDown, Plus, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
            Thriftly
          </span>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Help */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-semibold text-foreground sm:inline">
                    Admin
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Empty State */}
      <main className="flex flex-1 items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
            <PiggyBank className="h-10 w-10 text-primary" />
          </div>

          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Welcome to Thriftly!
          </h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            Create your first cooperative group to start tracking contributions
            and building trust.
          </p>

          <Button size="lg" className="gap-2 text-base font-bold shadow-lg">
            <Plus className="h-5 w-5" />
            Create Your First Group
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
