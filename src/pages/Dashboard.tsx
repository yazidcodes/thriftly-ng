import { Bell, HelpCircle, ChevronDown, Plus, PiggyBank, Users } from "lucide-react";
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

const floatingShapes = [
  { type: "circle", size: 120, x: "10%", y: "15%", delay: 0 },
  { type: "hexagon", size: 80, x: "85%", y: "20%", delay: 1.5 },
  { type: "square", size: 60, x: "75%", y: "75%", delay: 3 },
  { type: "circle", size: 90, x: "15%", y: "70%", delay: 2 },
  { type: "square", size: 50, x: "50%", y: "10%", delay: 4 },
  { type: "hexagon", size: 70, x: "30%", y: "85%", delay: 1 },
  { type: "circle", size: 40, x: "90%", y: "50%", delay: 2.5 },
  { type: "hexagon", size: 55, x: "60%", y: "12%", delay: 3.5 },
  { type: "circle", size: 65, x: "5%", y: "45%", delay: 0.5 },
  { type: "square", size: 45, x: "42%", y: "78%", delay: 1.8 },
];

const ShapeSvg = ({ type, size }: { type: string; size: number }) => {
  const s = size;
  if (type === "hexagon") {
    const r = s / 2;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${r + r * Math.cos(angle)},${r + r * Math.sin(angle)}`;
    }).join(" ");
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === "square") {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <rect x="4" y="4" width={s - 8} height={s - 8} rx={s * 0.15} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <circle cx={s / 2} cy={s / 2} r={s / 2 - 4} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

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
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>

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
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        {/* Floating geometric shapes */}
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-primary/[0.06]"
            style={{ left: shape.x, top: shape.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -12, 0],
              rotate: [0, shape.type === "square" ? 15 : 8, 0],
            }}
            transition={{
              opacity: { duration: 1, delay: shape.delay * 0.2 },
              scale: { duration: 1, delay: shape.delay * 0.2 },
              y: { duration: 6 + shape.delay, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 8 + shape.delay, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <ShapeSvg type={shape.type} size={shape.size} />
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-md">
            <PiggyBank className="h-10 w-10 text-primary" />
          </div>

          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Welcome to Thriftly!
          </h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            Create your first cooperative group to start tracking contributions
            and building trust.
          </p>

          <Button size="lg" className="gap-2 text-base font-bold shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-5 w-5" />
            Create Your First Group
          </Button>

          <Button size="lg" variant="outline" className="mt-3 gap-2 text-base font-bold shadow-lg hover:shadow-xl transition-shadow">
            <Users className="h-5 w-5" />
            Check Your Groups
          </Button>

          <Card className="mx-auto mt-10 w-fit border-border/50 bg-card/80 px-6 py-5 shadow-sm backdrop-blur-sm">
            <ul className="space-y-3 text-left text-sm text-muted-foreground">
              {[
                "Create a group to start tracking contributions.",
                "Add members to your cooperative circle.",
                "Monitor payments and build trust scores.",
              ].map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="flex items-start gap-2"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {tip}
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
