"use client";
import { useEffect, useState } from "react";

type U = {
  id: string | number;
  email: string;
  name?: string;
  jobTitle?: string;
  roles: string[];
  department?: string;
  sites?: any[];
  locales?: string[];
  active?: boolean;
  createdAt?: string;
};

const fmtDate = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};
type Site = { id: string | number; name: string };

const ROLES = ["viewer", "author", "reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"];
const ROLE_LABEL: Record<string, string> = { siteAdmin: "Site Admin", compliance: "Legal/Compliance" };
const roleLabel = (r: string) => ROLE_LABEL[r] ?? r;
const DEPTS = ["marketing", "editorial", "communications", "hr", "product", "executive"];
const LOCALES = ["en", "ar"];

const blank = { email: "", name: "", jobTitle: "", password: "", roles: ["viewer"], department: "", sites: [], locales: [], active: true, outOfOffice: false, delegateApprovalsTo: "" };

export default function UsersClient({ meId }: { meId: string | number }) {
  const [users, setUsers] = useState<U[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null); // null = closed
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [u, s] = await Promise.all([fetch("/api/users"), fetch("/api/sites")]);
    setUsers((await u.json()).users ?? []);
    setSites((await s.json()).sites ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setErr(null); setEditing({ ...blank, _new: true }); }
  function openEdit(u: U) {
    setErr(null);
    setEditing({
      _new: false, id: u.id, email: u.email, name: u.name || "", jobTitle: u.jobTitle || "", password: "",
      roles: u.roles || [], department: u.department || "", active: u.active !== false, createdAt: u.createdAt,
      sites: (u.sites || []).map((x: any) => (typeof x === "object" ? x.id : x)),
      locales: u.locales || [],
      outOfOffice: (u as any).outOfOffice || false,
      delegateApprovalsTo: (() => { const d = (u as any).delegateApprovalsTo; return d ? (typeof d === "object" ? d.id : d) : ""; })(),
    });
  }
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function save() {
    if (!editing.email) return setErr("Email is required");
    if (editing._new && !editing.password) return setErr("Password is required for new users");
    if (!editing.roles.length) return setErr("At least one role is required");
    setBusy(true); setErr(null);
    const payload: any = {
      email: editing.email, name: editing.name, jobTitle: editing.jobTitle, roles: editing.roles,
      department: editing.department || undefined, sites: editing.sites, locales: editing.locales, active: editing.active,
      outOfOffice: editing.outOfOffice, delegateApprovalsTo: editing.delegateApprovalsTo || null,
    };
    if (editing.password) payload.password = editing.password;
    const res = editing._new
      ? await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`/api/users/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Save failed");
    setEditing(null); setToast(editing._new ? "User created" : "User updated"); load();
  }

  async function remove(u: U) {
    if (!confirm(`Delete ${u.email}?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setToast(data.error || "Delete failed");
    setToast("User deleted"); load();
  }

  const pill = (text: string, bg = "var(--mint-pill)", color = "var(--studio-teal-dark)") => (
    <span key={text} style={{ fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: bg, color, marginRight: 4 }}>{text}</span>
  );
  const field: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--hairline)", borderRadius: 10, fontSize: 14.5, outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>Users</h2>
          <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: 13.5 }}>{users.length} users · RBAC roles + ABAC scope (site / department / locale)</p>
        </div>
        <button onClick={openNew} style={{ height: 42, padding: "0 18px", border: "none", borderRadius: 999, background: "var(--studio-primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: 14.5 }}>+ New user</button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 24 }}>Loading…</div>
      ) : (
        <div style={{ border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--soft-bg)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>User</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Roles</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Department</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Scope</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{u.name || "—"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>{(u.roles || []).map((r) => pill(r))}</td>
                  <td style={{ padding: "12px 14px", color: "var(--ink)" }}>{u.department || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 12.5 }}>
                    {(u.sites || []).length ? `${u.sites!.length} site(s)` : "all sites"}
                    {(u.locales || []).length ? ` · ${(u.locales || []).join("/")}` : ""}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {u.active !== false ? pill("active", "color-mix(in srgb, var(--success) 12%, var(--background))", "var(--success)") : pill("disabled", "color-mix(in srgb, var(--destructive) 10%, var(--background))", "var(--destructive)")}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 12.5, whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(u)} style={{ border: "none", background: "transparent", color: "var(--studio-primary)", fontWeight: 600, cursor: "pointer", marginRight: 10 }}>Edit</button>
                    {String(u.id) !== String(meId) && <button onClick={() => remove(u)} style={{ border: "none", background: "transparent", color: "var(--destructive)", fontWeight: 600, cursor: "pointer" }}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,20,22,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }} onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", background: "var(--card)", borderRadius: 18, padding: 26, boxShadow: "var(--shadow-card)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{editing._new ? "New user" : "Edit user"}</h3>
            {!editing._new && editing.createdAt && (
              <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)" }}>Created {fmtDate(editing.createdAt)}</p>
            )}
            {editing._new && <div style={{ marginBottom: 14 }} />}
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}><span style={lbl}>Email</span><input style={field} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={lbl}>Name</span><input style={field} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}><span style={lbl}>Job title</span><input style={field} value={editing.jobTitle} onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={lbl}>{editing._new ? "Password" : "New password (optional)"}</span><input type="password" style={field} value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></label>
              </div>
              <div>
                <span style={lbl}>Roles (RBAC)</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {ROLES.map((r) => (
                    <button key={r} onClick={() => setEditing((prev: any) => ({ ...prev, roles: toggle(prev.roles, r) }))} style={selChip(editing.roles.includes(r))}>{roleLabel(r)}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={lbl}>Department (ABAC)</span>
                  <select style={field} value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })}>
                    <option value="">—</option>
                    {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <div>
                  <span style={lbl}>Locale scope (ABAC)</span>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {LOCALES.map((l) => <button key={l} onClick={() => setEditing((prev: any) => ({ ...prev, locales: toggle(prev.locales, l) }))} style={selChip(editing.locales.includes(l))}>{l}</button>)}
                  </div>
                </div>
              </div>
              <div>
                <span style={lbl}>Site scope (ABAC) — empty = all sites</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {sites.map((s) => <button key={s.id} onClick={() => setEditing((prev: any) => ({ ...prev, sites: toggle(prev.sites.map(String), String(s.id)) }))} style={selChip(editing.sites.map(String).includes(String(s.id)))}>{s.name}</button>)}
                  {!sites.length && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No sites yet</span>}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                <span style={{ fontSize: 14, color: "var(--ink)" }}>Active (can sign in)</span>
              </label>

              {/* HITL approval delegation (out-of-office coverage) */}
              <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 14 }}>
                <span style={lbl}>Approval delegation (HITL)</span>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center", marginTop: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={editing.outOfOffice} onChange={(e) => setEditing({ ...editing, outOfOffice: e.target.checked })} />
                    <span style={{ fontSize: 13.5, color: "var(--ink)" }}>Out of office</span>
                  </label>
                  <select style={field} value={editing.delegateApprovalsTo} onChange={(e) => setEditing({ ...editing, delegateApprovalsTo: e.target.value })}>
                    <option value="">Delegate approvals to… (backup approver)</option>
                    {users.filter((u) => String(u.id) !== String(editing.id)).map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "6px 0 0" }}>While “out of office” is on, your delegate inherits your approval authority so reviews don’t stall.</p>
              </div>

              {err && <div style={{ background: "color-mix(in srgb, var(--destructive) 10%, var(--background))", color: "var(--destructive)", borderRadius: 10, padding: "9px 12px", fontSize: 13.5 }}>{err}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
              <button onClick={() => setEditing(null)} style={{ height: 42, padding: "0 18px", border: "1px solid var(--hairline)", borderRadius: 999, background: "var(--card)", fontWeight: 600 }}>Cancel</button>
              <button onClick={save} disabled={busy} style={{ height: 42, padding: "0 22px", border: "none", borderRadius: 999, background: "var(--studio-primary)", color: "var(--primary-foreground)", fontWeight: 700 }}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div onAnimationEnd={() => setToast(null)} style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--studio-teal-dark)", color: "var(--primary-foreground)", padding: "12px 20px", borderRadius: 12, fontWeight: 600, zIndex: 120 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--label)" };
const selChip = (on: boolean): React.CSSProperties => ({
  height: 32, padding: "0 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
  border: `1px solid ${on ? "var(--studio-primary)" : "var(--hairline)"}`,
  background: on ? "var(--mint-pill)" : "var(--card)", color: on ? "var(--studio-teal-dark)" : "var(--ink)",
});
