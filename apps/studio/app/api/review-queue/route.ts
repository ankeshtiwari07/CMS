// HITL Review Queue: content pending an approval stage the current user can
// decide — role-routed, with SLA status (on-track / due-soon / overdue),
// time-based ESCALATION to senior approvers, and DELEGATION (a user inherits
// the authority of anyone out-of-office who delegated to them). Own content is
// excluded (separation of duties).
import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

const STAGE_ROLES: Record<string, string[]> = {
  editorial: ["reviewer", "publisher", "siteAdmin", "admin"],
  brand: ["brand", "admin"],
  legal: ["compliance", "admin"],
  final: ["publisher", "siteAdmin", "admin"],
};
const REQUIRED: Record<string, string[]> = { trivial: [], low: ["editorial"], medium: ["editorial", "final"], high: ["editorial", "brand", "legal", "final"] };
const STAGE_LABEL: Record<string, string> = { editorial: "Editorial review", brand: "Brand review", legal: "Legal / Compliance", final: "Final sign-off" };
const SLA_HOURS: Record<string, number> = {
  editorial: Number(process.env.SLA_EDITORIAL_HOURS || 24), brand: Number(process.env.SLA_BRAND_HOURS || 48),
  legal: Number(process.env.SLA_LEGAL_HOURS || 72), final: Number(process.env.SLA_FINAL_HOURS || 24),
};
const ESCALATION_ROLES = (process.env.SLA_ESCALATION_ROLES || "siteAdmin,admin").split(",").map((s) => s.trim());
const COLLS: Record<string, string> = {
  articles: "title", blogPosts: "headline", pressReleases: "headline", events: "title", products: "name",
  caseStudies: "title", leadership: "name", faqs: "question", mediaGalleries: "title", campaignMicrosites: "title", careers: "title", pages: "title",
};
const requiredStages = (tier: string, ai: boolean) => {
  const base = REQUIRED[tier] ?? REQUIRED.low;
  return ai && !base.includes("editorial") ? ["editorial", ...base] : base;
};
const sla = (stage: string, sinceMs: number, now: number) => {
  const h = SLA_HOURS[stage] ?? 24;
  const rem = h - (now - sinceMs) / 3_600_000;
  if (rem <= 0) return { state: "overdue", hours: Math.max(0, Math.round(-rem)) };
  if (rem <= Math.max(2, h * 0.25)) return { state: "due_soon", hours: Math.round(rem) };
  return { state: "on_track", hours: Math.round(rem) };
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Effective roles = own + roles inherited from out-of-office delegators.
  let roles: string[] = [...((user as any).roles || [])];
  let delegatedFrom: string[] = [];
  try {
    const dr = await payloadFetch(`/api/users?where[delegateApprovalsTo][equals]=${(user as any).id}&where[outOfOffice][equals]=true&limit=50&depth=0`);
    if (dr.ok) {
      const delegators = (await dr.json()).docs || [];
      delegatedFrom = delegators.map((d: any) => d.email || d.id);
      roles = Array.from(new Set([...roles, ...delegators.flatMap((d: any) => d.roles || [])]));
    }
  } catch {}
  // An approver by their own role OR by active delegation may use the queue.
  if (!["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"].some((r) => roles.includes(r))) {
    return NextResponse.json({ items: [], count: 0, overdueCount: 0, delegatingFor: [] });
  }
  const canDecide = (stage: string) => (STAGE_ROLES[stage] || []).some((r) => roles.includes(r));
  const isEscalator = ESCALATION_ROLES.some((r) => roles.includes(r));
  const now = Date.now();

  const items: any[] = [];
  for (const [slug, titleField] of Object.entries(COLLS)) {
    let docs: any[] = [];
    try {
      const r = await payloadFetch(`/api/${slug}?where[_status][not_equals]=published&limit=50&depth=0&sort=-updatedAt`);
      if (r.ok) docs = (await r.json()).docs || [];
    } catch { continue; }
    if (!docs.length) continue;
    let decisions: any[] = [];
    try {
      const dr = await payloadFetch(`/api/approvals?where[collectionSlug][equals]=${slug}&limit=500&depth=0&sort=-createdAt`);
      if (dr.ok) decisions = (await dr.json()).docs || [];
    } catch {}
    for (const d of docs) {
      const tier = d.riskTier || "low";
      const req = requiredStages(tier, Boolean(d.aiGenerated));
      if (!req.length) continue;
      const lastEdit = d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
      const docDecisions = decisions.filter((x) => String(x.documentId) === String(d.id));
      // sequential SLA clock: a stage becomes "pending since" when the prior stage cleared (or last edit)
      let prevClearedAt = lastEdit;
      const stages = req.map((stage) => {
        const latest = docDecisions.find((x) => x.stage === stage);
        const fresh = latest && new Date(latest.createdAt).getTime() >= lastEdit;
        const status = fresh ? latest.decision : "pending";
        const pendingSince = prevClearedAt;
        if (status === "approve") prevClearedAt = Math.max(prevClearedAt, new Date(latest.createdAt).getTime());
        const s = status === "pending" || status === "reject" || status === "request_changes" ? sla(stage, pendingSince, now) : { state: "approved", hours: 0 };
        return { stage, label: STAGE_LABEL[stage], status, comment: fresh ? latest.comment : undefined, sla: s.state, slaHours: s.hours };
      });
      const pending = stages.filter((s) => s.status === "pending" || s.status === "reject" || s.status === "request_changes");
      if (!pending.length) continue;
      const overdue = pending.some((s) => s.sla === "overdue");
      const creator = d.createdBy?.id ?? d.createdBy;
      const isOwn = creator != null && String(creator) === String((user as any).id) && !roles.includes("admin");
      if (isOwn) continue;
      // actionable: stages I can decide by role/delegation, PLUS — if overdue and I'm an
      // escalation role — any overdue stage (step in to clear the bottleneck).
      const actionable = pending
        .filter((s) => canDecide(s.stage) || (isEscalator && s.sla === "overdue"))
        .map((s) => s.stage);
      if (!actionable.length) continue;
      const escalated = actionable.some((st) => pending.find((p) => p.stage === st)?.sla === "overdue") && !pending.filter((s) => s.sla === "overdue").every((s) => canDecide(s.stage));
      items.push({
        collection: slug, id: d.id, title: d[titleField] || `${slug}#${d.id}`,
        riskTier: tier, aiGenerated: Boolean(d.aiGenerated), updatedAt: d.updatedAt,
        stages, pendingStages: pending.map((s) => s.stage), actionable, overdue,
        escalatedToYou: escalated, viaDelegation: delegatedFrom.length > 0,
      });
    }
  }
  // overdue first, then most-recent
  items.sort((a, b) => (Number(b.overdue) - Number(a.overdue)) || (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return NextResponse.json({
    items, count: items.length,
    overdueCount: items.filter((i) => i.overdue).length,
    delegatingFor: delegatedFrom,
  });
}
