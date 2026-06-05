import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";

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

  items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  const top = items.slice(0, 20);
  const lastRead = (user as any).notificationsReadAt ? new Date((user as any).notificationsReadAt).getTime() : 0;
  const withUnread = top.map((i) => ({ ...i, unread: new Date(i.ts).getTime() > lastRead }));
  return NextResponse.json({ items: withUnread, unreadCount: withUnread.filter((i) => i.unread).length });
}
