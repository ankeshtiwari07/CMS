"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, Button, Dialog, EmptyState, Input } from "@humain/ui";
import { MessagesSquare, Pencil, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n-client";

type Chat = { id: string | number; title: string; mode?: string; pinned?: boolean; updatedAt?: string };

/* =============================================================================
   Per-user chat history.

   The target design shows "Chats" as a COLLAPSED row with a chevron, not an
   always-open list, so the list is now the children of an AppSidebar.NavItem —
   which is the package's own collapsible-parent pattern.

   AppSidebar.NavSub carries only a label and an onClick, so per-row rename and
   delete cannot hang off it. Rather than drop those (they are real features),
   the last child opens a "Manage chats" Dialog that does both. Nothing is lost;
   it moves one click away, and the sidebar row stays a plain nav row as designed.

   The list refreshes whenever a thread is saved (humain:chatsaved).
   ============================================================================= */

/**
 * Module-level cache.
 *
 * Module scope survives component remounts within a page session, so when the
 * console shell is torn down and rebuilt (which per-route shells do on every
 * navigation) the list is there immediately and revalidates in the background
 * instead of refetching cold and flashing empty.
 */
let cachedChats: Chat[] | null = null;

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(cachedChats ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const loaded = useRef(false);

  async function load() {
    try {
      // no-store: always re-fetch so a freshly saved chat shows immediately
      // (a cached empty list is what makes history look like it "didn't save").
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      const next = Array.isArray(d.conversations) ? d.conversations : [];
      cachedChats = next;
      setChats(next);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    // Always revalidate on mount; the cache only removes the empty flash.
    if (!loaded.current) { loaded.current = true; load(); }
    const onSaved = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) setActiveId(String(id));
      load();
    };
    const onNew = () => setActiveId(null);
    globalThis.addEventListener("humain:chatsaved", onSaved);
    globalThis.addEventListener("humain:newchat", onNew);
    return () => {
      globalThis.removeEventListener("humain:chatsaved", onSaved);
      globalThis.removeEventListener("humain:newchat", onNew);
    };
  }, []);

  return { chats, setChats, activeId, setActiveId, reload: load };
}

/** The NavSub rows that sit under the collapsible "Chats" item. */
export function ChatNavItems({
  chats,
  activeId,
  onOpen,
  onManage,
}: {
  chats: Chat[];
  activeId: string | null;
  onOpen: (id: string | number) => void;
  onManage: () => void;
}) {
  const t = useT();
  return (
    <>
      {chats.length === 0 && <AppSidebar.NavSub label={t("chats.empty")} />}
      {chats.map((c) => (
        <AppSidebar.NavSub
          key={c.id}
          label={c.title || "—"}
          isActive={activeId === String(c.id)}
          onClick={() => onOpen(c.id)}
        />
      ))}
      {chats.length > 0 && <AppSidebar.NavSub label={t("chats.manage")} onClick={onManage} />}
    </>
  );
}

/** Rename / delete, which NavSub cannot carry. */
export function ManageChatsDialog({
  open,
  onOpenChange,
  chats,
  setChats,
  activeId,
  setActiveId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeId: string | null;
  setActiveId: (v: string | null) => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function rename(c: Chat) {
    const title = draft.trim().slice(0, 120);
    setEditing(null);
    if (!title || title === c.title) return;
    setChats((p) => { const n = p.map((x) => (x.id === c.id ? { ...x, title } : x)); cachedChats = n; return n; });
    await fetch(`/api/conversations/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {});
  }

  async function remove(c: Chat) {
    setChats((p) => { const n = p.filter((x) => x.id !== c.id); cachedChats = n; return n; });
    if (activeId === String(c.id)) {
      setActiveId(null);
      globalThis.dispatchEvent(new CustomEvent("humain:newchat"));
    }
    await fetch(`/api/conversations/${c.id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup size="md">
        <Dialog.Header>
          <Dialog.Title>{t("chats.title")}</Dialog.Title>
          <Dialog.Description>Rename or delete your saved threads.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          {chats.length === 0 ? (
            <EmptyState
              title={t("chats.empty")}
              description="Threads you save from the composer appear here."
              media="featured-icon"
              icon={<MessagesSquare />}
            />
          ) : (
            <div className="grid gap-2">
              {chats.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  {editing === String(c.id) ? (
                    <Input
                      value={draft}
                      autoFocus
                      aria-label={t("chats.rename")}
                      className="flex-1"
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") rename(c);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      onBlur={() => rename(c)}
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm text-foreground">{c.title || "—"}</span>
                  )}
                  <Button
                    appearance="ghost"
                    variant="secondary"
                    size="icon-sm"
                    aria-label={t("chats.rename")}
                    title={t("chats.rename")}
                    onClick={() => { setEditing(String(c.id)); setDraft(c.title || ""); }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    appearance="ghost"
                    variant="destructive"
                    size="icon-sm"
                    aria-label={t("chats.delete")}
                    title={t("chats.delete")}
                    onClick={() => remove(c)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Dialog.Body>
      </Dialog.Popup>
    </Dialog>
  );
}
