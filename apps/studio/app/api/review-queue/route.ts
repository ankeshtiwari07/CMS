// HITL Review Queue: returns content pending an approval stage the current user
// can decide (role-routed), excluding content they created (separation of duties).
import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch, hasRole } from "@/lib/payload";

const STAGE_ROLES: Record<string, string[]> = {
  editorial: ["reviewer", "publisher", "siteAdmin", "admin"],
  brand: ["brand", "admin"],
  legal: ["compliance", "admin"],
  final: ["publisher", "siteAdmin", "admin"],
};
const REQUIRED: Record<string, string[]> = {
  trivial: [],
  low: ["editorial"],
  medium: ["editorial", "final"],
  high: ["editorial", "brand", "legal", "final"],
};
const STAGE_LABEL: Record<string, string> = {
  editorial: "Editorial review", brand: "Brand review", legal: "Legal / Compliance", final: "Final sign-off",
};
const requiredStages = (tier: string, ai: boolean) => {
  const base = REQUIRED[tier] ?? REQUIRED.low;
  return ai && !base.includes("editorial") ? ["editorial", ...base] : base;
};
// content collection -> title field
const COLLS: Record<string, string> = {
  articles: "title", blogPosts: "headline", pressReleases: "headline", events: "title",
  products: "name", caseStudies: "title", leadership: "name", faqs: "question",
  mediaGalleries: "title", campaignMicrosites: "title", careers: "title", pages: "title",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const roles = (user as any).roles || [];
  if (!hasRole(user, ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"])) {
    return NextResponse.json({ error: "Not an approver" }, { status: 403 });
  }
  const canDecide = (stage: string) => (STAGE_ROLES[stage] || []).some((r) => roles.includes(r));

  const items: any[] = [];
  for (const [slug, titleField] of Object.entries(COLLS)) {
    let docs: any[] = [];
    try {
      const r = await payloadFetch(`/api/${slug}?where[_status][not_equals]=published&limit=50&depth=0&sort=-updatedAt`);
      if (r.ok) docs = (await r.json()).docs || [];
    } catch { continue; }
    if (!docs.length) continue;
    // all decisions for this collection, newest first
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
      const stageState = req.map((stage) => {
        const latest = docDecisions.find((x) => x.stage === stage);
        const fresh = latest && new Date(latest.createdAt).getTime() >= lastEdit;
        const status = fresh ? latest.decision : "pending";
        return { stage, label: STAGE_LABEL[stage], status, comment: fresh ? latest.comment : undefined };
      });
      const pending = stageState.filter((s) => s.status === "pending" || s.status === "reject" || s.status === "request_changes");
      // stages THIS user can act on now (and not their own content)
      const creator = d.createdBy?.id ?? d.createdBy;
      const isOwn = creator != null && String(creator) === String((user as any).id) && !roles.includes("admin");
      const actionable = pending.filter((s) => canDecide(s.stage)).map((s) => s.stage);
      if (actionable.length && !isOwn) {
        items.push({
          collection: slug, id: d.id, title: d[titleField] || `${slug}#${d.id}`,
          riskTier: tier, aiGenerated: Boolean(d.aiGenerated), updatedAt: d.updatedAt,
          stages: stageState, pendingStages: pending.map((s) => s.stage), actionable,
        });
      }
    }
  }
  items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return NextResponse.json({ items, count: items.length });
}
