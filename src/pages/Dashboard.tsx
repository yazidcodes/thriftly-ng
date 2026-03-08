import { useState, useMemo } from "react";
import { Bell, HelpCircle, ChevronDown, Plus, PiggyBank, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups, useCreateGroup } from "@/hooks/useSupabase";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import GroupDashboard from "@/components/GroupDashboard";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import NeutralLanding from "@/components/NeutralLanding";

const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const navigate = useNavigate();

  const adminGroups = useMemo(
    () => (groups ?? []).filter((g) => g.admin_id === user?.id),
    [groups, user?.id]
  );
  const memberOnlyGroups = useMemo(
    () => (groups ?? []).filter((g) => g.admin_id !== user?.id),
    [groups, user?.id]
  );

  const isAdmin = adminGroups.length > 0;
  const isMemberOnly = !isAdmin && memberOnlyGroups.length > 0;
  const isNewUser = !isAdmin && !isMemberOnly;

  const handleCreateGroup = (group: {
    name: string;
    contributionAmount: number;
    cycleLength: number;
    payoutDay?: number;
  }) => {
    createGroup.mutate({
      group_name: group.name,
      monthly_contribution: group.contributionAmount,
      cycle_length: group.cycleLength,
      payout_day: group.payoutDay,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        isAdmin={isAdmin}
        onCreateGroup={() => setDialogOpen(true)}
        onSignOut={handleSignOut}
        onNavigateGroups={() => navigate("/my-groups")}
      />

      {/* Admin view: show first admin group dashboard */}
      {isAdmin && (
        <main className="flex-1">
          <GroupDashboard group={adminGroups[0]} />
        </main>
      )}

      {/* Member-only view: prompt to check groups */}
      {isMemberOnly && (
        <main className="flex flex-1 items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-md text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-md">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Welcome back!
            </h1>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground">
              You're a member of {memberOnlyGroups.length} group{memberOnlyGroups.length > 1 ? "s" : ""}.
              View your contributions, trust scores, and payout schedules.
            </p>
            <Button
              size="lg"
              className="gap-2 text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => navigate("/my-groups")}
            >
              <Eye className="h-5 w-5" />
              Check Your Groups
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mt-3 gap-2 text-base font-bold"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Create Your Own Group
            </Button>
          </motion.div>
        </main>
      )}

      {/* New user: neutral landing */}
      {isNewUser && (
        <NeutralLanding
          onCreateGroup={() => setDialogOpen(true)}
          onCheckGroups={() => navigate("/my-groups")}
        />
      )}

      <CreateGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default Dashboard;
