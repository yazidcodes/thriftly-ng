import { PieChart, ShieldCheck, Wallet, ArrowRight, Users, ClipboardList, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-2xl font-extrabold text-primary tracking-tight">Thriftly</span>
          <div className="flex items-center gap-2 sm:gap-6">
            <button onClick={() => scrollTo("features")} className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">How it Works</button>
            <Button size="sm" className="font-semibold" onClick={() => navigate("/dashboard")}>
              Login / Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Leave the Notebook.<br />
            <span className="text-primary">Start Saving the Smart Way.</span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            The easiest way for market administrators in Zaria and beyond to track daily Ajo and Esusu contributions. No calculation errors, just clear and transparent savings.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="gap-2 text-base font-bold shadow-lg" onClick={() => navigate("/dashboard")}>
              Open Free Ledger <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base font-bold" onClick={() => scrollTo("how-it-works")}>
              See How It Works
            </Button>
          </div>
        </div>
        {/* Phone mockup placeholder */}
        <div className="flex items-center justify-center">
          <div className="relative mx-auto w-64 sm:w-72">
            <div className="rounded-[2.5rem] border-[6px] border-foreground/10 bg-card p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="h-2 w-20 rounded-full bg-muted" />
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-accent p-4">
                  <p className="text-xs font-semibold text-accent-foreground">Total Savings</p>
                  <p className="text-2xl font-extrabold text-primary">₦450,000</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">AY</div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Amina Yusuf</p>
                      <p className="text-[10px] text-muted-foreground">₦2,000 • just now</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-primary-foreground">CO</div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Chinedu Okoro</p>
                      <p className="text-[10px] text-muted-foreground">₦5,000 • 2 min ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <div className="h-1 w-24 rounded-full bg-border" />
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-primary/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-4 space-y-1 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              All the tools you need.
            </h2>
            <p className="text-3xl font-extrabold text-foreground sm:text-4xl">
              No more <span className="text-primary">arguments</span>.
            </p>
            <p className="text-3xl font-extrabold text-foreground sm:text-4xl">
              No more <span className="text-primary">confusions</span>.
            </p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-3 my-[50px]">
            {[
            {
              icon: PieChart,
              title: "Contribution Insights.",
              text: "Visualize contributions and payouts instantly. Track who has paid, upcoming collections, and group progress at a glance."
            },
            {
              icon: ShieldCheck,
              title: "Digital Trust.",
              text: "Every member's balance is securely backed up to the cloud. No more lost notebooks or water damage."
            },
            {
              icon: Wallet,
              title: "Instant Balances.",
              text: "Know exactly how much is in the group pot and who is next to collect, all at a glance."
            }].
            map((f, i) =>
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm transition hover:shadow-md"
            >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-accent/40 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-foreground sm:text-4xl">
            How Thriftly Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
            { icon: Users, title: "Create Your Group", text: "Start a cooperative savings circle in minutes." },
            { icon: ClipboardList, title: "Track Contributions", text: "Every member's payment is recorded and visible to the group." },
            { icon: ShieldCheck, title: "Trust Score Insights", text: "See which members are most reliable and spot potential risks early, improving group trust and reducing disputes." },
            { icon: BadgeCheck, title: "Build Trust & History", text: "Members earn a digital trust score, enabling future access to financial services." }].
            map((step, i) =>
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm transition hover:shadow-md"
            >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.div>
            )}
          </div>
          <div className="mt-12 text-center">
            <p className="mb-6 text-lg text-muted-foreground">Get started today and bring your cooperative savings online.</p>
            <Button size="lg" className="gap-2 text-base font-bold shadow-lg" onClick={() => navigate("/dashboard")}>
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground sm:py-20">
        <h2 className="mb-3 text-3xl font-extrabold sm:text-4xl">Ready to go digital?</h2>
        <p className="mb-8 text-lg opacity-90">Start your free ledger in under a minute.</p>
        <Button size="lg" variant="secondary" className="text-base font-bold">
          Open Free Ledger <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground">
        © 2026 Thriftly — A 3MTT NextGen Project.
      </footer>
    </div>);

};

export default Landing;