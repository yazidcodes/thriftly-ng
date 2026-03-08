import { ArrowLeft, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGroups } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";

const MyGroups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups = [], isLoading } = useGroups();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-extrabold tracking-tight text-foreground">My Groups</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">You're not part of any groups yet.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {groups.map((group) => {
              const isAdmin = group.admin_id === user?.id;
              return (
                <motion.div
                  key={group.id}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                >
                  <Card
                    className="cursor-pointer rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => navigate(`/group/${group.id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-extrabold text-foreground truncate">
                            {group.group_name}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {group.cycle_length}-month cycle
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₦{group.monthly_contribution.toLocaleString()}/mo
                            </span>
                          </div>
                        </div>
                        <Badge variant={isAdmin ? "default" : "secondary"} className="shrink-0 text-[10px]">
                          {isAdmin ? "Admin" : "Member"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MyGroups;
