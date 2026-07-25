"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, chatItemVariants, cn } from "@humain/ui";
import { Pencil, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n-client";

type Chat = { id: string | number; title: string; mode?: string; pinned?: boolean; updatedAt?: string };

/* =============================================================================
   Per-user chat history in the sidebar. Lists the signed-in user's saved
   conversations (topics); clicking one reopens the thread in the composer.
   The list refreshes whenever a thread is saved (humain:chatsaved).

   Now rendered inside the package's AppSidebar.ChatList, which owns the section
   label, the scroll region and — importantly — the collapsed behaviour: it
   returns null on the icon rail, which is what the old hand-rolled list did with
   its own `collapsed` prop. That prop is therefore gone; the shell no longer has
   to tell this component how wide the sidebar is.

   The rows are NOT AppSidebar.ChatItem. ChatItem renders a single <button> with
   no action slot, so per-row rename/delete could only be reached through its
   onContextMenu — and the package's ContextMenu.Trigger is itself a <button>,
   which would nest interactive elements. Instead the rows use the package's
   exported `chatItemVariants` (the same styling ChatItem uses) so the chrome is
   identical while rename/delete stay as real sibling buttons.
   ============================================================================= */
export default function ChatHistory() {
  const t = useT();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const loaded = useRef(false);

  async function load() {
    try {
      // no-store: always re-fetch so a freshly saved chat shows immediately
      // (a cached empty list is what makes history look like it "didn't save").
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setChats(Array.isArray(d.conversations) ? d.conversations : []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!loaded.current) { loaded.current = true; load(); }
    // A save refreshes the list and highlights the just-saved thread as active.
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

  function open(id: string | number) {
    setActiveId(String(id));
    router.push("/studio");
    setTimeout(() => globalThis.dispatchEvent(new CustomEvent("humain:loadchat", { detail: { id } })), 90);
  }

  async function rename(c: Chat) {
    const next = window.prompt(t("chats.renamePrompt"), c.title);
    if (next == null) return;
    const title = next.trim().slice(0, 120);
    if (!title || title === c.title) return;
    setChats((p) => p.map((x) => (x.id === c.id ? { ...x, title } : x)));
    await fetch(`/api/conversations/${c.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) }).catch(() => {});
  }

  async function remove(c: Chat) {
    if (!window.confirm(t("chats.deleteConfirm"))) return;
    setChats((p) => p.filter((x) => x.id !== c.id));
    if (activeId === String(c.id)) { setActiveId(null); globalThis.dispatchEvent(new CustomEvent("humain:newchat")); }
    await fetch(`/api/conversations/${c.id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <AppSidebar.ChatList label={t("chats.title")}>
      {chats.length === 0 ? (
        <p className="px-3 py-1 text-sm text-muted-foreground">{t("chats.empty")}</p>
      ) : (
        chats.map((c) => {
          const on = activeId === String(c.id);
          return (
            <div
              key={c.id}
              role="listitem"
              className={cn(chatItemVariants({ state: on ? "selected" : "default" }), "group/chat")}
            >
              <button
                type="button"
                onClick={() => open(c.id)}
                title={c.title}
                className={cn(
                  "min-w-0 flex-1 cursor-pointer truncate text-start text-sm",
                  on ? "font-semibold text-primary" : "text-sidebar-foreground",
                )}
              >
                {c.title || "—"}
              </button>
              <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/chat:opacity-100 focus-within:opacity-100 motion-reduce:transition-none">
                <button
                  type="button"
                  aria-label={t("chats.rename")}
                  title={t("chats.rename")}
                  onClick={() => rename(c)}
                  className="grid size-6 cursor-pointer place-items-center rounded-sm text-muted-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={t("chats.delete")}
                  title={t("chats.delete")}
                  onClick={() => remove(c)}
                  className="grid size-6 cursor-pointer place-items-center rounded-sm text-destructive hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </div>
          );
        })
      )}
    </AppSidebar.ChatList>
  );
}
