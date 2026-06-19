import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";
import { AI_URL } from "@/lib/env";

const TYPE_LABEL: Record<string, string> = {
  video: "Video", writing: "Article", website: "Website copy", websiteBuild: "Website build",
  email: "Email", deck: "Deck", image: "Image", brand: "Brand", designSystem: "Design system",
  translation: "Translation", event: "Event", webinar: "Webinar", campaign: "Campaign",
  brandGuideline: "Brand guideline",
};

type Item = { id: string; type: string; title: string; detail?: string; ts: string; href?: string; unread?: boolean };

// Live activity feed: generations/renders (Projects) + content events (AuditLog, admins).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items: Item[] = [];

  // Studio output — generations and video renders (readable by editors).
  try {
    const r = await payloadFetch("/api/projects?sort=-createdAt&limit=15&depth=0");
    if (r.ok) {
      for (const p of (await r.json()).docs ?? []) {
        const verb = p.type === "video" ? "rendered" : "created";
        items.push({
          id: `project-${p.id}`,
          type: p.type,
          title: `${TYPE_LABEL[p.type] || "Project"} ${verb}`,
          detail: p.title,
          ts: p.createdAt,
          href: "/projects",
        });
      }
    }
  } catch {
    /* ignore */
  }

  // Content lifecycle events (publish/update/delete) — audit log is admin-only.
  if (hasRole(user, ["admin"])) {
    try {
      const r = await payloadFetch("/api/auditLog?sort=-createdAt&limit=15&depth=0");
      if (r.ok) {
        for (const a of (await r.json()).docs ?? []) {
          items.push({
            id: `audit-${a.id}`,
            type: a.action,
            title: a.summary || `${a.action} in ${a.collectionSlug}`,
            detail: a.collectionSlug,
            ts: a.createdAt,
            href: "/cms",
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  // Proactive HITL SLA reminders — overdue/due-soon approvals routed to my role.
  const myRoles: string[] = (user as any).roles || [];
  let slaUnread = 0;
  try {
    const r = await fetch(`${AI_URL}/sla/reminders`, { cache: "no-store" });
    if (r.ok) {
      const { breaches = [] } = await r.json();
      const mine = (breaches as any[]).filter((b) => (b.notifyRoles || []).some((role: string) => myRoles.includes(role)));
      for (const b of mine) {
        items.push({
          id: `sla-${b.key}`,
          type: b.state === "overdue" ? "delete" : "update", // reuse icon mapping (red/amber)
          title: b.state === "overdue" ? `⏰ Overdue: ${b.stageLabel}` : `Due soon: ${b.stageLabel}`,
          detail: `${b.title} — ${b.state === "overdue" ? `${b.hours}h over SLA` : `${b.hours}h left`}`,
          ts: new Date().toISOString(),
          href: "/review",
          unread: true,
        });
        slaUnread++;
      }
    }
  } catch {
    /* ai-service unreachable — skip reminders */
  }

  items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  const top = items.slice(0, 25);
  const lastRead = (user as any).notificationsReadAt ? new Date((user as any).notificationsReadAt).getTime() : 0;
  const withUnread = top.map((i) => ({ ...i, unread: i.unread ?? new Date(i.ts).getTime() > lastRead }));
  // SLA reminders always count as unread (time-sensitive), in addition to new activity.
  const unreadCount = withUnread.filter((i) => i.unread && !String(i.id).startsWith("sla-")).length + slaUnread;
  return NextResponse.json({ items: withUnread, unreadCount });
}
