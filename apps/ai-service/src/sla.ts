// Proactive HITL SLA sweep. Runs on a schedule, scans content with pending
// approval stages, computes SLA breaches (due-soon / overdue), keeps the live
// breach list in memory (surfaced via /sla/reminders into the notifications
// bell), and fires a reminder side-effect (log + optional webhook) the first
// time each breach is seen — so reviews don't silently stall.
const CMS = process.env.CMS_BASE_URL || "http://localhost:3001";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@humain.sa";
const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD || "";

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
const slaOf = (stage: string, sinceMs: number, now: number) => {
  const h = SLA_HOURS[stage] ?? 24;
  const rem = h - (now - sinceMs) / 3_600_000;
  if (rem <= 0) return { state: "overdue", hours: Math.max(0, Math.round(-rem)) };
  if (rem <= Math.max(2, h * 0.25)) return { state: "due_soon", hours: Math.round(rem) };
  return { state: "on_track", hours: Math.round(rem) };
};

export type Breach = {
  collection: string; id: string | number; title: string; stage: string; stageLabel: string;
  state: "due_soon" | "overdue"; hours: number; riskTier: string; aiGenerated: boolean;
  notifyRoles: string[]; key: string;
};

let lastBreaches: Breach[] = [];
let lastSweptAt: string | null = null;
const reminded = new Map<string, number>(); // dedupe: key -> last reminded ms

async function cmsToken(): Promise<string | null> {
  try {
    const r = await fetch(`${CMS}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PW }) });
    return ((await r.json()) as any)?.token || null;
  } catch { return null; }
}

export async function runSlaSweep(log?: (o: any, m: string) => void): Promise<Breach[]> {
  const token = await cmsToken();
  if (!token) { log?.({}, "sla sweep: no CMS token"); return lastBreaches; }
  const H = { Authorization: `JWT ${token}` };
  const now = Date.now();
  const breaches: Breach[] = [];

  for (const [slug, titleField] of Object.entries(COLLS)) {
    let docs: any[] = [], decisions: any[] = [];
    try {
      const r = await fetch(`${CMS}/api/${slug}?where[_status][not_equals]=published&limit=100&depth=0&sort=-updatedAt`, { headers: H });
      if (r.ok) docs = ((await r.json()) as any).docs || [];
      const dr = await fetch(`${CMS}/api/approvals?where[collectionSlug][equals]=${slug}&limit=1000&depth=0&sort=-createdAt`, { headers: H });
      if (dr.ok) decisions = ((await dr.json()) as any).docs || [];
    } catch { continue; }
    for (const d of docs) {
      const tier = d.riskTier || "low";
      const req = requiredStages(tier, Boolean(d.aiGenerated));
      if (!req.length) continue;
      const lastEdit = d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
      const dd = decisions.filter((x) => String(x.documentId) === String(d.id));
      let prevCleared = lastEdit;
      for (const stage of req) {
        const latest = dd.find((x) => x.stage === stage);
        const fresh = latest && new Date(latest.createdAt).getTime() >= lastEdit;
        if (fresh && latest.decision === "approve") { prevCleared = Math.max(prevCleared, new Date(latest.createdAt).getTime()); continue; }
        // this stage is pending (or rejected/changes) → evaluate SLA from prevCleared
        const s = slaOf(stage, prevCleared, now);
        if (s.state === "due_soon" || s.state === "overdue") {
          const notifyRoles = Array.from(new Set([...(STAGE_ROLES[stage] || []), ...(s.state === "overdue" ? ESCALATION_ROLES : [])]));
          breaches.push({
            collection: slug, id: d.id, title: d[titleField] || `${slug}#${d.id}`, stage, stageLabel: STAGE_LABEL[stage],
            state: s.state, hours: s.hours, riskTier: tier, aiGenerated: Boolean(d.aiGenerated),
            notifyRoles, key: `${slug}:${d.id}:${stage}:${s.state}`,
          });
        }
        break; // only the first unmet stage is "currently pending"
      }
    }
  }

  // Reminder side-effect on NEW breaches (deduped within the stage SLA window).
  const ttlMs = Number(process.env.SLA_REMINDER_TTL_HOURS || 6) * 3_600_000;
  for (const b of breaches) {
    const prev = reminded.get(b.key) || 0;
    if (now - prev > ttlMs) {
      reminded.set(b.key, now);
      log?.({ ...b }, `SLA ${b.state}: ${b.collection}#${b.id} [${b.stage}] notify=${b.notifyRoles.join(",")}`);
      const hook = process.env.SLA_WEBHOOK_URL;
      if (hook) {
        fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "hitl.sla", breach: b }) }).catch(() => {});
      }
    }
  }
  // prune dedupe map for keys no longer breaching
  const live = new Set(breaches.map((b) => b.key));
  for (const k of reminded.keys()) if (!live.has(k) && now - (reminded.get(k) || 0) > ttlMs) reminded.delete(k);

  lastBreaches = breaches;
  lastSweptAt = new Date(now).toISOString();
  return breaches;
}

export function getBreaches() {
  return { breaches: lastBreaches, sweptAt: lastSweptAt, overdue: lastBreaches.filter((b) => b.state === "overdue").length };
}

export function startSlaScheduler(log: (o: any, m: string) => void) {
  if (!ADMIN_PW) { log({}, "sla scheduler disabled (no SEED_ADMIN_PASSWORD)"); return; }
  const mins = Number(process.env.SLA_SWEEP_MINUTES || 30);
  const tick = () => runSlaSweep(log).then((b) => log({ count: b.length }, "sla sweep complete")).catch((e) => log({ err: String(e) }, "sla sweep failed"));
  setTimeout(tick, 15_000); // first sweep shortly after boot
  setInterval(tick, Math.max(1, mins) * 60_000);
  log({ everyMinutes: mins }, "sla scheduler started");
}
