export interface Payment {
  date: string;
  amount: number;
  status: "paid" | "pending" | "missed";
}

export interface MemberData {
  name: string;
  role: "Admin" | "Member";
  trustScore: number;
  totalContributed: number;
  payments: Payment[];
}

export type TrustTier = "high" | "moderate" | "low";

export function getTrustTier(score: number): TrustTier {
  if (score >= 80) return "high";
  if (score >= 60) return "moderate";
  return "low";
}

export function getTrustLabel(tier: TrustTier): string {
  if (tier === "high") return "Highly Reliable";
  if (tier === "moderate") return "Moderate";
  return "At Risk";
}

/** Clamp trust score between 0-100 */
function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}

export function applyTrustDelta(score: number, action: "paid" | "late" | "missed"): number {
  if (action === "paid") return clamp(score + 2);
  if (action === "late") return clamp(score - 1);
  return clamp(score - 5); // missed
}

export function createMember(name: string, role: "Admin" | "Member" = "Member"): MemberData {
  return {
    name,
    role,
    trustScore: 100,
    totalContributed: 0,
    payments: [],
  };
}

export function formatDate(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
