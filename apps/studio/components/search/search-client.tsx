"use client";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";

type Result = { collection: string; label: string; id: string | number; title: string; status: string };

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
      setBusy(false);
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1.5px solid var(--studio-primary)",
          borderRadius: 14,
          padding: "12px 16px",
          background: "#fff",
        }}
      >
        <SearchIcon size={20} color="var(--studio-primary)" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search content across the platform…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 16, color: "var(--ink)" }}
        />
        {busy && <span style={{ color: "var(--muted)", fontSize: 13 }}>…</span>}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
        {searched && results.length === 0 && !busy && (
          <div style={{ color: "var(--muted)", padding: 16, textAlign: "center" }}>No results for “{q}”.</div>
        )}
        {results.map((r) => (
          <a
            key={`${r.collection}-${r.id}`}
            href={`http://localhost:3001/admin/collections/${r.collection}/${r.id}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              textDecoration: "none",
              color: "var(--ink)",
              background: "#fff",
            }}
          >
            <span style={{ fontWeight: 600 }}>{r.title}</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: r.status === "published" ? "var(--mint-pill)" : "var(--hairline)",
                  color: r.status === "published" ? "var(--studio-teal-dark)" : "var(--muted)",
                }}
              >
                {r.status}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
