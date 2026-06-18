// Human-in-the-Loop (HITL) approval policy. Risk-based, multi-stage. Enterprises
// tier approval depth by content risk so low-risk content isn't bottlenecked
// while high-risk (legal/financial/medical) content gets full sign-off.

export type RiskTier = "trivial" | "low" | "medium" | "high";
export type Stage = "editorial" | "brand" | "legal" | "final";
export type Decision = "approve" | "reject" | "request_changes";

export const RISK_TIERS: RiskTier[] = ["trivial", "low", "medium", "high"];
export const STAGES: Stage[] = ["editorial", "brand", "legal", "final"];
export const DECISIONS: Decision[] = ["approve", "reject", "request_changes"];

// Required approval stages per risk tier (sequential gates before publish).
export const REQUIRED_STAGES: Record<RiskTier, Stage[]> = {
  trivial: [], // internal/draft — no gate
  low: ["editorial"], // minor copy — single reviewer
  medium: ["editorial", "final"], // product/campaign pages — editor + manager
  high: ["editorial", "brand", "legal", "final"], // legal/financial/medical — full sign-off
};

// AI-generated content ALWAYS needs at least a human editorial review
// (validate accuracy, brand voice, bias, hallucination) — never auto-publish.
export function requiredStagesFor(riskTier: string | null | undefined, aiGenerated: boolean): Stage[] {
  const tier = (RISK_TIERS as string[]).includes(riskTier || "") ? (riskTier as RiskTier) : "low";
  const base = REQUIRED_STAGES[tier];
  if (aiGenerated && !base.includes("editorial")) return ["editorial", ...base];
  return base;
}

// Which roles may decide each stage (separation of duties is enforced separately:
// the content's creator can never approve their own content).
export const STAGE_ROLES: Record<Stage, string[]> = {
  editorial: ["reviewer", "publisher", "siteAdmin", "admin"],
  brand: ["brand", "admin"],
  legal: ["compliance", "admin"],
  final: ["publisher", "siteAdmin", "admin"],
};

export const STAGE_LABEL: Record<Stage, string> = {
  editorial: "Editorial review",
  brand: "Brand review",
  legal: "Legal / Compliance",
  final: "Final sign-off",
};

// Every role that can act on at least one approval stage.
export const APPROVER_ROLES: string[] = ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"];

export const canDecideStage = (roles: string[], stage: string): boolean =>
  (STAGE_ROLES[stage as Stage] || []).some((r) => roles.includes(r));

export const stagesUserCanDecide = (roles: string[]): Stage[] =>
  STAGES.filter((s) => canDecideStage(roles, s));
