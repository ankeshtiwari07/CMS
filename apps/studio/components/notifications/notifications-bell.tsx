"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, NotificationItem, Sheet } from "@humain/ui";
import {
  Bell, BookImage, Bookmark, Building2, Calendar, Check, FileText, Globe,
  Image as ImageIcon, Mail, Megaphone, Monitor, Palette, Video,
} from "lucide-react";

/* =============================================================================
   Notifications.

   The target design puts Notifications in the sidebar as a nav ROW with an
   inline unread count, not a bell with its own popover, so this is now a panel:
   the shell owns the row and the count, and opens this Sheet.

   Rows use the package's NotificationItem instead of hand-rolled flex blocks,
   and the empty case uses EmptyState.

   Behaviour is unchanged: same /api/notifications feed, same 45s poll, same
   mark-all-read POST, same click-through to the item's href. The unread count is
   lifted to the shell via onUnreadChange so the nav row can badge it.
   ============================================================================= */

type Item = { id: string; type: string; title: string; detail?: string; ts: string; href?: string; unread?: boolean };

const ICON: Record<string, any> = {
  video: Video, writing: FileText, campaign: Megaphone, webinar: Monitor,
  event: Calendar, conference: Calendar, summit: Building2,
  website: Globe, websiteBuild: Globe, brandGuideline: Bookmark,
  brand: Bookmark, designSystem: Palette, email: Mail, image: ImageIcon,
  publish: Megaphone, create: FileText, update: FileText, delete: FileText,
  gallery: BookImage,
};

function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

export default function NotificationsPanel({
  open,
  onOpenChange,
  onUnreadChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUnreadChange?: (n: number) => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.items || []);
      setUnread(d.unreadCount || 0);
      onUnreadChange?.(d.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead() {
    setUnread(0);
    onUnreadChange?.(0);
    setItems((p) => p.map((i) => ({ ...i, unread: false })));
    try { await fetch("/api/notifications/read", { method: "POST" }); } catch { /* ignore */ }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.Popup side="right" width="md">
        <Sheet.Header>
          <Sheet.Title>Notifications</Sheet.Title>
          <Sheet.Description>
            {unread > 0 ? `${unread} unread` : "You are all caught up."}
          </Sheet.Description>
          {unread > 0 && (
            <div className="mt-3">
              <Button appearance="outline" variant="secondary" size="sm" startIcon={<Check className="size-4" />} onClick={markRead}>
                Mark all read
              </Button>
            </div>
          )}
        </Sheet.Header>
        <Sheet.Body>
          {items.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Generations, renders and content events appear here as they happen."
              media="featured-icon"
              icon={<Bell />}
            />
          ) : (
            <div className="grid gap-2">
              {items.map((i) => {
                const Icon = ICON[i.type] || FileText;
                return (
                  <NotificationItem
                    key={i.id}
                    variant={i.unread ? "primary" : "gray"}
                    title={i.title}
                    supportingText={i.detail}
                    timestamp={ago(i.ts)}
                    icon={<Icon className="size-4" />}
                    primaryAction={
                      i.href
                        ? { label: "Open", onClick: () => { onOpenChange(false); router.push(i.href!); } }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </Sheet.Body>
      </Sheet.Popup>
    </Sheet>
  );
}
