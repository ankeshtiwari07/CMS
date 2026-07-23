import SettingsNav from "@/components/settings/settings-nav";

export const dynamic = "force-dynamic";

const ROLES = ["viewer", "author", "reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"];
const CAPS: { label: string; allow: Record<string, boolean> }[] = [
  { label: "View published content", allow: { viewer: true, author: true, reviewer: true, publisher: true, brand: true, siteAdmin: true, compliance: true, admin: true } },
  { label: "Create / edit drafts", allow: { author: true, reviewer: true, publisher: true, brand: true, siteAdmin: true, admin: true } },
  { label: "HITL — editorial approval", allow: { reviewer: true, publisher: true, siteAdmin: true, admin: true } },
  { label: "HITL — brand approval", allow: { brand: true, admin: true } },
  { label: "HITL — legal / compliance approval", allow: { compliance: true, admin: true } },
  { label: "HITL — final sign-off", allow: { publisher: true, siteAdmin: true, admin: true } },
  { label: "Publish content (after approvals)", allow: { publisher: true, siteAdmin: true, admin: true } },
  { label: "Edit brand & site settings", allow: { brand: true, publisher: true, admin: true } },
  { label: "Manage users & roles", allow: { admin: true } },
];

export default function AccessPage() {
  const cell = (on: boolean) => (
    <td style={{ textAlign: "center", padding: "10px 12px", color: on ? "var(--success)" : "var(--hairline)", fontWeight: 700 }}>{on ? "✓" : "·"}</td>
  );
  return (
    <>
      <SettingsNav />
      <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>Access &amp; Roles</h2>
      <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: 13.5 }}>RBAC capability matrix. Roles are assigned per user under Users.</p>

      <div style={{ border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--soft-bg)", color: "var(--text-muted)" }}>
              <th style={{ textAlign: "left", padding: "12px 14px", fontWeight: 600 }}>Capability</th>
              {ROLES.map((r) => <th key={r} style={{ padding: "12px 12px", fontWeight: 600, textTransform: "capitalize" }}>{r === "siteAdmin" ? "Site Admin" : r}</th>)}
            </tr>
          </thead>
          <tbody>
            {CAPS.map((c) => (
              <tr key={c.label} style={{ borderTop: "1px solid var(--hairline)" }}>
                <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{c.label}</td>
                {ROLES.map((r) => cell(Boolean(c.allow[r])))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: "28px 0 10px" }}>Attribute-based access (ABAC)</h3>
      <ul style={{ color: "var(--ink)", fontSize: 14, lineHeight: 1.8, paddingInlineStart: 20, margin: 0 }}>
        <li><strong>Site scope</strong> — editors with assigned sites can only create/edit content in those sites (empty = all sites).</li>
        <li><strong>Department</strong> — collection access by department (e.g. Careers is editable only by HR / Communications).</li>
        <li><strong>Locale scope</strong> — a user’s locale attribute marks which locales (EN/AR) they own.</li>
        <li><strong>Field-level</strong> — roles and access scope are editable by admins only; deactivated accounts cannot sign in.</li>
      </ul>
    </>
  );
}
