"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n-client";
import { TrashIcon, PencilIcon } from "@/components/icons";

type Chat = { id: string | number; title: string; mode?: string; pinned?: boolean; updatedAt?: string };

// Per-user chat history in the sidebar. Lists the signed-in user's saved
// conversations (topics); clicking one reopens the thread in the composer.
// The list refreshes whenever a thread is saved (humain:chatsaved).
export default function ChatHistory({ collapsed }: { collapsed: boolean }) {
  const t = useT();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
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

  // Collapsed rail hides the list (it needs width for titles).
  if (collapsed) return null;

  return (
    <div style={{ marginTop: 10, maxHeight: "38vh", flexShrink: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "4px 14px 6px", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: "var(--text-muted)", textTransform: "uppercase" }}>
        {t("chats.title")}
      </div>
      <div style={{ overflowY: "auto", paddingRight: 2 }}>
        {chats.length === 0 ? (
          <div style={{ padding: "4px 14px", fontSize: 13, color: "var(--text-muted)" }}>{t("chats.empty")}</div>
        ) : (
          chats.map((c) => {
            const on = activeId === String(c.id);
            const hot = hover === String(c.id);
            return (
              <div
                key={c.id}
                onMouseEnter={() => setHover(String(c.id))}
                onMouseLeave={() => setHover(null)}
                style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 10, background: on ? "var(--mint-pill)" : "transparent" }}
              >
                <button
                  onClick={() => open(c.id)}
                  title={c.title}
                  style={{ flex: 1, minWidth: 0, textAlign: "start", border: "none", background: "transparent", cursor: "pointer", padding: "8px 6px 8px 14px", fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? "var(--studio-teal-dark)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {c.title || "—"}
                </button>
                {hot && (
                  <span style={{ display: "flex", gap: 2, paddingRight: 6 }}>
                    <button aria-label={t("chats.rename")} title={t("chats.rename")} onClick={() => rename(c)} style={iconBtn}><PencilIcon size={14} /></button>
                    <button aria-label={t("chats.delete")} title={t("chats.delete")} onClick={() => remove(c)} style={{ ...iconBtn, color: "var(--destructive)" }}><TrashIcon size={14} /></button>
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
  width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center",
};
